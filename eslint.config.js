import js from '@eslint/js';
import eslintConfigPrettier from 'eslint-config-prettier';
import eslintImport from 'eslint-plugin-import';
import prettierPlugin from 'eslint-plugin-prettier';
import eslintReact from 'eslint-plugin-react';
import eslintReactHooks from 'eslint-plugin-react-hooks';
import eslintReactRefresh from 'eslint-plugin-react-refresh';
import reactYouMightNotNeedAnEffect from 'eslint-plugin-react-you-might-not-need-an-effect';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import unusedImports from 'eslint-plugin-unused-imports';
import globals from 'globals';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default [
   reactYouMightNotNeedAnEffect.configs.recommended,

   {
      plugins: {
         react: eslintReact,
         'react-hooks': eslintReactHooks,
         'react-refresh': eslintReactRefresh,
         prettier: prettierPlugin,
         import: eslintImport,
         'simple-import-sort': simpleImportSort,
         'unused-imports': unusedImports,
      },
   },
   {
      ignores: [
         'dist',
         'node_modules',
         'src-tauri',
         'src/routeTree.gen.ts',
         '.idea',
         '.vscode',
      ],
   },
   js.configs.recommended,

   {
      languageOptions: {
         parserOptions: {
            ecmaFeatures: {
               jsx: true,
            },
            ...eslintReact.configs.recommended.parserOptions,
         },
         globals: {
            ...globals.browser,
            ...globals.node,
            ...globals.es2020,
         },
      },
   },
   {
      files: ['**/*.{js,jsx,ts,tsx}'],
      settings: {
         'import/resolver': {
            alias: {
               map: [
                  ['@', path.resolve(__dirname, 'src')],
                  ['components', path.resolve(__dirname, 'src/components')],
                  ['routes', path.resolve(__dirname, 'src/routes')],
                  ['styles', path.resolve(__dirname, 'src/styles')],
                  ['utils', path.resolve(__dirname, 'src/utils')],
                  ['hooks', path.resolve(__dirname, 'src/hooks')],
               ],
               extensions: ['.js', '.jsx', '.ts', '.tsx', '.json'],
            },
            node: {
               extensions: ['.js', '.jsx', '.ts', '.tsx', '.json'],
            },
         },
      },
      rules: {
         ...prettierPlugin.configs.recommended.rules,
         ...eslintConfigPrettier.rules,
         'react/jsx-uses-react': 'error',
         'react/jsx-no-undef': 'error',
         'react/jsx-uses-vars': 'error',
         'no-undef': 'error',
         'no-unused-vars': 'off',
         'unused-imports/no-unused-imports': 'error',
         'unused-imports/no-unused-vars': [
            'error',
            {
               vars: 'all',
               varsIgnorePattern: '^_',
               args: 'after-used',
               argsIgnorePattern: '^_',
            },
         ],
         'react/no-array-index-key': 'error',
         'no-use-before-define': [
            'warn',
            {
               functions: false,
               classes: true,
               variables: true,
               allowNamedExports: false,
            },
         ],
         'react/no-multi-comp': 'warn',
         'simple-import-sort/imports': 'error',
         'simple-import-sort/exports': 'error',
         'react-refresh/only-export-components': 'off',
         'import/imports-first': 'off',
         'import/no-unresolved': 'off', // Turning this off for TS/Vite compatibility with aliases for now
         'no-console': 'error',
         'react/sort-comp': 'error',
         'default-param-last': 'error',
         'prefer-template': 'error',
         'prefer-const': 'error',
         'react/jsx-curly-brace-presence': ['error', { props: 'never', children: 'never' }],
         'react/self-closing-comp': ['error', { component: true, html: true }],
         'max-lines': ['error', { max: 300, skipBlankLines: true }],
         'max-params': ['error', 3],
      },
   },
];
