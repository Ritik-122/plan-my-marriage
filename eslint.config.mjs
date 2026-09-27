import { defineConfig, globalIgnores } from "eslint/config";
import { fixupConfigRules } from "@eslint/compat";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";
import prettier from "eslint-config-prettier/flat";

export default defineConfig([
  // Next's React plugin still uses rule-context methods removed in ESLint 10.
  ...fixupConfigRules([...nextVitals, ...nextTypescript]),
  prettier,
  globalIgnores([
    ".next/**",
    "out/**",
    "coverage/**",
    "next-env.d.ts",
    "playwright-report/**",
    "test-results/**",
    ".tools/**",
    ".npm-cache/**",
  ]),
]);
