// Copyright (c) 2016-present Mattermost, Inc. All Rights Reserved.
// See License.txt for license information.

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
