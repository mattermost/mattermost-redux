// Copyright (c) 2017-present Mattermost, Inc. All Rights Reserved.
// See License.txt for license information.

import {createSelector} from 'reselect';

import {
    getCurrentChannelId,
    getUsers,
} from 'selectors/entities/common';
import {getTeammateNameDisplaySetting} from 'selectors/entities/preferences';

import {displayUsername} from 'utils/user_utils';

const getUsersTypingImpl = (profiles, teammateNameDisplay, channelId, parentPostId, typing) => {
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
};

export const makeGetUsersTypingByChannelAndPost = () => {
    return createSelector(
        getUsers,
        getTeammateNameDisplaySetting,
        (state, options) => options.channelId,
        (state, options) => options.postId,
        (state) => state.entities.typing,
        getUsersTypingImpl,
    );
};

export const getUsersTyping = createSelector(
    getUsers,
    getTeammateNameDisplaySetting,
    getCurrentChannelId,
    (state) => state.entities.posts.selectedPostId,
    (state) => state.entities.typing,
    getUsersTypingImpl,
);
