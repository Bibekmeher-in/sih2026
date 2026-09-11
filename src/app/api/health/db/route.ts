import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectToDatabase, getDatabaseState } from "@/lib/db";
import { User, Product, Order } from "@/models";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

/**
 * GET /api/health/db
 *
 * Development diagnostic endpoint to inspect database connection details,
 * provider type (Local vs Atlas), database name, ping status, document counts,
 * and authenticated farmer state without exposing credentials.
 */
export async function GET() {
  const uri = process.env.MONGODB_URI || "";
  const hasUri = Boolean(uri && uri.trim().length > 0);

  // Determine provider type without leaking secrets
  let provider: "ATLAS" | "LOCAL" | "CUSTOM_REMOTE" | "UNCONFIGURED" = "UNCONFIGURED";
  let hostHint = "";
  if (!hasUri) {
    provider = "UNCONFIGURED";
  } else if (uri.startsWith("mongodb+srv://") || uri.includes(".mongodb.net")) {
    provider = "ATLAS";
    // Extract cluster domain safely e.g. "cluster0.xxxxx.mongodb.net"
    const hostMatch = uri.match(/@([^/?#]+)/);
    hostHint = hostMatch ? hostMatch[1] : "mongodb.net";
  } else if (uri.includes("127.0.0.1") || uri.includes("localhost")) {
    provider = "LOCAL";
    hostHint = uri.includes("127.0.0.1") ? "127.0.0.1:27017" : "localhost:27017";
  } else {
    provider = "CUSTOM_REMOTE";
    const hostMatch = uri.match(/@([^/?#]+)/);
    hostHint = hostMatch ? hostMatch[1] : "remote-host";
  }

  // Connection attempt
  let dbStatus = getDatabaseState();
  let connectionError: string | null = null;

  try {
    await connectToDatabase();
    dbStatus = getDatabaseState();
  } catch (err: unknown) {
    dbStatus = "disconnected";
    connectionError = (err as Error)?.message || String(err);
  }

  const isConnected = dbStatus === "connected" && mongoose.connection.readyState === 1;

  // Execute Ping
  let pingStatus = "failed";
  let pingLatencyMs: number | null = null;
  let databaseName = "";
  const collectionsMap: Record<string, number> = {};
  let userCount = 0;
  let productCount = 0;
  let orderCount = 0;

  if (isConnected && mongoose.connection.db) {
    databaseName = mongoose.connection.db.databaseName;
    const pingStart = Date.now();
    try {
      await mongoose.connection.db.admin().ping();
      pingLatencyMs = Date.now() - pingStart;
      pingStatus = "ok";
    } catch {
      pingStatus = "failed";
    }

    // Count collections and documents
    try {
      const collections = await mongoose.connection.db.listCollections().toArray();
      for (const col of collections) {
        try {
          const count = await mongoose.connection.db.collection(col.name).countDocuments();
          collectionsMap[col.name] = count;
        } catch {
          collectionsMap[col.name] = -1;
        }
      }
    } catch (e) {
      console.warn("Failed to list collections:", e);
    }

    // Verify User, Product, Order collections
    try {
      userCount = await User.countDocuments();
    } catch {
      userCount = collectionsMap["users"] ?? 0;
    }

    try {
      productCount = await Product.countDocuments();
    } catch {
      productCount = collectionsMap["products"] ?? 0;
    }

    try {
      orderCount = await Order.countDocuments();
    } catch {
      orderCount = collectionsMap["orders"] ?? 0;
    }
  }

  // Verify currently authenticated farmer data
  let authenticatedFarmer: {
    isAuthenticated: boolean;
    userId?: string;
    role?: string;
    hasProducts?: boolean;
    productCount?: number;
    hasOrders?: boolean;
    orderCount?: number;
    message?: string;
  } = { isAuthenticated: false, message: "No active user session detected." };

  try {
    const currentUser = await getCurrentUser();
    if (currentUser) {
      let sellerObjectId: mongoose.Types.ObjectId | null = null;
      if (mongoose.Types.ObjectId.isValid(currentUser.id)) {
        sellerObjectId = new mongoose.Types.ObjectId(currentUser.id);
      } else if (currentUser.email) {
        const found = await User.findOne({ email: currentUser.email.toLowerCase() }).select("_id").lean();
        if (found) sellerObjectId = (found as { _id: mongoose.Types.ObjectId })._id;
      }

      if (sellerObjectId) {
        const farmerProducts = await Product.countDocuments({ seller: sellerObjectId });
        const farmerOrders = await Order.countDocuments({ seller: sellerObjectId });
        authenticatedFarmer = {
          isAuthenticated: true,
          userId: currentUser.id,
          role: currentUser.role,
          hasProducts: farmerProducts > 0,
          productCount: farmerProducts,
          hasOrders: farmerOrders > 0,
          orderCount: farmerOrders,
        };
      } else {
        authenticatedFarmer = {
          isAuthenticated: true,
          userId: currentUser.id,
          role: currentUser.role,
          message: "User session exists but matching user record not found in active database.",
        };
      }
    }
  } catch {
    // Non-fatal session check
  }

  const responsePayload = {
    success: isConnected && pingStatus === "ok",
    timestamp: new Date().toISOString(),
    connection: {
      hasUri,
      provider, // "LOCAL" | "ATLAS" | "CUSTOM_REMOTE"
      hostHint, // e.g. "127.0.0.1:27017" or "cluster0.xxxxx.mongodb.net"
      status: dbStatus,
      readyState: mongoose.connection.readyState,
      actualDatabaseName: databaseName,
      ping: {
        status: pingStatus,
        latencyMs: pingLatencyMs,
      },
      ...(connectionError && { error: connectionError }),
    },
    counts: {
      users: userCount,
      products: productCount,
      orders: orderCount,
      totalCollections: Object.keys(collectionsMap).length,
      collections: collectionsMap,
    },
    authenticatedFarmer,
    environmentRecommendation:
      provider === "LOCAL"
        ? "Application is currently connected to your local MongoDB instance (127.0.0.1:27017). To switch to MongoDB Atlas, update MONGODB_URI in .env.local with your Atlas connection string (e.g. mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/KISANOVA?retryWrites=true&w=majority) and restart next dev."
        : "Application is connected to MongoDB Atlas. Ensure the database name in the URI path is set to /KISANOVA so collections are not placed into default 'test'.",
  };

  return NextResponse.json(responsePayload, {
    status: isConnected ? 200 : 503,
  });
}
