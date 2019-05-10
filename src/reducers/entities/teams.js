// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {combineReducers} from 'redux';
import {ChannelTypes, TeamTypes, UserTypes, SchemeTypes, GroupTypes} from 'action_types';
import {teamListToMap} from 'utils/team_utils';

function currentTeamId(state = '', action) {
    switch (action.type) {
    case TeamTypes.SELECT_TEAM:
        return action.data;

    case UserTypes.LOGOUT_SUCCESS:
        return '';
    default:
        return state;
    }
}

function teams(state = {}, action) {
    switch (action.type) {
    case TeamTypes.RECEIVED_TEAMS_LIST:
    case SchemeTypes.RECEIVED_SCHEME_TEAMS:
        return Object.assign({}, state, teamListToMap(action.data));
    case TeamTypes.RECEIVED_TEAMS:
        return Object.assign({}, state, action.data);

    case TeamTypes.CREATED_TEAM:
    case TeamTypes.UPDATED_TEAM:
    case TeamTypes.PATCHED_TEAM:
    case TeamTypes.RECEIVED_TEAM:
        return {
            ...state,
            [action.data.id]: action.data,
        };

    case TeamTypes.RECEIVED_TEAM_DELETED: {
        const nextState = {...state};
        const teamId = action.data.id;
        if (nextState.hasOwnProperty(teamId)) {
            Reflect.deleteProperty(nextState, teamId);
            return nextState;
        }

        return state;
    }

    case TeamTypes.UPDATED_TEAM_SCHEME: {
        const {teamId, schemeId} = action.data;
        const team = state[teamId];

        if (!team) {
            return state;
        }

        return {...state, [teamId]: {...team, scheme_id: schemeId}};
    }

    case UserTypes.LOGOUT_SUCCESS:
        return {};

    default:
        return state;
    }
}

function myMembers(state = {}, action) {
    function updateState(receivedTeams = {}, currentState = {}) {
        return Object.keys(receivedTeams).forEach((teamId) => {
            if (receivedTeams[teamId].delete_at > 0 && currentState[teamId]) {
                Reflect.deleteProperty(currentState, teamId);
            }
        });
    }

    switch (action.type) {
    case TeamTypes.RECEIVED_MY_TEAM_MEMBER: {
        const nextState = {...state};
        const member = action.data;
        if (member.delete_at === 0) {
            nextState[member.team_id] = member;
        }
        return nextState;
    }
    case TeamTypes.RECEIVED_MY_TEAM_MEMBERS: {
        const nextState = {};
        const members = action.data;
        for (const m of members) {
            if (m.delete_at == null || m.delete_at === 0) {
                const prevMember = state[m.team_id] || {mention_count: 0, msg_count: 0};
                nextState[m.team_id] = {
                    ...prevMember,
                    ...m,
                };
            }
        }
        return nextState;
    }
    case TeamTypes.RECEIVED_TEAMS_LIST: {
        const nextState = {...state};
        const receivedTeams = teamListToMap(action.data);

        return updateState(receivedTeams, nextState) || nextState;
    }
    case TeamTypes.RECEIVED_TEAMS: {
        const nextState = {...state};
        const receivedTeams = action.data;

        return updateState(receivedTeams, nextState) || nextState;
    }
    case TeamTypes.RECEIVED_MY_TEAM_UNREADS: {
        const nextState = {...state};
        const unreads = action.data;
        for (const u of unreads) {
            const msgCount = u.msg_count < 0 ? 0 : u.msg_count;
            const mentionCount = u.mention_count < 0 ? 0 : u.mention_count;
            const m = {
                ...state[u.team_id],
                mention_count: mentionCount,
                msg_count: msgCount,
            };
            nextState[u.team_id] = m;
        }

        return nextState;
    }
    case ChannelTypes.INCREMENT_UNREAD_MSG_COUNT: {
        const {teamId, amount, onlyMentions} = action.data;
        const member = state[teamId];

        if (!member) {
            // Don't keep track of unread posts until we've loaded the actual team member
            return state;
        }

        if (onlyMentions) {
            // Incrementing the msg_count marks the team as unread, so don't do that if these posts shouldn't be unread
            return state;
        }

        return {
            ...state,
            [teamId]: {
                ...member,
                msg_count: member.msg_count + amount,
            },
        };
    }
    case ChannelTypes.DECREMENT_UNREAD_MSG_COUNT: {
        const {teamId, amount} = action.data;
        const member = state[teamId];

        if (!member) {
            // Don't keep track of unread posts until we've loaded the actual team member
            return state;
        }

        return {
            ...state,
            [teamId]: {
                ...member,
                msg_count: Math.max(member.msg_count - Math.abs(amount), 0),
            },
        };
    }
    case ChannelTypes.INCREMENT_UNREAD_MENTION_COUNT: {
        const {teamId, amount} = action.data;
        const member = state[teamId];

        if (!member) {
            // Don't keep track of unread posts until we've loaded the actual team member
            return state;
        }

        return {
            ...state,
            [teamId]: {
                ...member,
                mention_count: member.mention_count + amount,
            },
        };
    }
    case ChannelTypes.DECREMENT_UNREAD_MENTION_COUNT: {
        const {teamId, amount} = action.data;
        const member = state[teamId];

        if (!member) {
            // Don't keep track of unread posts until we've loaded the actual team member
            return state;
        }

        return {
            ...state,
            [teamId]: {
                ...member,
                mention_count: Math.max(member.mention_count - amount, 0),
            },
        };
    }
    case TeamTypes.LEAVE_TEAM:
    case TeamTypes.RECEIVED_TEAM_DELETED: {
        const nextState = {...state};
        const data = action.data;
        Reflect.deleteProperty(nextState, data.id);
        return nextState;
    }
    case TeamTypes.UPDATED_TEAM_MEMBER_SCHEME_ROLES: {
        return updateTeamMemberSchemeRoles(state, action);
    }
    case UserTypes.LOGOUT_SUCCESS:
        return {};
    default:
        return state;
    }
}

