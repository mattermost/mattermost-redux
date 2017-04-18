// Copyright (c) 2016-present Mattermost, Inc. All Rights Reserved.
// See License.txt for license information.

import {Client4} from 'client';
import {Preferences} from 'constants';
import {PreferenceTypes} from 'action_types';
import {getMyPreferences as getMyPreferencesSelector} from 'selectors/entities/preferences';
import {getCurrentUserId} from 'selectors/entities/users';
import {getPreferenceKey} from 'utils/preference_utils';

import {bindClientFunc} from './helpers';
import {getProfilesByIds, getProfilesInChannel} from './users';
import {getChannel} from './channels';

export function deletePreferences(preferences) {
    return async (dispatch) => {
        dispatch({
            type: PreferenceTypes.DELETE_PREFERENCES,
            data: preferences,
            meta: {
                offline: {
                    effect: () => Client4.deletePreferences(preferences),
                    commit: {
                        type: PreferenceTypes.DELETED_PREFERENCES,
                        data: preferences
                    }
                }
            }
        });
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

            if (!state.channels.channels[channelId]) {
                getChannel(channelId)(dispatch, getState);
            }

            getProfilesInChannel(channelId, 0)(dispatch, getState);
            await savePreferences(currentUserId, [preference])(dispatch, getState);
        }
    };
}

export function savePreferences(preferences) {
    return async (dispatch) => {
        dispatch({
            type: PreferenceTypes.SAVE_PREFERENCES,
            data: preferences,
            meta: {
                offline: {
                    effect: () => Client4.savePreferences(preferences),
                    commit: {
                        type: PreferenceTypes.RECEIVED_PREFERENCES,
                        data: preferences
                    }
                }
            }
        });
    };
}
