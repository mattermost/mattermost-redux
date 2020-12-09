// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {ThreadTypes} from 'action_types';
import {combineReducers} from 'redux';
import {GenericAction} from 'types/actions';
import {Team} from 'types/teams';
import {ThreadsState, UserThread} from 'types/threads';
import {IDMappedObjects, RelationOneToMany} from 'types/utilities';

export const threadsReducer = (state: IDMappedObjects<UserThread> = {}, action: GenericAction) => {
    if (action.type === ThreadTypes.RECEIVED_THREADS) {
        return {
            ...state,
            ...action.data.threads.reduce((results: IDMappedObjects<UserThread>, thread: UserThread) => {
                results[thread.id] = thread;
                return results;
            }, {}),
        };
    }
    return state;
};

export const threadsInTeamReducer = (state: RelationOneToMany<Team, UserThread> = {}, action: GenericAction) => {
    if (action.type === ThreadTypes.RECEIVED_THREADS) {
        const nextSet = new Set(state[action.data.team_id]);

        action.data.threads.forEach((thread: UserThread) => {
            nextSet.add(thread.id);
        });

        return {
            ...state,
            [action.data.team_id]: [...nextSet],
        };
    }
    return state;
};

export const selectedThreadIdInTeamReducer = (state: string | null = null, action: GenericAction) => {
    if (action.type === ThreadTypes.CHANGED_SELECTED_THREAD) {
        return action.data;
    }
    return state;
};

export const countsReducer = (state: ThreadsState['counts'] = {}, action: GenericAction) => {
    if (action.type === ThreadTypes.RECEIVED_THREADS) {
        return {
            ...state,
            [action.data.team_id]: {
                total: action.data.total,
                total_unread_replies: action.data.total_unread_replies,
                total_unread_mentions: action.data.total,
            },
        };
    }
    return state;
};

export default combineReducers({
    threads: threadsReducer,
    threadsInTeam: threadsInTeamReducer,
    selectedThreadIdInTeam: selectedThreadIdInTeamReducer,
    counts: countsReducer,
});
