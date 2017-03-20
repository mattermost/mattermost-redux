// Copyright (c) 2016 Mattermost, Inc. All Rights Reserved.
// See License.txt for license information.

import assert from 'assert';

import configureStore from 'store';

import * as Actions from 'actions/general';
import {Client, Client4} from 'client';
import {RequestStatus} from 'constants';

import TestHelper from 'test/test_helper';

describe('Actions.General', () => {
    let store;
    before(async () => {
        await TestHelper.initBasic(Client, Client4);
    });

    beforeEach(() => {
        store = configureStore();
    });

    after(async () => {
        await TestHelper.basicClient.logout();
        await TestHelper.basicClient4.logout();
    });

    it('getPing - Invalid URL', async () => {
        const serverUrl = Client.getUrl();
        Client.setUrl('notarealurl');
        await Actions.getPing()(store.dispatch, store.getState);

        const {server} = store.getState().requests.general;
        assert.ok(server.status === RequestStatus.FAILURE && server.error);
        Client.setUrl(serverUrl);
    });

    it('getPing', async () => {
        await Actions.getPing()(store.dispatch, store.getState);

        const {server} = store.getState().requests.general;
        if (server.status === RequestStatus.FAILED) {
            throw new Error(JSON.stringify(server.error));
        }
    });

    it('getClientConfig', async () => {
        await Actions.getClientConfig()(store.dispatch, store.getState);

        const configRequest = store.getState().requests.general.config;
        if (configRequest.status === RequestStatus.FAILURE) {
            throw new Error(JSON.stringify(configRequest.error));
        }

        const clientConfig = store.getState().entities.general.config;

        // Check a few basic fields since they may change over time
        assert.ok(clientConfig.Version);
        assert.ok(clientConfig.BuildNumber);
        assert.ok(clientConfig.BuildDate);
        assert.ok(clientConfig.BuildHash);
    });

    it('getLicenseConfig', async () => {
        await Actions.getLicenseConfig()(store.dispatch, store.getState);

        const licenseRequest = store.getState().requests.general.license;
        if (licenseRequest.status === RequestStatus.FAILURE) {
            throw new Error(JSON.stringify(licenseRequest.error));
        }

        const licenseConfig = store.getState().entities.general.license;

        // Check a few basic fields since they may change over time
        assert.notStrictEqual(licenseConfig.IsLicensed, undefined);
    });

    it('setServerVersion', async () => {
        const version = '3.7.0';
        await Actions.setServerVersion(version)(store.dispatch, store.getState);

        const {serverVersion} = store.getState().entities.general;
        assert.deepEqual(serverVersion, version);
    });
});
