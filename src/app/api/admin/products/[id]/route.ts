import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { USER_ROLES } from "@/types";
import { connectToDatabase } from "@/lib/db";
import { Product } from "@/models/Product";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await getCurrentUser();
    if (!admin || admin.role !== USER_ROLES.ADMIN) {
      return NextResponse.json(
        { success: false, message: "Unauthorized: Admin privileges required" },
        { status: 403 }
      );
    }

    await connectToDatabase();
    const { id } = await params;

    const product = await Product.findById(id).populate("seller", "name email role phone").lean();
    if (!product) {
      return NextResponse.json({ success: false, message: "Product not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: product });
  } catch (error: unknown) {
    console.error("Admin GET product detail error:", error);
    const msg = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await getCurrentUser();
    if (!admin || admin.role !== USER_ROLES.ADMIN) {
      return NextResponse.json(
        { success: false, message: "Unauthorized: Admin privileges required" },
        { status: 403 }
      );
    }

    await connectToDatabase();
    const { id } = await params;
    const body = await req.json();
    const { status, price, availableQuantity } = body;

    const updateFields: Record<string, unknown> = {};

    if (status !== undefined) {
      const allowed = ["AVAILABLE", "LOW_STOCK", "OUT_OF_STOCK", "ARCHIVED", "DISABLED"];
      if (!allowed.includes(status)) {
        return NextResponse.json(
          { success: false, message: `Invalid status. Allowed: ${allowed.join(", ")}` },
          { status: 400 }
        );
      }
      updateFields.status = status;
    }

    if (price !== undefined && typeof price === "number" && price >= 0) {
      updateFields.price = price;
    }

    if (availableQuantity !== undefined && typeof availableQuantity === "number" && availableQuantity >= 0) {
      updateFields.availableQuantity = availableQuantity;
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      { $set: updateFields },
      { returnDocument: "after" }
    );

    if (!updatedProduct) {
      return NextResponse.json({ success: false, message: "Product not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: updatedProduct,
      message: "Product updated successfully by administrator",
    });
  } catch (error: unknown) {
    console.error("Admin PATCH product error:", error);
    const msg = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}
