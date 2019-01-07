// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
// @flow

import {combineReducers} from 'redux';
import {GeneralTypes} from 'action_types';

import {handleRequest, initialRequestState} from './helpers';

import type {GenericAction} from 'types/actions';
import type {GeneralRequestsStatuses, RequestStatusType} from 'types/requests';

function server(state: RequestStatusType = initialRequestState(), action: GenericAction): RequestStatusType {
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

function config(state: RequestStatusType = initialRequestState(), action: GenericAction): RequestStatusType {
    return handleRequest(
        GeneralTypes.CLIENT_CONFIG_REQUEST,
        GeneralTypes.CLIENT_CONFIG_SUCCESS,
        GeneralTypes.CLIENT_CONFIG_FAILURE,
        state,
        action
    );
}

function dataRetentionPolicy(state: RequestStatusType = initialRequestState(), action: GenericAction): RequestStatusType {
    return handleRequest(
        GeneralTypes.DATA_RETENTION_POLICY_REQUEST,
        GeneralTypes.DATA_RETENTION_POLICY_SUCCESS,
        GeneralTypes.DATA_RETENTION_POLICY_FAILURE,
        state,
        action
    );
}

function license(state: RequestStatusType = initialRequestState(), action: GenericAction): RequestStatusType {
    return handleRequest(
        GeneralTypes.CLIENT_LICENSE_REQUEST,
        GeneralTypes.CLIENT_LICENSE_SUCCESS,
        GeneralTypes.CLIENT_LICENSE_FAILURE,
        state,
        action
    );
}

function websocket(state: RequestStatusType = initialRequestState(), action: GenericAction): RequestStatusType {
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

function redirectLocation(state: RequestStatusType = initialRequestState(), action: GenericAction): RequestStatusType {
    return handleRequest(
        GeneralTypes.REDIRECT_LOCATION_REQUEST,
        GeneralTypes.REDIRECT_LOCATION_SUCCESS,
        GeneralTypes.REDIRECT_LOCATION_FAILURE,
        state,
        action
    );
}

export default (combineReducers({
    server,
    config,
    dataRetentionPolicy,
    license,
    websocket,
    redirectLocation,
}): (GeneralRequestsStatuses, GenericAction) => GeneralRequestsStatuses);
