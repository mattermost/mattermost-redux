// Copyright (c) 2017 Mattermost, Inc. All Rights Reserved.
// See License.txt for license information.

export const defaultOptions = {
    additionalMiddleware: [],
    enableBuffer: true
};

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
    }
};
