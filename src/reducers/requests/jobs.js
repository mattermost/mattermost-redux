// Copyright (c) 2017-present Mattermost, Inc. All Rights Reserved.
// See License.txt for license information.

import {combineReducers} from 'redux';
import {JobTypes} from 'action_types';

import {handleRequest, initialRequestState} from './helpers';

function createJob(state = initialRequestState(), action) {
    return handleRequest(
        JobTypes.CREATE_JOB_REQUEST,
        JobTypes.CREATE_JOB_SUCCESS,
        JobTypes.CREATE_JOB_FAILURE,
        state,
        action
    );
}

function getJob(state = initialRequestState(), action) {
    return handleRequest(
        JobTypes.GET_JOB_REQUEST,
        JobTypes.GET_JOB_SUCCESS,
        JobTypes.GET_JOB_FAILURE,
        state,
        action
    );
}

function getJobs(state = initialRequestState(), action) {
    return handleRequest(
        JobTypes.GET_JOBS_REQUEST,
        JobTypes.GET_JOBS_SUCCESS,
        JobTypes.GET_JOBS_FAILURE,
        state,
        action
    );
}

function cancelJob(state = initialRequestState(), action) {
    return handleRequest(
        JobTypes.CANCEL_JOB_REQUEST,
        JobTypes.CANCEL_JOB_SUCCESS,
        JobTypes.CANCEL_JOB_FAILURE,
        state,
        action
    );
}

export default combineReducers({
    createJob,
    getJob,
    getJobs,
    cancelJob,
});

