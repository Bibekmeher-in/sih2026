import { NextResponse } from "next/server";
import { seedCompleteDatabase } from "@/lib/seed-database";
import { DEMO_ACCOUNTS, DEMO_PASSWORD } from "@/config/demo-users";
import { getCurrentUser } from "@/lib/auth";
import { USER_ROLES } from "@/types";

export const dynamic = "force-dynamic";

/**
 * POST /api/seed
 * Requires: Admin session OR NODE_ENV=development
 *
 * Security: This endpoint triggers a full database wipe + reseed.
 * It MUST be protected in production to prevent unauthorized data destruction.
 */
export async function POST() {
  // In production, only authenticated admins may trigger a reseed.
  // In development/test, allow unauthenticated access for CI/eval convenience.
  if (process.env.NODE_ENV === "production") {
    const user = await getCurrentUser();
    if (!user || user.role !== USER_ROLES.ADMIN) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Forbidden: Database seeding in production requires an active admin session.",
        },
        { status: 403 }
      );
    }
  }

  try {
    const summary = await seedCompleteDatabase();
    return NextResponse.json({
      success: true,
      message: "Successfully seeded complete KISANOVA agritech database",
      counts: summary,
      demoAccounts: DEMO_ACCOUNTS.map((a) => ({
        role: a.role,
        email: a.email,
        name: a.name,
      })),
      standardPassword: DEMO_PASSWORD,
    });
  } catch (error: unknown) {
    console.error("Database seed error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Database seed operation failed. Check MongoDB connection.",
        // Only include error detail in non-production environments
        ...(process.env.NODE_ENV !== "production" && {
          error: error instanceof Error ? error.message : String(error),
        }),
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    description: "KISANOVA Multi-Collection Seed Registry",
    standardPassword: DEMO_PASSWORD,
    collectionsSupported: [
      "User",
      "FarmerProfile",
      "FPO",
      "BuyerProfile",
      "Category",
      "Product",
      "Inventory",
      "Order",
      "Delivery",
      "Vehicle",
      "Route",
      "DemandForecast",
      "PriceRecommendation",
      "Notification",
      "Review",
    ],
    demoAccounts: DEMO_ACCOUNTS.map((a) => ({
      role: a.role,
      email: a.email,
      name: a.name,
      description: a.description,
    })),
    instruction:
      process.env.NODE_ENV === "production"
        ? "Send a POST request to /api/seed with an active admin session to populate all 15 collections."
        : "Send a POST request to /api/seed to populate all 15 collections with realistic demo data.",
    environment: process.env.NODE_ENV,
  });
}

