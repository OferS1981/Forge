// @ts-check
import js from '@eslint/js';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import reactHooks from 'eslint-plugin-react-hooks';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-config-prettier';

export default tseslint.config(
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/.next/**',
      'apps/web/out/**',
      'apps/web/next-env.d.ts',
      '**/coverage/**',
      '**/.turbo/**',
      'reference/**',
      'playwright-report/**',
      'test-results/**',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-non-null-assertion': 'error',
      '@typescript-eslint/consistent-type-imports': 'error',
    },
  },
  // The component layer. jsx-a11y catches a broken accessibility contract at lint time, which is
  // cheaper than catching it in axe, which is cheaper than a user finding it.
  {
    files: ['packages/ui/**/*.tsx', 'apps/web/**/*.tsx'],
    plugins: { 'react-hooks': reactHooks, 'jsx-a11y': jsxA11y },
    rules: {
      ...reactHooks.configs.recommended.rules,
      ...jsxA11y.flatConfigs.strict.rules,
      /*
       * These four rules assume a native element is available. Section 7 of the spec says we draw
       * the control ourselves and write the contract by hand, so the pattern they object to is the
       * documented one. Everything they would have caught is covered instead by an axe check per
       * component and by axe in the browser, in both themes, at three viewports.
       *
       * - listbox rows are deliberately not focusable: the input keeps focus and points at the
       *   active row with aria-activedescendant, which is the ARIA combobox pattern,
       * - a drop zone reacts to a pointer drag, and its keyboard path is the real file input,
       * - a scrollable region and a tab panel both take tabindex 0 so a keyboard can reach them.
       */
      'jsx-a11y/no-noninteractive-element-interactions': 'off',
      'jsx-a11y/click-events-have-key-events': 'off',
      'jsx-a11y/interactive-supports-focus': 'off',
      'jsx-a11y/no-static-element-interactions': 'off',
      'jsx-a11y/no-noninteractive-tabindex': ['error', { roles: ['group', 'tabpanel'] }],
    },
  },
  // The app's store is a .ts file that also uses hooks.
  {
    files: ['apps/web/src/lib/*.ts'],
    plugins: { 'react-hooks': reactHooks },
    rules: { ...reactHooks.configs.recommended.rules },
  },
  // Node scripts: no DOM, no type-aware linting, and Node's globals are real.
  {
    files: ['**/*.js', '**/*.mjs', '**/*.cjs'],
    ...tseslint.configs.disableTypeChecked,
    languageOptions: {
      ...tseslint.configs.disableTypeChecked.languageOptions,
      globals: {
        process: 'readonly',
        URL: 'readonly',
        console: 'readonly',
        Buffer: 'readonly',
      },
    },
  },
  // The service worker runs in worker scope: self, caches and fetch are its real globals.
  {
    files: ['apps/web/public/sw.js'],
    languageOptions: {
      globals: {
        self: 'readonly',
        caches: 'readonly',
        fetch: 'readonly',
        URL: 'readonly',
      },
    },
  },
  prettier,
);
