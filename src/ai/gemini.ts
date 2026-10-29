import type { Content } from "@google/genai";
import { EXAMPLES, wrap } from "./prompt";

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