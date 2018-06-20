// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {createStore} from 'redux';
import thunk from 'redux-thunk';
import {REHYDRATE} from 'redux-persist/constants';
import {createOfflineReducer, networkStatusChangedAction, offlineCompose} from 'redux-offline';
import defaultOfflineConfig from 'redux-offline/lib/defaults';
import createActionBuffer from 'redux-action-buffer';
import reducerRegistry from 'store/reducer_registry';
import {Client4} from 'client';

import serviceReducer from 'reducers';

import initialState from './initial_state';
import {defaultOptions, offlineConfig, createReducer} from './helpers';

/***
clientOptions object - This param allows users to configure the store from the client side.
It has two properties currently:
enableBuffer - bool - default = true - If true the store will buffer all actions until offline state rehydration occurs.
additionalMiddleware - func | array - Allows for single or multiple additional middleware functions to be passed in from the client side.
***/
export default function configureOfflineServiceStore(preloadedState, appReducer, userOfflineConfig, getAppReducer, clientOptions = {}) {
    const baseState = Object.assign({}, initialState, preloadedState);

    const baseOfflineConfig = Object.assign({}, defaultOfflineConfig, offlineConfig, userOfflineConfig);
    const options = Object.assign({}, defaultOptions, clientOptions);

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
        offlineCompose(baseOfflineConfig)(
            middleware,
            []
        )
    );

    reducerRegistry.setChangeListener((reducers) => {
        store.replaceReducer(createOfflineReducer(createReducer(baseState, reducers)));
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

    return store;
}