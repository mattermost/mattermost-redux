// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {createSelector} from 'reselect';

import {Permissions} from 'constants';

import {getConfig, getCurrentUrl, isCompatibleWithJoinViewTeamPermissions} from 'selectors/entities/general';
import {haveISystemPermission} from 'selectors/entities/roles';

import {createIdsSelector} from 'utils/helpers';
import {isTeamAdmin} from 'utils/user_utils';
import {sortTeamsWithLocale} from 'utils/team_utils';

export function getCurrentTeamId(state) {
    return state.entities.teams.currentTeamId;
}

export const getTeamByName = createSelector(
    getTeams,
    (state, name) => name,
    (teams, name) => {
        return Object.values(teams).find((team) => team.name === name);
    }
);

export function getTeams(state) {
    return state.entities.teams.teams;
}

export function getTeamStats(state) {
    return state.entities.teams.stats;
}

export function getTeamMemberships(state) {
    return state.entities.teams.myMembers;
}

export function getMembersInTeams(state) {
    return state.entities.teams.membersInTeam;
}

export const getTeamsList = createSelector(
    getTeams,
    (teams) => {
        return Object.values(teams);
    }
);

export const getCurrentTeam = createSelector(
    getTeams,
    getCurrentTeamId,
    (teams, currentTeamId) => {
        return teams[currentTeamId];
    }
);

export function getTeam(state, id) {
    const teams = getTeams(state);
    return teams[id];
}

export const getCurrentTeamMembership = createSelector(
    getCurrentTeamId,
    getTeamMemberships,
    (currentTeamId, teamMemberships) => {
        return teamMemberships[currentTeamId];
    }
);

export const isCurrentUserCurrentTeamAdmin = createSelector(
    getCurrentTeamMembership,
    (member) => {
        if (member) {
            const roles = member.roles || '';
            return isTeamAdmin(roles);
        }
        return false;
    }
);

export const getCurrentTeamUrl = createSelector(
    getCurrentUrl,
    getCurrentTeam,
    (state) => getConfig(state).SiteURL,
    (currentURL, currentTeam, siteURL) => {
        const rootURL = `${currentURL || siteURL}`;
        if (!currentTeam) {
            return rootURL;
        }

        return `${rootURL}/${currentTeam.name}`;
    }
);

export const getCurrentRelativeTeamUrl = createSelector(
    getCurrentTeam,
    (currentTeam) => {
        if (!currentTeam) {
            return '/';
        }
        return `/${currentTeam.name}`;
    }
);

export const getCurrentTeamStats = createSelector(
    getCurrentTeamId,
    getTeamStats,
    (currentTeamId, teamStats) => {
        return teamStats[currentTeamId];
    }
);

export const getMyTeams = createSelector(
    getTeams,
    getTeamMemberships,
    (teams, members) => {
        return Object.values(teams).filter((t) => members[t.id]);
    }
);

export const getMyTeamMember = createSelector(
    getTeamMemberships,
    (state, teamId) => teamId,
    (teamMemberships, teamId) => {
        return teamMemberships[teamId] || {};
    }
);

export const getMembersInCurrentTeam = createSelector(
    getCurrentTeamId,
    getMembersInTeams,
    (currentTeamId, teamMembers) => {
        return teamMembers[currentTeamId];
    }
);

export function getTeamMember(state, teamId, userId) {
    const members = getMembersInTeams(state)[teamId];
    if (members) {
        return members[userId];
    }

    return null;
}

export const getListableTeamIds = createIdsSelector(
    getTeams,
    getTeamMemberships,
    (state) => haveISystemPermission(state, {permission: Permissions.LIST_PUBLIC_TEAMS}),
    (state) => haveISystemPermission(state, {permission: Permissions.LIST_PRIVATE_TEAMS}),
    isCompatibleWithJoinViewTeamPermissions,
    (teams, myMembers, canListPublicTeams, canListPrivateTeams, compatibleWithJoinViewTeamPermissions) => {
        return Object.keys(teams).filter((id) => {
            const team = teams[id];
            const member = myMembers[id];
            let canList = team.allow_open_invite;
            if (compatibleWithJoinViewTeamPermissions) {
                canList = (canListPrivateTeams && !team.allow_open_invite) || (canListPublicTeams && team.allow_open_invite);
            }
            return team.delete_at === 0 && canList && !member;
        });
    }
);

