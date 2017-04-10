// Copyright (c) 2016-present Mattermost, Inc. All Rights Reserved.
// See License.txt for license information.

import {batchActions} from 'redux-batched-actions';

import {Client4} from 'client';
import {Preferences} from 'constants';
import {PreferenceTypes} from 'action_types';
import {getMyPreferences as getMyPreferencesSelector} from 'selectors/entities/preferences';
import {getCurrentUserId} from 'selectors/entities/users';
import {getPreferenceKey} from 'utils/preference_utils';

import {bindClientFunc, forceLogoutIfNecessary} from './helpers';
import {getLogErrorAction} from './errors';
import {getProfilesByIds, getProfilesInChannel} from './users';

export function deletePreferences(userId, preferences) {
    return async (dispatch, getState) => {
        dispatch({type: PreferenceTypes.DELETE_PREFERENCES_REQUEST}, getState);

        try {
            await Client4.deletePreferences(userId, preferences);
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch);
            dispatch(batchActions([
                {type: PreferenceTypes.DELETE_PREFERENCES_FAILURE, error},
                getLogErrorAction(error)
            ]), getState);
            return;
        }

        dispatch(batchActions([
            {
                type: PreferenceTypes.DELETED_PREFERENCES,
                data: preferences
            },
            {
                type: PreferenceTypes.DELETE_PREFERENCES_SUCCESS
            }
        ]), getState);
    };
}

export function getMyPreferences() {
    return bindClientFunc(
        Client4.getMyPreferences,
        PreferenceTypes.MY_PREFERENCES_REQUEST,
        [PreferenceTypes.RECEIVED_PREFERENCES, PreferenceTypes.MY_PREFERENCES_SUCCESS],
        PreferenceTypes.MY_PREFERENCES_FAILURE
    );
}

export function makeDirectChannelVisibleIfNecessary(otherUserId) {
    return async (dispatch, getState) => {
        const state = getState();
        const myPreferences = getMyPreferencesSelector(state);
        const currentUserId = getCurrentUserId(state);

        let preference = myPreferences[getPreferenceKey(Preferences.CATEGORY_DIRECT_CHANNEL_SHOW, otherUserId)];

        if (!preference || preference.value === 'false') {
            preference = {
                user_id: currentUserId,
                category: Preferences.CATEGORY_DIRECT_CHANNEL_SHOW,
                name: otherUserId,
                value: 'true'
            };
            getProfilesByIds([otherUserId])(dispatch, getState);
            await savePreferences(currentUserId, [preference])(dispatch, getState);
        }
    };
}

export function makeGroupMessageVisibleIfNecessary(channelId) {
    return async (dispatch, getState) => {
        const state = getState();
        const myPreferences = getMyPreferencesSelector(state);
        const currentUserId = getCurrentUserId(state);

        let preference = myPreferences[getPreferenceKey(Preferences.CATEGORY_GROUP_CHANNEL_SHOW, channelId)];

        if (!preference || preference.value === 'false') {
            preference = {
                user_id: currentUserId,
                category: Preferences.CATEGORY_GROUP_CHANNEL_SHOW,
                name: channelId,
                value: 'true'
            };

            getProfilesInChannel(channelId, 0)(dispatch, getState);
            await savePreferences(currentUserId, [preference])(dispatch, getState);
        }
    };
}

export function savePreferences(userId, preferences) {
    return async (dispatch, getState) => {
        dispatch({type: PreferenceTypes.SAVE_PREFERENCES_REQUEST}, getState);

        try {
            await Client4.savePreferences(userId, preferences);
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch);
            dispatch(batchActions([
                {type: PreferenceTypes.SAVE_PREFERENCES_FAILURE, error},
                getLogErrorAction(error)
            ]), getState);
            return;
        }

        dispatch(batchActions([
            {
                type: PreferenceTypes.RECEIVED_PREFERENCES,
                data: preferences
            },
            {
                type: PreferenceTypes.SAVE_PREFERENCES_SUCCESS
            }
        ]), getState);
    };
}

