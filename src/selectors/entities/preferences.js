// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {createSelector} from 'reselect';

import {General, Preferences} from 'constants';

import {getConfig} from 'selectors/entities/general';
import {getCurrentTeamId} from 'selectors/entities/teams';

import {createShallowSelector} from 'utils/helpers';
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

export function getInt(state, category, name, defaultValue = 0) {
    const value = get(state, category, name, defaultValue);

    return parseInt(value, 10);
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

const getFavoritesCategory = makeGetCategory();

export function getFavoritesPreferences(state) {
    const favorites = getFavoritesCategory(state, Preferences.CATEGORY_FAVORITE_CHANNEL);
    return favorites.filter((f) => f.value === 'true').map((f) => f.name);
}

export const getVisibleTeammate = createSelector(
    getDirectShowPreferences,
    (direct) => {
        return direct.filter((dm) => dm.value === 'true' && dm.name).map((dm) => dm.name);
    }
);

export const getVisibleGroupIds = createSelector(
    getGroupShowPreferences,
    (groups) => {
        return groups.filter((dm) => dm.value === 'true' && dm.name).map((dm) => dm.name);
    }
);

export const getTeammateNameDisplaySetting = createSelector(
    getConfig,
    getMyPreferences,
    (config, preferences) => {
        const key = getPreferenceKey(Preferences.CATEGORY_DISPLAY_SETTINGS, Preferences.NAME_NAME_FORMAT);
        if (preferences[key]) {
            return preferences[key].value;
        } else if (config.TeammateNameDisplay) {
            return config.TeammateNameDisplay;
        }
        return General.TEAMMATE_NAME_DISPLAY.SHOW_USERNAME;
    }
);

const getThemePreference = createSelector(
    getMyPreferences,
    getCurrentTeamId,
    (myPreferences, currentTeamId) => {
        // Prefer the user's current team-specific theme over the user's current global theme
        let themePreference;

        if (currentTeamId) {
            themePreference = myPreferences[getPreferenceKey(Preferences.CATEGORY_THEME, currentTeamId)];
        }

        if (!themePreference) {
            themePreference = myPreferences[getPreferenceKey(Preferences.CATEGORY_THEME, '')];
        }

        return themePreference;
    }
);

const getDefaultTheme = createSelector(getConfig, (config) => {
    if (config.DefaultTheme) {
        const theme = Preferences.THEMES[config.DefaultTheme];
        if (theme) {
            return theme;
        }
    }

    // If no config.DefaultTheme or value doesn't refer to a valid theme name...
    return Preferences.THEMES.default;
});

export const getTheme = createShallowSelector(
    getThemePreference,
    getDefaultTheme,
    (themePreference, defaultTheme) => {
        let theme;
        if (themePreference) {
            theme = themePreference.value;
        } else {
            theme = defaultTheme;
        }

        if (typeof theme === 'string') {
            // A custom theme will be a JSON-serialized object stored in a preference
            theme = JSON.parse(theme);
        }

        // At this point, the theme should be a plain object

        // If this is a system theme, find it in case the user's theme is missing any fields
        if (theme.type && theme.type !== 'custom') {
            const match = Object.values(Preferences.THEMES).find((v) => v.type === theme.type);
            if (match) {
                if (!match.mentionBg) {
                    match.mentionBg = match.mentionBj;
                }

                return match;
            }
        }

        for (const key of Object.keys(defaultTheme)) {
            if (theme[key]) {
                // Fix a case where upper case theme colours are rendered as black
                theme[key] = theme[key].toLowerCase();
            }
        }

        // Backwards compatability with old name
        if (!theme.mentionBg) {
            theme.mentionBg = theme.mentionBj;
        }

        return Object.assign({}, defaultTheme, theme);
    }
);

export function makeGetStyleFromTheme() {
    return createSelector(
        getTheme,
        (state, getStyleFromTheme) => getStyleFromTheme,
        (theme, getStyleFromTheme) => {
            return getStyleFromTheme(theme);
        }
    );
}

const defaultSidebarPrefs = {
    grouping: 'by_type',
    unreads_at_top: 'true',
    favorite_at_top: 'true',
    sorting: 'alpha',
};

export const getSidebarPreferences = createSelector(
    (state) => {
        const config = getConfig(state);
        return config.ExperimentalGroupUnreadChannels !== General.DISABLED && getBool(
            state,
            Preferences.CATEGORY_SIDEBAR_SETTINGS,
            'show_unread_section',
            config.ExperimentalGroupUnreadChannels === General.DEFAULT_ON
        );
    },
    (state) => {
        return get(
            state,
            Preferences.CATEGORY_SIDEBAR_SETTINGS,
            '',
            null
        );
    },
    (showUnreadSection, sidebarPreference) => {
        let sidebarPrefs = JSON.parse(sidebarPreference);
        if (sidebarPrefs === null) {
            // Support unread settings for old implementation
            sidebarPrefs = {
                ...defaultSidebarPrefs,
                unreads_at_top: showUnreadSection ? 'true' : 'false',
            };
        }

        return sidebarPrefs;
    }
);
