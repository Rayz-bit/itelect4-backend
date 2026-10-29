import { GoogleGenAI, type Content } from "@google/genai";
import {
  reviewJsonSchema,
  reviewSchema,
  type Review,
} from "../schemas/review";
import { EXAMPLES, MODEL, SYSTEM_PROMPT, wrap } from "./prompt";

let client: GoogleGenAI | null = null;

// Created on first use, so a missing key fails the one request that needs
// it and not the whole server at startup.
function getClient(): GoogleGenAI {
  if (!client) {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is missing");
    }

    client = new GoogleGenAI({ apiKey, httpOptions: { timeout: 30000 } });
  }

  return client;
}

// The two examples become two finished exchanges (a user turn, then the
// model's reply), and the real description is the last turn. To the model
// it looks like a conversation it has already had twice.
export function buildContents(description: string): Content[] {
  const shots: Content[] = EXAMPLES.flatMap((example) => [
    { role: "user", parts: [{ text: wrap(example.description) }] },
    {
      role: "model",
      parts: [{ text: JSON.stringify(example.review) }],
    },
  ]);

  return [
    ...shots,
    { role: "user", parts: [{ text: wrap(description) }] },
  ];
}

// Thrown when Gemini answered but the answer is unusable. The route
// turns it into a 502; anything else stays a 500.
export class AiReplyError extends Error {}

export async function reviewProject(description: string): Promise<Review> {
  const response = await getClient().models.generateContent({
    model: MODEL,
    contents: buildContents(description),
    config: {
      systemInstruction: SYSTEM_PROMPT,
      // JSON, in exactly this shape. Without these two lines the reply is
      // prose, and prose cannot be put on a screen field by field.
      responseMimeType: "application/json",
      responseJsonSchema: reviewJsonSchema,
      // No temperature here, on purpose. Google's guide for the Gemini 3
      // models says to leave it at its default of 1.0.
    },
  });

  // Check 1: undefined when there is no text at all, for example a reply
  // blocked by Gemini's safety filters.
  const text = response.text;
  if (!text) {
    throw new AiReplyError("Gemini sent back no text");
  }

  // Check 2: asking for JSON makes bad JSON rare, not impossible.
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new AiReplyError("Gemini's reply was not JSON");
  }

  // Check 3: the schema was a request, and this is the check. Nothing that
  // arrived over the network is a Review until something has checked it is.
  const result = reviewSchema.safeParse(data);
  if (!result.success) {
    throw new AiReplyError("Gemini's reply did not match the schema");
  }

  return result.data;
}