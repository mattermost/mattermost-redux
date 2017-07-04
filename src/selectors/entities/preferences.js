// Copyright (c) 2016-present Mattermost, Inc. All Rights Reserved.
// See License.txt for license information.

import {createSelector} from 'reselect';

import {Preferences} from 'constants';

import {getConfig} from 'selectors/entities/general';

import {getPreferenceKey} from 'utils/preference_utils';

export function getMyPreferences(state) {
    return state.entities.preferences.myPreferences;
}

export function get(state, category, name, defaultValue = '') {
    const key = getPreferenceKey(category, name);
    const prefs = getMyPreferences(state);

    if (!(key in prefs)) {
        return defaultValue;
    }

    return prefs[key].value;
}

export function getBool(state, category, name, defaultValue = false) {
    const value = get(state, category, name, String(defaultValue));

    return value !== 'false';
}

export function makeGetCategory() {
    return createSelector(
        getMyPreferences,
        (state, category) => category,
        (preferences, category) => {
            const prefix = category + '--';
            const prefsInCategory = [];

            for (const key in preferences) {
                if (key.startsWith(prefix)) {
                    prefsInCategory.push(preferences[key]);
                }
            }

            return prefsInCategory;
        }
    );
}

const getDirectShowCategory = makeGetCategory();

export function getDirectShowPreferences(state) {
    return getDirectShowCategory(state, Preferences.CATEGORY_DIRECT_CHANNEL_SHOW);
}

const getGroupShowCategory = makeGetCategory();

export function getGroupShowPreferences(state) {
    return getGroupShowCategory(state, Preferences.CATEGORY_GROUP_CHANNEL_SHOW);
}

export const getTeammateNameDisplaySetting = createSelector(
    getConfig,
    getMyPreferences,
    (config, myPreferences) => {
        return config.TeammateNameDisplay || myPreferences[getPreferenceKey(Preferences.CATEGORY_DISPLAY_SETTINGS, Preferences.NAME_NAME_FORMAT)];
    }
);
