import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { Product } from "@/models/Product";
import { Inventory } from "@/models/Inventory";

export const dynamic = "force-dynamic";

interface CartInputItem {
  productId: string;
  quantity: number;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const items: CartInputItem[] = Array.isArray(body.items) ? body.items : [];
    const deliveryDistanceKm: number = Number(body.deliveryDistanceKm) || 25;

    if (items.length === 0) {
      return NextResponse.json({
        valid: true,
        items: [],
        subtotal: 0,
        deliveryFee: 0,
        total: 0,
        errors: [],
      });
    }

    let hasDb = false;
    try {
      await connectToDatabase();
      hasDb = true;
    } catch {
      hasDb = false;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const validatedItems: any[] = [];
    const errors: string[] = [];
    let subtotal = 0;

    for (const input of items) {
      if (!input.productId || input.quantity <= 0) continue;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let productDoc: any = null;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let inventoryDoc: any = null;

      if (hasDb && input.productId.match(/^[0-9a-fA-F]{24}$/)) {
        productDoc = await Product.findById(input.productId).lean();
        if (productDoc) {
          inventoryDoc = await Inventory.findOne({ product: input.productId }).lean();
        }
      }

      if (!productDoc) {
        errors.push(`Product ID ${input.productId} was not found in catalog.`);
        continue;
      }

      const availableStock = inventoryDoc?.availableQuantity ?? productDoc.availableQuantity;
      const canonicalPrice = productDoc.price; // Retrieved strictly from Database!

      let itemValid = true;
      let issueMessage = "";

      // 1. Stock validation
      if (input.quantity > availableStock) {
        itemValid = false;
        issueMessage = `Only ${availableStock} ${productDoc.unit} available in stock. Requested: ${input.quantity} ${productDoc.unit}`;
        errors.push(`${productDoc.name}: ${issueMessage}`);
      }

      // 2. Minimum order quantity validation
      if (input.quantity < productDoc.minimumOrderQuantity) {
        itemValid = false;
        issueMessage = `Minimum order quantity is ${productDoc.minimumOrderQuantity} ${productDoc.unit}`;
        errors.push(`${productDoc.name}: ${issueMessage}`);
      }

      const lineTotal = Math.round(input.quantity * canonicalPrice * 100) / 100;
      subtotal += lineTotal;

      validatedItems.push({
        productId: productDoc._id.toString(),
        name: productDoc.name,
        variety: productDoc.variety || "",
        unit: productDoc.unit,
        price: canonicalPrice, // Canonical price enforced
        mandiBenchmarkPrice: productDoc.mandiBenchmarkPrice || canonicalPrice,
        requestedQuantity: input.quantity,
        availableStock,
        minimumOrderQuantity: productDoc.minimumOrderQuantity,
        lineTotal,
        sellerName: productDoc.sellerName || "Verified Grower",
        sellerType: productDoc.sellerType || "FarmerProfile",
        qualityGrade: productDoc.qualityGrade,
        valid: itemValid,
        issue: issueMessage,
      });
    }

    // Deterministic delivery fee calculation
    // Base ₹80 for local, + ₹6/km for longer distances; waived for bulk orders over ₹20,000
    let deliveryFee = 0;
    if (subtotal > 0 && subtotal < 20000) {
      deliveryFee = Math.round(80 + Math.max(0, deliveryDistanceKm - 10) * 6);
    }

    subtotal = Math.round(subtotal * 100) / 100;
    const total = Math.round((subtotal + deliveryFee) * 100) / 100;

    return NextResponse.json({
      valid: errors.length === 0,
      items: validatedItems,
      subtotal,
      deliveryFee,
      total,
      errors,
      serverTime: new Date().toISOString(),
    });
  } catch (error: unknown) {
    console.error("Cart validation error:", error);
    return NextResponse.json(
      {
        valid: false,
        message: "Failed to validate cart against database inventory",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
