// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import assert from 'assert';

import * as Actions from 'actions/alerts';
import {Alerts} from 'constants';
import configureStore from 'test/test_store';

describe('Actions.Alerts', () => {
    let store;

    beforeEach(async () => {
        store = await configureStore();
    });

    it('push and clear alerts', async () => {
        await Actions.pushNotificationAlert('alert message')(store.dispatch, store.getState);
        await Actions.pushErrorAlert('alert message')(store.dispatch, store.getState);
        await Actions.pushDeveloperAlert('alert message')(store.dispatch, store.getState);

        let state = store.getState();
        let alerts = state.entities.alerts.alertStack;
        assert.ok(alerts);
        assert.ok(alerts.length === 3);
        assert.ok(alerts[0].type === Alerts.ALERT_DEVELOPER);
        assert.ok(alerts[1].type === Alerts.ALERT_ERROR);
        assert.ok(alerts[2].type === Alerts.ALERT_NOTIFICATION);

        await Actions.clearLatestAlert()(store.dispatch, store.getState);

        state = store.getState();
        alerts = state.entities.alerts.alertStack;
        assert.ok(alerts.length === 2);
        assert.ok(alerts[0].type === Alerts.ALERT_ERROR);
        assert.ok(alerts[1].type === Alerts.ALERT_NOTIFICATION);

        await Actions.clearLatestAlert()(store.dispatch, store.getState);
        await Actions.clearLatestAlert()(store.dispatch, store.getState);

        state = store.getState();
        alerts = state.entities.alerts.alertStack;
        assert.ok(alerts.length === 0);
    });
});
