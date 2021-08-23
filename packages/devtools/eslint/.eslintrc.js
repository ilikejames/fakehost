const config = require('eslint-config-standard-with-typescript');
const { mapValues } = require('lodash');
const { join } = require('path');

// Change all 'warn' rules to 'error'
const makeStrict = value => {
    if (value === 'warn') {
        return 'error';
    }
    if (Array.isArray(value)) {
        const [level, ...options] = value;
        if (level === 'warn') {
            return ['error', ...options];
        }
        return value;
    }
    return value;
};

const rules = {
    ...config.rules,
    'no-shadow': 'off',
    'no-only-tests/no-only-tests': 'warn',
    'import/no-anonymous-default-export': 'off',
};

const strictRules = mapValues(rules, makeStrict);
const strictOverrides = config.overrides.map(override => ({
    ...override,
    rules: mapValues(override.rules, makeStrict),
}));

const isCI = process.env.CI === 'true';

console.log('path', [join(process.cwd(), './.eslintrc.json')]);
module.exports = {
    plugins: ['no-only-tests'],
    extends: 'standard-with-typescript',
    overrides: isCI ? strictOverrides : config.overrides,
    rules: isCI ? strictRules : rules,
    parserOptions: {
        project: [join(process.cwd(), './tsconfig.json')],
    },
};
