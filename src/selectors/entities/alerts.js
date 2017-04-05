// Copyright (c) 2017 Mattermost, Inc. All Rights Reserved.
// See License.txt for license information.

import {createSelector} from 'reselect';
import {Alerts} from 'constants';

export function getAlerts(state) {
    return state.entities.alerts.alertStack;
}

export function getLatestAlert(state) {
    return state.entities.alerts.alertStack[0];
}

export const getLatestNotificationAlert = createSelector(
    getAlerts,
    (alerts) => {
        return alerts.find((a) => a.type === Alerts.ALERT_NOTIFICATION);
    }
);

export const getLatestDeveloperAlert = createSelector(
    getAlerts,
    (alerts) => {
        return alerts.find((a) => a.type === Alerts.ALERT_DEVELOPER);
    }
);

export const getLatestErrorAlert = createSelector(
    getAlerts,
    (alerts) => {
        return alerts.find((a) => a.type === Alerts.ALERT_ERROR);
    }
);

