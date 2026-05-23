import os from "node:os";
import { defineConfig } from "vitest/config";

const availableParallelism =
  typeof os.availableParallelism === "function"
    ? os.availableParallelism()
    : os.cpus().length;
const maxWorkers = Math.max(
  1,
  Math.min(2, Math.floor(availableParallelism / 2))
);

export default defineConfig({
  test: {
    environment: "node",
    include: [
      "packages/**/*.test.ts",
      "apps/**/*.test.ts",
      "apps/**/*.test.tsx",
    ],
    exclude: ["**/dist/**", "**/node_modules/**"],
    maxWorkers,
  },
});
