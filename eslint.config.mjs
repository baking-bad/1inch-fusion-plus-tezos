// @ts-check

import globals from 'globals';

import eslint from '@eslint/js';
import stylistic from '@stylistic/eslint-plugin';
import tseslint from 'typescript-eslint';

export default [
  ...tseslint.config(
    eslint.configs.recommended,
    ...tseslint.configs.recommendedTypeChecked,
    {
      languageOptions: {
        parserOptions: {
          project: 'tsconfig.eslint.json',
          tsconfigRootDir: import.meta.dirname,
        },
      },
      rules: {
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/no-unsafe-argument': 'off',
        '@typescript-eslint/no-unsafe-assignment': 'off',
        '@typescript-eslint/no-unsafe-call': 'off',
        '@typescript-eslint/no-unsafe-declaration-merging': 'off',
        '@typescript-eslint/no-unsafe-enum-comparison': 'off',
        '@typescript-eslint/no-unsafe-member-access': 'off',
        '@typescript-eslint/no-unsafe-return': 'off',
        '@typescript-eslint/require-await': 'off',
        '@typescript-eslint/no-misused-promises': [
          'error',
          {
            checksVoidReturn: false,
          },
        ],
        '@typescript-eslint/no-unused-vars': [
          'warn',
          {
            argsIgnorePattern: '^_',
            varsIgnorePattern: '^_',
          },
        ],
      },
    },
    {
      files: [
        'packages/**/jest.config.ts',
        'packages/**/jest.config.js',
        'packages/**/jest.config.mts',
        'packages/**/jest.config.mjs',
        'packages/**/tests/**/*.ts',
        'packages/**/tests/**/*.js',
        'packages/**/tests/**/*.mts',
        'packages/**/tests/**/*.mjs',
      ],
      languageOptions: {
        globals: {
          ...globals.node,
        },
      },
    },
    {
      ignores: [
        'packages/**/dist/**/*',
        'packages/**/build/**/*',
        'packages/**/temp/**/*',
      ],
    }
  ),
  stylistic.configs.customize({
    quotes: 'single',
    indent: 2,
    semi: true,
    jsx: true,
  }),
  {
    rules: {
      '@stylistic/indent': ['warn', 2, {
        flatTernaryExpressions: true,
        offsetTernaryExpressions: false,
        SwitchCase: 1,
      }],
      '@stylistic/comma-dangle': ['warn', {
        arrays: 'always-multiline',
        objects: 'always-multiline',
        imports: 'never',
        exports: 'never',
        functions: 'never',
      }],
      '@stylistic/arrow-parens': ['warn', 'as-needed'],
    },
  },
];
