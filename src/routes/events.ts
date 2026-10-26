import { Router } from "express";
import { Types } from "mongoose";
import { EventModel } from "../models/Event";
import { requireAuth } from "../middleware/auth";

const router = Router();

// Read :id from the URL as a valid ObjectId string, or null.
// The typeof check narrows string | string[] down to string.
function getValidId(raw: string | string[] | undefined): string | null {
  return typeof raw === "string" && Types.ObjectId.isValid(raw) ? raw : null;
}

// Validate event input.
function validateEvent(body: unknown): string | null {
  if (!body || typeof body !== "object") {
    return "Event details are required";
  }

  const data = body as Record<string, unknown>;

  if (
    typeof data.title !== "string" ||
    !data.title.trim() ||
    data.title.length > 100
  ) {
    return "Title must contain 1-100 characters";
  }

  if (typeof data.location !== "string" || !data.location.trim()) {
    return "Location is required";
  }

  if (
    typeof data.capacity !== "number" ||
    !Number.isInteger(data.capacity) ||
    data.capacity < 1 ||
    data.capacity > 10000
  ) {
    return "Capacity must be an integer between 1 and 10000";
  }

  if (
    typeof data.date !== "string" ||
    !data.date.trim() ||
    Number.isNaN(Date.parse(data.date))
  ) {
    return "A valid date is required";
  }

  return null;
}

// 1. GET /api/events  (PUBLIC)
router.get("/", async (_req, res) => {
  try {
    const events = await EventModel.find().sort({ date: 1 });
    res.status(200).json(events);
  } catch (error) {
    console.error("List events error:", error);
    res.status(500).json({ message: "Failed to load events" });
  }
});

// 2. GET /api/events/:id  (PUBLIC)
router.get("/:id", async (req, res) => {
  try {
    const id = getValidId(req.params.id);

    if (!id) {
      res.status(404).json({ message: "Event not found" });
      return;
    }

    const event = await EventModel.findById(id);

    if (!event) {
      res.status(404).json({ message: "Event not found" });
      return;
    }

    res.status(200).json(event);
  } catch (error) {
    console.error("Read event error:", error);
    res.status(500).json({ message: "Failed to load event" });
  }
});

// 3. POST /api/events  (PROTECTED)
router.post("/", requireAuth, async (req, res) => {
  try {
    const errorMessage = validateEvent(req.body);

    if (errorMessage) {
      res.status(400).json({ message: errorMessage });
      return;
    }

    const { title, date, location, capacity } = req.body;

    const event = await EventModel.create({
      title: title.trim(),
      date: new Date(date),
      location: location.trim(),
      capacity,
      organizerId: req.userId
    });

    res.status(201).json(event);
  } catch (error) {
    console.error("Create event error:", error);
    res.status(500).json({ message: "Failed to create event" });
  }
});

// 4. PUT /api/events/:id  (PROTECTED, owner only)
router.put("/:id", requireAuth, async (req, res) => {
  try {
    const id = getValidId(req.params.id);

    if (!id) {
      res.status(404).json({ message: "Event not found" });
      return;
    }

    const errorMessage = validateEvent(req.body);

    if (errorMessage) {
      res.status(400).json({ message: errorMessage });
      return;
    }

    const { title, date, location, capacity } = req.body;

    const event = await EventModel.findOneAndUpdate(
      { _id: id, organizerId: req.userId },
      {
        $set: {
          title: title.trim(),
          date: new Date(date),
          location: location.trim(),
          capacity
        }
      },
      { new: true, runValidators: true }
    );

    if (!event) {
      res.status(404).json({ message: "Event not found" });
      return;
    }

    res.status(200).json(event);
  } catch (error) {
    console.error("Update event error:", error);
    res.status(500).json({ message: "Failed to update event" });
  }
});

// 5. DELETE /api/events/:id  (PROTECTED, owner only)
router.delete("/:id", requireAuth, async (req, res) => {
  try {
    const id = getValidId(req.params.id);

    if (!id) {
      res.status(404).json({ message: "Event not found" });
      return;
    }

    const event = await EventModel.findOneAndDelete({
      _id: id,
      organizerId: req.userId
    });

    if (!event) {
      res.status(404).json({ message: "Event not found" });
      return;
    }

    res.status(200).json({ message: "Event deleted successfully" });
  } catch (error) {
    console.error("Delete event error:", error);
    res.status(500).json({ message: "Failed to delete event" });
  }
});

export default router;