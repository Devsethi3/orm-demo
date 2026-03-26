import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

export default defineConfig([
  ...nextVitals,
  ...nextTs,

  {
    rules: Object.fromEntries(
      Object.keys({
        ...nextVitals.flatMap(c => c.rules ?? {}).reduce((a,b)=>({...a,...b}), {}),
        ...nextTs.flatMap(c => c.rules ?? {}).reduce((a,b)=>({...a,...b}), {}),
      }).map(rule => [rule, "off"])
    ),
  },

  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);