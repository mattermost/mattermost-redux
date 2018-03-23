// Copyright (c) 2017-present Mattermost, Inc. All Rights Reserved.
// See License.txt for license information.

import {getCurrentUser} from 'selectors/entities/users';
import {getUserTimezone} from 'selectors/entities/timezone';
import {updateMe} from 'actions/users';

export function autoUpdateTimezone(deviceTimezone) {
    return async (dispatch, getState) => {
        const currentUer = getCurrentUser(getState());
        const currentTimezone = getUserTimezone(getState(), currentUer.id);
        const newTimezoneExists = currentTimezone.automaticTimezone !== deviceTimezone;

        if (currentTimezone.useAutomaticTimezone && newTimezoneExists) {
            const timezone = {
                useAutomaticTimezone: 'true',
                automaticTimezone: deviceTimezone,
                manualTimezone: currentTimezone.manualTimezone,
            };

            const updatedUser = {
                ...currentUer,
                timezone,
            };

            updateMe(updatedUser)(dispatch, getState);
        }
    };
}
