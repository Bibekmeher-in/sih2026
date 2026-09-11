import mongoose from "mongoose";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { USER_ROLES } from "@/types";
import { connectToDatabase } from "@/lib/db";
import { Product } from "@/models/Product";
import { Order } from "@/models/Order";
import { User } from "@/models/User";
import { answerFarmerAssistant, FarmerContext } from "@/lib/gemini";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (
      !user ||
      (user.role !== USER_ROLES.FARMER &&
        user.role !== USER_ROLES.FPO &&
        user.role !== USER_ROLES.ADMIN)
    ) {
      return NextResponse.json(
        { success: false, message: "Unauthorized: Farmer credentials required" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const question = body.question;

    if (!question || typeof question !== "string" || question.trim().length === 0) {
      return NextResponse.json(
        { success: false, message: "Question string is required" },
        { status: 400 }
      );
    }

    await connectToDatabase();

    /**
     * Deterministic user resolution — never falls back to role-based lookups
     * that could accidentally return another farmer's data.
     *
     * Priority:
     *   1. Exact ObjectId match (normal case)
     *   2. Email match (stale JWT after DB reseed — same person, new ObjectId)
     *   3. Fail with 401 — never guess
     */
    let sellerObjectId: mongoose.Types.ObjectId | null = null;

    if (mongoose.Types.ObjectId.isValid(user.id)) {
      const dbUser = await User.findById(user.id).select("_id").lean();
      if (dbUser) {
        sellerObjectId = (dbUser as { _id: mongoose.Types.ObjectId })._id;
      }
    }

    // Fallback: stale session after DB reseed — match strictly by email
    if (!sellerObjectId && user.email) {
      const dbUser = await User.findOne({
        email: user.email.toLowerCase(),
      }).select("_id").lean();
      if (dbUser) {
        sellerObjectId = (dbUser as { _id: mongoose.Types.ObjectId })._id;
      }
    }

    if (!sellerObjectId) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Your account could not be resolved in the database. Please sign out and sign in again.",
        },
        { status: 401 }
      );
    }

    // Fetch ONLY this farmer's data — strict seller filter
    const [rawProducts, rawOrders, userDoc] = await Promise.all([
      Product.find({ seller: sellerObjectId, status: { $ne: "ARCHIVED" } })
        .select("name variety price mandiBenchmarkPrice availableQuantity unit qualityGrade")
        .lean(),
      Order.find({ seller: sellerObjectId, orderStatus: { $ne: "CANCELLED" } })
        .select("total items orderStatus")
        .lean(),
      User.findById(sellerObjectId)
        .select("location")
        .lean() as Promise<{ location?: { district?: string; state?: string } } | null>,
    ]);

    const orders = rawOrders as Array<{
      total?: number;
      orderStatus: string;
      items: Array<{ quantity: number }>;
    }>;
    const products = rawProducts as Array<{
      name: string;
      variety?: string;
      price: number;
      mandiBenchmarkPrice?: number;
      availableQuantity: number;
      unit: string;
      qualityGrade: string;
    }>;

    const grossEarnings = orders.reduce(
      (acc, curr) => acc + (curr.total ?? 0),
      0
    );
    const totalSoldKg = orders.reduce(
      (acc, curr) =>
        acc + curr.items.reduce((sum, i) => sum + (i.quantity ?? 0), 0),
      0
    );

    // Grounding for market price questions (Section 14 requirement)
    let verifiedMarketData: {
      crop: string;
      variety?: string;
      pricePerKg?: number;
      mandiBenchmarkPrice?: number;
      location?: string;
      source: string;
      timestamp: string;
      isAvailable: boolean;
    } | null = null;

    const qLower = question.toLowerCase();
    const isPriceQuery =
      qLower.includes("price") ||
      qLower.includes("rate") ||
      qLower.includes("mandi") ||
      qLower.includes("cost");

    if (isPriceQuery) {
      const knownCrops = [
        "tomato", "potato", "onion", "rice", "wheat", "cauliflower",
        "cabbage", "garlic", "ginger", "chilli", "brinjal", "carrot",
        "cotton", "soybean", "maize", "pulses", "peas"
      ];
      const mentionedCrop = knownCrops.find((c) => qLower.includes(c));

      if (mentionedCrop) {
        const matchingLots = await Product.find({
          status: { $in: ["AVAILABLE", "LOW_STOCK"] },
          availableQuantity: { $gt: 0 },
          name: { $regex: mentionedCrop, $options: "i" },
        })
          .select("name variety price mandiBenchmarkPrice location unit qualityGrade updatedAt")
          .limit(3)
          .lean();

        if (matchingLots.length > 0) {
          const topLot = matchingLots[0] as {
            variety?: string;
            price: number;
            mandiBenchmarkPrice?: number;
            location?: { district?: string; state?: string };
            updatedAt?: Date;
          };
          verifiedMarketData = {
            crop: mentionedCrop.charAt(0).toUpperCase() + mentionedCrop.slice(1),
            variety: topLot.variety,
            pricePerKg: topLot.price,
            mandiBenchmarkPrice: topLot.mandiBenchmarkPrice || Math.round(topLot.price * 0.76),
            location: topLot.location?.district
              ? `${topLot.location.district}, ${topLot.location.state || ""}`
              : undefined,
            source: "KISANOVA Verified Marketplace Lots",
            timestamp: topLot.updatedAt
              ? new Date(topLot.updatedAt).toLocaleDateString()
              : new Date().toLocaleDateString(),
            isAvailable: true,
          };
        } else {
          verifiedMarketData = {
            crop: mentionedCrop.charAt(0).toUpperCase() + mentionedCrop.slice(1),
            source: "KISANOVA Live Marketplace",
            timestamp: new Date().toLocaleDateString(),
            isAvailable: false,
          };
        }
      }
    }

    const farmerContext: FarmerContext = {
      // Use authenticated farmer name
      farmerName: user.name || "Farmer",
      location: {
        district: userDoc?.location?.district ?? "Unknown District",
        state: userDoc?.location?.state ?? "India",
      },
      products: products.map((p) => ({
        name: p.name,
        variety: p.variety,
        price: p.price,
        mandiBenchmarkPrice: p.mandiBenchmarkPrice,
        availableQuantity: p.availableQuantity,
        unit: p.unit,
        qualityGrade: p.qualityGrade,
      })),
      recentSalesVolumeKg: totalSoldKg,
      grossEarningsInr: grossEarnings,
      openOrdersCount: orders.filter((o) => o.orderStatus !== "DELIVERED")
        .length,
      verifiedMarketData,
    };

    const response = await answerFarmerAssistant(farmerContext, question);

    return NextResponse.json({
      success: true,
      answer: response.answer,
      suggestedActions: response.suggestedActions,
      isAiGenerated: response.isAiGenerated,
      modelUsed: response.modelUsed,
      ...(response.errorCode && { errorCode: response.errorCode }),
      timestamp: new Date().toISOString(),
    });
  } catch (error: unknown) {
    console.error("[Farmer AI Copilot] Unhandled error:", error);
    return NextResponse.json(
      { success: false, message: "AI assistant failed to respond. Please try again." },
      { status: 500 }
    );
  }
}
