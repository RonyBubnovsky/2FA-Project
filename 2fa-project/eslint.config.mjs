import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  // Ignore all test files and test utility files
  {
    ignores: [
      "**/tests/**/*",
      "**/*.test.ts",
      "**/*.test.tsx",
      "jest.config.js",
      "tsconfig.test.json"
    ]
  },
  // Base configuration for everything else
  ...compat.extends("next/core-web-vitals", "next/typescript"),
];

export default eslintConfig;
