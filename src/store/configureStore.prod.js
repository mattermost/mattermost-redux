// Copyright (c) 2016-present Mattermost, Inc. All Rights Reserved.
// See License.txt for license information.
/* eslint-disable no-undefined */

import {createStore, combineReducers} from 'redux';
import {enableBatching} from 'redux-batched-actions';
import thunk from 'redux-thunk';
import {REHYDRATE} from 'redux-persist/constants';
import {createOfflineReducer, networkStatusChangedAction, offlineCompose} from 'redux-offline';
import defaultOfflineConfig from 'redux-offline/lib/defaults';
import createActionBuffer from 'redux-action-buffer';

import {General} from 'constants';
import serviceReducer from 'reducers';

import initialState from './initial_state';
import {offlineConfig} from './helpers';

export default function configureOfflineServiceStore(preloadedState, appReducer, userOfflineConfig) {
    const baseReducer = combineReducers(Object.assign({}, serviceReducer, appReducer));
    const baseState = Object.assign({}, initialState, preloadedState);

    const baseOfflineConfig = Object.assign({}, defaultOfflineConfig, offlineConfig, userOfflineConfig);

    // Root reducer wrapper that listens for reset events.
    // Returns whatever is passed for the data property
    // as the new state.
    function offlineReducer(state = {}, action) {
        if (action.type === General.OFFLINE_STORE_RESET) {
            return baseReducer(baseState, action);
        }

        return baseReducer(state, action);
    }

    const store = createStore(
        createOfflineReducer(enableBatching(offlineReducer)),
        baseState,
        offlineCompose(baseOfflineConfig)(
            [thunk, createActionBuffer(REHYDRATE)]
        )
    );

    // launch store persistor
    if (baseOfflineConfig.persist) {
        baseOfflineConfig.persist(store, baseOfflineConfig.persistOptions, baseOfflineConfig.persistCallback);
    }

    if (baseOfflineConfig.detectNetwork) {
        baseOfflineConfig.detectNetwork((online) => {
            store.dispatch(networkStatusChangedAction(online));
        });
    }

    return store;
}
