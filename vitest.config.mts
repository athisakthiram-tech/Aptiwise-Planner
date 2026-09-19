import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  // The app's own tsconfig.json sets jsx: "preserve" (Next/SWC compiles
  // it at build time) — Vite 8's default oxc transform needs an
  // explicit JSX mode of its own for the .tsx integration tests under
  // tests/, since it otherwise takes "preserve" literally and leaves
  // JSX syntax untransformed.
  oxc: {
    jsx: "automatic",
  },
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "."),
    },
  },
  test: {
    environment: "node",
    // .tsx test files opt into a jsdom environment individually via a
    // `// @vitest-environment jsdom` docblock — real DOM/click-through
    // integration tests proving a production button is actually wired,
    // not just that the underlying helper function works in isolation
    // (see tests/integration-*.test.tsx).
    include: ["tests/**/*.test.ts", "tests/**/*.test.tsx"],
    setupFiles: ["./tests/setupReactAct.ts"],
  },
});
