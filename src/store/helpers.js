// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {combineReducers} from 'redux';
import {enableBatching} from 'redux-batched-actions';
import {General} from 'constants';
import reducerRegistry from 'store/reducer_registry';

export const offlineConfig = {
    effect: (effect, action) => {
        if (typeof effect !== 'function') {
            throw new Error('Offline Action: effect must be a function.');
        } else if (!action.meta.offline.commit) {
            throw new Error('Offline Action: commit action must be present.');
        }

        return effect();
    },
    discard: (error, action, retries) => {
        if (action.meta && action.meta.offline.hasOwnProperty('maxRetry')) {
            return retries >= action.meta.offline.maxRetry;
        }

        return retries > 10;
    },
};

export function createReducer(baseState, ...reducers) {
    reducerRegistry.setReducers(Object.assign({}, ...reducers));
    const baseReducer = combineReducers(reducerRegistry.getReducers());

    // Root reducer wrapper that listens for reset events.
    // Returns whatever is passed for the data property
    // as the new state.
    function offlineReducer(state = {}, action) {
        if (action.type === General.OFFLINE_STORE_RESET) {
            return baseReducer(baseState, action);
        }

        return baseReducer(state, action);
    }

    return enableBatching(offlineReducer);
}
