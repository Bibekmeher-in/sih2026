import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { USER_ROLES } from "@/types";
import { getBuyerSuppliers } from "@/lib/buyer-service";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== USER_ROLES.BULK_BUYER) {
      return NextResponse.json(
        { message: "Unauthorized: Bulk Buyer credentials required" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const crop = searchParams.get("crop") || undefined;
    const type = searchParams.get("type") || undefined;
    const district = searchParams.get("district") || undefined;
    const minCapacity = searchParams.get("minCapacity")
      ? parseInt(searchParams.get("minCapacity")!)
      : undefined;

    const suppliers = await getBuyerSuppliers({
      crop,
      type,
      district,
      minCapacity,
    });

    return NextResponse.json({ success: true, suppliers });
  } catch (error) {
    console.error("Error fetching suppliers:", error);
    return NextResponse.json(
      { message: "Failed to fetch suppliers" },
      { status: 500 }
    );
  }
}
