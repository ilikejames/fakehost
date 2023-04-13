const config = require('@fakehost/devtools-eslint')

module.exports = {
    ...config,
    ignorePatterns: ['src/generated/**/*'],
}
