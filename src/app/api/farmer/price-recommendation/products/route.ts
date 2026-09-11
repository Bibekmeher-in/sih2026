import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { getCurrentUser } from "@/lib/auth";
import { USER_ROLES } from "@/types";
import { connectToDatabase } from "@/lib/db";
import { Product } from "@/models/Product";

export const dynamic = "force-dynamic";

/**
 * GET /api/farmer/price-recommendation/products
 * Retrieve logged-in farmer's active produce listings for 1-click price discovery auto-population
 */
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== USER_ROLES.FARMER && user.role !== USER_ROLES.ADMIN && user.role !== USER_ROLES.FPO)) {
      return NextResponse.json(
        { success: false, message: "Unauthorized: Farmer credentials required" },
        { status: 401 }
      );
    }

    await connectToDatabase();

    const sellerId = new mongoose.Types.ObjectId(user.id);
    let products = await Product.find({
      seller: sellerId,
      status: { $ne: "ARCHIVED" },
    })
      .select("name variety category price mandiBenchmarkPrice availableQuantity unit qualityGrade location harvestDate")
      .lean();

    // If this farmer currently has no active products, provide common produce listings so they have options to select
    if (products.length === 0) {
      products = await Product.find({ status: "AVAILABLE" })
        .select("name variety category price mandiBenchmarkPrice availableQuantity unit qualityGrade location harvestDate")
        .limit(5)
        .lean();
    }

    return NextResponse.json({
      success: true,
      products,
    });
  } catch (error: unknown) {
    console.error("Error in GET /api/farmer/price-recommendation/products:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch farmer produce items",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
