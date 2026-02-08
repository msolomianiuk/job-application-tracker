import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { FlatCompat } from '@eslint/eslintrc';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends('google', 'next/core-web-vitals', 'next/typescript'),
  {
    ignores: [
      'node_modules/**',
      '.next/**',
      'out/**',
      'build/**',
      'next-env.d.ts',
      'bun.lock',
    ],
  },
  {
    rules: {
      // Google style adjustments for React/Next.js
      'require-jsdoc': 'off', // JSDoc not required for React components
      'valid-jsdoc': 'off',
      'max-len': [
        'error',
        {
          code: 100,
          ignoreUrls: true,
          ignoreStrings: true,
          ignoreTemplateLiterals: true,
          ignoreRegExpLiterals: true,
        },
      ],
      'object-curly-spacing': ['error', 'always'], // Consistent with Prettier
      'indent': [
        'error',
        2,
        {
          SwitchCase: 1,
          ignoredNodes: [
            'JSXElement',
            'JSXElement > *',
            'JSXAttribute',
            'JSXIdentifier',
            'JSXNamespacedName',
            'JSXMemberExpression',
            'JSXSpreadAttribute',
            'JSXExpressionContainer',
            'JSXOpeningElement',
            'JSXClosingElement',
            'JSXFragment',
            'JSXOpeningFragment',
            'JSXClosingFragment',
            'JSXText',
            'JSXEmptyExpression',
            'JSXSpreadChild',
          ],
        },
      ],
      'react/react-in-jsx-scope': 'off', // Not needed in Next.js 13+
      'new-cap': [
        'error',
        {
          capIsNewExceptions: [
            'NextResponse',
            'NextRequest',
            'Geist',
            'Geist_Mono',
          ],
        },
      ],
      'camelcase': [
        'error',
        {
          allow: [
            '^Geist_',
            'user_id',
            'job_title',
            'company_name',
            'created_at',
            'updated_at',
          ],
        },
      ],
    },
  },
];

export default eslintConfig;
