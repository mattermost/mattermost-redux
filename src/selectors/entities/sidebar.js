// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {General, Preferences} from 'constants/index';
import {getConfig} from 'selectors/entities/general';
import {getBool as getBoolPreference, get as getPreference} from 'selectors/entities/preferences';

const defaultSidebarPrefs = {
    grouping: 'by_type',
    unreads_at_top: 'true',
    favorite_at_top: 'true',
    sorting: 'alpha',
};

export function getSidebarPreferences(state) {
    const config = getConfig(state);

    const showUnreadSection = config.ExperimentalGroupUnreadChannels !== General.DISABLED && getBoolPreference(
        state,
        Preferences.CATEGORY_SIDEBAR_SETTINGS,
        'show_unread_section',
        config.ExperimentalGroupUnreadChannels === General.DEFAULT_ON
    );

    let sidebarPrefs = JSON.parse(
        getPreference(
            state,
            Preferences.CATEGORY_SIDEBAR_SETTINGS,
            '',
            null
        )
    );

    if (sidebarPrefs === null) {
        // Support unread settings for old implementation
        sidebarPrefs = {
            ...defaultSidebarPrefs,
            unreads_at_top: showUnreadSection ? 'true' : 'false',
        };
    }

    return sidebarPrefs;
}
