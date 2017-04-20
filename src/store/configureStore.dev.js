// Copyright (c) 2016-present Mattermost, Inc. All Rights Reserved.
// See License.txt for license information.
/* eslint-disable no-undefined */

import {createStore, combineReducers} from 'redux';
import {enableBatching} from 'redux-batched-actions';
import devTools from 'remote-redux-devtools';
import thunk from 'redux-thunk';
import {REHYDRATE} from 'redux-persist/constants';
import {createOfflineReducer, networkStatusChangedAction, offlineCompose} from 'redux-offline';
import defaultOfflineConfig from 'redux-offline/lib/defaults';
import createActionBuffer from 'redux-action-buffer';

import {General} from 'constants';
import serviceReducer from 'reducers';
import deepFreezeAndThrowOnMutation from 'utils/deep_freeze';

import {offlineConfig} from './helpers';

export default function configureServiceStore(preloadedState, appReducer, userOfflineConfig, getAppReducer) {
    const baseOfflineConfig = Object.assign({}, defaultOfflineConfig, offlineConfig, userOfflineConfig);

    const store = createStore(
        createOfflineReducer(createReducer(serviceReducer, appReducer)),
        undefined,
        // eslint-disable-line - offlineCompose(config)(middleware, other funcs)
        offlineCompose(baseOfflineConfig)(
            [thunk, createActionBuffer(REHYDRATE)],
            [devTools({
                name: 'Mattermost',
                hostname: 'localhost',
                port: 5678
            })]
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

    if (module.hot) {
        // Enable Webpack hot module replacement for reducers
        module.hot.accept(() => {
            const nextServiceReducer = require('../reducers').default; // eslint-disable-line global-require
            let nextAppReducer;
            if (getAppReducer) {
                nextAppReducer = getAppReducer(); // eslint-disable-line global-require
            }
            store.replaceReducer(createReducer(nextServiceReducer, nextAppReducer));
        });
    }

    return store;
}

function createReducer(...reducers) {
    const baseReducer = combineReducers(Object.assign({}, ...reducers));

    // Root reducer wrapper that listens for reset events.
    // Returns whatever is passed for the data property
    // as the new state.
    function offlineReducer(state = {}, action) {
        if (action.type === General.OFFLINE_STORE_RESET) {
            return baseReducer(undefined, action);
        }

        return baseReducer(state, action);
    }

    return enableFreezing(enableBatching(offlineReducer));
}

function enableFreezing(reducer) {
    return (state, action) => {
        const nextState = reducer(state, action);

        if (nextState !== state) {
            deepFreezeAndThrowOnMutation(nextState);
        }

        return nextState;
    };
}
