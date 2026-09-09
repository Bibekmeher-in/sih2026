import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { USER_ROLES } from "@/types";
import { getBulkRequirements, createBulkRequirement } from "@/lib/buyer-service";
import { bulkRequirementFormSchema } from "@/schemas";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== USER_ROLES.BULK_BUYER) {
      return NextResponse.json(
        { message: "Unauthorized: Bulk Buyer credentials required" },
        { status: 401 }
      );
    }

    const requirements = await getBulkRequirements(user.id);
    return NextResponse.json({ success: true, requirements });
  } catch (error) {
    console.error("Error fetching requirements:", error);
    return NextResponse.json(
      { message: "Failed to fetch requirements" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== USER_ROLES.BULK_BUYER) {
      return NextResponse.json(
        { message: "Unauthorized: Bulk Buyer credentials required" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const parsed = bulkRequirementFormSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { message: "Validation error", errors: parsed.error.format() },
        { status: 400 }
      );
    }

    const result = await createBulkRequirement(user.id, parsed.data);
    return NextResponse.json(result, { status: 201 });
  } catch (error: unknown) {
    console.error("Error creating requirement:", error);
    return NextResponse.json(
      { message: "Failed to create requirement. Please try again." },
      { status: 500 }
    );
  }
}

