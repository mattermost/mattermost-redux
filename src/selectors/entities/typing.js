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

import type {Typing} from 'types/typing';
import type {UserProfile} from 'types/users';
import type {GlobalState} from 'types/store';
import type {IDMappedObjects} from 'types/utilities';

const getUsersTypingImpl = (profiles: IDMappedObjects<UserProfile>, teammateNameDisplay: string, channelId: string, parentPostId: string, typing: Typing): Array<string> => {
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
    return (createSelector(
        getUsers,
        getTeammateNameDisplaySetting,
        (state: GlobalState, options: {channelId: string, postId: string}): string => options.channelId,
        (state: GlobalState, options: {channelId: string, postId: string}): string => options.postId,
        (state: GlobalState): Typing => state.entities.typing,
        getUsersTypingImpl,
    ): (state: GlobalState, {channelId: string, postId: string}) => Array<string>);
};

export const getUsersTyping: (state: GlobalState) => Array<string> = createSelector(
    getUsers,
    getTeammateNameDisplaySetting,
    getCurrentChannelId,
    (state) => state.entities.posts.selectedPostId,
    (state) => state.entities.typing,
    getUsersTypingImpl,
);
