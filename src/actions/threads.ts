// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {ThreadTypes} from 'action_types';
import {Thread, ThreadList} from 'types/threads';
import ThreadConstants from 'constants/threads';
import {DispatchFunc, GetStateFunc, batchActions} from 'types/actions';
import {Client4} from 'client';
import {forceLogoutIfNecessary} from './helpers';
import {logError} from './errors';

export function receivedThread(thread: Thread) {
    return {
        type: ThreadTypes.RECEIVED_THREAD,
        data: thread,
    };
}

export function receivedThreads(threadList: ThreadList) {
    return {
        type: ThreadTypes.RECEIVED_THREADS,
        data: threadList,
    };
}

export function getThreads(userId: string, teamId: string, {page = 0, perPage = ThreadConstants.THREADS_CHUNK_SIZE} = {}) {
    return async (dispatch: DispatchFunc, getState: GetStateFunc) => {
        let threads;

        try {
            threads = await Client4.getThreads(userId, teamId, {page, perPage});
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch, getState);
            dispatch(logError(error));
            return {error};
        }

        dispatch(batchActions([
            receivedThreads(threads),
        ]));

        return {data: threads};
    };
}
