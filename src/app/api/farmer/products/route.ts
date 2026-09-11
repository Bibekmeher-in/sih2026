import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { USER_ROLES } from "@/types";
import { getFarmerProducts, createFarmerProduct } from "@/lib/farmer-service";
import { farmerProductFormSchema } from "@/schemas";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== USER_ROLES.FARMER && user.role !== USER_ROLES.FPO)) {
      return NextResponse.json(
        { message: "Unauthorized: Farmer credentials required" },
        { status: 401 }
      );
    }

    const products = await getFarmerProducts(user.id, user.email ?? undefined);
    return NextResponse.json({ success: true, products });
  } catch (error) {
    console.error("Error fetching farmer products:", error);
    const message = (error as Error)?.message || "Failed to fetch farmer products";
    return NextResponse.json(
      { message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== USER_ROLES.FARMER && user.role !== USER_ROLES.FPO)) {
      return NextResponse.json(
        { message: "Unauthorized: Farmer credentials required" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const parsed = farmerProductFormSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { message: "Validation error", errors: parsed.error.format() },
        { status: 400 }
      );
    }

    const product = await createFarmerProduct(user.id, parsed.data, user.email ?? undefined);
    return NextResponse.json({ success: true, product }, { status: 201 });
  } catch (error: unknown) {
    console.error("Error creating farmer product:", error);
    const message = (error as Error)?.message || "Failed to create product listing. Please try again.";
    return NextResponse.json(
      { message },
      { status: 500 }
    );
  }
}

