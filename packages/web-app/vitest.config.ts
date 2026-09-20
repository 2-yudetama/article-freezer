import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  envDir: false,
  test: {
    coverage: {
      provider: "v8",
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
});
