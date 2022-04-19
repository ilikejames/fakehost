const config = require('eslint-config-standard-with-typescript');
const { join } = require('path');

const rules = {
    ...config.rules,
    'no-shadow': 'off',
    'no-only-tests/no-only-tests': 'warn',
    'import/no-anonymous-default-export': 'off',
    '@typescript-eslint/explicit-function-return-type': [
        'off',
        {
            allowExpressions: true,
            allowHigherOrderFunctions: true,
            allowTypedFunctionExpressions: true,
            allowDirectConstAssertionInArrowFunctions: true,
        },
    ],
};

const eslintConfig = {
    plugins: ['no-only-tests'],
    extends: 'standard-with-typescript',
    overrides: config.overrides,
    rules,
    parserOptions: {
        project: [join(process.cwd(), './tsconfig.json')],
    },
};

module.exports = {
    parser: '@typescript-eslint/parser',
    plugins: ['@typescript-eslint'],
    extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended'],
    rules: {
        '@typescript-eslint/explicit-function-return-type': 'off',
        '@typescript-eslint/explicit-module-boundary-types': 'off',
    },
};
