// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import resolve from 'rollup-plugin-node-resolve';

import {terser} from 'rollup-plugin-terser';
import commonjs from 'rollup-plugin-commonjs';
import typescript from 'rollup-plugin-typescript2';

// eslint-disable-next-line no-process-env
const production = process.env.NODE_ENV === 'production';

const inputs = ['client4', 'websocket_client'];
const suffix = production ? '.min' : '';
// eslint-disable-next-line no-process-env
const buildFolder = process.env.OUTPUT_FOLDER || './build';

module.exports = inputs.map((input) => ({
    input: `./src/client/${input}.ts`,
    treeshake: Boolean(production),
    output: [{
        format: 'esm',
        file: `${buildFolder}/${input}.esm${suffix}.js`,
        sourcemap: true,
        dynamicImportFunction: 'importModule',
    },
    {
        format: 'cjs',
        file: `${buildFolder}/${input}.cjs${suffix}.js`,
        sourcemap: true,
        exports: 'named',
    }],
    plugins: [
        resolve(),
        commonjs({
            include: ['node_modules/**'],

        }),
        typescript({
            // eslint-disable-next-line global-require
            typescript: require('ttypescript'),
            rollupCommonJSResolveHack: true,
            exclude: '**/__tests__/**',
            clean: true,
        }),

        // only minify if in production
        production && terser(),
    ],
}));
