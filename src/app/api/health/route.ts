import { NextResponse } from "next/server";
import { connectToDatabase, getDatabaseState } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  let dbStatus = getDatabaseState();

  if (dbStatus !== "connected") {
    try {
      await connectToDatabase();
      dbStatus = getDatabaseState();
    } catch {
      // Database is currently unreachable or not yet configured
      dbStatus = "disconnected";
    }
  }

  return NextResponse.json({
    status: "ok",
    database: dbStatus === "connected" ? "connected" : "disconnected",
    timestamp: new Date().toISOString(),
    service: "KISANOVA Core Engine",
    version: "1.0.0",
  });
}
