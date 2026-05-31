import js from "@eslint/js";
<<<<<<< Updated upstream
import eslintConfigPrettier from "eslint-config-prettier";
=======
import eslintConfigPrettier from "eslint-config-prettier"; // 1. Import config này
>>>>>>> Stashed changes
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist"] },
  {
    extends: [
      js.configs.recommended,
      ...tseslint.configs.recommended,
<<<<<<< Updated upstream
      eslintConfigPrettier,
=======
      eslintConfigPrettier, // 2. Đặt nó ở đây để ghi đè và tắt các rule xung đột
>>>>>>> Stashed changes
    ],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,

      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "server-only",
<<<<<<< Updated upstream
              message:
                "TanStack Start does not use the Next.js `server-only` package.",
=======
              message: "TanStack Start does not use the Next.js `server-only` package.",
>>>>>>> Stashed changes
            },
          ],
        },
      ],

      "react-refresh/only-export-components": [
        "warn",
        { allowConstantExport: true },
      ],

      "@typescript-eslint/no-unused-vars": "off",
      // Không cần rule "prettier/prettier" ở đây vì Prettier đã tự lo việc format
    },
  },
<<<<<<< Updated upstream
);
=======
);
>>>>>>> Stashed changes
