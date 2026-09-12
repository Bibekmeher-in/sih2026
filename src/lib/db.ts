import mongoose from "mongoose";

/**
 * Global cache interface for Mongoose in development.
 * Prevents multiple connections during Next.js Hot Module Replacement (HMR).
 */
interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
  uri?: string;
}

declare global {
  var mongooseCache: MongooseCache | undefined;
}

const cached: MongooseCache = global.mongooseCache || { conn: null, promise: null, uri: undefined };

if (!global.mongooseCache) {
  global.mongooseCache = cached;
}

/**
 * Connect to MongoDB Atlas with connection caching.
 * Only executes on the server side.
 */
export async function connectToDatabase(): Promise<typeof mongoose> {
  if (typeof window !== "undefined") {
    throw new Error("Database connection cannot be invoked from the client side.");
  }

  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error(
      "Please define the MONGODB_URI environment variable inside .env.local"
    );
  }

  // If URI has changed, cleanly disconnect and reinitialize
  if (cached.uri && cached.uri !== uri) {
    try {
      await mongoose.disconnect();
    } catch {
      // ignore disconnect error
    }
    cached.conn = null;
    cached.promise = null;
  }

  if (cached.conn && mongoose.connection.readyState === 1) {
    return cached.conn;
  }

  cached.uri = uri;

  if (!cached.promise) {
    const opts: mongoose.ConnectOptions = {
      bufferCommands: false,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 8000,
    };

    cached.promise = mongoose.connect(uri, opts).then((mongooseInstance) => {
      return mongooseInstance;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

/**
 * Checks current connection state without throwing an exception.
 * Returns: "connected" | "connecting" | "disconnecting" | "disconnected"
 */
export function getDatabaseState(): "connected" | "connecting" | "disconnecting" | "disconnected" {
  switch (mongoose.connection.readyState) {
    case 1:
      return "connected";
    case 2:
      return "connecting";
    case 3:
      return "disconnecting";
    default:
      return "disconnected";
  }
}
