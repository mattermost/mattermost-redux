// Copyright (c) 2017 Mattermost, Inc. All Rights Reserved.
// See License.txt for license information.

import assert from 'assert';

import * as Actions from 'actions/integrations';
import {Client, Client4} from 'client';

import {RequestStatus} from 'constants';
import TestHelper from 'test/test_helper';
import configureStore from 'test/test_store';

describe('Actions.Integrations', () => {
    let store;
    before(async () => {
        await TestHelper.initBasic(Client, Client4);
    });

    beforeEach(async () => {
        store = await configureStore();
    });

    after(async () => {
        await TestHelper.basicClient.logout();
        await TestHelper.basicClient4.logout();
    });

    it('createIncomingHook', async () => {
        const created = await Actions.createIncomingHook(
            {
                channel_id: TestHelper.basicChannel.id,
                display_name: 'test',
                description: 'test'
            }
        )(store.dispatch, store.getState);

        const state = store.getState();
        const request = state.requests.integrations.createIncomingHook;
        if (request.status === RequestStatus.FAILURE) {
            throw new Error('createIncomingHook request failed');
        }

        const hooks = state.entities.integrations.incomingHooks;
        assert.ok(hooks);
        assert.ok(hooks[created.id]);
    });

    it('getIncomingWebhooks', async () => {
        const created = await Actions.createIncomingHook(
            {
                channel_id: TestHelper.basicChannel.id,
                display_name: 'test',
                description: 'test'
            }
        )(store.dispatch, store.getState);

        await Actions.getIncomingHooks(TestHelper.basicTeam.id)(store.dispatch, store.getState);

        const state = store.getState();
        const request = state.requests.integrations.getIncomingHooks;
        if (request.status === RequestStatus.FAILURE) {
            throw new Error('getIncomingHooks request failed');
        }

        const hooks = state.entities.integrations.incomingHooks;
        assert.ok(hooks);
        assert.ok(hooks[created.id]);
    });

    it('removeIncomingHook', async () => {
        const created = await Actions.createIncomingHook(
            {
                channel_id: TestHelper.basicChannel.id,
                display_name: 'test',
                description: 'test'
            }
        )(store.dispatch, store.getState);

        await Actions.removeIncomingHook(created.id)(store.dispatch, store.getState);

        const state = store.getState();
        const request = state.requests.integrations.deleteIncomingHook;
        if (request.status === RequestStatus.FAILURE) {
            throw new Error('removeIncomingHook request failed');
        }

        const hooks = state.entities.integrations.incomingHooks;
        assert.ok(!hooks[created.id]);
    });

    it('updateIncomingHook', async () => {
        const created = await Actions.createIncomingHook(
            {
                channel_id: TestHelper.basicChannel.id,
                display_name: 'test',
                description: 'test'
            }
        )(store.dispatch, store.getState);

        const updated = {...created};
        updated.display_name = 'test2';
        await Actions.updateIncomingHook(updated)(store.dispatch, store.getState);

        const state = store.getState();
        const request = state.requests.integrations.updateIncomingHook;
        if (request.status === RequestStatus.FAILURE) {
            throw new Error('updateIncomingHook request failed');
        }

        const hooks = state.entities.integrations.incomingHooks;
        assert.ok(hooks[created.id]);
        assert.ok(hooks[created.id].display_name === updated.display_name);
    });

    it('createOutgoingHook', async () => {
        const created = await Actions.createOutgoingHook(
            {
                channel_id: TestHelper.basicChannel.id,
                team_id: TestHelper.basicTeam.id,
                display_name: 'test',
                trigger_words: [TestHelper.generateId()],
                callback_urls: ['http://localhost/notarealendpoint']
            }
        )(store.dispatch, store.getState);

        const state = store.getState();
        const request = state.requests.integrations.createOutgoingHook;
        if (request.status === RequestStatus.FAILURE) {
            throw new Error('createOutgoingHook request failed');
        }

        const hooks = state.entities.integrations.outgoingHooks;
        assert.ok(hooks);
        assert.ok(hooks[created.id]);
    });

    it('getOutgoingWebhooks', async () => {
        const created = await Actions.createOutgoingHook(
            {
                channel_id: TestHelper.basicChannel.id,
                team_id: TestHelper.basicTeam.id,
                display_name: 'test',
                trigger_words: [TestHelper.generateId()],
                callback_urls: ['http://localhost/notarealendpoint']
            }
        )(store.dispatch, store.getState);

        await Actions.getOutgoingHooks(TestHelper.basicChannel.id)(store.dispatch, store.getState);

        const state = store.getState();
        const request = state.requests.integrations.getOutgoingHooks;
        if (request.status === RequestStatus.FAILURE) {
            throw new Error('getOutgoingHooks request failed');
        }

        const hooks = state.entities.integrations.outgoingHooks;
        assert.ok(hooks);
        assert.ok(hooks[created.id]);
    });

    it('removeOutgoingHook', async () => {
        const created = await Actions.createOutgoingHook(
            {
                channel_id: TestHelper.basicChannel.id,
                team_id: TestHelper.basicTeam.id,
                display_name: 'test',
                trigger_words: [TestHelper.generateId()],
                callback_urls: ['http://localhost/notarealendpoint']
            }
        )(store.dispatch, store.getState);

        await Actions.removeOutgoingHook(created.id)(store.dispatch, store.getState);

        const state = store.getState();
        const request = state.requests.integrations.deleteOutgoingHook;
        if (request.status === RequestStatus.FAILURE) {
            throw new Error('removeOutgoingHook request failed');
        }

        const hooks = state.entities.integrations.outgoingHooks;
        assert.ok(!hooks[created.id]);
    });

    it('updateOutgoingHook', async () => {
        const created = await Actions.createOutgoingHook(
            {
                channel_id: TestHelper.basicChannel.id,
                team_id: TestHelper.basicTeam.id,
                display_name: 'test',
                trigger_words: [TestHelper.generateId()],
                callback_urls: ['http://localhost/notarealendpoint']
            }
        )(store.dispatch, store.getState);

        const updated = {...created};
        updated.display_name = 'test2';
        await Actions.updateOutgoingHook(updated)(store.dispatch, store.getState);

        const state = store.getState();
        const request = state.requests.integrations.updateOutgoingHook;
        if (request.status === RequestStatus.FAILURE) {
            throw new Error('updateOutgoingHook request failed');
        }

        const hooks = state.entities.integrations.outgoingHooks;
        assert.ok(hooks[created.id]);
        assert.ok(hooks[created.id].display_name === updated.display_name);
    });
});
