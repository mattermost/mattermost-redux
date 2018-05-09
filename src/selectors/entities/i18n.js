// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {getCurrentUser} from 'selectors/entities/common';

import {DEFAULT_LOCALE} from 'constants/general';

export function getCurrentUserLocale(state, defaultLocale = DEFAULT_LOCALE) {
    const currentUser = getCurrentUser(state);

    if (!currentUser) {
        return defaultLocale;
    }

    return currentUser.locale || defaultLocale;
}
