// Copyright (c) 2016-present Mattermost, Inc. All Rights Reserved.
// See License.txt for license information.

import {createSelector} from 'reselect';

import {getCurrentUrl} from 'selectors/entities/general';

import {createIdsSelector} from 'utils/helpers';
import {isTeamAdmin} from 'utils/user_utils';

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

export const getJoinableTeams = createSelector(
    getTeams,
    getTeamMemberships,
    (teams, myMembers) => {
        const openTeams = {};
        Object.values(teams).forEach((t) => {
            if (t.allow_open_invite && !myMembers[t.id]) {
                openTeams[t.id] = t;
            }
        });

        return openTeams;
    }
);

export const getJoinableTeamIds = createIdsSelector(
    getTeams,
    getTeamMemberships,
    (teams, myMembers) => {
        return Object.keys(teams).filter((id) => {
            const team = teams[id];
            const member = myMembers[id];
            return team.allow_open_invite && !member;
        });
    }
);

export const getMySortedTeamIds = createIdsSelector(
    getTeams,
    getTeamMemberships,
    (state, locale) => locale,
    (teams, myMembers, locale) => {
        return Object.values(teams).filter((t) => myMembers[t.id]).sort((a, b) => {
            if (a.display_name !== b.display_name) {
                return a.display_name.toLowerCase().localeCompare(b.display_name.toLowerCase(), locale, {numeric: true});
            }

            return a.name.toLowerCase().localeCompare(b.name.toLowerCase(), locale, {numeric: true});
        }).map((t) => t.id);
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
                mentionCount = mentionCount + (m.mention_count || 0);
                messageCount = messageCount + (m.msg_count || 0);
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
