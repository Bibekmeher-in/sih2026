import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import { BulkRequirement } from "@/models/BulkRequirement";
import { ProduceAggregation } from "@/models/ProduceAggregation";
import { calculateMatchScore } from "@/lib/fpo-community-service";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    await connectToDatabase();

    const requirements = await BulkRequirement.find({
      status: { $in: ["OPEN", "MATCHED"] },
    })
      .sort({ createdAt: -1 })
      .lean();

    const aggregations = await ProduceAggregation.find({
      status: { $in: ["OPEN", "TARGET_REACHED", "RESERVED"] },
    })
      .populate("groupId", "name location")
      .lean();

    const opportunities = requirements.map((reqDoc) => {
      let bestMatch: { matchScore: number; breakdown: Record<string, number> } = {
        matchScore: 70,
        breakdown: { product: 20, quantity: 20, location: 15, price: 10, date: 5 },
      };
      let matchingAggId: string | null = null;
      let matchingGroupName = "Regional Growers Collective";
      let availableAggregatedKg = 0;

      const matchingAgg = aggregations.find(
        (a) => a.productName.toLowerCase() === reqDoc.productName.toLowerCase()
      );

      if (matchingAgg) {
        const group = matchingAgg.groupId as unknown as { name?: string; location?: { district?: string; state?: string } };
        bestMatch = calculateMatchScore(
          {
            productName: reqDoc.productName,
            category: reqDoc.category,
            requiredQuantity: reqDoc.requiredQuantity,
            targetPrice: reqDoc.targetPrice,
            deliveryLocation: reqDoc.deliveryLocation,
          },
          {
            productName: matchingAgg.productName,
            category: matchingAgg.category,
            availableQuantity: matchingAgg.availableQuantity,
            targetPrice: matchingAgg.targetPrice,
            location: group?.location || { district: "Ganjam", state: "Odisha" },
          }
        );
        matchingAggId = matchingAgg._id.toString();
        matchingGroupName = group?.name || "Local Farmer Collective";
        availableAggregatedKg = matchingAgg.availableQuantity;
      }

      return {
        id: reqDoc._id.toString(),
        buyerId: reqDoc.buyer.toString(),
        buyerName: reqDoc.buyerName,
        buyerPhone: reqDoc.buyerPhone,
        productName: reqDoc.productName,
        category: reqDoc.category,
        requiredQuantity: reqDoc.requiredQuantity,
        unit: reqDoc.unit,
        targetPrice: reqDoc.targetPrice,
        location: `${reqDoc.deliveryLocation.district}, ${reqDoc.deliveryLocation.state}`,
        deliveryHub: reqDoc.deliveryLocation.deliveryHubName || `${reqDoc.deliveryLocation.district} Central Distribution Point`,
        requiredDate: reqDoc.requiredDate,
        status: reqDoc.status,
        matchScore: bestMatch.matchScore,
        scoreBreakdown: bestMatch.breakdown,
        suitableAggregationId: matchingAggId,
        suitableGroupName: matchingGroupName,
        availableAggregatedKg,
      };
    });

    return NextResponse.json({ success: true, opportunities });
  } catch (error) {
    console.error("Error fetching opportunities:", error);
    const message = (error as Error)?.message || "Failed to fetch opportunities";
    return NextResponse.json({ message }, { status: 500 });
  }
}
