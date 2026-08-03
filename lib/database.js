import mongoose from "mongoose";
import dns from "dns";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error("Please define the MONGODB_URI environment variable inside .env");
}

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents connections growing exponentially
 * during API Route usage.
 */
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function dbConnect() {
  if (cached.conn) {
    return cached.conn;
  }

  // Configure fallback DNS resolvers (Google Public DNS & Cloudflare DNS)
  // to resolve MongoDB Atlas mongodb+srv:// SRV records reliably across local ISP/Windows DNS resolvers.
  try {
    dns.setServers(["8.8.8.8", "1.1.1.1", "8.8.4.4"]);
    if (dns.promises && typeof dns.promises.setServers === "function") {
      dns.promises.setServers(["8.8.8.8", "1.1.1.1", "8.8.4.4"]);
    }
  } catch (dnsErr) {
    // Ignored if environment restricts custom DNS servers
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      dbName: process.env.MONGODB_DBNAME,
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      return mongoose;
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

export default dbConnect;