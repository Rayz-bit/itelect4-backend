import "dotenv/config";
import mongoose from "mongoose";
import { EventModel } from "./models/Event";

const seedEvents = [
  {
    title: "Tech Meetup 2026",
    date: new Date("2026-11-15T09:00:00Z"),
    location: "Main Auditorium",
    capacity: 100
  },
  {
    title: "AI Workshop",
    date: new Date("2026-11-20T13:00:00Z"),
    location: "Room 301",
    capacity: 40
  },
  {
    title: "Career Fair 2026",
    date: new Date("2026-12-01T08:00:00Z"),
    location: "Gymnasium",
    capacity: 300
  }
];

async function seed(): Promise<void> {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI is missing");

  await mongoose.connect(uri);
  console.log("Connected to database:", mongoose.connection.name);

  // Use the first registered user as the organizer
  const user = await mongoose.connection.collection("users").findOne({});
  if (!user) {
    throw new Error("Register a user first, then run the seed again");
  }

  let added = 0;

  for (const event of seedEvents) {
    // Skip any event whose title already exists, so running twice is safe
    const exists = await EventModel.exists({ title: event.title });

    if (!exists) {
      await EventModel.create({ ...event, organizerId: user._id });
      added++;
    }
  }

  console.log(`Added ${added} event(s)`);
  await mongoose.disconnect();
}

seed().catch((error) => {
  console.error(error);
  process.exit(1);
});