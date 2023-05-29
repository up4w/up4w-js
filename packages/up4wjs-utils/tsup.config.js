import { defineConfig } from "tsup";

export default defineConfig({
  dts: true,
  format: ["esm", "cjs"],
  entry: ["src/index.ts"],
});
