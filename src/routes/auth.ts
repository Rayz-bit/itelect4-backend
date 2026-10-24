
import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { UserModel } from "../models/User";

const router = Router();

// POST /api/auth/register
router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (
      typeof name !== "string" ||
      !name.trim() ||
      typeof email !== "string" ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
      typeof password !== "string" ||
      password.length < 8
    ) {
      res.status(400).json({
        message: "Valid name, email, and password (minimum 8 characters) are required"
      });
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await UserModel.findOne({
      email: normalizedEmail
    });

    if (existingUser) {
      res.status(409).json({
        message: "That email is already registered"
      });
      return;
    }

    const user = await UserModel.create({
      name: name.trim(),
      email: normalizedEmail,
      password,
      role: "attendee",
      isActive: true
    });

    res.status(201).json({
      message: "Registration successful",
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({
      message: "Registration failed"
    });
  }
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (
      typeof email !== "string" ||
      typeof password !== "string"
    ) {
      res.status(400).json({
        message: "Email and password are required"
      });
      return;
    }

    const user = await UserModel.findOne({
      email: email.trim().toLowerCase()
    });

    if (!user || !user.isActive) {
      res.status(401).json({
        message: "Invalid email or password"
      });
      return;
    }

    const passwordMatches = await bcrypt.compare(
      password,
      user.password
    );

    if (!passwordMatches) {
      res.status(401).json({
        message: "Invalid email or password"
      });
      return;
    }

    const secret = process.env.JWT_SECRET;

    if (!secret) {
      res.status(500).json({
        message: "JWT_SECRET is not configured"
      });
      return;
    }

    const token = jwt.sign(
      { userId: user._id.toString() },
      secret,
      { expiresIn: "2h" }
    );

    res.status(200).json({
      token,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      message: "Login failed"
    });
  }
});

export default router;
