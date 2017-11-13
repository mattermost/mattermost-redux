// Copyright (c) 2016-present Mattermost, Inc. All Rights Reserved.
// See License.txt for license information.

import {combineReducers} from 'redux';
import {TeamTypes, UserTypes} from 'action_types';
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
        return Object.assign({}, state, teamListToMap(action.data));
    case TeamTypes.RECEIVED_TEAMS:
        return Object.assign({}, state, action.data);

    case TeamTypes.CREATED_TEAM:
    case TeamTypes.UPDATED_TEAM:
    case TeamTypes.RECEIVED_TEAM:
        return {
            ...state,
            [action.data.id]: action.data
        };

    case UserTypes.LOGOUT_SUCCESS:
        return {};

    default:
        return state;
    }
}

function myMembers(state = {}, action) {
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
                    ...m
                };
            }
        }
        return nextState;
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
                msg_count: msgCount
            };
            nextState[u.team_id] = m;
        }

        return nextState;
    }

    case TeamTypes.LEAVE_TEAM: {
        const nextState = {...state};
        const data = action.data;
        Reflect.deleteProperty(nextState, data.id);
        return nextState;
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
            [data.team_id]: members
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
                [teamId]: members
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
                [data.team_id]: nextState
            };
        }

        return state;
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
            [stat.team_id]: stat
        };
    }
    case UserTypes.LOGOUT_SUCCESS:
        return {};
    default:
        return state;
    }
}

export default combineReducers({

    // the current selected team
    currentTeamId,

    // object where every key is the team id and has and object with the team detail
    teams,

    // object where every key is the team id and has and object with the team members detail
    myMembers,

    // object where every key is the team id and has an of members in the team where the key is user id
    membersInTeam,

    // object where every key is the team id and has an object with the team stats
    stats
});
