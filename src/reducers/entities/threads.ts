// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {TeamTypes, ThreadTypes, UserTypes} from 'action_types';
import {combineReducers} from 'redux';
import {GenericAction} from 'types/actions';
import {Team} from 'types/teams';
import {ThreadsState, UserThread} from 'types/threads';
import {IDMappedObjects} from 'types/utilities';

export const threadsReducer = (state: ThreadsState['threads'] = {}, action: GenericAction) => {
    switch (action.type) {
    case ThreadTypes.RECEIVED_THREADS: {
        const {threads} = action.data;
        return {
            ...state,
            ...threads.reduce((results: IDMappedObjects<UserThread>, thread: UserThread) => {
                results[thread.id] = thread;
                return results;
            }, {}),
        };
    }
    case ThreadTypes.FOLLOW_CHANGED_THREAD: {
        const {id, following} = action.data;
        return {
            ...state,
            [id]: {...(state[id] || {}), is_following: following},
        };
    }
    case UserTypes.LOGOUT_SUCCESS:
        return {};
    }
    return state;
};

export const threadsInTeamReducer = (state: ThreadsState['threadsInTeam'] = {}, action: GenericAction) => {
    switch (action.type) {
    case ThreadTypes.RECEIVED_THREADS: {
        const nextSet = new Set(state[action.data.team_id]);

        action.data.threads.forEach((thread: UserThread) => {
            nextSet.add(thread.id);
        });

        return {
            ...state,
            [action.data.team_id]: [...nextSet],
        };
    }
    case TeamTypes.LEAVE_TEAM: {
        const team: Team = action.data;

        if (!state[team.id]) {
            return state;
        }

        const nextState = {...state};
        Reflect.deleteProperty(nextState, team.id);

        return nextState;
    }
    case UserTypes.LOGOUT_SUCCESS:
        return {};
    }
    return state;
};
export const countsReducer = (state: ThreadsState['counts'] = {}, action: GenericAction) => {
    switch (action.type) {
    case ThreadTypes.RECEIVED_THREADS: {
        return {
            ...state,
            [action.data.team_id]: {
                total: action.data.total,
                total_unread_replies: action.data.total_unread_replies,
                total_unread_mentions: action.data.total_unread_mentions,
            },
        };
    }
    case TeamTypes.LEAVE_TEAM: {
        const team: Team = action.data;

        if (!state[team.id]) {
            return state;
        }

        const nextState = {...state};
        Reflect.deleteProperty(nextState, team.id);

        return nextState;
    }

    case UserTypes.LOGOUT_SUCCESS:
        return {
            total_unread_replies: 0,
            total: 0,
            total_unread_mentions: 0,
        };
    }
    return state;
};

export default combineReducers({
    threads: threadsReducer,
    threadsInTeam: threadsInTeamReducer,
    counts: countsReducer,
});
