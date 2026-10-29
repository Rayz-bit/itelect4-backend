import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    env: {
      // index.ts only calls app.listen when VERCEL is not "1", so this
      // keeps the tests from opening a port.
      VERCEL: "1",
      // A dummy address. mongoose.connect is replaced in the test, so
      // nothing ever connects to it.
      MONGODB_URI: "mongodb://db.example.test/itelect4-test",
    },
  },
});