// Copyright (c) 2017 Mattermost, Inc. All Rights Reserved.
// See License.txt for license information.

import {combineReducers} from 'redux';
import {FilesTypes, RequestStatus} from 'constants';

import {handleRequest, initialRequestState} from './helpers';

function getFilesForPost(state = initialRequestState(), action) {
    return handleRequest(
        FilesTypes.FETCH_FILES_FOR_POST_REQUEST,
        FilesTypes.FETCH_FILES_FOR_POST_SUCCESS,
        FilesTypes.FETCH_FILES_FOR_POST_FAILURE,
        state,
        action
    );
}

export function handleUploadFilesRequest(REQUEST, SUCCESS, FAILURE, CANCEL, state, action) {
    switch (action.type) {
    case REQUEST:
        return {
            ...state,
            status: RequestStatus.STARTED
        };
    case SUCCESS:
        return {
            ...state,
            status: RequestStatus.SUCCESS,
            error: null
        };
    case FAILURE: {
        let error = action.error;

        if (error instanceof Error) {
            error = error.hasOwnProperty('intl') ? {...error} : error.toString();
        }

        return {
            ...state,
            status: RequestStatus.FAILURE,
            error
        };
    }
    case CANCEL:
        return {
            ...state,
            status: RequestStatus.CANCELLED,
            error: null
        };
    default:
        return state;
    }
}

function uploadFiles(state = initialRequestState(), action) {
    return handleUploadFilesRequest(
        FilesTypes.UPLOAD_FILES_REQUEST,
        FilesTypes.UPLOAD_FILES_SUCCESS,
        FilesTypes.UPLOAD_FILES_FAILURE,
        FilesTypes.UPLOAD_FILES_CANCEL,
        state,
        action
    );
}

export default combineReducers({
    getFilesForPost,
    uploadFiles
});
