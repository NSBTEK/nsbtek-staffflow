import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";

export default [
  {
    ignores: [
      "dist/**",
      "node_modules/**",
      "supabase/functions/**",
      "coverage/**",
    ],
  },

  js.configs.recommended,

  {
    files: ["**/*.{js,jsx}"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,

      "no-unused-vars": ["error", { argsIgnorePattern: "^[A-Z_]", varsIgnorePattern: "^[A-Z_]" }],
      "no-undef": "error",
      "no-useless-escape": "error",

      "react-refresh/only-export-components": [
        "error",
        { allowConstantExport: true },
      ],
    },
  },

  {
    files: ["src/components/ui/**/*.jsx", "src/lib/AuthContext.jsx"],
    rules: {
      "react-refresh/only-export-components": "off",
    },
  },

  {
    files: ["tailwind.config.js", "vite.config.js"],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
    rules: {
      "no-undef": "off",
    },
  },
];