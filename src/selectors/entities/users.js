// Copyright (c) 2016-present Mattermost, Inc. All Rights Reserved.
// See License.txt for license information.

import {createSelector} from 'reselect';

import {getCurrentChannelId, getMyCurrentChannelMembership} from './channels';
import {getCurrentTeamId, getCurrentTeamMembership} from './teams';

import {filterProfilesMatchingTerm, sortByUsername, isSystemAdmin} from 'utils/user_utils';

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

export const isCurrentUserSystemAdmin = createSelector(
    getCurrentUser,
    (user) => {
        const roles = user.roles || '';
        return isSystemAdmin(roles);
    }
);

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

export const getProfilesInTeam = createSelector(
    getUsers,
    getUserIdsInTeams,
    (state, teamId) => teamId,
    (profiles, usersInTeams, teamId) => {
        return sortAndInjectProfiles(profiles, usersInTeams[teamId] || new Set());
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

export function searchProfiles(state, term, skipCurrent = false) {
    const profiles = filterProfilesMatchingTerm(Object.values(getUsers(state)), term);
    if (skipCurrent) {
        removeCurrentUserFromList(profiles, getCurrentUserId(state));
    }

    return profiles;
}

export function searchProfilesInCurrentChannel(state, term, skipCurrent = false) {
    const profiles = filterProfilesMatchingTerm(getProfilesInCurrentChannel(state), term);
    if (skipCurrent) {
        removeCurrentUserFromList(profiles, getCurrentUserId(state));
    }

    return profiles;
}

export function searchProfilesNotInCurrentChannel(state, term, skipCurrent = false) {
    const profiles = filterProfilesMatchingTerm(getProfilesNotInCurrentChannel(state), term);
    if (skipCurrent) {
        removeCurrentUserFromList(profiles, getCurrentUserId(state));
    }

    return profiles;
}

export function searchProfilesInCurrentTeam(state, term, skipCurrent = false) {
    const profiles = filterProfilesMatchingTerm(getProfilesInCurrentTeam(state), term);
    if (skipCurrent) {
        removeCurrentUserFromList(profiles, getCurrentUserId(state));
    }

    return profiles;
}

export function searchProfilesInTeam(state, teamId, term, skipCurrent = false) {
    const profiles = filterProfilesMatchingTerm(getProfilesInTeam(state, teamId), term);
    if (skipCurrent) {
        removeCurrentUserFromList(profiles, getCurrentUserId(state));
    }

    return profiles;
}

export function searchProfilesNotInCurrentTeam(state, term, skipCurrent = false) {
    const profiles = filterProfilesMatchingTerm(getProfilesNotInCurrentTeam(state), term);
    if (skipCurrent) {
        removeCurrentUserFromList(profiles, getCurrentUserId(state));
    }

    return profiles;
}

export function searchProfilesWithoutTeam(state, term, skipCurrent = false) {
    const profiles = filterProfilesMatchingTerm(getProfilesWithoutTeam(state), term);
    if (skipCurrent) {
        removeCurrentUserFromList(profiles, getCurrentUserId(state));
    }

    return profiles;
}

function removeCurrentUserFromList(profiles, currentUserId) {
    const index = profiles.findIndex((p) => p.id === currentUserId);
    if (index >= 0) {
        profiles.splice(index, 1);
    }
}
