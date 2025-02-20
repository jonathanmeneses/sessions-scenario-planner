import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { FlatCompat } from '@eslint/eslintrc';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
  {
    rules: {
      // Fix deployment errors:
      '@typescript-eslint/no-unused-vars': 'warn', // Downgrade from error to warning
      'react/no-unescaped-entities': 'off',        // Turn off quotes/apostrophes errors

      // Additional helpful rules for the calculator:
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      '@typescript-eslint/no-explicit-any': 'warn',

      // Optional formatting rules:
      'semi': ['error', 'always'],
      'quotes': ['error', 'single']
    },
    ignores: [
      '**/node_modules/**',
      '**/.next/**',
      '**/public/**'
    ]
  }
];

export default eslintConfig;