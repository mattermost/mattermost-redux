// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
// @flow

import {Client4} from 'client';

import type {CustomEmoji} from '../types/emojis';

export function getEmojiImageUrl(emoji: CustomEmoji): string {
    if (emoji.id) {
        return Client4.getEmojiRoute(emoji.id) + '/image';
    }

    const filename = emoji.filename || emoji.aliases[0];

    return '/static/emoji/' + filename + '.png';
}

export function parseNeededCustomEmojisFromText(text: string, systemEmojis: Map<string, CustomEmoji>, customEmojisByName: Map<string, CustomEmoji>, nonExistentEmoji: Set<string>): Set<string> {
    if (!text.includes(':')) {
        return new Set();
    }

    const pattern = /:([A-Za-z0-9_-]+):/gi;

    const customEmojis = new Set();

    let match;
    while ((match = pattern.exec(text)) !== null) {
        if (systemEmojis.has(match[1])) {
            // It's a system emoji, go the next match
            continue;
        }

        if (nonExistentEmoji.has(match[1])) {
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
