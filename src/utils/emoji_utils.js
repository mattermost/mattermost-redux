// Copyright (c) 2016-present Mattermost, Inc. All Rights Reserved.
// See License.txt for license information.

import {Client4} from 'client';

export function getEmojiImageUrl(emoji) {
    if (emoji.id) {
        return Client4.getEmojiRoute(emoji.id) + '/image';
    }

    const filename = emoji.filename || emoji.aliases[0];

    return '/static/emoji/' + filename + '.png';
}

export function parseNeededCustomEmojisFromText(text, systemEmojis, customEmojisByName, nonExistentEmoji) {
    if (!text.includes(':')) {
        return new Set();
    }

    // sometimes nonExistentEmoji is of type object instead of a Set for the mobile app
    // causing a crash, this will in case is not a Set convert it to one
    let nonExistentEmojiSet = nonExistentEmoji;
    if (!nonExistentEmojiSet.has) {
        nonExistentEmojiSet = new Set(nonExistentEmoji);
    }

    const pattern = /\B:([A-Za-z0-9_-]+):\B/gi;

    const customEmojis = new Set();

    let match;
    while ((match = pattern.exec(text)) !== null) {
        if (systemEmojis.has(match[1])) {
            // It's a system emoji, go the next match
            continue;
        }

        if (nonExistentEmojiSet.has(match[1])) {
            // We've previously confirmed this is not a custom emoji
            continue;
        }

        if (customEmojisByName.has(match[1])) {
            // We have the emoji, go to the next match
            continue;
        }

        customEmojis.add(match[1]);
    }

    return customEmojis;
}
