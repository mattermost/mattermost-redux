// Copyright (c) 2016-present Mattermost, Inc. All Rights Reserved.
// See License.txt for license information.

import {combineReducers} from 'redux';
import {GeneralTypes} from 'action_types';

import {handleRequest, initialRequestState} from './helpers';

function server(state = initialRequestState(), action) {
    if (action.type === GeneralTypes.PING_RESET) {
        return initialRequestState();
    }

    return handleRequest(
        GeneralTypes.PING_REQUEST,
        GeneralTypes.PING_SUCCESS,
        GeneralTypes.PING_FAILURE,
        state,
        action
    );
}

function config(state = initialRequestState(), action) {
    return handleRequest(
        GeneralTypes.CLIENT_CONFIG_REQUEST,
        GeneralTypes.CLIENT_CONFIG_SUCCESS,
        GeneralTypes.CLIENT_CONFIG_FAILURE,
        state,
        action
    );
}

function dataRetentionPolicy(state = initialRequestState(), action) {
    return handleRequest(
        GeneralTypes.DATA_RETENTION_POLICY_REQUEST,
        GeneralTypes.DATA_RETENTION_POLICY_SUCCESS,
        GeneralTypes.DATA_RETENTION_POLICY_FAILURE,
        state,
        action
    );
}

function license(state = initialRequestState(), action) {
    return handleRequest(
        GeneralTypes.CLIENT_LICENSE_REQUEST,
        GeneralTypes.CLIENT_LICENSE_SUCCESS,
        GeneralTypes.CLIENT_LICENSE_FAILURE,
        state,
        action
    );
}

function websocket(state = initialRequestState(), action) {
    if (action.type === GeneralTypes.WEBSOCKET_CLOSED) {
        return initialRequestState();
    }

    return handleRequest(
        GeneralTypes.WEBSOCKET_REQUEST,
        GeneralTypes.WEBSOCKET_SUCCESS,
        GeneralTypes.WEBSOCKET_FAILURE,
        state,
        action
    );
}

export default combineReducers({
    server,
    config,
    dataRetentionPolicy,
    license,
    websocket
});
