const { join } = require('path')

const rules = {
    'no-shadow': 'off',
    'no-only-tests/no-only-tests': 'warn',
    'import/no-anonymous-default-export': 'off',
}

const result = {
    plugins: ['no-only-tests'],
    extends: ['plugin:@typescript-eslint/recommended'],
    rules,
    parserOptions: {
        project: [join(process.cwd(), './tsconfig.json')],
    },
}
module.exports = result
