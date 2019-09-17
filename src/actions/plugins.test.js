// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import assert from 'assert';
import nock from 'nock';

import * as PluginActions from 'actions/plugins';
import {Client4} from 'client';

import TestHelper from 'test/test_helper';
import configureStore from 'test/test_store';

describe('Actions.Plugins', () => {
    let store;
    beforeAll(async () => {
        await TestHelper.initBasic(Client4);
    });

    beforeEach(async () => {
        store = await configureStore();
    });

    afterAll(async () => {
        await TestHelper.tearDown();
    });

    it('loadMarketplacePlugins', async () => {
        const marketplacePlugins = [TestHelper.fakeMarketplacePlugin(), TestHelper.fakeMarketplacePlugin()];
        nock(Client4.getPluginsMarketplaceRoute()).
            get('').
            query(true).
            reply(200, marketplacePlugins);

        await store.dispatch(PluginActions.getMarketplacePlugins());

        const state = store.getState();
        const marketplacePluginsResult = state.entities.plugins.marketplacePlugins;
        assert.equal(marketplacePlugins.length, Object.values(marketplacePluginsResult).length);
    });
});
