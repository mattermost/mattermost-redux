// Copyright (c) 2016 Mattermost, Inc. All Rights Reserved.
// See License.txt for license information.
/* eslint-disable no-undefined */

import {applyMiddleware, createStore, combineReducers} from 'redux';
import {enableBatching} from 'redux-batched-actions';
import thunk from 'redux-thunk';
import {REHYDRATE} from 'redux-persist/constants';
import {createOfflineStore} from 'redux-offline';
import createActionBuffer from 'redux-action-buffer';

import serviceReducer from 'reducers';

export default function configureServiceStore(preloadedState, appReducer) {
    const baseReducer = combineReducers(Object.assign({}, serviceReducer, appReducer));
    return createStore(
        enableBatching(baseReducer),
        preloadedState,
        applyMiddleware(thunk)
    );
}

export function configureOfflineServiceStore(appReducer, offlineConfig) {
    const baseReducer = combineReducers(Object.assign({}, serviceReducer, appReducer));

    return createOfflineStore(
        baseReducer,
        undefined,
        applyMiddleware(thunk, createActionBuffer(REHYDRATE)),
        offlineConfig
    );
}
