// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {ThreadTypes} from 'action_types';
import {Client4} from 'client';
import ThreadConstants from 'constants/threads';
import {DispatchFunc, GetStateFunc} from 'types/actions';
import {logError} from './errors';
import {forceLogoutIfNecessary} from './helpers';

export function getThreads(userId: string, teamId: string, {page = 0, perPage = ThreadConstants.THREADS_CHUNK_SIZE} = {}) {
    return async (dispatch: DispatchFunc, getState: GetStateFunc) => {
        let threads;

        try {
            threads = await Client4.getUserThreads(userId, teamId, page, perPage);
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch, getState);
            dispatch(logError(error));
            return {error};
        }

        dispatch({
            type: ThreadTypes.RECEIVED_THREADS,
            data: {threads, team_id: teamId},
        });

        return {data: threads};
    };
}

export function markThreadsRead(userId: string, teamId: string) {
    return async (dispatch: DispatchFunc, getState: GetStateFunc) => {
        try {
            await Client4.updateThreadsReadForUser(userId, teamId);
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch, getState);
            dispatch(logError(error));
            return {error};
        }

        dispatch({
            type: ThreadTypes.THREADS_READ,
            data: {
                team_id: teamId,
            },
        });

        return {};
    };
}

export function updateThreadRead(userId: string, teamId: string, threadId: string, timestamp: number) {
    return async (dispatch: DispatchFunc, getState: GetStateFunc) => {
        try {
            await Client4.updateThreadReadForUser(userId, teamId, threadId, timestamp);
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch, getState);
            dispatch(logError(error));
            return {error};
        }

        dispatch({
            type: ThreadTypes.READ_CHANGED_THREAD,
            data: {
                id: threadId,
                team_id: teamId,
                timestamp,
            },
        });

        return {};
    };
}

export function setSelectedThreadId(userId: string, teamId: string, threadId: string|undefined) {
    return async (dispatch: DispatchFunc) => {
        dispatch({
            type: ThreadTypes.CHANGED_SELECTED_THREAD,
            data: {
                id: threadId,
                team_id: teamId,
            },
        });
    };
}

export function setThreadFollow(userId: string, teamId: string, threadId: string, newState: boolean) {
    return async (dispatch: DispatchFunc, getState: GetStateFunc) => {
        try {
            await Client4.updateThreadFollowForUser(userId, teamId, threadId, newState);
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch, getState);
            dispatch(logError(error));
            return {error};
        }

        dispatch({
            type: ThreadTypes.FOLLOW_CHANGED_THREAD,
            data: {
                id: threadId,
                team_id: teamId,
                following: newState,
            },
        });

        return {};
    };
}
