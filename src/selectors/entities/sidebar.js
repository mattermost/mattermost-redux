// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {createSelector} from 'reselect';

import {General, Preferences} from 'constants/index';
import {getConfig} from 'selectors/entities/general';
import {getBool as getBoolPreference, get as getPreference} from 'selectors/entities/preferences';

const defaultSidebarPrefs = {
    grouping: 'by_type',
    unreads_at_top: 'true',
    favorite_at_top: 'true',
    sorting: 'alpha',
};

export const getSidebarPreferences = createSelector(
    (state) => {
        const config = getConfig(state);
        return config.ExperimentalGroupUnreadChannels !== General.DISABLED && getBoolPreference(
            state,
            Preferences.CATEGORY_SIDEBAR_SETTINGS,
            'show_unread_section',
            config.ExperimentalGroupUnreadChannels === General.DEFAULT_ON
        );
    },
    (state) => {
        const sidebarPreference = getPreference(
            state,
            Preferences.CATEGORY_SIDEBAR_SETTINGS,
            '',
            null
        );
        return JSON.parse(sidebarPreference);
    },
    (showUnreadSection, sidebarPreference) => {
        let sidebarPrefs = sidebarPreference;
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
