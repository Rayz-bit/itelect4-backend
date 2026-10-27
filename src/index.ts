import "dotenv/config";
import express from "express";
import cors from "cors";
import mongoose from "mongoose";

import authRoutes from "./routes/auth";
import eventRoutes from "./routes/events";
import rsvpRoutes from "./routes/rsvps";

const app = express();
const PORT = Number(process.env.PORT) || 4000;

// Allowed frontend origins come only from the environment
const allowedOrigins = (process.env.CORS_ORIGIN || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

// Middleware
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Origin not allowed by CORS"));
      }
    },
  })
);

app.use(express.json());

// Reuse the MongoDB connection across serverless requests
let connectionPromise: Promise<typeof mongoose> | null = null;

async function connectToDatabase() {
  if (mongoose.connection.readyState === 1) {
    return;
  }

  const mongoURI = process.env.MONGODB_URI;

  if (!mongoURI) {
    throw new Error("MONGODB_URI is missing");
  }

  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is missing");
  }

  if (!connectionPromise) {
    connectionPromise = mongoose
      .connect(mongoURI, { serverSelectionTimeoutMS: 5000 })
      .catch((error) => {
        connectionPromise = null;
        throw error;
      });
  }

  await connectionPromise;
}

// Connect before handling API routes
app.use(async (_req, _res, next) => {
  try {
    await connectToDatabase();
    next();
  } catch (error) {
    next(error);
  }
});

// Health check
app.get("/api/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
    db: mongoose.connection.readyState === 1,
  });
});

// Authentication routes
app.use("/api/auth", authRoutes);

// Event routes
app.use("/api/events", eventRoutes);

// RSVP routes
app.use("/api/rsvps", rsvpRoutes);

// Unknown routes
app.use((_req, res) => {
  res.status(404).json({
    message: "Route not found",
  });
});

// Error handler
app.use(
  (error: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error("API error:", error.message);
    res.status(500).json({
      message: "Internal server error",
    });
  }
);

// Local development only; Vercel handles requests itself
if (process.env.VERCEL !== "1") {
  app.listen(PORT, () => {
    console.log(`API running on port ${PORT}`);
  });
}

export default app;