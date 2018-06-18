// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
/* eslint-disable no-undefined */

import {createStore} from 'redux';
import devTools from 'remote-redux-devtools';
import thunk from 'redux-thunk';
import {REHYDRATE} from 'redux-persist/constants';
import {createOfflineReducer, networkStatusChangedAction, offlineCompose} from 'redux-offline';
import defaultOfflineConfig from 'redux-offline/lib/defaults';
import createActionBuffer from 'redux-action-buffer';
import reducerRegistry from 'store/reducer_registry';
import {Client4} from 'client';

const devToolsEnhancer = (
    typeof window !== 'undefined' && window.__REDUX_DEVTOOLS_EXTENSION__ ? // eslint-disable-line no-underscore-dangle
        window.__REDUX_DEVTOOLS_EXTENSION__ : // eslint-disable-line no-underscore-dangle
        () => {
            return devTools({
                name: 'Mattermost',
                hostname: 'localhost',
                port: 5678,
                realtime: true,
            });
        }
);

import serviceReducer from 'reducers';
import deepFreezeAndThrowOnMutation from 'utils/deep_freeze';
import initialState from './initial_state';
import {defaultOptions, offlineConfig, createReducer} from './helpers';

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

    const loadReduxDevtools = process.env.NODE_ENV !== 'test'; //eslint-disable-line no-process-env

    const store = createStore(
        createOfflineReducer(createDevReducer(baseState, serviceReducer, appReducer)),
        baseState,
        // eslint-disable-line - offlineCompose(config)(middleware, other funcs)
        offlineCompose(baseOfflineConfig)(
            middleware,
            loadReduxDevtools ? [devToolsEnhancer()] : []
        )
    );

    reducerRegistry.setChangeListener((reducers) => {
        store.replaceReducer(createOfflineReducer(createDevReducer(baseState, reducers)));
    });

    // launch store persistor
    if (baseOfflineConfig.persist) {
        baseOfflineConfig.persist(store, baseOfflineConfig.persistOptions, baseOfflineConfig.persistCallback);
    }

    if (baseOfflineConfig.detectNetwork) {
        baseOfflineConfig.detectNetwork((online) => {
            Client4.setOnline(online);
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
            store.replaceReducer(createDevReducer(baseState, reducerRegistry.getReducers(), nextServiceReducer, nextAppReducer));
        });
    }

    return store;
}

function createDevReducer(baseState, ...reducers) {
    return enableFreezing(createReducer(baseState, ...reducers));
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
