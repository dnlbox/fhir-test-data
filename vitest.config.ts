import { defineConfig } from "vitest/config";
import { resolve } from "node:path";

export default defineConfig({
  resolve: {
    alias: {
      "@": resolve(import.meta.dirname, "./src"),
    },
  },
  test: {
    globals: false,
    passWithNoTests: true,
    coverage: {
      provider: "v8",
    },
    include: ["tests/**/*.test.ts"],
    exclude: ["tests/compat/**"],
  },
});
