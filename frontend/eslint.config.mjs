import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    // The modals and countdown deliberately reset state when their props
    // change (e.g. clearing form fields when a modal opens). The rule only
    // fires on those intentional sync-in-effect patterns, so disable it
    // project-wide instead of silencing a dozen call sites.
    rules: {
      "react-hooks/set-state-in-effect": "off",
    },
  },
  globalIgnores([
    // Keep `eslint .` fast: skip build output and generated files.
    ".next/**",
    "out/**",
    "build/**",
    "coverage/**",
    "next-env.d.ts",
    ".eslintcache",
  ]),
]);

export default eslintConfig;
