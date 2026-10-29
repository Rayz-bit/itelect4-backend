import "dotenv/config";
import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY;

console.log("Key loaded:", Boolean(apiKey), "length:", apiKey?.length ?? 0);

if (!apiKey) {
  throw new Error("GEMINI_API_KEY is missing");
}

const ai = new GoogleGenAI({ apiKey });

const MODELS = [
  "gemini-flash-lite-latest",
  "gemini-3.1-flash-lite",
  "gemini-3.5-flash-lite",
  "gemini-2.5-flash-lite",
  "gemini-3.7-flash",
  "gemini-3.6-flash",
];

const LIMIT_MS = 25000;

// Give up on a model after LIMIT_MS so one busy model can't block the rest
function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`no reply in ${ms / 1000} s`)), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      }
    );
  });
}

async function tryModel(model: string): Promise<boolean> {
  const started = Date.now();
  try {
    const response = await withTimeout(
      ai.models.generateContent({
        model,
        contents: "In one sentence, what is an event RSVP system?",
      }),
      LIMIT_MS
    );
    console.log(`OK    ${model} (${Date.now() - started} ms)`);
    console.log("      ", JSON.stringify(response.text));
    return true;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.log(`FAIL  ${model} (${Date.now() - started} ms): ${message.slice(0, 160)}`);
    return false;
  }
}

async function main(): Promise<void> {
  for (const model of MODELS) {
    if (await tryModel(model)) {
      process.exitCode = 0;
      return;
    }
  }
  process.exitCode = 1;
}

void main();