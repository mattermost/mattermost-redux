// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import {combineReducers} from 'redux';
import {PreferenceTypes} from 'action_types';

import {GenericAction} from 'types/actions';
import {PreferencesRequestsStatuses, RequestStatusType} from 'types/requests';

import {handleRequest, initialRequestState} from './helpers';

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
}) as (b: PreferencesRequestsStatuses, a: GenericAction) => PreferencesRequestsStatuses);
