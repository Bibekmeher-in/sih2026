import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { getCurrentUser } from "@/lib/auth";
import { answerCommunityAssistant, CommunityAssistantContext } from "@/lib/gemini";
import { connectToDatabase } from "@/lib/db";
import { FarmerGroup } from "@/models/FarmerGroup";
import { CommunityPost } from "@/models/CommunityPost";
import { ProduceAggregation } from "@/models/ProduceAggregation";
import { BulkRequirement } from "@/models/BulkRequirement";
import { Product } from "@/models/Product";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ message: "Authentication required" }, { status: 401 });
    }

    const body = await req.json();
    const { query, groupId } = body;

    if (!query || typeof query !== "string" || !query.trim()) {
      return NextResponse.json({ message: "Query text is required" }, { status: 400 });
    }

    await connectToDatabase();

    let groupName: string | undefined;
    let groupProduct: string | undefined;

    if (groupId) {
      const group = await FarmerGroup.findById(groupId).lean();
      if (group) {
        groupName = group.name;
        groupProduct = group.product;
      }
    }

    // Fetch up to 6 recent community discussions
    const posts = await CommunityPost.find(groupId ? { groupId, status: "ACTIVE" } : { status: "ACTIVE" })
      .sort({ createdAt: -1 })
      .limit(6)
      .lean();

    const relevantDiscussions = posts.map((p) => ({
      author: p.authorName,
      content: p.content,
      type: p.postType,
    }));

    // Fetch active aggregations
    const agg = await ProduceAggregation.findOne(
      groupId ? { groupId, status: { $in: ["OPEN", "TARGET_REACHED"] } } : { status: { $in: ["OPEN", "TARGET_REACHED"] } }
    ).lean();

    const aggregationStatus = agg
      ? {
          product: agg.productName,
          totalKg: agg.totalQuantity,
          targetKg: agg.targetQuantity,
        }
      : undefined;

    // Fetch active bulk buyer requirements
    const buyerReqs = await BulkRequirement.find({ status: { $in: ["OPEN", "MATCHED"] } })
      .sort({ createdAt: -1 })
      .limit(4)
      .lean();

    const activeBuyerRequirements = buyerReqs.map((b) => ({
      product: b.productName,
      quantity: b.requiredQuantity,
      targetPrice: b.targetPrice,
      location: `${b.deliveryLocation.district}, ${b.deliveryLocation.state}`,
    }));

    // Fetch user inventory if farmer
    const products = await Product.find({
      seller: new mongoose.Types.ObjectId(user.id),
      status: "AVAILABLE",
    })
      .limit(5)
      .lean();
    const farmerInventory = products.map((p) => ({
      name: p.name,
      quantity: p.availableQuantity,
      price: p.price,
    }));

    const context: CommunityAssistantContext = {
      farmerName: user.name || "Farmer",
      groupName,
      relevantDiscussions,
      farmerInventory,
      activeBuyerRequirements,
      aggregationStatus,
    };

    const result = await answerCommunityAssistant(query.trim(), context);

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("Error in community AI assistant:", error);
    const message = (error as Error)?.message || "Failed to get AI assistant response";
    return NextResponse.json({ message }, { status: 500 });
  }
}
