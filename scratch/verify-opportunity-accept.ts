import { connectToDatabase } from "@/lib/db";
import { acceptBuyerOpportunity } from "@/lib/fpo-community-service";
import { BulkRequirement, ProduceAggregation, Order, Notification, User } from "@/models";

async function main() {
  await connectToDatabase();
  const fpoUser = await User.findOne({ role: "FPO" });
  if (!fpoUser) throw new Error("No FPO user found");

  const tomatoReq = await BulkRequirement.findOne({ productName: "Tomato", status: "OPEN" });
  if (!tomatoReq) throw new Error("No open tomato requirement found");

  const tomatoAgg = await ProduceAggregation.findOne({ productName: "Tomato", status: "OPEN" });
  if (!tomatoAgg) throw new Error("No open tomato aggregation found");

  console.log("Found Requirement:", tomatoReq.buyerName, "| Required:", tomatoReq.requiredQuantity, "kg @ ₹" + tomatoReq.targetPrice);
  console.log("Found Aggregation:", tomatoAgg.productName, "| Available:", tomatoAgg.availableQuantity, "kg");

  console.log("\nAccepting opportunity as FPO...");
  const acceptResult = await acceptBuyerOpportunity(
    fpoUser._id.toString(),
    tomatoReq._id.toString(),
    tomatoAgg._id.toString()
  );

  console.log("Opportunity accepted successfully! Order ID:", acceptResult.orderId);

  // Verify DB state
  const updatedReq = await BulkRequirement.findById(tomatoReq._id);
  console.log("Updated Requirement Status:", updatedReq?.status);

  const updatedAgg = await ProduceAggregation.findById(tomatoAgg._id);
  console.log("Updated Aggregation Available:", updatedAgg?.availableQuantity, "kg | Reserved:", updatedAgg?.reservedQuantity, "kg | Status:", updatedAgg?.status);

  const createdOrder = await Order.findById(acceptResult.orderId);
  console.log("Created Order:", createdOrder?.orderNumber, "| Total: ₹" + createdOrder?.total, "| Payment Status:", createdOrder?.paymentStatus);

  const notifs = await Notification.find({ type: "BULK_OPPORTUNITY" }).sort({ createdAt: -1 }).limit(4);
  console.log(`Generated ${notifs.length} farmer notifications:`);
  for (const n of notifs) {
    console.log(`  - [${n.title}] to ${n.recipient}: ${n.message.slice(0, 80)}...`);
  }

  // Reset tomatoReq and tomatoAgg back to OPEN so the UI demo still has the open opportunity ready to be accepted by the user on the screen!
  tomatoReq.status = "OPEN";
  await tomatoReq.save();
  tomatoAgg.availableQuantity = 700;
  tomatoAgg.reservedQuantity = 0;
  tomatoAgg.status = "OPEN";
  tomatoAgg.matchedBuyerRequirementId = undefined;
  tomatoAgg.matchedOrderId = undefined;
  await tomatoAgg.save();
  await Order.findByIdAndDelete(acceptResult.orderId);

  console.log("\nReset demo state so user can accept live from the UI!");
  process.exit(0);
}

main().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
