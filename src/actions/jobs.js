// Copyright (c) 2017-present Mattermost, Inc. All Rights Reserved.
// See License.txt for license information.

import {JobTypes} from 'action_types';

import {Client4} from 'client';
import {General} from 'constants';

import {bindClientFunc} from './helpers';

export function createJob(job) {
    return bindClientFunc(
        Client4.createJob,
        JobTypes.CREATE_JOB_REQUEST,
        [JobTypes.RECEIVED_JOB, JobTypes.CREATE_JOB_SUCCESS],
        JobTypes.CREATE_JOB_FAILURE,
        job
    );
}

export function getJob(id) {
    return bindClientFunc(
        Client4.getJob,
        JobTypes.GET_JOB_REQUEST,
        [JobTypes.RECEIVED_JOB, JobTypes.GET_JOB_SUCCESS],
        JobTypes.GET_JOB_FAILURE,
        id
    );
}

export function getJobs(page = 0, perPage = General.JOBS_CHUNK_SIZE) {
    return bindClientFunc(
        Client4.getJobs,
        JobTypes.GET_JOBS_REQUEST,
        [JobTypes.RECEIVED_JOBS, JobTypes.GET_JOBS_SUCCESS],
        JobTypes.GET_JOBS_FAILURE,
        page,
        perPage
    );
}

export function getJobsByType(type, page = 0, perPage = General.JOBS_CHUNK_SIZE) {
    return bindClientFunc(
        Client4.getJobsByType,
        JobTypes.GET_JOBS_REQUEST,
        [JobTypes.RECEIVED_JOBS, JobTypes.RECEIVED_JOBS_BY_TYPE, JobTypes.GET_JOBS_SUCCESS],
        JobTypes.GET_JOBS_FAILURE,
        type,
        page,
        perPage
    );
}

export function cancelJob(job) {
    return bindClientFunc(
        Client4.cancelJob,
        JobTypes.CANCEL_JOB_REQUEST,
        JobTypes.CANCEL_JOB_SUCCESS,
        JobTypes.CANCEL_JOB_FAILURE,
        job
    );
}
