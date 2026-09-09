import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { USER_ROLES } from "@/types";
import { submitOrderReview } from "@/lib/consumer-service";
import { reviewFormSchema } from "@/schemas";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== USER_ROLES.CONSUMER) {
      return NextResponse.json(
        { message: "Unauthorized: Consumer credentials required" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const parsed = reviewFormSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { message: "Validation error", errors: parsed.error.format() },
        { status: 400 }
      );
    }

    const result = await submitOrderReview(user.id, parsed.data);
    return NextResponse.json(result, { status: 201 });
  } catch (error: unknown) {
    console.error("Error submitting review:", error);
    return NextResponse.json(
      { message: "Failed to submit review. Please try again." },
      { status: 500 }
    );
  }
}

