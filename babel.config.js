// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

module.exports = {
    presets: [
        ['@babel/preset-env', {
            targets: {
                chrome: 66,
                firefox: 60,
                edge: 42,
                ie: 11,
                safari: 12,
            },
            useBuiltIns: 'usage',
            shippedProposals: true,
        }],
        '@babel/preset-flow',
    ],
    plugins: [
        ['module-resolver', {
            root: ['./src', '.'],
        }],
        '@babel/proposal-class-properties',
    ],
};
