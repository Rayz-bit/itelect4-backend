import { z } from "zod";

// ----- What a client may send to POST /api/ai -----
export const reviewRequestSchema = z.object({
  prompt: z
    .string()
    .trim()
    .min(20, "Describe your event in at least 20 characters.")
    .max(2000, "Keep the description under 2000 characters."),
});

export type ReviewRequest = z.infer<typeof reviewRequestSchema>;

// ----- What Gemini must send back -----
export const reviewSchema = z.object({
  summary: z
    .string()
    .describe("One or two sentences summarising the event plan."),
  strengths: z
    .array(z.string())
    .min(1)
    .max(3)
    .describe("What is good about the plan. One to three short points."),
  improvements: z
    .array(z.string())
    .min(1)
    .max(3)
    .describe("What to fix before announcing the event. One to three short points."),
  readiness: z
    .enum(["ready", "needs_work", "not_ready"])
    .describe(
      "ready: attendees have everything they need to RSVP. needs_work: one or two important details are missing. not_ready: the description is too thin to judge."
    ),
});

// The TypeScript type, generated from the schema, not hand-written
export type Review = z.infer<typeof reviewSchema>;

// The JSON Schema that Gemini is sent with each request
export const reviewJsonSchema = z.toJSONSchema(reviewSchema);