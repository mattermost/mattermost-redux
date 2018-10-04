// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import createActionBuffer from 'redux-action-buffer';
import {REHYDRATE} from 'redux-persist/constants';
import thunk from 'redux-thunk';

const defaultOptions = {
    additionalMiddleware: [],
    enableBuffer: true,
    enableThunk: true,
};

/***
clientOptions object - This param allows users to configure the store from the client side.
It has the following properties:
additionalMiddleware - func | array - Allows for single or multiple additional middleware functions to be passed in from the client side.
enableBuffer - bool - default = true - If true, the store will buffer all actions until offline state rehydration occurs.
enableThunk - bool - default = true - If true, include the thunk middleware automatically. If false, thunk must be provided as part of additionalMiddleware.
***/
export function createMiddleware(clientOptions) {
    const options = Object.assign({}, defaultOptions, clientOptions);
    const {
        additionalMiddleware,
        enableBuffer,
        enableThunk,
    } = options;

    const middleware = [];

    if (enableThunk) {
        middleware.push(thunk);
    }

    if (additionalMiddleware) {
        if (typeof additionalMiddleware === 'function') {
            middleware.push(additionalMiddleware);
        } else {
            middleware.push(...additionalMiddleware);
        }
    }

    if (enableBuffer) {
        middleware.push(createActionBuffer(REHYDRATE));
    }

    return middleware;
}
