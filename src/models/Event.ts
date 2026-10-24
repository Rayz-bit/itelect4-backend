
import mongoose, { Schema, Types } from "mongoose";
import type { EventDoc } from "../types";

const eventSchema = new Schema<EventDoc>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      match: /\S/,
      maxlength: 100
    },
    date: {
      type: Date,
      required: true
    },
    location: {
      type: String,
      required: true,
      trim: true
    },
    capacity: {
      type: Number,
      required: true,
      min: 1,
      max: 10000
    },
    organizerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true
    }
  },
  { timestamps: true }
);

export const EventModel = mongoose.model<EventDoc>(
  "Event",
  eventSchema
);
