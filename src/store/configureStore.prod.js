// Copyright (c) 2016 Mattermost, Inc. All Rights Reserved.
// See License.txt for license information.

import {applyMiddleware, createStore, combineReducers} from 'redux';
import {enableBatching} from 'redux-batched-actions';
import thunk from 'redux-thunk';
import serviceReducer from 'reducers';

export default function configureServiceStore(preloadedState, appReducer) {
    const baseReducer = combineReducers(Object.assign({}, serviceReducer, appReducer));
    return createStore(
        enableBatching(baseReducer),
        preloadedState,
        applyMiddleware(thunk)
    );
}
