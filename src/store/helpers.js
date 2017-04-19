// Copyright (c) 2017 Mattermost, Inc. All Rights Reserved.
// See License.txt for license information.

export const offlineConfig = {
    effect: (effect, action) => {
        if (typeof effect !== 'function') {
            throw new Error('Offline Action: effect must be a function.');
        } else if (!action.meta.offline.commit) {
            throw new Error('Offline Action: commit action must be preset.');
        }

        return effect();
    }
};
