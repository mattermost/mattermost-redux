// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {PreferenceTypes} from 'action_types';

import {Client4} from 'client';

import {Preferences} from '../constants';

import {getMyPreferences as getMyPreferencesSelector, makeGetCategory} from 'selectors/entities/preferences';
import {getCurrentUserId} from 'selectors/entities/users';

import {GetStateFunc, DispatchFunc, ActionFunc} from 'types/actions';
import {PreferenceType, Theme} from 'types/preferences';

import {getPreferenceKey} from 'utils/preference_utils';

import {getChannelAndMyMember, getMyChannelMember} from './channels';
import {bindClientFunc} from './helpers';
import {getProfilesByIds, getProfilesInChannel} from './users';

export function deletePreferences(userId: string, preferences: PreferenceType[]): ActionFunc {
    return async (dispatch: DispatchFunc, getState: GetStateFunc) => {
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

export function getMyPreferences(): ActionFunc {
    return bindClientFunc({
        clientFunc: Client4.getMyPreferences,
        onSuccess: PreferenceTypes.RECEIVED_ALL_PREFERENCES,
    });
}

export function makeDirectChannelVisibleIfNecessary(otherUserId: string): ActionFunc {
    return async (dispatch: DispatchFunc, getState: GetStateFunc) => {
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
            savePreferences(currentUserId, [preference])(dispatch);
        }

        return {data: true};
    };
}

export function makeGroupMessageVisibleIfNecessary(channelId: string): ActionFunc {
    return async (dispatch: DispatchFunc, getState: GetStateFunc) => {
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
            savePreferences(currentUserId, [preference])(dispatch);
        }

        return {data: true};
    };
}

export function savePreferences(userId: string, preferences: PreferenceType[]) {
    return async (dispatch: DispatchFunc) => {
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

export function saveTheme(teamId: string, theme: Theme): ActionFunc {
    return async (dispatch: DispatchFunc, getState: GetStateFunc) => {
        const state = getState();
        const currentUserId = getCurrentUserId(state);
        const preference: PreferenceType = {
            user_id: currentUserId,
            category: Preferences.CATEGORY_THEME,
            name: teamId || '',
            value: JSON.stringify(theme),
        };

        await savePreferences(currentUserId, [preference])(dispatch);
        return {data: true};
    };
}

export function deleteTeamSpecificThemes(): ActionFunc {
    return async (dispatch: DispatchFunc, getState: GetStateFunc) => {
        const state = getState();

        const themePreferences: PreferenceType[] = makeGetCategory()(state, Preferences.CATEGORY_THEME);
        const currentUserId = getCurrentUserId(state);

        const toDelete = themePreferences.filter((pref) => pref.name !== '');
        if (toDelete.length > 0) {
            await deletePreferences(currentUserId, toDelete)(dispatch, getState);
        }

        return {data: true};
    };
}
