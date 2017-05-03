// Copyright (c) 2017-present Mattermost, Inc. All Rights Reserved.
// See License.txt for license information.

import {createSelector} from 'reselect';

export function getCustomEmojis(state) {
    return state.entities.emojis.customEmoji;
}

export const getCustomEmojisAsMap = createSelector(
    getCustomEmojis,
    (emojis) => {
        const map = new Map();
        Object.keys(emojis).forEach((key) => {
            map.set(key, emojis[key]);
        });
        return map;
    }
);
