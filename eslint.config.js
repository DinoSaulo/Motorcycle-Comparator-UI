import js from '@eslint/js';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';

const maxCommentLinesRule = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Disallow comment blocks longer than 2 lines',
    },
    messages: {
      tooLong: 'Comment block exceeds maximum of 2 lines (found {{lines}} lines).',
    },
  },
  create(context) {
    return {
      Program() {
        const comments = context.sourceCode.getAllComments();
        if (!comments || comments.length === 0) return;

        for (const comment of comments) {
          if (comment.type === 'Block') {
            const lines = comment.loc.end.line - comment.loc.start.line + 1;
            if (lines > 2) {
              context.report({
                loc: comment.loc,
                messageId: 'tooLong',
                data: { lines },
              });
            }
          }
        }

        let lineGroup = [];
        const checkGroup = () => {
          if (lineGroup.length > 2) {
            context.report({
              loc: {
                start: lineGroup[0].loc.start,
                end: lineGroup[lineGroup.length - 1].loc.end,
              },
              messageId: 'tooLong',
              data: { lines: lineGroup.length },
            });
          }
          lineGroup = [];
        };

        for (let i = 0; i < comments.length; i++) {
          const comment = comments[i];
          if (comment.type === 'Line') {
            if (lineGroup.length === 0) {
              lineGroup.push(comment);
            } else {
              const prev = lineGroup[lineGroup.length - 1];
              if (comment.loc.start.line === prev.loc.end.line + 1) {
                lineGroup.push(comment);
              } else {
                checkGroup();
                lineGroup = [comment];
              }
            }
          } else {
            checkGroup();
          }
        }
        checkGroup();
      },
    };
  },
};

const customPlugin = {
  rules: {
    'max-comment-lines': maxCommentLinesRule,
  },
};

export default [
  {
    ignores: ['dist/**', 'coverage/**', 'node_modules/**'],
  },
  js.configs.recommended,
  {
    files: ['**/*.{js,jsx}'],
    plugins: {
      react,
      'react-hooks': reactHooks,
      custom: customPlugin,
    },
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.es2021,
      },
    },
    settings: {
      react: {
        version: '19.0',
      },
    },
    rules: {
      ...react.configs.recommended.rules,
      ...react.configs['jsx-runtime'].rules,
      ...reactHooks.configs.recommended.rules,
      'react/prop-types': 'off',
      'react-hooks/set-state-in-effect': 'off',
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      'custom/max-comment-lines': 'error',
    },
  },
  {
    files: ['**/*.test.{js,jsx}', 'src/testing/**/*.{js,jsx}'],
    languageOptions: {
      globals: {
        ...globals.vitest,
      },
    },
  },
];
