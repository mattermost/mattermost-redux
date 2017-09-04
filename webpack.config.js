const path = require('path');
const UglifyPlugin = require('uglifyjs-webpack-plugin');

module.exports = {
    entry: {
        client: './src/client/client.js',
        client4: './src/client/client4.js',
        websocket: './src/client/websocket_client.js'
    },
    output: {
        path: path.resolve(__dirname, 'lib'),
        library: ['Mattermost', '[name]'],
        filename: 'mattermost.[name].js'
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /(node_modules)/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: ['env', 'stage-0']
                    }
                }
            }
        ]
    },
    plugins: [
        new UglifyPlugin({sourceMap: true})
    ],
    devtool: 'source-map'
};
