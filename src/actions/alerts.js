// Copyright (c) 2017-present Mattermost, Inc. All Rights Reserved.
// See License.txt for license information.

import {AlertTypes} from 'action_types';
import {Alerts} from 'constants';

export function pushNotificationAlert(message) {
    return async (dispatch, getState) => {
        const notificationAlert = {
            type: Alerts.ALERT_NOTIFICATION,
            message
        };

        dispatch({type: AlertTypes.PUSH_ALERT, data: notificationAlert}, getState);

        return {data: true};
    };
}

export function pushDeveloperAlert(message) {
    return async (dispatch, getState) => {
        const developerAlert = {
            type: Alerts.ALERT_DEVELOPER,
            message
        };

        dispatch({type: AlertTypes.PUSH_ALERT, data: developerAlert}, getState);

        return {data: true};
    };
}

export function pushErrorAlert(message) {
    return async (dispatch, getState) => {
        const errorAlert = {
            type: Alerts.ALERT_ERROR,
            message
        };

        dispatch({type: AlertTypes.PUSH_ALERT, data: errorAlert}, getState);

        return {data: true};
    };
}

export function clearLatestAlert() {
    return async (dispatch, getState) => {
        dispatch({type: AlertTypes.CLEAR_ALERT}, getState);

        return {data: true};
    };
}

