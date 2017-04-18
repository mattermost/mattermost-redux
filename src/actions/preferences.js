// Copyright (c) 2016 Mattermost, Inc. All Rights Reserved.
// See License.txt for license information.

import Client from 'client';
import {Preferences, PreferencesTypes} from 'constants';
import {getMyPreferences as getMyPreferencesSelector} from 'selectors/entities/preferences';
import {getCurrentTeamId} from 'selectors/entities/teams';
import {getCurrentUserId} from 'selectors/entities/users';
import {getPreferenceKey} from 'utils/preference_utils';

import {bindClientFunc} from './helpers';
import {getProfilesByIds, getProfilesInChannel} from './users';
import {getChannel} from './channels';

export function deletePreferences(preferences) {
    return async (dispatch, getState) => {
        const state = getState();
        const myPreferences = getMyPreferencesSelector(state);
        const currentPreferences = preferences.map((pref) => myPreferences[getPreferenceKey(pref.category, pref.name)]);

        dispatch({
            type: PreferencesTypes.DELETED_PREFERENCES,
            data: preferences,
            meta: {
                offline: {
                    effect: () => Client.deletePreferences(preferences),
                    commit: {
                        type: PreferencesTypes.DELETED_PREFERENCES
                    },
                    rollback: {
                        type: PreferencesTypes.RECEIVED_PREFERENCES,
                        data: currentPreferences
                    }
                }
            }
        });
    };
}

export function getMyPreferences() {
    return bindClientFunc(
        Client.getMyPreferences,
        PreferencesTypes.MY_PREFERENCES_REQUEST,
        [PreferencesTypes.RECEIVED_PREFERENCES, PreferencesTypes.MY_PREFERENCES_SUCCESS],
        PreferencesTypes.MY_PREFERENCES_FAILURE
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
            await savePreferences([preference])(dispatch, getState);
        }
    };
}

export function makeGroupMessageVisibleIfNecessary(channelId) {
    return async (dispatch, getState) => {
        const state = getState();
        const myPreferences = getMyPreferencesSelector(state);
        const currentTeamId = getCurrentTeamId(state);
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
                getChannel(currentTeamId, channelId)(dispatch, getState);
            }

            getProfilesInChannel(currentTeamId, channelId, 0)(dispatch, getState);
            await savePreferences([preference])(dispatch, getState);
        }
    };
}

export function savePreferences(preferences) {
    return async (dispatch) => {
        dispatch({
            type: PreferencesTypes.RECEIVED_PREFERENCES,
            data: preferences,
            meta: {
                offline: {
                    effect: () => Client.savePreferences(preferences),
                    commit: {
                        type: PreferencesTypes.RECEIVED_PREFERENCES
                    },
                    rollback: {
                        type: PreferencesTypes.DELETED_PREFERENCES,
                        data: preferences
                    }
                }
            }
        });
    };
}
