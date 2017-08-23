const path = require('path');
const UglifyPlugin = require('uglifyjs-webpack-plugin');

module.exports = {
    entry: './main.browser.js',
    output: {
      path: path.resolve(__dirname, 'lib'),
      filename: 'mattermost-redux.bundle.js'
    },
    plugins: [
        new UglifyPlugin({sourceMap: true})
    ],
    devtool: 'source-map'
};
