// config/database.ts
import mongoose from "mongoose";
import { MONGODB_URI } from "./consts";

/**
 * Connect to MongoDB using Mongoose
 */
export const connectDB = async (): Promise<void> => {
  try {
    const mongoURI = MONGODB_URI;

    if (!mongoURI) {
      throw new Error("MONGODB_URI is not defined in environment variables");
    }

    const conn = await mongoose.connect(mongoURI, {
      dbName: process.env.MONGODB_DB_NAME || "rag_database",
      autoIndex: true, // Disable in production if needed
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error("MongoDB connection failed:", error);
    process.exit(1);
  }
};

/**
 * Graceful shutdown
 */
process.on("SIGINT", async () => {
  await mongoose.connection.close();
  console.log("MongoDB connection closed due to app termination");
  process.exit(0);
});
