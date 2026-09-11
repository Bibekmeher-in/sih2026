import { connectToDatabase } from "@/lib/db";
import {
  getFpoDashboardData,
  listGroups,
  listPosts,
  listProduceAggregations,
  listMembers,
  getFpoAnalytics,
} from "@/lib/fpo-community-service";
import { User } from "@/models";

async function main() {
  await connectToDatabase();
  const fpoUser = await User.findOne({ role: "FPO" });
  if (!fpoUser) throw new Error("No FPO user found");

  console.log("=== Testing FPO Dashboard Data ===");
  const dashboard = await getFpoDashboardData(fpoUser._id.toString(), "FPO");
  console.log("Dashboard Metrics:", dashboard.metrics);
  console.log("FPO Org Name:", dashboard.fpoDetails.organizationName);
  console.log("Top Active Groups:", dashboard.topActiveGroups.length);
  console.log("Recent Activities:", dashboard.recentCommunityActivity.length);
  console.log("Bulk Opportunities:", dashboard.currentBulkOpportunities.length);

  console.log("\n=== Testing Groups List ===");
  const groups = await listGroups();
  console.log("Groups count:", groups.length);
  console.log("Sample group:", groups[0].name, "| Members:", groups[0].memberCount, "| Aggregated Kg:", groups[0].aggregatedQuantityKg);

  console.log("\n=== Testing Community Posts ===");
  const posts = await listPosts({ limit: 5 });
  console.log("Posts retrieved:", posts.length);
  console.log("Sample post:", posts[0].title, "| Author:", posts[0].authorName, "| Type:", posts[0].postType);
  if (posts[0].marketPriceDetails) {
    console.log("  Price Reported: ₹", posts[0].marketPriceDetails.pricePerKg, "/kg at", posts[0].marketPriceDetails.marketName);
  }

  console.log("\n=== Testing Produce Aggregation Pools ===");
  const aggs = await listProduceAggregations();
  console.log("Aggregations count:", aggs.length);
  for (const a of aggs) {
    console.log(`- ${a.productName} Pool: ${a.totalQuantity} / ${a.targetQuantity} kg (${a.status}) with ${a.contributionsCount} farmer contributions`);
  }

  console.log("\n=== Testing FPO Members ===");
  const members = await listMembers();
  console.log("Members count:", members.length);
  console.log("Sample farmer:", members[0].name, "| District:", members[0].district, "| Groups:", members[0].groups.map((g) => g.name).join(", "));

  console.log("\n=== Testing Analytics ===");
  const analytics = await getFpoAnalytics();
  console.log("Analytics summary:", analytics);

  console.log("\nALL SERVICE CHECKS PASSED WITH REAL MONGODB DATA!");
  process.exit(0);
}

main().catch((err) => {
  console.error("Verification failed:", err);
  process.exit(1);
});
