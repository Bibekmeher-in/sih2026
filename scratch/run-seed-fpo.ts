
import { connectToDatabase } from "@/lib/db";
import { seedFpoCommunityData } from "@/lib/seed-fpo-data";

async function main() {
  console.log("Connecting to database...");
  await connectToDatabase();
  console.log("Starting FPO & Farmer Community seeding...");
  const result = await seedFpoCommunityData();
  console.log("FPO Community seed finished successfully!", result);
  process.exit(0);
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
