const { default: multiInput } = require('rollup-plugin-multi-input');
const configuration = require('./default');
const json = require('@rollup/plugin-json');

const baseConfig = configuration();
module.exports = (...inputs) => ({
    ...baseConfig,
    input: inputs,
    plugins: [multiInput(), ...baseConfig.plugins],
    output: {
        dir: 'dist',
        format: 'cjs',
        sourcemap: true,
    },
});
