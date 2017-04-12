// Copyright (c) 2016-present Mattermost, Inc. All Rights Reserved.
// See License.txt for license information.

import {createSelector} from 'reselect';

import {getCurrentChannelId, getMyCurrentChannelMembership} from './channels';
import {getCurrentTeamMembership} from './teams';

export function getCurrentUserId(state) {
    return state.entities.users.currentUserId;
}

export function getUserIdsInChannel(state, id) {
    return state.entities.users.profilesInChannel[id];
}

export function getUserIdsNotInChannel(state, id) {
    return state.entities.users.profilesNotInChannel[id];
}

export function getUserIdsInTeam(state, id) {
    return state.entities.users.profilesInTeam[id];
}

export function getUserIdsNotInTeam(state, id) {
    return state.entities.users.profilesNotInTeam[id];
}

export function getUserIdsWithoutTeam(state) {
    return state.entities.users.profilesWithoutTeam;
}

export function getUserStatuses(state) {
    return state.entities.users.statuses;
}

export function getUser(state, id) {
    return state.entities.users.profiles[id];
}

export function getUsers(state) {
    return state.entities.users.profiles;
}

export const getUsersByUsername = createSelector(
    getUsers,
    (users) => {
        const usersByUsername = {};

        for (const id in users) {
            if (users.hasOwnProperty(id)) {
                const user = users[id];
                usersByUsername[user.username] = user;
            }
        }

        return usersByUsername;
    }
);

export function getCurrentUser(state) {
    return state.entities.users.profiles[getCurrentUserId(state)];
}

export const getCurrentUserRoles = createSelector(
    getMyCurrentChannelMembership,
    getCurrentTeamMembership,
    getCurrentUser,
    (currentChannelMembership, currentTeamMembership, currentUser) => {
        return `${currentTeamMembership.roles} ${currentChannelMembership.roles} ${currentUser.roles}`;
    }
);

export const getProfileSetInCurrentChannel = createSelector(
    getCurrentChannelId,
    getUserIdsInChannel,
    (currentChannel, channelProfiles) => {
        return channelProfiles[currentChannel];
    }
);

export const getProfileSetNotInCurrentChannel = createSelector(
    getCurrentChannelId,
    getUserIdsNotInChannel,
    (currentChannel, channelProfiles) => {
        return channelProfiles[currentChannel];
    }
);

function sortAndInjectProfiles(profiles, profileSet) {
    const currentProfiles = [];
    if (typeof profileSet === 'undefined') {
        return currentProfiles;
    }

    profileSet.forEach((p) => {
        currentProfiles.push(profiles[p]);
    });

    const sortedCurrentProfiles = currentProfiles.sort((a, b) => {
        const nameA = a.username;
        const nameB = b.username;

        return nameA.localeCompare(nameB);
    });

    return sortedCurrentProfiles;
}

export const getProfilesInCurrentChannel = createSelector(
    getUsers,
    getProfileSetInCurrentChannel,
    (profiles, currentChannelProfileSet) => {
        return sortAndInjectProfiles(profiles, currentChannelProfileSet);
    }
);

export const getProfilesNotInCurrentChannel = createSelector(
    getUsers,
    getProfileSetNotInCurrentChannel,
    (profiles, notInCurrentChannelProfileSet) => {
        return sortAndInjectProfiles(profiles, notInCurrentChannelProfileSet);
    }
);

export function getStatusForUserId(state, userId) {
    return getUserStatuses(state)[userId];
}
