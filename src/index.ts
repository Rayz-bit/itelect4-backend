
import "dotenv/config";
import express from "express";
import cors from "cors";
import mongoose from "mongoose";

import authRoutes from "./routes/auth";
import eventRoutes from "./routes/events";

const app = express();
const PORT = Number(process.env.PORT) || 4000;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get("/api/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
    db: mongoose.connection.readyState === 1
  });
});

// Authentication routes
app.use("/api/auth", authRoutes);

// Event CRUD routes
app.use("/api/events", eventRoutes);

// Unknown routes
app.use((_req, res) => {
  res.status(404).json({
    message: "Route not found"
  });
});

// Connect to MongoDB before starting server
async function startServer() {
  try {
    const mongoURI = process.env.MONGODB_URI;

    if (!mongoURI) {
      throw new Error("MONGODB_URI is missing from .env");
    }

    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET is missing from .env");
    }

    await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 5000
    });

    console.log("MongoDB connected successfully");

    app.listen(PORT, () => {
      console.log(`API running at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Server startup failed:", error);
    process.exit(1);
  }
}

startServer();
