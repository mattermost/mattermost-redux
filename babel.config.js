// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

module.exports = {
    presets: [
        '@babel/env',
    ],
    plugins: [
        '@babel/transform-flow-comments',
        '@babel/proposal-class-properties',
        ['module-resolver', {
            root: ['./src', '.'],
        }],
    ],
};

