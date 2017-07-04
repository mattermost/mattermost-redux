// Copyright (c) 2017-present Mattermost, Inc. All Rights Reserved.
// See License.txt for license information.

import {createSelector} from 'reselect';
import {getCurrentChannelId} from './channels';
import {getTeammateNameDisplaySetting} from './preferences';
import {getUsers} from './users';
import {displayUsername} from 'utils/user_utils';

export const getUsersTyping = createSelector(
    getUsers,
    getTeammateNameDisplaySetting,
    getCurrentChannelId,
    (state) => state.entities.posts.selectedPostId,
    (state) => state.entities.typing,
    (profiles, teammateNameDisplay, channelId, parentPostId, typing) => {
        const id = channelId + parentPostId;

        if (typing[id]) {
            const users = Object.keys(typing[id]);

            if (users.length) {
                return users.map((userId) => {
                    return displayUsername(profiles[userId], teammateNameDisplay);
                });
            }
        }

        return [];
    }
);
