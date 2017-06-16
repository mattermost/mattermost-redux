// Copyright (c) 2017 Mattermost, Inc. All Rights Reserved.
// See License.txt for license information.

import assert from 'assert';

import * as Actions from 'actions/integrations';
import * as TeamsActions from 'actions/teams';
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

    it('regenOutgoingHookToken', async () => {
        const created = await Actions.createOutgoingHook(
            {
                channel_id: TestHelper.basicChannel.id,
                team_id: TestHelper.basicTeam.id,
                display_name: 'test',
                trigger_words: [TestHelper.generateId()],
                callback_urls: ['http://localhost/notarealendpoint']
            }
        )(store.dispatch, store.getState);

        await Actions.regenOutgoingHookToken(created.id)(store.dispatch, store.getState);

        const state = store.getState();
        const request = state.requests.integrations.updateOutgoingHook;
        if (request.status === RequestStatus.FAILURE) {
            throw new Error('regenOutgoingHookToken request failed');
        }

        const hooks = state.entities.integrations.outgoingHooks;
        assert.ok(hooks[created.id]);
        assert.ok(hooks[created.id].token !== created.token);
    });

    it('getCustomTeamCommands', async () => {
        const team = await TeamsActions.createTeam(
            TestHelper.fakeTeam()
        )(store.dispatch, store.getState);

        await Actions.getCustomTeamCommands(
            team.id
        )(store.dispatch, store.getState);

        const noCommands = store.getState().entities.integrations.commands;
        assert.equal(Object.keys(noCommands).length, 0);

        const created = await Actions.addCommand(
            team.id,
            TestHelper.testCommand()
        )(store.dispatch, store.getState);

        await Actions.getCustomTeamCommands(
            team.id
        )(store.dispatch, store.getState);

        const request = store.getState().requests.integrations.getCustomTeamCommands;
        if (request.status === RequestStatus.FAILURE) {
            throw new Error(JSON.stringify(request.error));
        }

        const {commands} = store.getState().entities.integrations;
        assert.ok(commands[created.id]);
        assert.equal(Object.keys(commands).length, 1);
        const actual = commands[created.id];
        const expected = created;
        assert.equal(JSON.stringify(actual), JSON.stringify(expected));
    });

    it('addCommand', async () => {
        const team = await TeamsActions.createTeam(
          TestHelper.fakeTeam()
        )(store.dispatch, store.getState);

        const expected = TestHelper.testCommand();

        const created = await Actions.addCommand(team.id, expected)(store.dispatch, store.getState);

        const request = store.getState().requests.integrations.addCommand;
        if (request.status === RequestStatus.FAILURE) {
            throw new Error(JSON.stringify(request.error));
        }

        const {commands} = store.getState().entities.integrations;
        assert.ok(commands[created.id]);
        const actual = commands[created.id];

        assert.ok(actual.token);
        assert.equal(actual.create_at, actual.update_at);
        assert.equal(actual.delete_at, 0);
        assert.ok(actual.creator_id);
        assert.equal(actual.team_id, team.id);
        assert.equal(actual.trigger, expected.trigger);
        assert.equal(actual.method, expected.method);
        assert.equal(actual.username, expected.username);
        assert.equal(actual.icon_url, expected.icon_url);
        assert.equal(actual.auto_complete, expected.auto_complete);
        assert.equal(actual.auto_complete_desc, expected.auto_complete_desc);
        assert.equal(actual.auto_complete_hint, expected.auto_complete_hint);
        assert.equal(actual.display_name, expected.display_name);
        assert.equal(actual.description, expected.description);
        assert.equal(actual.url, expected.url);
    });

    it('regenCommandToken', async () => {
        const team = await TeamsActions.createTeam(
          TestHelper.fakeTeam()
        )(store.dispatch, store.getState);

        const created = await Actions.addCommand(team.id,
          TestHelper.testCommand()
        )(store.dispatch, store.getState);

        await Actions.regenCommandToken(
          created.id
        )(store.dispatch, store.getState);

        const request = store.getState().requests.integrations.regenCommandToken;
        if (request.status === RequestStatus.FAILURE) {
            throw new Error(JSON.stringify(request.error));
        }

        const {commands} = store.getState().entities.integrations;
        assert.ok(commands[created.id]);
        const updated = commands[created.id];

        assert.equal(updated.id, created.id);
        assert.notEqual(updated.token, created.token);
        assert.equal(updated.create_at, created.create_at);
        assert.equal(updated.update_at, created.update_at);
        assert.equal(updated.delete_at, created.delete_at);
        assert.equal(updated.creator_id, created.creator_id);
        assert.equal(updated.team_id, created.team_id);
        assert.equal(updated.trigger, created.trigger);
        assert.equal(updated.method, created.method);
        assert.equal(updated.username, created.username);
        assert.equal(updated.icon_url, created.icon_url);
        assert.equal(updated.auto_complete, created.auto_complete);
        assert.equal(updated.auto_complete_desc, created.auto_complete_desc);
        assert.equal(updated.auto_complete_hint, created.auto_complete_hint);
        assert.equal(updated.display_name, created.display_name);
        assert.equal(updated.description, created.description);
        assert.equal(updated.url, created.url);
    });

    it('editCommand', async () => {
        const team = await TeamsActions.createTeam(
            TestHelper.fakeTeam()
        )(store.dispatch, store.getState);

        const created = await Actions.addCommand(
            team.id,
            TestHelper.testCommand()
        )(store.dispatch, store.getState);

        const expected = Object.assign({}, created);
        expected.trigger = 'modified';
        expected.method = 'G';
        expected.username = 'modified';
        expected.auto_complete = false;

        await Actions.editCommand(
            expected
        )(store.dispatch, store.getState);

        const request = store.getState().requests.integrations.editCommand;
        if (request.status === RequestStatus.FAILURE) {
            throw new Error(JSON.stringify(request.error));
        }

        const {commands} = store.getState().entities.integrations;
        assert.ok(commands[created.id]);
        const actual = commands[created.id];

        assert.notEqual(actual.update_at, expected.update_at);
        expected.update_at = actual.update_at;
        assert.equal(JSON.stringify(actual), JSON.stringify(expected));
    });

    it('deleteCommand', async () => {
        const team = await TeamsActions.createTeam(
          TestHelper.fakeTeam()
        )(store.dispatch, store.getState);

        const created = await Actions.addCommand(team.id,
          TestHelper.testCommand()
        )(store.dispatch, store.getState);

        await Actions.deleteCommand(
          created.id
        )(store.dispatch, store.getState);

        const request = store.getState().requests.integrations.deleteCommand;
        if (request.status === RequestStatus.FAILURE) {
            throw new Error(JSON.stringify(request.error));
        }

        const {commands} = store.getState().entities.integrations;
        assert.ok(!commands[created.id]);
    });

    it('addOAuthApp', async () => {
        const created = await Actions.addOAuthApp(TestHelper.fakeOAuthApp())(store.dispatch, store.getState);

        const request = store.getState().requests.integrations.addOAuthApp;
        if (request.status === RequestStatus.FAILURE) {
            throw new Error(JSON.stringify(request.error));
        }

        const {oauthApps} = store.getState().entities.integrations;
        assert.ok(oauthApps[created.id]);
    });

    it('getOAuthApp', async () => {
        const created = await Actions.addOAuthApp(TestHelper.fakeOAuthApp())(store.dispatch, store.getState);

        await Actions.getOAuthApp(created.id)(store.dispatch, store.getState);

        const request = store.getState().requests.integrations.getOAuthApp;
        if (request.status === RequestStatus.FAILURE) {
            throw new Error(JSON.stringify(request.error));
        }

        const {oauthApps} = store.getState().entities.integrations;
        assert.ok(oauthApps[created.id]);
    });

    it('getOAuthApps', async () => {
        await Actions.addOAuthApp(TestHelper.fakeOAuthApp())(store.dispatch, store.getState);

        await Actions.getOAuthApps()(store.dispatch, store.getState);

        const request = store.getState().requests.integrations.getOAuthApps;
        if (request.status === RequestStatus.FAILURE) {
            throw new Error(JSON.stringify(request.error));
        }

        const {oauthApps} = store.getState().entities.integrations;
        assert.ok(oauthApps);
    });

    it('deleteOAuthApp', async () => {
        const created = await Actions.addOAuthApp(TestHelper.fakeOAuthApp())(store.dispatch, store.getState);

        await Actions.deleteOAuthApp(created.id)(store.dispatch, store.getState);

        const request = store.getState().requests.integrations.deleteOAuthApp;
        if (request.status === RequestStatus.FAILURE) {
            throw new Error(JSON.stringify(request.error));
        }

        const {oauthApps} = store.getState().entities.integrations;
        assert.ok(!oauthApps[created.id]);
    });

    it('regenOAuthAppSecret', async () => {
        const created = await Actions.addOAuthApp(TestHelper.fakeOAuthApp())(store.dispatch, store.getState);

        await Actions.regenOAuthAppSecret(created.id)(store.dispatch, store.getState);

        const request = store.getState().requests.integrations.updateOAuthApp;
        if (request.status === RequestStatus.FAILURE) {
            throw new Error(JSON.stringify(request.error));
        }

        const {oauthApps} = store.getState().entities.integrations;
        assert.ok(oauthApps[created.id].client_secret !== created.client_secret);
    });
});
