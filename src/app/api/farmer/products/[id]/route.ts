import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { USER_ROLES } from "@/types";
import {
  getFarmerProducts,
  updateFarmerProduct,
  deleteFarmerProduct,
} from "@/lib/farmer-service";
import { farmerProductFormSchema } from "@/schemas";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_req: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== USER_ROLES.FARMER && user.role !== USER_ROLES.FPO)) {
      return NextResponse.json(
        { message: "Unauthorized: Farmer credentials required" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const products = await getFarmerProducts(user.id, user.email ?? undefined);
    const product = products.find((p: { _id: string }) => p._id === id);

    if (!product) {
      return NextResponse.json(
        { message: "Produce lot not found or not owned by you" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, product });
  } catch (err) {
    const message = (err as Error)?.message || "Failed to fetch product details. Please try again.";
    return NextResponse.json(
      { message },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== USER_ROLES.FARMER && user.role !== USER_ROLES.FPO)) {
      return NextResponse.json(
        { message: "Unauthorized: Farmer credentials required" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await req.json();

    // Partial validation of incoming update fields
    const parsed = farmerProductFormSchema.partial().safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { message: "Validation error", errors: parsed.error.format() },
        { status: 400 }
      );
    }

    const updated = await updateFarmerProduct(user.id, id, parsed.data);
    return NextResponse.json({ success: true, product: updated });
  } catch (err) {
    const message = (err as Error)?.message || "Failed to update product listing. Please try again.";
    return NextResponse.json(
      { message },
      { status: 500 }
    );
  }
}

export async function DELETE(_req: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== USER_ROLES.FARMER && user.role !== USER_ROLES.FPO)) {
      return NextResponse.json(
        { message: "Unauthorized: Farmer credentials required" },
        { status: 401 }
      );
    }

    const { id } = await params;
    await deleteFarmerProduct(user.id, id);
    return NextResponse.json({ success: true, message: "Produce listing archived" });
  } catch (err) {
    const message = (err as Error)?.message || "Failed to delete product. Please try again.";
    return NextResponse.json(
      { message },
      { status: 500 }
    );
  }
}

