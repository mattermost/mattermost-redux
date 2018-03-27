// Copyright (c) 2017-present Mattermost, Inc. All Rights Reserved.
// See License.txt for license information.
// @flow

import type {GlobalState} from '../../types/store';
import type {UserProfile} from '../../types/users';

// Channels

export function getCurrentChannelId(state: GlobalState): string {
    return state.entities.channels.currentChannelId;
}

// Users

export function getCurrentUser(state: GlobalState): UserProfile {
    return state.entities.users.profiles[getCurrentUserId(state)];
}

export function getCurrentUserId(state: GlobalState): string {
    return state.entities.users.currentUserId;
}

export function getUsers(state: GlobalState): {[string]: UserProfile} {
    return state.entities.users.profiles;
}
