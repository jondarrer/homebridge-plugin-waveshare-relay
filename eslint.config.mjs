import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { FlatCompat } from '@eslint/eslintrc';
import js from '@eslint/js';
import jest from 'eslint-plugin-jest';
import globals from 'globals';
import tseslint from 'typescript-eslint';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
});

export default [
  ...compat.extends('plugin:jest/recommended'),
  ...tseslint.configs.strict,
  ...tseslint.configs.stylistic,
  {
    plugins: {
      jest,
    },

    languageOptions: {
      globals: {
        ...globals.commonjs,
        ...globals.node,
        ...globals.jest,
      },

      ecmaVersion: 13,
      sourceType: 'module',

      parserOptions: {
        ecmaFeatures: {
          impliedStrict: true,
        },
      },
    },

    rules: {},
  },
  {
    files: ['**/*.spec.ts'],

    languageOptions: {
      globals: {
        ...globals.jest,
      },
    },

    rules: {
      'max-lines': 'off',
      'no-useless-escape': 'off',
    },
  },
];
