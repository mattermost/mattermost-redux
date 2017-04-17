// Copyright (c) 2016-present Mattermost, Inc. All Rights Reserved.
// See License.txt for license information.

import {createSelector} from 'reselect';

import {getCurrentChannelId, getMyCurrentChannelMembership} from './channels';
import {getCurrentTeamId, getCurrentTeamMembership} from './teams';

import {userMatchesSearchTerm, sortByUsername} from 'utils/user_utils';

export function getCurrentUserId(state) {
    return state.entities.users.currentUserId;
}

export function getUserIdsInChannels(state) {
    return state.entities.users.profilesInChannel;
}

export function getUserIdsNotInChannels(state) {
    return state.entities.users.profilesNotInChannel;
}

export function getUserIdsInTeams(state) {
    return state.entities.users.profilesInTeam;
}

export function getUserIdsNotInTeams(state) {
    return state.entities.users.profilesNotInTeam;
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
    getUserIdsInChannels,
    (currentChannel, channelProfiles) => {
        return channelProfiles[currentChannel];
    }
);

export const getProfileSetNotInCurrentChannel = createSelector(
    getCurrentChannelId,
    getUserIdsNotInChannels,
    (currentChannel, channelProfiles) => {
        return channelProfiles[currentChannel];
    }
);

export const getProfileSetInCurrentTeam = createSelector(
    getCurrentTeamId,
    getUserIdsInTeams,
    (currentTeam, teamProfiles) => {
        return teamProfiles[currentTeam];
    }
);

export const getProfileSetNotInCurrentTeam = createSelector(
    getCurrentTeamId,
    getUserIdsNotInTeams,
    (currentTeam, teamProfiles) => {
        return teamProfiles[currentTeam];
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

    const sortedCurrentProfiles = currentProfiles.sort(sortByUsername);

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

export const getProfilesInCurrentTeam = createSelector(
    getUsers,
    getProfileSetInCurrentTeam,
    (profiles, currentTeamProfileSet) => {
        return sortAndInjectProfiles(profiles, currentTeamProfileSet);
    }
);

export const getProfilesNotInCurrentTeam = createSelector(
    getUsers,
    getProfileSetNotInCurrentTeam,
    (profiles, notInCurrentTeamProfileSet) => {
        return sortAndInjectProfiles(profiles, notInCurrentTeamProfileSet);
    }
);

export const getProfilesWithoutTeam = createSelector(
    getUsers,
    getUserIdsWithoutTeam,
    (profiles, withoutTeamProfileSet) => {
        return sortAndInjectProfiles(profiles, withoutTeamProfileSet);
    }
);

export function getStatusForUserId(state, userId) {
    return getUserStatuses(state)[userId];
}

export function searchProfiles(state, term) {
    return Object.values(getUsers(state)).filter((u) => userMatchesSearchTerm(u, term));
}

export function searchProfilesInCurrentChannel(state, term) {
    return Object.values(getProfilesInCurrentChannel(state)).filter((u) => userMatchesSearchTerm(u, term));
}

export function searchProfilesNotInCurrentChannel(state, term) {
    return Object.values(getProfilesNotInCurrentChannel(state)).filter((u) => userMatchesSearchTerm(u, term));
}

export function searchProfilesInCurrentTeam(state, term) {
    return Object.values(getProfilesInCurrentTeam(state)).filter((u) => userMatchesSearchTerm(u, term));
}

export function searchProfilesNotInCurrentTeam(state, term) {
    return Object.values(getProfilesNotInCurrentTeam(state)).filter((u) => userMatchesSearchTerm(u, term));
}

export function searchProfilesWithoutTeam(state, term) {
    return Object.values(getProfilesWithoutTeam(state)).filter((u) => userMatchesSearchTerm(u, term));
}
