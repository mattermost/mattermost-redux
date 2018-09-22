// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

module.exports = {
    presets: [
        ['@babel/preset-env', {
            targets: {
                ie: 11,
                chrome: 43,
                firefox: 52,
                edge: 15,
                ios: 9,
            },
            loose: true,
            modules: false,
            useBuiltIns: 'usage',
            shippedProposals: true,
        }],
        '@babel/preset-flow',
    ],
    plugins: [
        ['module-resolver', {
            root: ['./src', '.'],
        }],
        ['@babel/proposal-class-properties', {
            loose: true,
        }],
    ],
};
