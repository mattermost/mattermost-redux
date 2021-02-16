// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {combineReducers} from 'redux';

import {General} from '../constants';

import {enableBatching, Action, Reducer} from 'types/actions';

import reducerRegistry from './reducer_registry';

export const offlineConfig = {
    effect: <T>(effect: () => T, action: Action): T => {
        if (typeof effect !== 'function') {
            throw new Error('Offline Action: effect must be a function.');
        } else if (!('meta' in action && action.meta && action.meta.offline.commit)) {
            throw new Error('Offline Action: commit action must be present.');
        }

        return effect();
    },
    discard: (error: Error, action: Action, retries: number) => {
        if ('meta' in action && action.meta && action.meta.offline.hasOwnProperty('maxRetry')) {
            return retries >= action.meta.offline.maxRetry;
        }

        return retries > 10;
    },
};

export function createReducer(baseState: any, ...reducers: Reducer[]) {
    reducerRegistry.setReducers(Object.assign({}, ...reducers));
    const baseReducer = combineReducers(reducerRegistry.getReducers());

    // Root reducer wrapper that listens for reset events.
    // Returns whatever is passed for the data property
    // as the new state.
    function offlineReducer(state = {}, action: Action) {
        if ('type' in action && 'data' in action && action.type === General.OFFLINE_STORE_RESET) {
            return baseReducer(action.data || baseState, action);
        }

        return baseReducer(state, action as any);
    }

    return enableBatching(offlineReducer);
}
