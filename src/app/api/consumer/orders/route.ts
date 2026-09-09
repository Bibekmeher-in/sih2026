import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { USER_ROLES } from "@/types";
import { getConsumerOrders, createConsumerOrder } from "@/lib/consumer-service";
import { checkoutFormSchema } from "@/schemas";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== USER_ROLES.CONSUMER) {
      return NextResponse.json(
        { message: "Unauthorized: Consumer credentials required" },
        { status: 401 }
      );
    }

    const orders = await getConsumerOrders(user.id);
    return NextResponse.json({ success: true, orders });
  } catch (error) {
    console.error("Error fetching consumer orders:", error);
    return NextResponse.json(
      { message: "Failed to fetch orders" },
      { status: 500 }
    );
  }
}

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
    const parsed = checkoutFormSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { message: "Validation error", errors: parsed.error.format() },
        { status: 400 }
      );
    }

    const result = await createConsumerOrder(user.id, parsed.data);
    return NextResponse.json(result, { status: 201 });
  } catch (error: unknown) {
    console.error("Error placing consumer order:", error);
    return NextResponse.json(
      { message: "Failed to process order. Please try again." },
      { status: 500 }
    );
  }
}

