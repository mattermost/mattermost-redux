// Copyright (c) 2017 Mattermost, Inc. All Rights Reserved.
// See License.txt for license information.

import {combineReducers} from 'redux';
import {FileTypes} from 'action_types';

import {handleRequest, initialRequestState} from './helpers';

function getFilesForPost(state = initialRequestState(), action) {
    return handleRequest(
        FileTypes.FETCH_FILES_FOR_POST_REQUEST,
        FileTypes.FETCH_FILES_FOR_POST_SUCCESS,
        FileTypes.FETCH_FILES_FOR_POST_FAILURE,
        state,
        action
    );
}

export default combineReducers({
    getFilesForPost
});
