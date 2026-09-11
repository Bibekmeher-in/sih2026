import crypto from "crypto";
import fs from "fs";
import path from "path";

// 1. Read secret from .env.local
let webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
if (!webhookSecret) {
  try {
    const envLocalPath = path.resolve(process.cwd(), ".env.local");
    if (fs.existsSync(envLocalPath)) {
      const envContent = fs.readFileSync(envLocalPath, "utf-8");
      for (const line of envContent.split("\n")) {
        const match = line.match(/^\s*RAZORPAY_WEBHOOK_SECRET\s*=\s*(.*)$/);
        if (match) {
          webhookSecret = match[1].trim().replace(/^["']|["']$/g, "");
          break;
        }
      }
    }
  } catch (err) {
    console.warn("Could not parse .env.local directly:", err.message);
  }
}

if (!webhookSecret) {
  console.error("ERROR: RAZORPAY_WEBHOOK_SECRET is not defined in process.env or .env.local");
  process.exit(1);
}

const targetUrl = process.argv[2] || "http://localhost:3000/api/webhooks/razorpay";
const eventTypeToSimulate = process.argv[3] || "payment.captured";

console.log("==========================================================");
console.log("   KISANOVA LOCAL RAZORPAY WEBHOOK SIMULATOR / TESTER    ");
console.log("==========================================================");
console.log(`Target Webhook URL : ${targetUrl}`);
console.log(`Event Type         : ${eventTypeToSimulate}`);
console.log(`Secret configured  : [REDACTED, ${webhookSecret.length} chars]\n`);

async function sendSimulatedWebhook() {
  const eventId = `evt_sim_${Date.now()}`;
  const paymentId = `pay_sim_${Date.now()}`;
  const orderId = `order_sim_${Date.now()}`;

  let eventPayload = {};

  if (eventTypeToSimulate === "payment.captured" || eventTypeToSimulate === "order.paid") {
    eventPayload = {
      entity: "event",
      account_id: "acc_simulated_local",
      event: eventTypeToSimulate,
      contains: ["payment"],
      id: eventId,
      created_at: Math.floor(Date.now() / 1000),
      payload: {
        payment: {
          entity: {
            id: paymentId,
            entity: "payment",
            amount: 45000,
            currency: "INR",
            status: "captured",
            order_id: orderId,
            method: "upi",
            description: "Farm gate produce delivery",
            email: "consumer@example.com",
            contact: "+919876543210",
          },
        },
      },
    };
  } else if (eventTypeToSimulate === "payment.failed") {
    eventPayload = {
      entity: "event",
      account_id: "acc_simulated_local",
      event: "payment.failed",
      contains: ["payment"],
      id: eventId,
      created_at: Math.floor(Date.now() / 1000),
      payload: {
        payment: {
          entity: {
            id: paymentId,
            entity: "payment",
            amount: 45000,
            currency: "INR",
            status: "failed",
            order_id: orderId,
            error_code: "BAD_REQUEST_ERROR",
            error_description: "Payment declined by issuing bank simulator",
          },
        },
      },
    };
  } else if (eventTypeToSimulate === "refund.created" || eventTypeToSimulate === "refund.processed") {
    eventPayload = {
      entity: "event",
      account_id: "acc_simulated_local",
      event: eventTypeToSimulate,
      contains: ["refund"],
      id: eventId,
      created_at: Math.floor(Date.now() / 1000),
      payload: {
        refund: {
          entity: {
            id: `rfnd_sim_${Date.now()}`,
            entity: "refund",
            amount: 45000,
            currency: "INR",
            payment_id: paymentId,
            status: eventTypeToSimulate === "refund.processed" ? "processed" : "created",
            notes: { reason: "Customer requested return" },
          },
        },
      },
    };
  } else {
    console.error(`Unknown event type: ${eventTypeToSimulate}`);
    process.exit(1);
  }

  const rawBody = JSON.stringify(eventPayload);
  const signature = crypto.createHmac("sha256", webhookSecret).update(rawBody).digest("hex");

  console.log("Sending HTTP POST with x-razorpay-signature...");
  try {
    const res = await fetch(targetUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-razorpay-signature": signature,
      },
      body: rawBody,
    });

    console.log(`HTTP Response Status: ${res.status} ${res.statusText}`);
    const data = await res.json();
    console.log("Response JSON Body  :", JSON.stringify(data, null, 2));

    if (res.ok && data.success) {
      console.log("\n>>> SUCCESS: Webhook reached application, signature passed, and was processed!");
    } else {
      console.log("\n>>> WARNING: Response status is not 200 OK or success was false.");
    }
  } catch (err) {
    console.error("Network or fetch error:", err.message);
  }
}

sendSimulatedWebhook();