function membersInTeam(state = {}, action) {
    switch (action.type) {
    case TeamTypes.RECEIVED_MEMBER_IN_TEAM: {
        const data = action.data;
        const members = {...(state[data.team_id] || {})};
        members[data.user_id] = data;
        return {
            ...state,
            [data.team_id]: members,
        };
    }
    case TeamTypes.RECEIVED_TEAM_MEMBERS: {
        const data = action.data;
        if (data && data.length) {
            const nextState = {...state};
            for (const member of data) {
                if (nextState[member.team_id]) {
                    nextState[member.team_id] = {...nextState[member.team_id]};
                } else {
                    nextState[member.team_id] = {};
                }
                nextState[member.team_id][member.user_id] = member;
            }

            return nextState;
        }

        return state;
    }
    case TeamTypes.RECEIVED_MEMBERS_IN_TEAM: {
        const data = action.data;
        if (data && data.length) {
            const teamId = data[0].team_id;
            const members = {...(state[teamId] || {})};
            for (const member of data) {
                members[member.user_id] = member;
            }

            return {
                ...state,
                [teamId]: members,
            };
        }

        return state;
    }
    case TeamTypes.REMOVE_MEMBER_FROM_TEAM: {
        const data = action.data;
        const members = state[data.team_id];
        if (members) {
            const nextState = {...members};
            Reflect.deleteProperty(nextState, data.user_id);
            return {
                ...state,
                [data.team_id]: nextState,
            };
        }

        return state;
    }
    case TeamTypes.RECEIVED_TEAM_DELETED: {
        const nextState = {...state};
        const teamId = action.data.id;
        if (nextState.hasOwnProperty(teamId)) {
            Reflect.deleteProperty(nextState, teamId);
            return nextState;
        }

        return state;
    }
    case TeamTypes.UPDATED_TEAM_MEMBER_SCHEME_ROLES: {
        return updateTeamMemberSchemeRoles(state, action);
    }
    case UserTypes.LOGOUT_SUCCESS:
        return {};
    default:
        return state;
    }
}

function stats(state = {}, action) {
    switch (action.type) {
    case TeamTypes.RECEIVED_TEAM_STATS: {
        const stat = action.data;
        return {
            ...state,
            [stat.team_id]: stat,
        };
    }
    case TeamTypes.RECEIVED_TEAM_DELETED: {
        const nextState = {...state};
        const teamId = action.data.id;
        if (nextState.hasOwnProperty(teamId)) {
            Reflect.deleteProperty(nextState, teamId);
            return nextState;
        }

        return state;
    }
    case UserTypes.LOGOUT_SUCCESS:
        return {};
    default:
        return state;
    }
}

function groupsAssociatedToTeam(state = {}, action) {
    switch (action.type) {
    case GroupTypes.RECEIVED_GROUPS_ASSOCIATED_TO_TEAM: {
        const {teamID, groups} = action.data;
        const nextState = {...state};
        const associatedGroupIDs = new Set(state[teamID] || []);
        for (const group of groups) {
            associatedGroupIDs.add(group.id);
        }
        nextState[teamID] = Array.from(associatedGroupIDs);
        return nextState;
    }
    case GroupTypes.RECEIVED_ALL_GROUPS_ASSOCIATED_TO_TEAM: {
        const {teamID, groups} = action.data;
        const nextState = {...state};
        const associatedGroupIDs = new Set([]);
        for (const group of groups) {
            associatedGroupIDs.add(group.id);
        }
        nextState[teamID] = Array.from(associatedGroupIDs);
        return nextState;
    }
    case GroupTypes.RECEIVED_GROUPS_NOT_ASSOCIATED_TO_TEAM: {
        const {teamID, groups} = action.data;
        const nextState = {...state};
        const associatedGroupIDs = new Set(state[teamID] || []);
        for (const group of groups) {
            associatedGroupIDs.delete(group.id);
        }
        nextState[teamID] = Array.from(associatedGroupIDs);
        return nextState;
    }
    default:
        return state;
    }
}

function updateTeamMemberSchemeRoles(state, action) {
    const {teamId, userId, isSchemeUser, isSchemeAdmin} = action.data;
    const team = state[teamId];
    if (team) {
        const member = team[userId];
        if (member) {
            return {
                ...state,
                [teamId]: {
                    ...state[teamId],
                    [userId]: {
                        ...state[teamId][userId],
                        scheme_user: isSchemeUser,
                        scheme_admin: isSchemeAdmin,
                    },
                },
            };
        }
    }
    return state;
}

export default combineReducers({

    // the current selected team
    currentTeamId,

    // object where every key is the team id and has and object with the team detail
    teams,

    // object where every key is the team id and has and object with the team members detail
    myMembers,

    // object where every key is the team id and has an object of members in the team where the key is user id
    membersInTeam,

    // object where every key is the team id and has an object with the team stats
    stats,

    groupsAssociatedToTeam,
});
