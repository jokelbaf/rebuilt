import js from "@eslint/js";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

export default tseslint.config(
	{ ignores: ["build", ".react-router", "node_modules", "dist"] },
	js.configs.recommended,
	...tseslint.configs.recommended,
	reactHooks.configs.flat.recommended,
	reactRefresh.configs.vite,
	{
		files: ["**/*.{ts,tsx}"],
		languageOptions: {
			parser: tseslint.parser,
			parserOptions: {
				projectService: true,
				ecmaFeatures: {
					jsx: true,
				},
			},
		},
		rules: {
			"react-refresh/only-export-components": [
				"warn",
				{
					allowConstantExport: true,
					allowExportNames: [
						"meta",
						"links",
						"headers",
						"loader",
						"action",
						"clientLoader",
						"clientAction",
						"handle",
						"shouldRevalidate",
						"HydrateFallback",
						"ErrorBoundary",
					],
				},
			],
			"@typescript-eslint/no-unused-vars": [
				"error",
				{ argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
			],
		},
	},
	{
		files: ["app/components/ui/**", "app/hooks/use-mobile.ts"],
		rules: {
			"react-refresh/only-export-components": "off",
			"react-hooks/set-state-in-effect": "off",
		},
	}
);
