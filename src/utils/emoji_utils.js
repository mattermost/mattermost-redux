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
