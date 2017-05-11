// Copyright (c) 2016-present Mattermost, Inc. All Rights Reserved.
// See License.txt for license information.

import {createSelector} from 'reselect';

import {getCurrentUrl} from './general';

import {isTeamAdmin} from 'utils/user_utils';

export function getCurrentTeamId(state) {
    return state.entities.teams.currentTeamId;
}

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

export const getCurrentTeam = createSelector(
    getTeams,
    getCurrentTeamId,
    (teams, currentTeamId) => {
        return teams[currentTeamId];
    }
);

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
        const roles = member.roles || '';
        return isTeamAdmin(roles);
    }
);

export const getCurrentTeamUrl = createSelector(
    getCurrentUrl,
    getCurrentTeam,
    (currentUrl, currentTeam) => {
        return `${currentUrl}/${currentTeam.name}`;
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

export const getJoinableTeams = createSelector(
    getTeams,
    (teams) => {
        const openTeams = {};
        Object.values(teams).forEach((t) => {
            if (t.allow_open_invite) {
                openTeams[t.id] = t;
            }
        });

        return openTeams;
    }
);
