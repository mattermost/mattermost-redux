// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

export function getUserCurrentTimezone(userTimezone) {
    if (!userTimezone) {
        return null;
    }
    const {
        useAutomaticTimezone,
        automaticTimezone,
        manualTimezone,
    } = userTimezone;

    let useAutomatic = useAutomaticTimezone;
    if (typeof useAutomaticTimezone === 'string') {
        useAutomatic = useAutomaticTimezone === 'true';
    }

    if (useAutomatic) {
        return automaticTimezone;
    }
    return manualTimezone;
}

export function getTimezoneRegion(timezone) {
    if (timezone) {
        const split = timezone.split('/');
        if (split.length > 1) {
            return split.pop().replace(/_/g, ' ');
        }
    }

    return timezone;
}
