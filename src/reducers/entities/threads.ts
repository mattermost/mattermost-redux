// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {UserThread, ThreadsState} from 'types/threads';
import {GenericAction} from 'types/actions';
import {ThreadTypes} from 'action_types';
import {combineReducers} from 'redux';
import {IDMappedObjects, RelationOneToMany} from 'types/utilities';
import {Team} from 'types/teams';

export default combineReducers({
    threads: (state: IDMappedObjects<UserThread> = {}, action: GenericAction) => {
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
    },
    threadsInTeam: (state: RelationOneToMany<Team, UserThread> = {}, action: GenericAction) => {
        if (action.type === ThreadTypes.RECEIVED_THREADS) {
            const nextSet = new Set(state[action.data.team_id]);

            action.data.threads.forEach((thread: UserThread) => {
                nextSet.add(thread.id);
            });

            return {
                ...state,
                [action.data.team_id]: {...nextSet},
            };
        }
        return state;
    },
    selectedThreadIdInTeam: (state: string|undefined, action: GenericAction) => {
        if (action.type === ThreadTypes.CHANGED_SELECTED_THREAD) {
            return action.data;
        }
        return state;
    },
    counts: (state: ThreadsState['counts'] = {}, action: GenericAction) => {
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
    },
});