export const getListableTeams = createSelector(
    getTeams,
    getListableTeamIds,
    (teams, listableTeamIds) => {
        return listableTeamIds.map((id) => teams[id]);
    }
);

export const getSortedListableTeams = createSelector(
    getTeams,
    getListableTeamIds,
    (state, locale) => locale,
    (teams, listableTeamIds, locale) => {
        const listableTeams = {};

        for (const id of listableTeamIds) {
            listableTeams[id] = teams[id];
        }

        return Object.values(listableTeams).sort(sortTeamsWithLocale(locale));
    }
);

export const getJoinableTeamIds = createIdsSelector(
    getTeams,
    getTeamMemberships,
    (state) => haveISystemPermission(state, {permission: Permissions.JOIN_PUBLIC_TEAMS}),
    (state) => haveISystemPermission(state, {permission: Permissions.JOIN_PRIVATE_TEAMS}),
    isCompatibleWithJoinViewTeamPermissions,
    (teams, myMembers, canJoinPublicTeams, canJoinPrivateTeams, compatibleWithJoinViewTeamPermissions) => {
        return Object.keys(teams).filter((id) => {
            const team = teams[id];
            const member = myMembers[id];
            let canJoin = team.allow_open_invite;
            if (compatibleWithJoinViewTeamPermissions) {
                canJoin = (canJoinPrivateTeams && !team.allow_open_invite) || (canJoinPublicTeams && team.allow_open_invite);
            }
            return team.delete_at === 0 && canJoin && !member;
        });
    }
);

export const getJoinableTeams = createSelector(
    getTeams,
    getJoinableTeamIds,
    (teams, joinableTeamIds) => {
        return joinableTeamIds.map((id) => teams[id]);
    }
);

export const getSortedJoinableTeams = createSelector(
    getTeams,
    getJoinableTeamIds,
    (state, locale) => locale,
    (teams, joinableTeamIds, locale) => {
        const joinableTeams = {};

        for (const id of joinableTeamIds) {
            joinableTeams[id] = teams[id];
        }

        return Object.values(joinableTeams).sort(sortTeamsWithLocale(locale));
    }
);

export const getMySortedTeamIds = createIdsSelector(
    getTeams,
    getTeamMemberships,
    (state, locale) => locale,
    (teams, myMembers, locale) => {
        return Object.values(teams).filter((t) => myMembers[t.id]).sort(sortTeamsWithLocale(locale)).map((t) => t.id);
    }
);

export const getMyTeamsCount = createSelector(
    getTeamMemberships,
    (teams) => {
        return Object.keys(teams).length;
    }
);

// returns the badge number to show (excluding the current team)
// > 0 means is returning the mention count
// 0 means that there are no unread messages
// -1 means that there are unread messages but no mentions
export const getChannelDrawerBadgeCount = createSelector(
    getCurrentTeamId,
    getTeamMemberships,
    (currentTeamId, teamMembers) => {
        let mentionCount = 0;
        let messageCount = 0;
        Object.values(teamMembers).forEach((m) => {
            if (m.team_id !== currentTeamId) {
                mentionCount += (m.mention_count || 0);
                messageCount += (m.msg_count || 0);
            }
        });

        let badgeCount = 0;
        if (mentionCount) {
            badgeCount = mentionCount;
        } else if (messageCount) {
            badgeCount = -1;
        }

        return badgeCount;
    }
);

// returns the badge for a team
// > 0 means is returning the mention count
// 0 means that there are no unread messages
// -1 means that there are unread messages but no mentions
export function makeGetBadgeCountForTeamId() {
    return createSelector(
        getTeamMemberships,
        (state, id) => id,
        (members, teamId) => {
            const member = members[teamId];
            let badgeCount = 0;

            if (member) {
                if (member.mention_count) {
                    badgeCount = member.mention_count;
                } else if (member.msg_count) {
                    badgeCount = -1;
                }
            }

            return badgeCount;
        }
    );
}
