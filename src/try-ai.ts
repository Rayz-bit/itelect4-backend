import "dotenv/config";
import { reviewProject } from "./ai/gemini";

async function main(): Promise<void> {
  const started = Date.now();

  const review = await reviewProject(
    "Career Fair on December 1 at the Gymnasium, 8 AM to 4 PM, for " +
      "graduating students. 300 seats. Companies are listed on the " +
      "poster, and students RSVP through the app."
  );

  console.log(`Replied in ${Date.now() - started} ms`);
  console.log(JSON.stringify(review, null, 2));
}

main().catch((error) => {
  console.error("Review failed:", error instanceof Error ? error.message : error);
  process.exitCode = 1;
});