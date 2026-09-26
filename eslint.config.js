import js from '@eslint/js';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import reactHooks from 'eslint-plugin-react-hooks';
import { defineConfig, globalIgnores } from 'eslint/config';
import tseslint from 'typescript-eslint';

// Browser globals that must never be used in src/domain (pure, framework-free logic).
// dependency-cruiser checks imports; this rule covers globals, which it cannot see.
const browserGlobals = [
  'window',
  'document',
  'navigator',
  'location',
  'history',
  'localStorage',
  'sessionStorage',
  'indexedDB',
  'fetch',
  'alert',
  'confirm',
  'prompt',
  'matchMedia',
  'requestAnimationFrame',
  'HTMLElement',
  'Element',
  'Node',
  'Event',
];

export default defineConfig([
  globalIgnores(['dist', 'coverage']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      jsxA11y.flatConfigs.recommended,
    ],
  },
  {
    files: ['src/domain/**/*.ts'],
    rules: {
      'no-restricted-globals': [
        'error',
        ...browserGlobals.map((name) => ({
          name,
          message: 'src/domain must stay free of browser APIs.',
        })),
      ],
    },
  },
  {
    // All user-visible text comes from locale files via i18n.
    files: ['src/ui/**/*.tsx', 'src/app/**/*.tsx'],
    ignores: ['**/*.test.tsx'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: 'JSXText[value=/\\S/]',
          message: 'No hardcoded UI text. Use t() with a key from src/locales/en.json.',
        },
        {
          selector: 'JSXExpressionContainer > Literal[value=/\\S/]',
          message: 'No hardcoded UI text. Use t() with a key from src/locales/en.json.',
        },
        {
          selector: 'JSXExpressionContainer > TemplateLiteral',
          message: 'No hardcoded UI text. Use t() with a key from src/locales/en.json.',
        },
        {
          selector:
            'JSXAttribute[name.name=/^(alt|title|placeholder|aria-label|aria-description)$/] > Literal',
          message: 'No hardcoded UI text. Use t() with a key from src/locales/en.json.',
        },
      ],
    },
  },
]);
