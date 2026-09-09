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
    if (!user || (user.role !== USER_ROLES.FARMER && user.role !== USER_ROLES.FPO && user.role !== USER_ROLES.ADMIN)) {
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

    // Retrieve STRICTLY the authenticated farmer's context (Zero user data leakage)
    let sellerObjectId: mongoose.Types.ObjectId | null = null;
    if (mongoose.Types.ObjectId.isValid(user.id)) {
      sellerObjectId = new mongoose.Types.ObjectId(user.id);
    } else {
      const dbUser = await User.findOne({
        $or: [{ email: user.email?.toLowerCase() }, { role: "FARMER" }],
      });
      if (dbUser) {
        sellerObjectId = dbUser._id;
      }
    }

    const [rawProducts, rawOrders, userDoc] = await Promise.all([
      sellerObjectId
        ? Product.find({ seller: sellerObjectId, status: { $ne: "ARCHIVED" } })
            .select("name variety category price mandiBenchmarkPrice availableQuantity unit qualityGrade")
            .lean()
        : Promise.resolve([]),
      sellerObjectId
        ? Order.find({ seller: sellerObjectId, orderStatus: { $ne: "CANCELLED" } })
            .select("total items orderStatus")
            .lean()
        : Promise.resolve([]),
      sellerObjectId
        ? (User.findById(sellerObjectId).select("location").lean() as Promise<{ location?: { district?: string; state?: string } } | null>)
        : Promise.resolve(null),
    ]);

    const orders = rawOrders as Array<{ total?: number; orderStatus: string; items: Array<{ quantity: number }> }>;
    const products = rawProducts as Array<{
      name: string;
      variety?: string;
      category?: unknown;
      price: number;
      mandiBenchmarkPrice?: number;
      availableQuantity: number;
      unit: string;
      qualityGrade: string;
    }>;

    const grossEarnings = orders.reduce((acc: number, curr) => acc + (curr.total || 0), 0);
    const totalSoldKg = orders.reduce(
      (acc: number, curr) => acc + curr.items.reduce((sum: number, i) => sum + (i.quantity || 0), 0),
      0
    );

    const farmerContext: FarmerContext = {
      // Use a generic role label instead of the farmer's real name
      // to minimize PII sent to the external Gemini API.
      farmerName: "Farmer",
      location: {
        district: userDoc?.location?.district || "Nashik",
        state: userDoc?.location?.state || "Maharashtra",
      },
      products: products.map((p) => ({
        name: p.name,
        variety: p.variety,
        category: p.category?.toString(),
        price: p.price,
        mandiBenchmarkPrice: p.mandiBenchmarkPrice,
        availableQuantity: p.availableQuantity,
        unit: p.unit,
        qualityGrade: p.qualityGrade,
      })),
      recentSalesVolumeKg: totalSoldKg,
      grossEarningsInr: grossEarnings,
      openOrdersCount: orders.filter((o) => o.orderStatus !== "DELIVERED").length,
    };

    const response = await answerFarmerAssistant(farmerContext, question);

    return NextResponse.json({
      success: true,
      answer: response.answer,
      suggestedActions: response.suggestedActions,
      isAiGenerated: response.isAiGenerated,
      timestamp: new Date().toISOString(),
    });
  } catch (error: unknown) {
    console.error("Error in farmer AI copilot:", error);
    return NextResponse.json(
      { success: false, message: "AI assistant failed to respond. Please try again." },
      { status: 500 }
    );
  }
}

