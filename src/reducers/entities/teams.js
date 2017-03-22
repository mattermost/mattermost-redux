// Copyright (c) 2016 Mattermost, Inc. All Rights Reserved.
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
    case TeamTypes.RECEIVED_MY_TEAM_MEMBERS: {
        const nextState = {};
        const members = action.data;
        for (const m of members) {
            nextState[m.team_id] = m;
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
        const members = new Set(state[data.team_id]);
        members.add(data.user_id);
        return {
            ...state,
            [data.team_id]: members
        };
    }
    case TeamTypes.RECEIVED_MEMBERS_IN_TEAM: {
        const data = action.data;
        if (data.length) {
            const teamId = data[0].team_id;
            const members = new Set(state[teamId]);
            for (const member of data) {
                members.add(member.user_id);
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
            const set = new Set(members);
            set.delete(data.user_id);
            return {
                ...state,
                [data.team_id]: set
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

    //object where every key is the team id and has and object with the team members detail
    myMembers,

    // object where every key is the team id and has a Set of user ids that are members in the team
    membersInTeam,

    // object where every key is the team id and has an object with the team stats
    stats
});
