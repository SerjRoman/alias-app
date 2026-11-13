// @ts-check
import eslint from "@eslint/js";
import eslintPluginPrettierRecommended from "eslint-plugin-prettier/recommended";
import globals from "globals";
import tseslint from "typescript-eslint";
import sonarjs from "eslint-plugin-sonarjs";

export default tseslint.config(
	{
		ignores: ["eslint.config.mjs"],
	},
	eslint.configs.recommended,
	...tseslint.configs.recommendedTypeChecked,
	eslintPluginPrettierRecommended,
	sonarjs.configs.recommended,
	{
		languageOptions: {
			globals: {
				...globals.node,
				...globals.jest,
			},
			sourceType: "commonjs",
			parserOptions: {
				projectService: true,
				tsconfigRootDir: import.meta.dirname,
			},
		},
	},
	{
		rules: {
			"@typescript-eslint/no-explicit-any": "off",
			"@typescript-eslint/no-floating-promises": "warn",
			"@typescript-eslint/no-unsafe-argument": "warn",
			"@typescript-eslint/no-unsafe-assignment": "off",
			"@typescript-eslint/no-unsafe-call": "off",
			"@typescript-eslint/no-unsafe-member-access": "off",
			"@typescript-eslint/require-await": "off",
			"@typescript-eslint/only-throw-error": "off",
			"prettier/prettier": ["error", { endOfLine: "auto" }],
			"@typescript-eslint/consistent-type-imports": "error",
			"sonarjs/pseudo-random": "off",
			"sonarjs/argument-type": "off",
			"sonarjs/void-use": "off",
			"sonarjs/no-redundant-optional": "off",
			"sonarjs/function-return-type": "off",
			"sonarjs/cognitive-complexity": ["warn", 25],
			"sonarjs/different-types-comparison": "off",
			"sonarjs/no-nested-conditional": "warn",
			"sonarjs/no-nested-template-literals": "warn",
			"sonarjs/null-dereference": "warn",
		},
	},
	{
		files: ["**/*.spec.ts"],
		rules: {
			"@typescript-eslint/unbound-method": "off",
			"@typescript-eslint/no-unnecessary-type-assertion": "off",
		},
	},
);
