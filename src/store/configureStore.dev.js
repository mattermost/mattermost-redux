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

const devToolsEnhancer = (
    typeof window !== 'undefined' && window.__REDUX_DEVTOOLS_EXTENSION__ ?  // eslint-disable-line no-underscore-dangle
    window.__REDUX_DEVTOOLS_EXTENSION__ :  // eslint-disable-line no-underscore-dangle
    () => {
        return devTools({
            name: 'Mattermost',
            hostname: 'localhost',
            port: 5678,
            realtime: true
        });
    }
);

import {General} from 'constants';
import serviceReducer from 'reducers';
import deepFreezeAndThrowOnMutation from 'utils/deep_freeze';

import initialState from './initial_state';
import {defaultOptions, offlineConfig} from './helpers';

/***
clientOptions object - This param allows users to configure the store from the client side.
It has two properties currently:
enableBuffer - bool - default = true - If true the store will buffer all actions until offline state rehydration occurs.
additionalMiddleware - func | array - Allows for single or multiple additional middleware functions to be passed in from the client side.
***/
export default function configureServiceStore(preloadedState, appReducer, userOfflineConfig, getAppReducer, clientOptions = {}) {
    const baseOfflineConfig = Object.assign({}, defaultOfflineConfig, offlineConfig, userOfflineConfig);
    const options = Object.assign({}, defaultOptions, clientOptions);
    const baseState = Object.assign({}, initialState, preloadedState);

    const {additionalMiddleware, enableBuffer} = options;

    let clientSideMiddleware = additionalMiddleware;

    if (typeof clientSideMiddleware === 'function') {
        clientSideMiddleware = [clientSideMiddleware];
    }

    const middleware = [thunk, ...clientSideMiddleware];
    if (enableBuffer) {
        middleware.push(createActionBuffer(REHYDRATE));
    }

    const store = createStore(
        createOfflineReducer(createReducer(baseState, serviceReducer, appReducer)),
        baseState,
        // eslint-disable-line - offlineCompose(config)(middleware, other funcs)
        offlineCompose(baseOfflineConfig)(
            middleware,
            [
                devToolsEnhancer()
            ]
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
            store.replaceReducer(createReducer(baseState, nextServiceReducer, nextAppReducer));
        });
    }

    return store;
}

function createReducer(baseState, ...reducers) {
    const baseReducer = combineReducers(Object.assign({}, ...reducers));

    // Root reducer wrapper that listens for reset events.
    // Returns whatever is passed for the data property
    // as the new state.
    function offlineReducer(state = {}, action) {
        if (action.type === General.OFFLINE_STORE_RESET) {
            return baseReducer(baseState, action);
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
