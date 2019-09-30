// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

// const tsconfig = require('./tsconfig.json');
// const moduleNameMapper = require('tsconfig-paths-jest')(tsconfig);
// eslint-disable-next-line no-console
// console.log(moduleNameMapper);

module.exports = {
    globals: {
        'ts-jest': {
            tsConfig: 'tsconfig.json',
            diagnostics: true,
        },
        NODE_ENV: 'test',
    },
    rootDir: '.',
    moduleDirectories: ['node_modules', 'src'],
    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
    transform: {
        '^.+\\.(tsx|js|jsx)?$': 'ts-jest',
    },
    transformIgnorePatterns: ['<rootDir>/node_modules/'],
    testMatch: [
        '<rootDir>/src/**/?(*.)(spec|test).(ts|js)?(x)',
    ],
    setupFilesAfterEnv: [
        '<rootDir>/test/setup.js',
    ],

    verbose: true,
    moduleNameMapper: {
        '^src/(.*)$': '<rootDir>/src/$1',
        '^test/(.*)$': '<rootDir>/test/$1',
        '^utils/(.*)$': '<rootDir>/src/utils/$1',
        '^action_types$': '<rootDir>/src/action_types',
        '^constants$': '<rootDir>/src/constants',
        '^action_types/(.*)$': '<rootDir>/src/action_types/$1',
        '^@/(.*)$': '<rootDir>/src/$1',
    },
};
