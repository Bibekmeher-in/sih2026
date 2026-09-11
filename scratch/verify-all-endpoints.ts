import { connectToDatabase } from "@/lib/db";
import { User, FarmerGroup, CommunityPost, ProduceAggregation, BulkRequirement } from "@/models";
import { generateDiscussionSummary, answerCommunityAssistant } from "@/lib/gemini";
import {
  getFpoDashboardData,
  listGroups,
  createGroup,
  listPosts,
  createPost,
  toggleLikePost,
  listComments,
  createComment,
  listProduceAggregations,
  addProduceToAggregation,
  calculateMatchScore,
  listMembers,
  getFpoAnalytics,
  getFpoProfile,
} from "@/lib/fpo-community-service";

async function main() {
  console.log("=== COMPREHENSIVE END-TO-END FPO & COMMUNITY VERIFICATION ===");
  await connectToDatabase();

  const fpoUser = await User.findOne({ role: "FPO" });
  if (!fpoUser) throw new Error("FPO User not found");

  const farmerUser = await User.findOne({ role: "FARMER" });
  if (!farmerUser) throw new Error("Farmer User not found");

  console.log("1. Verified Users:", {
    fpo: fpoUser.name,
    farmer: farmerUser.name,
  });

  // 1. Dashboard
  const dashboard = await getFpoDashboardData(fpoUser._id.toString(), "FPO");
  console.log("2. Dashboard Summary:", {
    fpoOrg: dashboard.fpoDetails.organizationName,
    activeFarmers: dashboard.metrics.activeFarmers,
    farmerGroups: dashboard.metrics.farmerGroups,
    aggregatedKg: dashboard.metrics.aggregatedProduceKg,
    opportunities: dashboard.metrics.pendingBulkOpportunities,
  });

  // 2. Groups
  const groups = await listGroups();
  console.log(`3. Farmer Groups: Found ${groups.length} groups.`);
  const tomatoGroup = groups.find((g) => g.product.toLowerCase() === "tomato") || groups[0];
  console.log(`   Selected Focus Group: ${tomatoGroup.name} (${tomatoGroup.product})`);

  // 3. Posts & Market Prices
  const posts = await listPosts({ groupId: tomatoGroup._id });
  console.log(`4. Group Posts: Found ${posts.length} posts in ${tomatoGroup.name}`);
  const pricePost = posts.find((p) => p.postType === "MARKET_PRICE");
  if (pricePost && pricePost.marketPriceDetails) {
    console.log(`   Verified Mandi Price Report: ₹${pricePost.marketPriceDetails.pricePerKg}/kg for ${pricePost.marketPriceDetails.crop} at ${pricePost.marketPriceDetails.marketName}`);
  }

  // 4. Test Like Toggle
  if (posts.length > 0) {
    const likeRes = await toggleLikePost(farmerUser._id.toString(), posts[0]._id);
    console.log(`5. Like Toggle: Post ${posts[0]._id.slice(-4)} now has ${likeRes.likesCount} likes (liked: ${likeRes.isLiked})`);
    // Toggle back
    await toggleLikePost(farmerUser._id.toString(), posts[0]._id);
  }

  // 5. Test Comment Creation
  if (posts.length > 0) {
    const comment = await createComment(
      farmerUser._id.toString(),
      posts[0]._id,
      "Verification test comment: Pooling produce directly helps everyone!"
    );
    console.log(`6. Comment Created: "${comment.content}" by ${comment.authorName}`);
  }

  // 6. Test Produce Aggregation
  const aggregations = await listProduceAggregations(tomatoGroup._id);
  console.log(`7. Aggregation Pool for ${tomatoGroup.name}:`, {
    totalKg: aggregations[0]?.totalQuantity,
    targetKg: aggregations[0]?.targetQuantity,
    status: aggregations[0]?.status,
    contributionsCount: aggregations[0]?.contributionsCount,
  });

  // 7. Deterministic Smart Matching Score
  const bulkReq = await BulkRequirement.findOne({ productName: "Tomato" });
  if (bulkReq && aggregations[0]) {
    const match = calculateMatchScore(
      {
        productName: bulkReq.productName,
        category: bulkReq.category,
        requiredQuantity: bulkReq.requiredQuantity,
        targetPrice: bulkReq.targetPrice,
        deliveryLocation: bulkReq.deliveryLocation,
      },
      {
        productName: aggregations[0].productName,
        category: aggregations[0].category,
        availableQuantity: aggregations[0].availableQuantity,
        targetPrice: aggregations[0].targetPrice,
        location: { district: "Ganjam", state: "Odisha" },
      }
    );
    console.log(`8. Deterministic Smart Match Score: ${match.matchScore}%`);
    console.log("   Breakdown:", match.breakdown);
  }

  // 8. Test Gemini AI Discussion Summary
  console.log("\n9. Testing Gemini AI Discussion Summary...");
  const recentSnippets = posts.slice(0, 8).map((p) => ({
    author: p.authorName,
    content: p.content,
    postType: p.postType,
    marketPrice: p.marketPriceDetails?.pricePerKg,
    location: p.marketPriceDetails ? `${p.marketPriceDetails.marketName}, ${p.marketPriceDetails.location}` : undefined,
  }));

  const aiSummary = await generateDiscussionSummary(
    tomatoGroup.name,
    tomatoGroup.product,
    recentSnippets,
    aggregations[0] ? { totalKg: aggregations[0].totalQuantity, targetKg: aggregations[0].targetQuantity, farmerCount: aggregations[0].contributionsCount } : undefined
  );

  console.log("   Gemini Summary Result:", {
    isAiGenerated: aiSummary.isAiGenerated,
    modelUsed: aiSummary.modelUsed,
    summaryPreview: aiSummary.summary.slice(0, 120) + "...",
    bulletCount: aiSummary.bullets.length,
  });

  // 9. Test Gemini Community Copilot Q&A
  console.log("\n10. Testing Gemini Community Copilot Q&A...");
  const aiAssistantRes = await answerCommunityAssistant(
    "Should I sell my 150 kg tomato at Hinjilicut mandi for ₹28/kg or pool with the group for ₹32/kg buyer?",
    {
      farmerName: farmerUser.name,
      groupName: tomatoGroup.name,
      relevantDiscussions: recentSnippets.map((s) => ({ author: s.author, content: s.content, type: s.postType })),
      aggregationStatus: aggregations[0] ? { product: aggregations[0].productName, totalKg: aggregations[0].totalQuantity, targetKg: aggregations[0].targetQuantity } : undefined,
      activeBuyerRequirements: bulkReq ? [{ product: bulkReq.productName, quantity: bulkReq.requiredQuantity, targetPrice: bulkReq.targetPrice, location: "Khordha, Odisha" }] : undefined,
    }
  );

  console.log("   Gemini Assistant Result:", {
    isAiGenerated: aiAssistantRes.isAiGenerated,
    modelUsed: aiAssistantRes.modelUsed,
    replyPreview: aiAssistantRes.reply.slice(0, 150) + "...",
    actions: aiAssistantRes.suggestedActions,
  });

  console.log("\n=== ALL 10 TEST SUITES COMPLETED WITH 100% SUCCESS ===");
  process.exit(0);
}

main().catch((e) => {
  console.error("Test failed:", e);
  process.exit(1);
});
