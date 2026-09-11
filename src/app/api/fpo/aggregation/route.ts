import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import {
  listProduceAggregations,
  addProduceToAggregation,
} from "@/lib/fpo-community-service";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const groupId = searchParams.get("groupId") || undefined;

    const aggregations = await listProduceAggregations(groupId);
    return NextResponse.json({ success: true, aggregations });
  } catch (error) {
    console.error("Error listing produce aggregations:", error);
    const message = (error as Error)?.message || "Failed to list aggregations";
    return NextResponse.json({ message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { message: "Authentication required to contribute produce" },
        { status: 401 }
      );
    }

    const body = await req.json();
    if (!body.groupId || !body.quantity || !body.expectedPrice) {
      return NextResponse.json(
        { message: "groupId, quantity, and expectedPrice are required" },
        { status: 400 }
      );
    }

    const result = await addProduceToAggregation(user.id, {
      groupId: body.groupId,
      quantity: Number(body.quantity),
      expectedPrice: Number(body.expectedPrice),
      qualityGrade: body.qualityGrade,
      harvestDate: body.harvestDate,
      availableDate: body.availableDate,
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("Error contributing to aggregation:", error);
    const message = (error as Error)?.message || "Failed to contribute to aggregation";
    return NextResponse.json({ message }, { status: 500 });
  }
}
