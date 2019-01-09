// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
// @flow

import {combineReducers} from 'redux';
import {PreferenceTypes} from 'action_types';

import {handleRequest, initialRequestState} from './helpers';

import type {GenericAction} from 'types/actions';
import type {PreferencesRequestsStatuses, RequestStatusType} from 'types/requests';

function getMyPreferences(state: RequestStatusType = initialRequestState(), action: GenericAction): RequestStatusType {
    return handleRequest(
        PreferenceTypes.MY_PREFERENCES_REQUEST,
        PreferenceTypes.MY_PREFERENCES_SUCCESS,
        PreferenceTypes.MY_PREFERENCES_FAILURE,
        state,
        action
    );
}

function savePreferences(state: RequestStatusType = initialRequestState(), action: GenericAction): RequestStatusType {
    return handleRequest(
        PreferenceTypes.SAVE_PREFERENCES_REQUEST,
        PreferenceTypes.SAVE_PREFERENCES_SUCCESS,
        PreferenceTypes.SAVE_PREFERENCES_FAILURE,
        state,
        action
    );
}

function deletePreferences(state: RequestStatusType = initialRequestState(), action: GenericAction): RequestStatusType {
    return handleRequest(
        PreferenceTypes.DELETE_PREFERENCES_REQUEST,
        PreferenceTypes.DELETE_PREFERENCES_SUCCESS,
        PreferenceTypes.DELETE_PREFERENCES_FAILURE,
        state,
        action
    );
}

export default (combineReducers({
    getMyPreferences,
    savePreferences,
    deletePreferences,
}): (PreferencesRequestsStatuses, GenericAction) => PreferencesRequestsStatuses);
