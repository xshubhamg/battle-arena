import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Registry-generated components (shadcn/ui and beUI). They are vendored
    // source, updated upstream, and not ours to lint. See ADR-0002.
    "components/ui/**",
    "components/motion/**",
    "lib/ease.ts",
    "lib/presence-gate.tsx",
    "lib/hooks/**",
  ]),
]);

export default eslintConfig;
