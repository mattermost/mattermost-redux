// Copyright (c) 2017 Mattermost, Inc. All Rights Reserved.
// See License.txt for license information.

import assert from 'assert';
import nock from 'nock';

import * as Actions from 'actions/admin';
import {Client, Client4} from 'client';
import configureStore from 'store';
import {RequestStatus} from 'constants';
import TestHelper from 'test/test_helper';

describe('Actions.Admin', () => {
    let store;
    before(async () => {
        await TestHelper.initBasic(Client, Client4);
    });

    beforeEach(() => {
        store = configureStore();
    });

    after(async () => {
        nock.restore();
        await TestHelper.basicClient.logout();
        await TestHelper.basicClient4.logout();
    });

    it('getLogs', async () => {
        nock(Client4.getBaseRoute()).
            get('/logs').
            query(true).
            reply(200, [
                '[2017/04/04 14:56:19 EDT] [INFO] Starting Server...',
                '[2017/04/04 14:56:19 EDT] [INFO] Server is listening on :8065',
                '[2017/04/04 15:01:48 EDT] [INFO] Stopping Server...',
                '[2017/04/04 15:01:48 EDT] [INFO] Closing SqlStore'
            ]);

        await Actions.getLogs()(store.dispatch, store.getState);

        const state = store.getState();
        const request = state.requests.admin.getLogs;
        if (request.status === RequestStatus.FAILURE) {
            throw new Error('getLogs request failed');
        }

        const logs = state.entities.admin.logs;
        assert.ok(logs);
        assert.ok(logs.length > 0);
    });

    it('getAudits', async () => {
        nock(Client4.getBaseRoute()).
            get('/audits').
            query(true).
            reply(200, [
                {
                    id: 'z6ghakhm5brsub66cjhz9yb9za',
                    create_at: 1491331476323,
                    user_id: 'ua7yqgjiq3dabc46ianp3yfgty',
                    action: '/api/v4/teams/o5pjxhkq8br8fj6xnidt7hm3ja',
                    extra_info: '',
                    ip_address: '127.0.0.1',
                    session_id: 'u3yb6bqe6fg15bu4stzyto8rgh'
                }
            ]);

        await Actions.getAudits()(store.dispatch, store.getState);

        const state = store.getState();
        const request = state.requests.admin.getAudits;
        if (request.status === RequestStatus.FAILURE) {
            throw new Error('getAudits request failed');
        }

        const audits = state.entities.admin.audits;
        assert.ok(audits);
        assert.ok(Object.keys(audits).length > 0);
    });

    it('getConfig', async () => {
        nock(Client4.getBaseRoute()).
            get('/config').
            reply(200, {
                ServiceSettings: {
                    SiteURL: 'http://localhost:8065'
                }
            });

        await Actions.getConfig()(store.dispatch, store.getState);

        const state = store.getState();
        const request = state.requests.admin.getConfig;
        if (request.status === RequestStatus.FAILURE) {
            throw new Error('getConfig request failed');
        }

        const config = state.entities.admin.config;
        assert.ok(config);
        assert.ok(config.ServiceSettings);
        assert.ok(config.ServiceSettings.SiteURL === 'http://localhost:8065');
    });

    it('updateConfig', async () => {
        const updated = {
            ServiceSettings: {
                SiteURL: 'http://localhost:8066'
            }
        };

        nock(Client4.getBaseRoute()).
            put('/config').
            reply(200, updated);

        await Actions.updateConfig(updated)(store.dispatch, store.getState);

        const state = store.getState();
        const request = state.requests.admin.getConfig;
        if (request.status === RequestStatus.FAILURE) {
            throw new Error('updateConfig request failed');
        }

        const config = state.entities.admin.config;
        assert.ok(config);
        assert.ok(config.ServiceSettings);
        assert.ok(config.ServiceSettings.SiteURL === updated.ServiceSettings.SiteURL);
    });
});

