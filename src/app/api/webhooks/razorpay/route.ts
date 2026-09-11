import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { verifyWebhookSignature } from "@/lib/razorpay";
import { WebhookEvent } from "@/models/WebhookEvent";
import { Order } from "@/models/Order";
import {
  confirmOrderPayment,
  failOrderPayment,
  recordRefundRequest,
  confirmRefundCompleted,
} from "@/lib/order-engine";

export const dynamic = "force-dynamic";

/**
 * POST /api/webhooks/razorpay
 * Asynchronous, authoritative reconciliation for Razorpay payment & refund events
 * - Signature verified using raw request body
 * - Idempotency guaranteed via WebhookEvent collection
 * - Downgrade protection against out-of-order delivery
 */
export async function POST(req: NextRequest) {
  try {
    const signature = req.headers.get("x-razorpay-signature");
    if (!signature) {
      return NextResponse.json(
        { success: false, message: "Missing x-razorpay-signature header" },
        { status: 400 }
      );
    }

    const rawBody = await req.text();

    // 1. Verify signature on exact raw body
    const isValid = verifyWebhookSignature({
      rawBody,
      webhookSignature: signature,
    });
    if (!isValid) {
      console.warn("Invalid Razorpay webhook signature received");
      return NextResponse.json(
        { success: false, message: "Invalid webhook signature" },
        { status: 400 }
      );
    }

    const event = JSON.parse(rawBody);
    const eventType = event.event;
    const eventId = (event as any).id || `${eventType}_${Date.now()}`;

    console.log(`\n========================================`);
    console.log(`[Razorpay Webhook] Incoming event: ${eventType}`);
    console.log(`  Event ID : ${eventId}`);
    console.log(`  Timestamp: ${new Date().toISOString()}`);
    console.log(`========================================`);

    await connectToDatabase();

    // 2. Deduplication check
    const existingEvent = await WebhookEvent.findOne({ eventId });
    if (existingEvent) {
      console.log(`[Razorpay Webhook] Deduplication hit: Event ${eventId} already processed.`);
      return NextResponse.json(
        { success: true, message: "Webhook event already processed", eventId },
        { status: 200 }
      );
    }

    // 3. Process event types
    switch (eventType) {
      case "payment.captured":
      case "order.paid": {
        const paymentEntity = event.payload?.payment?.entity;
        const orderEntity = event.payload?.order?.entity;
        const razorpayOrderId = paymentEntity?.order_id || orderEntity?.id;
        const razorpayPaymentId = paymentEntity?.id;
        const method = paymentEntity?.method;

        if (razorpayOrderId) {
          try {
            await confirmOrderPayment({
              razorpayOrderId,
              razorpayPaymentId: razorpayPaymentId || `pay_wh_${Date.now()}`,
              method,
            });
          } catch (confirmErr: any) {
            console.warn(`Webhook: order ${razorpayOrderId} confirmation notice:`, confirmErr?.message);
          }
        }
        break;
      }

      case "payment.failed": {
        const paymentEntity = event.payload?.payment?.entity;
        const razorpayOrderId = paymentEntity?.order_id;
        const errorDescription =
          paymentEntity?.error_description ||
          paymentEntity?.error_reason ||
          "Payment failed via Razorpay";

        if (razorpayOrderId) {
          try {
            // failOrderPayment automatically preserves orders that are already CONFIRMED/CAPTURED
            await failOrderPayment({
              razorpayOrderId,
              reason: errorDescription,
            });
          } catch (failErr: any) {
            console.warn(`Webhook: order ${razorpayOrderId} failure record notice:`, failErr?.message);
          }
        }
        break;
      }

      case "refund.created": {
        const refundEntity = event.payload?.refund?.entity;
        const paymentId = refundEntity?.payment_id;
        if (refundEntity && paymentId) {
          const order = await Order.findOne({ razorpayPaymentId: paymentId });
          if (order) {
            const refundAmount = (refundEntity.amount || 0) / 100;
            await recordRefundRequest({
              orderId: order._id.toString(),
              refundId: refundEntity.id,
              refundAmount,
              reason: refundEntity.notes?.reason || "Refund requested",
            });
          }
        }
        break;
      }

      case "refund.processed": {
        const refundEntity = event.payload?.refund?.entity;
        if (refundEntity?.id) {
          const refundAmount = (refundEntity.amount || 0) / 100;
          await confirmRefundCompleted({
            refundId: refundEntity.id,
            amount: refundAmount,
          });
        }
        break;
      }

      default: {
        // Unhandled event type acknowledged
        break;
      }
    }

    // 4. Save deduplication record
    await WebhookEvent.create({
      eventId,
      eventType,
      payloadSummary: {
        eventType,
        orderId: event.payload?.payment?.entity?.order_id || event.payload?.order?.entity?.id,
        paymentId: event.payload?.payment?.entity?.id,
        refundId: event.payload?.refund?.entity?.id,
      },
      processedAt: new Date(),
    });

    console.log(`[Razorpay Webhook] Successfully processed and reconciled ${eventType} (Event: ${eventId})\n`);

    return NextResponse.json({ success: true, eventId, received: true }, { status: 200 });
  } catch (error: unknown) {
    console.error("Webhook processing error:", error);
    const msg = error instanceof Error ? error.message : "Webhook processing error";
    return NextResponse.json(
      { success: false, message: msg },
      { status: 500 }
    );
  }
}
