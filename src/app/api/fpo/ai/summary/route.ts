import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { generateDiscussionSummary, DiscussionPostSnippet } from "@/lib/gemini";
import { connectToDatabase } from "@/lib/db";
import { FarmerGroup } from "@/models/FarmerGroup";
import { CommunityPost } from "@/models/CommunityPost";
import { ProduceAggregation } from "@/models/ProduceAggregation";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ message: "Authentication required" }, { status: 401 });
    }

    const body = await req.json();
    const { groupId } = body;

    await connectToDatabase();

    let groupName = "Odisha Farmers Producer Community";
    let cropName = "Vegetables";
    let aggregationStats: { totalKg: number; targetKg: number; farmerCount: number } | undefined;

    let postQuery: Record<string, any> = { status: "ACTIVE" };
    if (groupId) {
      const group = await FarmerGroup.findById(groupId);
      if (group) {
        groupName = group.name;
        cropName = group.product;
      }
      postQuery.groupId = groupId;

      const agg = await ProduceAggregation.findOne({ groupId });
      if (agg) {
        aggregationStats = {
          totalKg: agg.totalQuantity,
          targetKg: agg.targetQuantity,
          farmerCount: agg.contributions.length,
        };
      }
    }

    const posts = await CommunityPost.find(postQuery)
      .sort({ createdAt: -1 })
      .limit(15)
      .lean();

    const discussions: DiscussionPostSnippet[] = posts.map((p) => ({
      author: p.authorName,
      content: p.content,
      postType: p.postType,
      marketPrice: p.marketPriceDetails?.pricePerKg,
      location: p.marketPriceDetails ? `${p.marketPriceDetails.marketName}, ${p.marketPriceDetails.location}` : undefined,
    }));

    const result = await generateDiscussionSummary(
      groupName,
      cropName,
      discussions,
      aggregationStats
    );

    return NextResponse.json({
      success: true,
      groupName,
      cropName,
      postCount: posts.length,
      ...result,
    });
  } catch (error) {
    console.error("Error generating AI discussion summary:", error);
    const message = (error as Error)?.message || "Failed to generate AI summary";
    return NextResponse.json({ message }, { status: 500 });
  }
}
