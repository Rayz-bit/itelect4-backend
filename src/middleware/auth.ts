
import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

// Add userId to Express Request
declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

// Middleware to protect routes
export function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({
      message: "No token. Send Authorization: Bearer <token>"
    });
    return;
  }

  const token = authHeader.slice(7);

  try {
    const secret = process.env.JWT_SECRET;

    if (!secret) {
      res.status(500).json({
        message: "JWT_SECRET is not configured"
      });
      return;
    }

    const decoded = jwt.verify(token, secret);

    if (
      typeof decoded === "string" ||
      typeof decoded.userId !== "string"
    ) {
      res.status(401).json({
        message: "Invalid token"
      });
      return;
    }

    req.userId = decoded.userId;
    next();
  } catch {
    res.status(401).json({
      message: "Invalid or expired token"
    });
  }
}
