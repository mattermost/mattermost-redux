// Copyright (c) 2016-present Mattermost, Inc. All Rights Reserved.
// See License.txt for license information.

export function getUserTimezone(state, id) {
    const profile = state.entities.users.profiles[id];

    if (profile && profile.timezone) {
        return {
            ...profile.timezone,
            useAutomaticTimezone: profile.timezone.useAutomaticTimezone === 'true',
        };
    }

    return {
        useAutomaticTimezone: true,
        automaticTimezone: '',
        manualTimezone: '',
    };
}
