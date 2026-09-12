import js from "@eslint/js";
import globals from "globals";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";

export default [
  { ignores: ["dist/**", "node_modules/**"] },
  {
    files: ["**/*.{js,jsx}"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: { ...globals.browser, ...globals.node },
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    settings: { react: { version: "detect" } },
    plugins: { react, "react-hooks": reactHooks },
    rules: {
      ...js.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      // Without these, everything rendered as JSX reads as an unused import.
      "react/jsx-uses-vars": "error",
      "react/jsx-uses-react": "error",
      // The rule that would have caught a useState variable shadowing
      // Firestore's imported query(), which blanked the whole app in
      // production. Worth failing the build over.
      "no-shadow": "error",
      // ignoreRestSiblings allows the `const { id, ...rest }` idiom for
      // dropping a key before a write.
      "no-unused-vars": ["warn", { argsIgnorePattern: "^_", varsIgnorePattern: "^React$", ignoreRestSiblings: true }],
    },
  },
  {
    files: ["**/*.test.{js,jsx}"],
    languageOptions: { globals: { ...globals.node } },
  },
];
