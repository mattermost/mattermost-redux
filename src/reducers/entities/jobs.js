// Copyright (c) 2017-present Mattermost, Inc. All Rights Reserved.
// See License.txt for license information.

import {combineReducers} from 'redux';
import {JobTypes} from 'action_types';

function jobs(state = {}, action) {
    const nextState = {...state};

    switch (action.type) {
    case JobTypes.RECEIVED_JOB: {
        nextState[action.data.id] = action.data;
        return nextState;
    }
    case JobTypes.RECEIVED_JOBS: {
        for (const job of action.data) {
            nextState[job.id] = job;
        }
        return nextState;
    }
    default:
        return state;
    }
}

function jobsByTypeList(state = {}, action) {
    const nextState = {...state};

    switch (action.type) {
    case JobTypes.RECEIVED_JOBS_BY_TYPE: {
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
    jobsByTypeList

});
