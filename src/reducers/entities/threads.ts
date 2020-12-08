// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {ThreadsState, UserThread} from 'types/threads';
import {GenericAction} from 'types/actions';
import {ThreadTypes} from 'action_types';

export default function threadsReducer(state: Partial<ThreadsState> = {}, action: GenericAction) {
    if (action.type === ThreadTypes.RECEIVED_THREADS) {
        const threads: ThreadsState['threads'] = {
            ...state.threads,
            ...action.data.threads.reduce((results: ThreadsState['threads'], thread: UserThread) => {
                results[thread.id] = thread;
                return results;
            }, {}),
        };

        const order = Object.keys(threads).sort((a, b) => threads[b].last_reply_at - threads[a].last_reply_at);

        return {
            ...state,
            threads,
            order,
        };
    }
    return state;
}
