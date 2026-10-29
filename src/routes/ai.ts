import {
  Router,
  type NextFunction,
  type Request,
  type Response,
} from "express";
import { rateLimit } from "express-rate-limit";
import { ApiError } from "@google/genai";
import { requireAuth } from "../middleware/auth";
import { reviewRequestSchema } from "../schemas/review";
import { reviewProject, AiReplyError } from "../ai/gemini";

const router = Router();

// Private, like RSVPs. Every call spends YOUR Gemini quota, so an
// anonymous visitor must not be able to make one.
router.use(requireAuth);

// Five requests a minute per account. It sits below requireAuth, so
// req.userId exists by the time the limiter reads it, and the limit
// follows the account, not the network. A whole classroom shares one Wi-Fi
// address, so counting by address would make 50 students share 5 requests.
const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 5,
  keyGenerator: (req: Request) => req.userId!,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    message: "Five reviews a minute is the limit. Try again shortly.",
  },
});

router.use(aiLimiter);

// POST /api/ai
router.post("/", async (req: Request, res: Response, next: NextFunction) => {
  // safeParse, not parse: it returns the problem instead of throwing it,
  // so the 400 is written here, next to the rule it reports.
  const parsed = reviewRequestSchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({
      message: "Validation failed",
      errors: parsed.error.issues.map((issue) => issue.message),
    });
    return;
  }

  try {
    const review = await reviewProject(parsed.data.prompt);
    res.status(200).json(review);
  } catch (err) {
    // 429 from Gemini means the quota of the Google project behind
    // GEMINI_API_KEY is used up, not this API's own limit above.
    if (err instanceof ApiError && err.status === 429) {
      res.status(429).json({
        message: "The AI quota is used up for now. Try again later.",
      });
      return;
    }

    // Gemini refused, was overloaded (503), timed out (504), or answered
    // with something unusable. The real reason goes in the log; the
    // browser gets one sentence and none of Google's error text.
    if (err instanceof ApiError || err instanceof AiReplyError) {
      console.error("AI error:", err);
      res.status(502).json({
        message: "The AI service did not answer properly. Try again.",
      });
      return;
    }

    // Anything else is a bug in this app, such as a missing key: your
    // error handler in index.ts answers 500 and logs the reason.
    next(err);
  }
});

export default router;