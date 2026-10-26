import { Router } from "express";
import { Types } from "mongoose";
import { RsvpModel } from "../models/Rsvp";
import { EventModel } from "../models/Event";
import { requireAuth } from "../middleware/auth";

const router = Router();

// Every RSVP route requires authentication.
router.use(requireAuth);

// GET /api/rsvps -- only the logged-in user's RSVPs
router.get("/", async (req, res) => {
  try {
    const rsvps = await RsvpModel.find({
      userId: req.userId
    }).sort({ createdAt: -1 });

    res.status(200).json(rsvps);
  } catch (error) {
    console.error("List rsvps error:", error);
    res.status(500).json({ message: "Failed to load RSVPs" });
  }
});

// POST /api/rsvps -- the browser sends only { eventId }.
// The server decides the owner (from the token) and the starting status.
router.post("/", async (req, res) => {
  try {
    const eventId = req.body?.eventId;

    if (typeof eventId !== "string" || !Types.ObjectId.isValid(eventId)) {
      res.status(400).json({ message: "A valid eventId is required" });
      return;
    }

    const event = await EventModel.findById(eventId);

    if (!event) {
      res.status(404).json({ message: "Event not found" });
      return;
    }

    const rsvp = await RsvpModel.create({
      userId: req.userId,
      eventId
    });

    res.status(201).json(rsvp);
  } catch (error: unknown) {
    // 11000 = duplicate key: this user already RSVP'd to this event
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code: number }).code === 11000
    ) {
      res.status(409).json({ message: "You already RSVP'd to this event" });
      return;
    }

    console.error("Create rsvp error:", error);
    res.status(500).json({ message: "Failed to create RSVP" });
  }
});

export default router;