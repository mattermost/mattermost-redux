// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
// @flow

import {combineReducers} from 'redux';
import {JobTypes} from 'action_types';

import type {JobType, Job} from '../../types/jobs';
import type {GenericAction} from '../../types/actions';

function jobs(state: {[string]: Job} = {}, action: GenericAction): {[string]: Job} {
    switch (action.type) {
    case JobTypes.RECEIVED_JOB: {
        const nextState = {...state};
        nextState[action.data.id] = action.data;
        return nextState;
    }
    case JobTypes.RECEIVED_JOBS: {
        const nextState = {...state};
        for (const job of action.data) {
            nextState[job.id] = job;
        }
        return nextState;
    }
    default:
        return state;
    }
}

function jobsByTypeList(state: {[JobType]: Array<Job>} = {}, action: GenericAction): {[JobType]: Array<Job>} {
    switch (action.type) {
    case JobTypes.RECEIVED_JOBS_BY_TYPE: {
        const nextState = {...state};
        if (action.data && action.data.length && action.data.length > 0) {
            nextState[action.data[0].type] = action.data;
        }
        return nextState;
    }
    default:
        return state;
    }
}

export default combineReducers({

    // object where every key is the job id and has an object with the job details
    jobs,

    // object where every key is a job type and contains a list of jobs.
    jobsByTypeList,

});
