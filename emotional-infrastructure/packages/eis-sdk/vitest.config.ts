import { fileURLToPath } from "node:url";
import { dirname } from "node:path";
import { defineConfig } from "vitest/config";

const root = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  root,
  css: {
    postcss: { plugins: [] },
  },
  test: {
    environment: "node",
  },
});
