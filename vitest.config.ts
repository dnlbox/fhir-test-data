import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: false,
    passWithNoTests: true,
    coverage: {
      provider: "v8",
    },
    include: ["tests/**/*.test.ts"],
  },
});
