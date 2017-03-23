// Copyright (c) 2017 Mattermost, Inc. All Rights Reserved.
// See License.txt for license information.

import {batchActions} from 'redux-batched-actions';

import Client from 'client';
import {FilesTypes} from 'constants';
import {getLogErrorAction} from './errors';
import {forceLogoutIfNecessary} from './helpers';

export function getFilesForPost(teamId, channelId, postId) {
    return async (dispatch, getState) => {
        dispatch({type: FilesTypes.FETCH_FILES_FOR_POST_REQUEST}, getState);
        let files;

        try {
            files = await Client.getFileInfosForPost(teamId, channelId, postId);
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch);
            dispatch(batchActions([
                {type: FilesTypes.FETCH_FILES_FOR_POST_FAILURE, error},
                getLogErrorAction(error)
            ]), getState);
            return;
        }

        dispatch(batchActions([
            {
                type: FilesTypes.RECEIVED_FILES_FOR_POST,
                data: files,
                postId
            },
            {
                type: FilesTypes.FETCH_FILES_FOR_POST_SUCCESS
            }
        ]), getState);
    };
}

// The ClientId's that the server returns are passed in with the fileFormData arg.
export function uploadFile(teamId, channelId, fileFormData, formBoundary, rootId) {
    return async (dispatch, getState) => {
        dispatch({type: FilesTypes.UPLOAD_FILES_REQUEST}, getState);

        let files;
        try {
            files = await Client.uploadFile(teamId, channelId, fileFormData, formBoundary);
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch);
            dispatch(batchActions([
                {type: FilesTypes.UPLOAD_FILES_FAILURE, error},
                getLogErrorAction(error)
            ]), getState);
            return;
        }

        const data = files.file_infos.map((file, index) => {
            return {
                ...file,
                clientId: files.client_ids[index]
            };
        });

        dispatch(batchActions([
            {
                type: FilesTypes.RECEIVED_UPLOAD_FILES,
                data,
                channelId,
                rootId
            },
            {
                type: FilesTypes.UPLOAD_FILES_SUCCESS
            }
        ]), getState);
    };
}
