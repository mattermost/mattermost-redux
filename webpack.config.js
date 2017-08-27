const path = require('path');
const UglifyPlugin = require('uglifyjs-webpack-plugin');

module.exports = {
    entry: './main.browser.js',
    output: {
        path: path.resolve(__dirname, 'lib'),
        library: 'Mattermost',
        filename: 'mattermost-redux.bundle.js'
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /(node_modules)/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: ['env']
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
