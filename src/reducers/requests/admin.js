// Copyright (c) 2017 Mattermost, Inc. All Rights Reserved.
// See License.txt for license information.

import {combineReducers} from 'redux';
import {AdminTypes} from 'action_types';

import {handleRequest, initialRequestState} from './helpers';

function getLogs(state = initialRequestState(), action) {
    return handleRequest(
        AdminTypes.GET_LOGS_REQUEST,
        AdminTypes.GET_LOGS_SUCCESS,
        AdminTypes.GET_LOGS_FAILURE,
        state,
        action
    );
}

function getAudits(state = initialRequestState(), action) {
    return handleRequest(
        AdminTypes.GET_AUDITS_REQUEST,
        AdminTypes.GET_AUDITS_SUCCESS,
        AdminTypes.GET_AUDITS_FAILURE,
        state,
        action
    );
}

function getConfig(state = initialRequestState(), action) {
    return handleRequest(
        AdminTypes.GET_CONFIG_REQUEST,
        AdminTypes.GET_CONFIG_SUCCESS,
        AdminTypes.GET_CONFIG_FAILURE,
        state,
        action
    );
}

function updateConfig(state = initialRequestState(), action) {
    return handleRequest(
        AdminTypes.UPDATE_CONFIG_REQUEST,
        AdminTypes.UPDATE_CONFIG_SUCCESS,
        AdminTypes.UPDATE_CONFIG_FAILURE,
        state,
        action
    );
}

export default combineReducers({
    getLogs,
    getAudits,
    getConfig,
    updateConfig
});

