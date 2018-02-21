// Copyright (c) 2016-present Mattermost, Inc. All Rights Reserved.
// See License.txt for license information.

import {combineReducers} from 'redux';
import {PreferenceTypes} from 'action_types';

import {handleRequest, initialRequestState} from './helpers';

function getMyPreferences(state = initialRequestState(), action) {
    return handleRequest(
        PreferenceTypes.MY_PREFERENCES_REQUEST,
        PreferenceTypes.MY_PREFERENCES_SUCCESS,
        PreferenceTypes.MY_PREFERENCES_FAILURE,
        state,
        action
    );
}

function savePreferences(state = initialRequestState(), action) {
    return handleRequest(
        PreferenceTypes.SAVE_PREFERENCES_REQUEST,
        PreferenceTypes.SAVE_PREFERENCES_SUCCESS,
        PreferenceTypes.SAVE_PREFERENCES_FAILURE,
        state,
        action
    );
}

function deletePreferences(state = initialRequestState(), action) {
    return handleRequest(
        PreferenceTypes.DELETE_PREFERENCES_REQUEST,
        PreferenceTypes.DELETE_PREFERENCES_SUCCESS,
        PreferenceTypes.DELETE_PREFERENCES_FAILURE,
        state,
        action
    );
}

export default combineReducers({
    getMyPreferences,
    savePreferences,
    deletePreferences,
});
