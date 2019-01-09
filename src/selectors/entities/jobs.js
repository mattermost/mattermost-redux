// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
// @flow

import {createSelector} from 'reselect';

import type {GlobalState} from 'types/store';
import type {JobType, Job} from 'types/jobs';
import type {IDMappedObjects} from 'types/utilities';

export function getAllJobs(state: GlobalState): IDMappedObjects<Job> {
    return state.entities.jobs.jobs;
}

export function getJobsByType(state: GlobalState): {[JobType]: Array<Job>} {
    return state.entities.jobs.jobsByTypeList;
}

export function makeGetJobsByType(type: JobType): (state: GlobalState) => Array<Job> {
    return createSelector(
        getJobsByType,
        (jobsByType) => {
            return jobsByType[type] || [];
        }
    );
}
