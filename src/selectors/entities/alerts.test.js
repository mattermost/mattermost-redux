// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import assert from 'assert';

import deepFreezeAndThrowOnMutation from 'utils/deep_freeze';
import * as Selectors from 'selectors/entities/alerts';
import {Alerts} from 'constants';

describe('Selectors.Alerts', () => {
    const alertStack = [
        {type: Alerts.ALERT_NOTIFICATION, message: '1'},
        {type: Alerts.ALERT_DEVELOPER, message: '2'},
        {type: Alerts.ALERT_ERROR, message: '3'},
        {type: Alerts.ALERT_ERROR, message: '4'},
        {type: Alerts.ALERT_DEVELOPER, message: '5'},
        {type: Alerts.ALERT_NOTIFICATION, message: '6'},
    ];

    const testState = deepFreezeAndThrowOnMutation({
        entities: {
            alerts: {
                alertStack,
            },
        },
    });

    it('should return all alerts', () => {
        assert.deepEqual(Selectors.getAlerts(testState), alertStack);
    });

    it('should return latest alert', () => {
        assert.deepEqual(Selectors.getLatestAlert(testState), alertStack[0]);
    });

    it('should return latest notification alert', () => {
        assert.deepEqual(Selectors.getLatestNotificationAlert(testState), alertStack[0]);
    });

    it('should return latest developer alert', () => {
        assert.deepEqual(Selectors.getLatestDeveloperAlert(testState), alertStack[1]);
    });

    it('should return latest error alert', () => {
        assert.deepEqual(Selectors.getLatestErrorAlert(testState), alertStack[2]);
    });
});

