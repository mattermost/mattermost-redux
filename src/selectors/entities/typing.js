// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
// @flow

import {createSelector} from 'reselect';

import {
    getCurrentChannelId,
    getUsers,
} from 'selectors/entities/common';
import {getTeammateNameDisplaySetting} from 'selectors/entities/preferences';

import {displayUsername} from 'utils/user_utils';

import type {Typing} from '../../types/typing';
import type {UserProfile} from '../../types/users';

const getUsersTypingImpl = (profiles: {[string]: UserProfile}, teammateNameDisplay: string, channelId: string, parentPostId: string, typing: Typing): Array<string> => {
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
