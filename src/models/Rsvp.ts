import mongoose, { Schema } from "mongoose";
import { RsvpStatus, type RsvpDoc } from "../types";

const rsvpSchema = new Schema<RsvpDoc>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    eventId: {
      type: Schema.Types.ObjectId,
      ref: "Event",
      required: true
    },
    status: {
      type: String,
      enum: Object.values(RsvpStatus),
      default: RsvpStatus.Pending
    },
    respondedAt: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true }
);

// One RSVP per person per event
rsvpSchema.index({ userId: 1, eventId: 1 }, { unique: true });

export const RsvpModel = mongoose.model<RsvpDoc>("Rsvp", rsvpSchema);