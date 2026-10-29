import { describe, it, expect, vi } from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import app from "../src/index";

// index.ts waits for mongoose.connect() before every route, and there is no
// database here or on GitHub's machine. This replaces it, for this test
// file only, with a version that succeeds at once.
vi.spyOn(mongoose, "connect").mockResolvedValue(mongoose);

// A token made the way POST /api/auth/login makes one: the same payload
// shape, signed with the same JWT_SECRET. No user has to exist, because
// requireAuth only checks the signature.
function tokenFor(userId: string): string {
  return jwt.sign({ userId }, process.env.JWT_SECRET!, { expiresIn: "5m" });
}

describe("POST /api/ai", () => {
  it("answers 401 when there is no token", async () => {
    const res = await request(app)
      .post("/api/ai")
      .send({ prompt: "A Tech Meetup on November 15 at the Main Auditorium." });

    expect(res.status).toBe(401);
    expect(res.body.message).toBe(
      "No token. Send Authorization: Bearer <token>"
    );
  });

  it("answers 401 when the token was signed with another secret", async () => {
    const forged = jwt.sign({ userId: "someone" }, "not-the-secret");

    const res = await request(app)
      .post("/api/ai")
      .set("Authorization", `Bearer ${forged}`)
      .send({ prompt: "A Tech Meetup on November 15 at the Main Auditorium." });

    expect(res.status).toBe(401);
    expect(res.body.message).toBe("Invalid or expired token");
  });

  it("lets a valid token through, then checks the body", async () => {
    // "Too short" is 9 characters, so reviewRequestSchema refuses it
    // before reviewProject() runs. Gemini is never called.
    const res = await request(app)
      .post("/api/ai")
      .set("Authorization", `Bearer ${tokenFor("test-user")}`)
      .send({ prompt: "Too short" });

    expect(res.status).toBe(400);
    expect(res.body.errors).toEqual([
      "Describe your event in at least 20 characters.",
    ]);
  });
});