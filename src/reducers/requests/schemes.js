// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
// @flow

import {combineReducers} from 'redux';
import {SchemeTypes} from 'action_types';

import {handleRequest, initialRequestState} from './helpers';

import type {GenericAction} from 'types/actions';
import type {SchemesRequestsStatuses, RequestStatusType} from 'types/requests';

function getSchemes(state: RequestStatusType = initialRequestState(), action: GenericAction): RequestStatusType {
    return handleRequest(
        SchemeTypes.GET_SCHEMES_REQUEST,
        SchemeTypes.GET_SCHEMES_SUCCESS,
        SchemeTypes.GET_SCHEMES_FAILURE,
        state,
        action
    );
}

function getScheme(state: RequestStatusType = initialRequestState(), action: GenericAction): RequestStatusType {
    return handleRequest(
        SchemeTypes.GET_SCHEME_REQUEST,
        SchemeTypes.GET_SCHEME_SUCCESS,
        SchemeTypes.GET_SCHEME_FAILURE,
        state,
        action
    );
}

function createScheme(state: RequestStatusType = initialRequestState(), action: GenericAction): RequestStatusType {
    return handleRequest(
        SchemeTypes.CREATE_SCHEME_REQUEST,
        SchemeTypes.CREATE_SCHEME_SUCCESS,
        SchemeTypes.CREATE_SCHEME_FAILURE,
        state,
        action
    );
}

function deleteScheme(state: RequestStatusType = initialRequestState(), action: GenericAction): RequestStatusType {
    return handleRequest(
        SchemeTypes.DELETE_SCHEME_REQUEST,
        SchemeTypes.DELETE_SCHEME_SUCCESS,
        SchemeTypes.DELETE_SCHEME_FAILURE,
        state,
        action
    );
}

function patchScheme(state: RequestStatusType = initialRequestState(), action: GenericAction): RequestStatusType {
    return handleRequest(
        SchemeTypes.PATCH_SCHEME_REQUEST,
        SchemeTypes.PATCH_SCHEME_SUCCESS,
        SchemeTypes.PATCH_SCHEME_FAILURE,
        state,
        action
    );
}

function getSchemeTeams(state: RequestStatusType = initialRequestState(), action: GenericAction): RequestStatusType {
    return handleRequest(
        SchemeTypes.GET_SCHEME_TEAMS_REQUEST,
        SchemeTypes.GET_SCHEME_TEAMS_SUCCESS,
        SchemeTypes.GET_SCHEME_TEAMS_FAILURE,
        state,
        action
    );
}

function getSchemeChannels(state: RequestStatusType = initialRequestState(), action: GenericAction): RequestStatusType {
    return handleRequest(
        SchemeTypes.GET_SCHEME_CHANNELS_REQUEST,
        SchemeTypes.GET_SCHEME_CHANNELS_SUCCESS,
        SchemeTypes.GET_SCHEME_CHANNELS_FAILURE,
        state,
        action
    );
}

export default (combineReducers({
    getSchemes,
    getScheme,
    createScheme,
    deleteScheme,
    patchScheme,
    getSchemeTeams,
    getSchemeChannels,
}): (SchemesRequestsStatuses, GenericAction) => SchemesRequestsStatuses);
