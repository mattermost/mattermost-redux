// Copyright (c) 2016-present Mattermost, Inc. All Rights Reserved.
// See License.txt for license information.
/* eslint-disable no-undefined */

import {applyMiddleware, combineReducers} from 'redux';
import {enableBatching} from 'redux-batched-actions';
import thunk from 'redux-thunk';
import {REHYDRATE} from 'redux-persist/constants';
import {createOfflineStore} from 'redux-offline';
import createActionBuffer from 'redux-action-buffer';

import {General} from 'constants';
import serviceReducer from 'reducers';
import initialState from './initial_state';

export default function configureServiceStore(preloadedState, appReducer, offlineConfig) {
    const baseReducer = combineReducers(Object.assign({}, serviceReducer, appReducer));
    const baseState = Object.assign({}, initialState, preloadedState);

    const baseOfflineConfig = Object.assign({}, {
        effect: (effect, action) => {
            if (typeof effect !== 'function') {
                throw new Error('Offline Action: effect must be a function.');
            } else if (!action.meta.offline.commit) {
                throw new Error('Offline Action: commit action must be preset.');
            }

            return effect();
        }
    }, offlineConfig);

    // Root reducer wrapper that listens for reset events.
    // Returns whatever is passed for the data property
    // as the new state.
    function offlineReducer(state = {}, action) {
        if (action.type === General.OFFLINE_STORE_RESET) {
            return baseReducer(baseState, action);
        }

        return baseReducer(state, action);
    }

    return createOfflineStore(
        enableBatching(offlineReducer),
        baseState,
        applyMiddleware(thunk, createActionBuffer(REHYDRATE)),
        baseOfflineConfig
    );
}
