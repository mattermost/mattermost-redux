// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {createStore} from 'redux';
import {createOfflineReducer, networkStatusChangedAction, offlineCompose} from 'redux-offline';
import defaultOfflineConfig from 'redux-offline/lib/defaults';
import reducerRegistry from 'store/reducer_registry';
import {Client4} from 'client';

import serviceReducer from 'reducers';

import {offlineConfig, createReducer} from './helpers';
import initialState from './initial_state';
import {createMiddleware} from './middleware';

export default function configureOfflineServiceStore(preloadedState, appReducer, userOfflineConfig, getAppReducer, clientOptions = {}) {
    const baseState = Object.assign({}, initialState, preloadedState);

    const baseOfflineConfig = Object.assign({}, defaultOfflineConfig, offlineConfig, userOfflineConfig);

    const store = createStore(
        createOfflineReducer(createReducer(baseState, serviceReducer, appReducer)),
        baseState,
        offlineCompose(baseOfflineConfig)(
            createMiddleware(clientOptions),
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
