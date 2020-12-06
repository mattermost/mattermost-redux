// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {combineReducers} from 'redux';
import {ThreadTypes} from 'action_types';
import {GenericAction} from 'types/actions';
import {Dictionary} from 'types/utilities';
import {ThreadsResponse} from 'types/posts';

function myThreads(state: Dictionary<ThreadsResponse> = {}, action: GenericAction) {
    switch (action.type) {
    case ThreadTypes.RECEIVED_USER_THREADS: {
        const nextState = {...state};

        if (action.data) {
            for (const thread of action.data.threads) {
                nextState[thread.id] = thread;
            }
        }

        return nextState;
    }
    default:
        return state;
    }
}

export default combineReducers({

    // object where the key is the root post id
    myThreads,
});
