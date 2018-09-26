// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {createSelector} from 'reselect';

import {
    getCurrentChannelId,
    getCurrentUser,
    getCurrentUserId,
    getUsers,
    getMyCurrentChannelMembership,
} from 'selectors/entities/common';

import {getConfig, getLicense} from 'selectors/entities/general';
import {getDirectShowPreferences} from 'selectors/entities/preferences';

import {filterProfilesMatchingTerm, sortByUsername, isSystemAdmin} from 'utils/user_utils';

export {
    getCurrentUserId,
    getCurrentUser,
    getUsers,
};

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

export function getUserSessions(state) {
    return state.entities.users.mySessions;
}

export function getUserAudits(state) {
    return state.entities.users.myAudits;
}

export function getUser(state, id) {
    return state.entities.users.profiles[id];
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

export function getUserByUsername(state, username) {
    return getUsersByUsername(state)[username];
}

export const getUsersByEmail = createSelector(
    getUsers,
    (users) => {
        const usersByEmail = {};

        for (const user of Object.values(users)) {
            usersByEmail[user.email] = user;
        }

        return usersByEmail;
    }
);

export function getUserByEmail(state, email) {
    return getUsersByEmail(state)[email];
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
    (state) => state.entities.teams.myMembers[state.entities.teams.currentTeamId],
    getCurrentUser,
    (currentChannelMembership, currentTeamMembership, currentUser) => {
        let roles = '';
        if (currentTeamMembership) {
            roles += `${currentTeamMembership.roles} `;
        }

        if (currentChannelMembership) {
            roles += `${currentChannelMembership.roles} `;
        }

        if (currentUser) {
            roles += currentUser.roles;
        }
        return roles.trim();
    }
);

export const getCurrentUserMentionKeys = createSelector(
    getCurrentUser,
    (user) => {
        let keys = [];

        if (!user || !user.notify_props) {
            return keys;
        }

        if (user.notify_props.mention_keys) {
            keys = keys.concat(user.notify_props.mention_keys.split(',').map((key) => {
                return {key};
            }));
        }

        if (user.notify_props.first_name === 'true' && user.first_name) {
            keys.push({key: user.first_name, caseSensitive: true});
        }

        if (user.notify_props.channel === 'true') {
            keys.push({key: '@channel'});
            keys.push({key: '@all'});
            keys.push({key: '@here'});
        }

        const usernameKey = '@' + user.username;
        if (keys.findIndex((key) => key.key === usernameKey) === -1) {
            keys.push({key: usernameKey});
        }

        return keys;
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
    (state) => state.entities.teams.currentTeamId,
    getUserIdsInTeams,
    (currentTeam, teamProfiles) => {
        return teamProfiles[currentTeam];
    }
);

export const getProfileSetNotInCurrentTeam = createSelector(
    (state) => state.entities.teams.currentTeamId,
    getUserIdsNotInTeams,
    (currentTeam, teamProfiles) => {
        return teamProfiles[currentTeam];
    }
);

const PROFILE_SET_ALL = 'all';
function sortAndInjectProfiles(profiles, profileSet, skipInactive = false) {
    let currentProfiles = [];
    if (typeof profileSet === 'undefined') {
        return currentProfiles;
    } else if (profileSet === PROFILE_SET_ALL) {
        currentProfiles = Object.values(profiles);
    } else {
        currentProfiles = Array.from(profileSet).map((p) => profiles[p]);
    }

    currentProfiles = currentProfiles.filter((profile) => Boolean(profile));

    if (skipInactive) {
        currentProfiles = currentProfiles.filter((profile) => !(profile.delete_at && profile.delete_at !== 0));
    }

    return currentProfiles.sort(sortByUsername);
}

export const getProfiles = createSelector(
    getUsers,
    (profiles) => {
        return sortAndInjectProfiles(profiles, PROFILE_SET_ALL);
    }
);

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

export function getTotalUsersStats(state) {
    return state.entities.users.stats;
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

export const showCustomTerms = createSelector(
    getConfig,
    getCurrentUser,
    getLicense,
    (config, user, license) => {
        // Defaults to false if the setting doesn't exist
        return Boolean(license.IsLicensed === 'true' && config.EnableCustomServiceTerms === 'true' && user && config.CustomServiceTermsId !== user.accepted_service_terms_id);
    }
);

export const getUsersInVisibleDMs = createSelector(
    getUsers,
    getDirectShowPreferences,
    (users, preferences) => {
        const dmUsers = [];
        preferences.forEach((pref) => {
            if (pref.value === 'true' && users[pref.name]) {
                dmUsers.push(users[pref.name]);
            }
        });
        return dmUsers;
    }
);

export function makeGetProfilesForReactions() {
    return createSelector(
        getUsers,
        (state, reactions) => reactions,
        (users, reactions) => {
            const profiles = [];
            reactions.forEach((r) => {
                if (users[r.user_id]) {
                    profiles.push(users[r.user_id]);
                }
            });
            return profiles;
        }
    );
}

export function makeGetProfilesInChannel() {
    return createSelector(
        getUsers,
        getUserIdsInChannels,
        (state, channelId) => channelId,
        (state, channelId, skipInactive) => skipInactive,
        (users, userIds, channelId, skipInactive = false) => {
            const userIdsInChannel = userIds[channelId];

            if (!userIdsInChannel) {
                return [];
            }

            return sortAndInjectProfiles(users, userIdsInChannel, skipInactive);
        }
    );
}

export function makeGetProfilesByIdsAndUsernames() {
    return createSelector(
        getUsers,
        getUsersByUsername,
        (state, props) => props.allUserIds,
        (state, props) => props.allUsernames,
        (allProfilesById, allProfilesByUsername, allUserIds, allUsernames) => {
            const userProfiles = [];

            if (allUserIds && allUserIds.length > 0) {
                const profilesById = allUserIds.
                    filter((userId) => allProfilesById[userId]).
                    map((userId) => allProfilesById[userId]);

                if (profilesById && profilesById.length > 0) {
                    userProfiles.push(...profilesById);
                }
            }

            if (allUsernames && allUsernames.length > 0) {
                const profilesByUsername = allUsernames.
                    filter((username) => allProfilesByUsername[username]).
                    map((username) => allProfilesByUsername[username]);

                if (profilesByUsername && profilesByUsername.length > 0) {
                    userProfiles.push(...profilesByUsername);
                }
            }

            return userProfiles;
        }
    );
}
