// Copyright (c) 2017-present Mattermost, Inc. All Rights Reserved.
// See License.txt for license information.

// Channels

export function getCurrentChannelId(state) {
    return state.entities.channels.currentChannelId;
}

// Users

export function getCurrentUser(state) {
    return state.entities.users.profiles[getCurrentUserId(state)];
}

export function getCurrentUserId(state) {
    return state.entities.users.currentUserId;
}

export function getUsers(state) {
    return state.entities.users.profiles;
}
