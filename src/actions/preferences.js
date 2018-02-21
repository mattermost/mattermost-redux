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
import {getChannelAndMyMember, getMyChannelMember} from './channels';

export function deletePreferences(userId, preferences) {
    return async (dispatch, getState) => {
        const state = getState();
        const myPreferences = getMyPreferencesSelector(state);
        const currentPreferences = preferences.map((pref) => myPreferences[getPreferenceKey(pref.category, pref.name)]);

        dispatch({
            type: PreferenceTypes.DELETED_PREFERENCES,
            data: preferences,
            meta: {
                offline: {
                    effect: () => Client4.deletePreferences(userId, preferences),
                    commit: {
                        type: PreferenceTypes.DELETED_PREFERENCES,
                    },
                    rollback: {
                        type: PreferenceTypes.RECEIVED_PREFERENCES,
                        data: currentPreferences,
                    },
                },
            },
        });

        return {data: true};
    };
}

export function getMyPreferences() {
    return bindClientFunc(
        Client4.getMyPreferences,
        PreferenceTypes.MY_PREFERENCES_REQUEST,
        [PreferenceTypes.RECEIVED_ALL_PREFERENCES, PreferenceTypes.MY_PREFERENCES_SUCCESS],
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
                value: 'true',
            };
            getProfilesByIds([otherUserId])(dispatch, getState);
            savePreferences(currentUserId, [preference])(dispatch, getState);
        }

        return {data: true};
    };
}

export function makeGroupMessageVisibleIfNecessary(channelId) {
    return async (dispatch, getState) => {
        const state = getState();
        const myPreferences = getMyPreferencesSelector(state);
        const currentUserId = getCurrentUserId(state);
        const {channels} = state.entities.channels;

        let preference = myPreferences[getPreferenceKey(Preferences.CATEGORY_GROUP_CHANNEL_SHOW, channelId)];

        if (!preference || preference.value === 'false') {
            preference = {
                user_id: currentUserId,
                category: Preferences.CATEGORY_GROUP_CHANNEL_SHOW,
                name: channelId,
                value: 'true',
            };

            if (channels[channelId]) {
                getMyChannelMember(channelId)(dispatch, getState);
            } else {
                getChannelAndMyMember(channelId)(dispatch, getState);
            }

            getProfilesInChannel(channelId, 0)(dispatch, getState);
            savePreferences(currentUserId, [preference])(dispatch, getState);
        }

        return {data: true};
    };
}

export function savePreferences(userId, preferences) {
    return async (dispatch) => {
        dispatch({
            type: PreferenceTypes.RECEIVED_PREFERENCES,
            data: preferences,
            meta: {
                offline: {
                    effect: () => Client4.savePreferences(userId, preferences),
                    commit: {
                        type: PreferenceTypes.RECEIVED_PREFERENCES,
                    },
                    rollback: {
                        type: PreferenceTypes.DELETED_PREFERENCES,
                        data: preferences,
                    },
                },
            },
        });

        return {data: true};
    };
}
