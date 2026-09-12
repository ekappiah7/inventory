import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: "dist",
    sourcemap: true,
  },
  test: {
    environment: "jsdom",
    // Testing Library registers its automatic between-test DOM cleanup off
    // the global afterEach, so without this, renders leak into each other.
    globals: true,
  },
});
