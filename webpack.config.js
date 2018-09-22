// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
const path = require('path');
const UglifyPlugin = require('uglifyjs-webpack-plugin');

module.exports = {
    entry: {
        client4: './src/client/client4.js',
        websocket: './src/client/websocket_client.js',
    },
    output: {
        path: path.resolve(__dirname, 'lib'),
        library: ['Mattermost', '[name]'],
        filename: 'mattermost.[name].js',
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /(node_modules)/,
                use: 'babel-loader',
            },
        ],
    },
    plugins: [
        new UglifyPlugin({sourceMap: true}),
    ],
    devtool: 'source-map',
};
