// Copyright (c) 2016-present Mattermost, Inc. All Rights Reserved.
// See License.txt for license information.
/* eslint-disable no-undefined */

import {applyMiddleware, compose, combineReducers} from 'redux';
import {enableBatching} from 'redux-batched-actions';
import devTools from 'remote-redux-devtools';
import thunk from 'redux-thunk';
import {REHYDRATE} from 'redux-persist/constants';
import {createOfflineStore} from 'redux-offline';
import createActionBuffer from 'redux-action-buffer';

import {General} from 'constants';
import serviceReducer from 'reducers';
import deepFreezeAndThrowOnMutation from 'utils/deep_freeze';

import {offlineConfig} from './helpers';
import initialState from './initial_state';

export default function configureOfflineServiceStore(preloadedState, appReducer, getAppReducer, userOfflineConfig) {
    const baseState = Object.assign({}, initialState, preloadedState);

    const baseOfflineConfig = Object.assign({}, offlineConfig, userOfflineConfig);

    const store = createOfflineStore(
        createReducer(serviceReducer, appReducer),
        baseState,
        compose(
            applyMiddleware(thunk, createActionBuffer(REHYDRATE)),
            devTools({
                name: 'Mattermost',
                hostname: 'localhost',
                port: 5678
            })
        ),
        baseOfflineConfig
    );

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
