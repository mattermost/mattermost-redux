// Copyright (c) 2017-present Mattermost, Inc. All Rights Reserved.
// See License.txt for license information.

import {createSelector} from 'reselect';
import {createIdsSelector} from 'utils/helpers';

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

export const getCustomEmojisByName = createSelector(
    getCustomEmojis,
    (emojis) => {
        const map = new Map();

        Object.values(emojis).forEach((emoji) => {
            map.set(emoji.name, emoji);
        });

        return map;
    }
);

export const getCustomEmojiIdsSortedByName = createIdsSelector(
    (state) => state.entities.emojis.customEmoji,
    (emojis) => {
        const sortedEmojis = Object.values(emojis).sort((a, b) => a.name.localeCompare(b.name));
        const sortedIds = [];
        sortedEmojis.forEach((e) => sortedIds.push(e.id));
        return sortedIds;
    }
);
