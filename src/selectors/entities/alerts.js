// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
// @flow

import {createSelector} from 'reselect';

import {Alerts} from 'constants';

import type {AlertType} from 'types/alerts';
import type {GlobalState} from 'types/store';

export function getAlerts(state: GlobalState) {
    return state.entities.alerts.alertStack;
}

export function getLatestAlert(state: GlobalState) {
    return state.entities.alerts.alertStack[0];
}

export const getLatestNotificationAlert: (state: GlobalState) => ?AlertType = createSelector(
    getAlerts,
    (alerts) => {
        return alerts.find((a) => a.type === Alerts.ALERT_NOTIFICATION);
    }
);

export const getLatestDeveloperAlert: (state: GlobalState) => ?AlertType = createSelector(
    getAlerts,
    (alerts) => {
        return alerts.find((a) => a.type === Alerts.ALERT_DEVELOPER);
    }
);

export const getLatestErrorAlert: (state: GlobalState) => ?AlertType = createSelector(
    getAlerts,
    (alerts) => {
        return alerts.find((a) => a.type === Alerts.ALERT_ERROR);
    }
);

