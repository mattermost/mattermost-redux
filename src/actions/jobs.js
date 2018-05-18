// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
// @flow

import {JobTypes} from 'action_types';

import {Client4} from 'client';
import {General} from 'constants';

import {bindClientFunc} from './helpers';

import type {ActionFunc} from '../types/actions';
import type {JobType, Job} from '../types/jobs';

export function createJob(job: Job): ActionFunc {
    return bindClientFunc(
        Client4.createJob,
        JobTypes.CREATE_JOB_REQUEST,
        [JobTypes.RECEIVED_JOB, JobTypes.CREATE_JOB_SUCCESS],
        JobTypes.CREATE_JOB_FAILURE,
        job
    );
}

export function getJob(id: string): ActionFunc {
    return bindClientFunc(
        Client4.getJob,
        JobTypes.GET_JOB_REQUEST,
        [JobTypes.RECEIVED_JOB, JobTypes.GET_JOB_SUCCESS],
        JobTypes.GET_JOB_FAILURE,
        id
    );
}

export function getJobs(page: number = 0, perPage: number = General.JOBS_CHUNK_SIZE): ActionFunc {
    return bindClientFunc(
        Client4.getJobs,
        JobTypes.GET_JOBS_REQUEST,
        [JobTypes.RECEIVED_JOBS, JobTypes.GET_JOBS_SUCCESS],
        JobTypes.GET_JOBS_FAILURE,
        page,
        perPage
    );
}

export function getJobsByType(type: JobType, page: number = 0, perPage: number = General.JOBS_CHUNK_SIZE): ActionFunc {
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

export function cancelJob(job: string): ActionFunc {
    return bindClientFunc(
        Client4.cancelJob,
        JobTypes.CANCEL_JOB_REQUEST,
        JobTypes.CANCEL_JOB_SUCCESS,
        JobTypes.CANCEL_JOB_FAILURE,
        job
    );
}
