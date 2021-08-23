const autoExternal = require('rollup-plugin-auto-external');
const esbuild = require('rollup-plugin-esbuild');
const json = require('@rollup/plugin-json');

const defaults = {
    base64: false,
};

module.exports = ({ base64 } = defaults) => ({
    input: 'src/index.ts',
    output: [
        {
            exports: 'named',
            file: 'dist/index.js',
            format: 'cjs',
            sourcemap: true,
        },
    ],
    plugins: [
        autoExternal(),
        json(),
        esbuild({
            sourcemap: true,
            svg: true,
        }),
    ],
});
