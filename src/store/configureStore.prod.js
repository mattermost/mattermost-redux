// Copyright (c) 2016-present Mattermost, Inc. All Rights Reserved.
// See License.txt for license information.
/* eslint-disable no-undefined */

import {applyMiddleware, createStore, combineReducers} from 'redux';
import {enableBatching} from 'redux-batched-actions';
import thunk from 'redux-thunk';
import {REHYDRATE} from 'redux-persist/constants';
import {createOfflineStore} from 'redux-offline';
import createActionBuffer from 'redux-action-buffer';

import {General} from 'constants';
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

    // Root reducer wrapper that listens for reset events.
    // Returns whatever is passed for the data property
    // as the new state.
    function offlineReducer(state = {}, action) {
        if (action.type === General.OFFLINE_STORE_RESET) {
            return {
                ...action.data
            };
        }

        return baseReducer(state, action);
    }

    return createOfflineStore(
        offlineReducer,
        undefined,
        applyMiddleware(thunk, createActionBuffer(REHYDRATE)),
        offlineConfig
    );
}
