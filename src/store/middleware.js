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
