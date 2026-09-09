import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { Product } from "@/models/Product";
import { Inventory } from "@/models/Inventory";
import { Review } from "@/models/Review";

export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    await connectToDatabase();

    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      const product = await Product.findById(id)
        .populate("category", "name slug icon")
        .populate("seller", "name phone location")
        .lean();

      if (product) {
        const inventory = await Inventory.findOne({ product: id }).lean();
        const reviews = await Review.find({ product: id })
          .sort({ createdAt: -1 })
          .limit(10)
          .lean();

        return NextResponse.json({
          success: true,
          product,
          inventory: inventory || {
            availableQuantity: product.availableQuantity,
            currentQuantity: product.availableQuantity,
            reservedQuantity: 0,
            storageType: "AMBIENT_WAREHOUSE",
          },
          reviews: reviews || [],
          source: "database",
        });
      }
    }
  } catch (error) {
    console.error("DB lookup error:", error);
  }

  return NextResponse.json(
    {
      success: false,
      message: "Produce listing not found",
    },
    { status: 404 }
  );
}
