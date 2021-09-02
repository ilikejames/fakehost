const config = require('eslint-config-standard-with-typescript');
const { join } = require('path');

const rules = {
    ...config.rules,
    'no-shadow': 'off',
    'no-only-tests/no-only-tests': 'warn',
    'import/no-anonymous-default-export': 'off',
};

module.exports = {
    plugins: ['no-only-tests'],
    extends: 'standard-with-typescript',
    overrides: config.overrides,
    rules,
    parserOptions: {
        project: [join(process.cwd(), './tsconfig.json')],
    },
};
