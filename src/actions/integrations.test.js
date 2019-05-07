// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import assert from 'assert';
import nock from 'nock';

import * as Actions from 'actions/integrations';
import * as TeamsActions from 'actions/teams';
import {Client4} from 'client';

import {RequestStatus} from 'constants';
import TestHelper from 'test/test_helper';
import configureStore from 'test/test_store';

const OK_RESPONSE = {status: 'OK'};

describe('Actions.Integrations', () => {
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

    it('createIncomingHook', async () => {
        nock(Client4.getIncomingHooksRoute()).
            post('').
            reply(201, TestHelper.testIncomingHook());

        const {data: created} = await Actions.createIncomingHook(
            {
                channel_id: TestHelper.basicChannel.id,
                display_name: 'test',
                description: 'test',
            }
        )(store.dispatch, store.getState);

        const state = store.getState();
        const request = state.requests.integrations.createIncomingHook;
        if (request.status === RequestStatus.FAILURE) {
            throw new Error(request.error);
        }

        const hooks = state.entities.integrations.incomingHooks;
        assert.ok(hooks);
        assert.ok(hooks[created.id]);
    });

    it('getIncomingWebhook', async () => {
        nock(Client4.getIncomingHooksRoute()).
            post('').
            reply(201, TestHelper.testIncomingHook());

        const {data: created} = await Actions.createIncomingHook(
            {
                channel_id: TestHelper.basicChannel.id,
                display_name: 'test',
                description: 'test',
            }
        )(store.dispatch, store.getState);

        nock(Client4.getIncomingHooksRoute()).
            get(`/${created.id}`).
            reply(200, created);

        await Actions.getIncomingHook(created.id)(store.dispatch, store.getState);

        const state = store.getState();
        const request = state.requests.integrations.getIncomingHooks;
        if (request.status === RequestStatus.FAILURE) {
            throw new Error(request.error);
        }

        const hooks = state.entities.integrations.incomingHooks;
        assert.ok(hooks);
        assert.ok(hooks[created.id]);
    });

    it('getIncomingWebhooks', async () => {
        nock(Client4.getIncomingHooksRoute()).
            post('').
            reply(201, TestHelper.testIncomingHook());

        const {data: created} = await Actions.createIncomingHook(
            {
                channel_id: TestHelper.basicChannel.id,
                display_name: 'test',
                description: 'test',
            }
        )(store.dispatch, store.getState);

        nock(Client4.getIncomingHooksRoute()).
            get('').
            query(true).
            reply(200, [created]);

        await Actions.getIncomingHooks(TestHelper.basicTeam.id)(store.dispatch, store.getState);

        const state = store.getState();
        const request = state.requests.integrations.getIncomingHooks;
        if (request.status === RequestStatus.FAILURE) {
            throw new Error(request.error);
        }

        const hooks = state.entities.integrations.incomingHooks;
        assert.ok(hooks);
        assert.ok(hooks[created.id]);
    });

    it('removeIncomingHook', async () => {
        nock(Client4.getIncomingHooksRoute()).
            post('').
            reply(201, TestHelper.testIncomingHook());

        const {data: created} = await Actions.createIncomingHook(
            {
                channel_id: TestHelper.basicChannel.id,
                display_name: 'test',
                description: 'test',
            }
        )(store.dispatch, store.getState);

        nock(Client4.getIncomingHooksRoute()).
            delete(`/${created.id}`).
            reply(200, OK_RESPONSE);

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
        nock(Client4.getIncomingHooksRoute()).
            post('').
            reply(201, TestHelper.testIncomingHook());

        const {data: created} = await Actions.createIncomingHook(
            {
                channel_id: TestHelper.basicChannel.id,
                display_name: 'test',
                description: 'test',
            }
        )(store.dispatch, store.getState);

        const updated = {...created};
        updated.display_name = 'test2';

        nock(Client4.getIncomingHooksRoute()).
            put(`/${created.id}`).
            reply(200, updated);
        await Actions.updateIncomingHook(updated)(store.dispatch, store.getState);

        const state = store.getState();
        const request = state.requests.integrations.updateIncomingHook;
        if (request.status === RequestStatus.FAILURE) {
            throw new Error(request.error);
        }

        const hooks = state.entities.integrations.incomingHooks;
        assert.ok(hooks[created.id]);
        assert.ok(hooks[created.id].display_name === updated.display_name);
    });

    it('createOutgoingHook', async () => {
        nock(Client4.getOutgoingHooksRoute()).
            post('').
            reply(201, TestHelper.testOutgoingHook());

        const {data: created} = await Actions.createOutgoingHook(
            {
                channel_id: TestHelper.basicChannel.id,
                team_id: TestHelper.basicTeam.id,
                display_name: 'test',
                trigger_words: [TestHelper.generateId()],
                callback_urls: ['http://localhost/notarealendpoint'],
            }
        )(store.dispatch, store.getState);

        const state = store.getState();
        const request = state.requests.integrations.createOutgoingHook;
        if (request.status === RequestStatus.FAILURE) {
            throw new Error(request.error);
        }

        const hooks = state.entities.integrations.outgoingHooks;
        assert.ok(hooks);
        assert.ok(hooks[created.id]);
    });

    it('getOutgoingWebhook', async () => {
        nock(Client4.getOutgoingHooksRoute()).
            post('').
            reply(201, TestHelper.testOutgoingHook());

        const {data: created} = await Actions.createOutgoingHook(
            {
                channel_id: TestHelper.basicChannel.id,
                team_id: TestHelper.basicTeam.id,
                display_name: 'test',
                trigger_words: [TestHelper.generateId()],
                callback_urls: ['http://localhost/notarealendpoint'],
            }
        )(store.dispatch, store.getState);

        nock(Client4.getOutgoingHooksRoute()).
            get(`/${created.id}`).
            reply(200, TestHelper.testOutgoingHook());

        await Actions.getOutgoingHook(created.id)(store.dispatch, store.getState);

        const state = store.getState();
        const request = state.requests.integrations.getOutgoingHooks;
        if (request.status === RequestStatus.FAILURE) {
            throw new Error(request.error);
        }

        const hooks = state.entities.integrations.outgoingHooks;
        assert.ok(hooks);
        assert.ok(hooks[created.id]);
    });

    it('getOutgoingWebhooks', async () => {
        nock(Client4.getOutgoingHooksRoute()).
            post('').
            reply(201, TestHelper.testOutgoingHook());

        const {data: created} = await Actions.createOutgoingHook(
            {
                channel_id: TestHelper.basicChannel.id,
                team_id: TestHelper.basicTeam.id,
                display_name: 'test',
                trigger_words: [TestHelper.generateId()],
                callback_urls: ['http://localhost/notarealendpoint'],
            }
        )(store.dispatch, store.getState);

        nock(Client4.getOutgoingHooksRoute()).
            get('').
            query(true).
            reply(200, [TestHelper.testOutgoingHook()]);

        await Actions.getOutgoingHooks(TestHelper.basicChannel.id)(store.dispatch, store.getState);

        const state = store.getState();
        const request = state.requests.integrations.getOutgoingHooks;
        if (request.status === RequestStatus.FAILURE) {
            throw new Error(request.error);
        }

        const hooks = state.entities.integrations.outgoingHooks;
        assert.ok(hooks);
        assert.ok(hooks[created.id]);
    });

    it('removeOutgoingHook', async () => {
        nock(Client4.getOutgoingHooksRoute()).
            post('').
            reply(201, TestHelper.testOutgoingHook());

        const {data: created} = await Actions.createOutgoingHook(
            {
                channel_id: TestHelper.basicChannel.id,
                team_id: TestHelper.basicTeam.id,
                display_name: 'test',
                trigger_words: [TestHelper.generateId()],
                callback_urls: ['http://localhost/notarealendpoint'],
            }
        )(store.dispatch, store.getState);

        nock(Client4.getOutgoingHooksRoute()).
            delete(`/${created.id}`).
            reply(200, OK_RESPONSE);

        await Actions.removeOutgoingHook(created.id)(store.dispatch, store.getState);

        const state = store.getState();
        const request = state.requests.integrations.deleteOutgoingHook;
        if (request.status === RequestStatus.FAILURE) {
            throw new Error(request.error);
        }

        const hooks = state.entities.integrations.outgoingHooks;
        assert.ok(!hooks[created.id]);
    });

    it('updateOutgoingHook', async () => {
        nock(Client4.getOutgoingHooksRoute()).
            post('').
            reply(201, TestHelper.testOutgoingHook());

        const {data: created} = await Actions.createOutgoingHook(
            {
                channel_id: TestHelper.basicChannel.id,
                team_id: TestHelper.basicTeam.id,
                display_name: 'test',
                trigger_words: [TestHelper.generateId()],
                callback_urls: ['http://localhost/notarealendpoint'],
            }
        )(store.dispatch, store.getState);

        const updated = {...created};
        updated.display_name = 'test2';
        nock(Client4.getOutgoingHooksRoute()).
            put(`/${created.id}`).
            reply(200, updated);
        await Actions.updateOutgoingHook(updated)(store.dispatch, store.getState);

        const state = store.getState();
        const request = state.requests.integrations.updateOutgoingHook;
        if (request.status === RequestStatus.FAILURE) {
            throw new Error(request.error);
        }

        const hooks = state.entities.integrations.outgoingHooks;
        assert.ok(hooks[created.id]);
        assert.ok(hooks[created.id].display_name === updated.display_name);
    });

    it('regenOutgoingHookToken', async () => {
        nock(Client4.getOutgoingHooksRoute()).
            post('').
            reply(201, TestHelper.testOutgoingHook());

        const {data: created} = await Actions.createOutgoingHook(
            {
                channel_id: TestHelper.basicChannel.id,
                team_id: TestHelper.basicTeam.id,
                display_name: 'test',
                trigger_words: [TestHelper.generateId()],
                callback_urls: ['http://localhost/notarealendpoint'],
            }
        )(store.dispatch, store.getState);

        nock(Client4.getOutgoingHooksRoute()).
            post(`/${created.id}/regen_token`).
            reply(200, {...created, token: TestHelper.generateId()});
        await Actions.regenOutgoingHookToken(created.id)(store.dispatch, store.getState);

        const state = store.getState();
        const request = state.requests.integrations.updateOutgoingHook;
        if (request.status === RequestStatus.FAILURE) {
            throw new Error(request.error);
        }

        const hooks = state.entities.integrations.outgoingHooks;
        assert.ok(hooks[created.id]);
        assert.ok(hooks[created.id].token !== created.token);
    });

    it('getCommands', async () => {
        const noTeamCommands = store.getState().entities.integrations.commands;
        const noSystemCommands = store.getState().entities.integrations.systemCommands;
        assert.equal(Object.keys({...noTeamCommands, ...noSystemCommands}).length, 0);

        nock(Client4.getTeamsRoute()).
            post('').
            reply(201, TestHelper.fakeTeamWithId());

        const {data: team} = await TeamsActions.createTeam(
            TestHelper.fakeTeam()
        )(store.dispatch, store.getState);

        const teamCommand = TestHelper.testCommand(team.id);

        nock(Client4.getCommandsRoute()).
            post('').
            reply(201, {...teamCommand, token: TestHelper.generateId(), id: TestHelper.generateId()});

        const {data: created} = await Actions.addCommand(
            teamCommand
        )(store.dispatch, store.getState);

        nock(Client4.getCommandsRoute()).
            get('').
            query(true).
            reply(200, [created, {
                trigger: 'system-command',
            }]);

        await Actions.getCommands(
            team.id
        )(store.dispatch, store.getState);

        const request = store.getState().requests.integrations.getCommands;
        if (request.status === RequestStatus.FAILURE) {
            throw new Error(JSON.stringify(request.error));
        }

        const teamCommands = store.getState().entities.integrations.commands;
        const executableCommands = store.getState().entities.integrations.executableCommands;
        assert.ok(Object.keys({...teamCommands, ...executableCommands}).length);
    });

    it('getAutocompleteCommands', async () => {
        const noTeamCommands = store.getState().entities.integrations.commands;
        const noSystemCommands = store.getState().entities.integrations.systemCommands;
        assert.equal(Object.keys({...noTeamCommands, ...noSystemCommands}).length, 0);

        nock(Client4.getTeamsRoute()).
            post('').
            reply(201, TestHelper.fakeTeamWithId());

        const {data: team} = await TeamsActions.createTeam(
            TestHelper.fakeTeam()
        )(store.dispatch, store.getState);

        const teamCommandWithAutocomplete = TestHelper.testCommand(team.id);

        nock(Client4.getCommandsRoute()).
            post('').
            reply(201, {...teamCommandWithAutocomplete, token: TestHelper.generateId(), id: TestHelper.generateId()});

        const {data: createdWithAutocomplete} = await Actions.addCommand(
            teamCommandWithAutocomplete
        )(store.dispatch, store.getState);

        nock(`${Client4.getTeamRoute(team.id)}/commands/autocomplete`).
            get('').
            query(true).
            reply(200, [createdWithAutocomplete, {
                trigger: 'system-command',
            }]);

        await Actions.getAutocompleteCommands(
            team.id
        )(store.dispatch, store.getState);

        const request = store.getState().requests.integrations.getAutocompleteCommands;
        if (request.status === RequestStatus.FAILURE) {
            throw new Error(JSON.stringify(request.error));
        }

        const teamCommands = store.getState().entities.integrations.commands;
        const systemCommands = store.getState().entities.integrations.systemCommands;
        assert.equal(Object.keys({...teamCommands, ...systemCommands}).length, 2);
    });

    it('getCustomTeamCommands', async () => {
        nock(Client4.getTeamsRoute()).
            post('').
            reply(201, TestHelper.fakeTeamWithId());

        const {data: team} = await TeamsActions.createTeam(
            TestHelper.fakeTeam()
        )(store.dispatch, store.getState);

        nock(Client4.getCommandsRoute()).
            get('').
            query(true).
            reply(200, []);

        await Actions.getCustomTeamCommands(
            team.id
        )(store.dispatch, store.getState);

        const noCommands = store.getState().entities.integrations.commands;
        assert.equal(Object.keys(noCommands).length, 0);

        const command = TestHelper.testCommand(team.id);

        nock(Client4.getCommandsRoute()).
            post('').
            reply(201, {...command, token: TestHelper.generateId(), id: TestHelper.generateId()});

        const {data: created} = await Actions.addCommand(
            command
        )(store.dispatch, store.getState);

        nock(Client4.getCommandsRoute()).
            get('').
            query(true).
            reply(200, []);

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

    it('executeCommand', async () => {
        nock(Client4.getTeamsRoute()).
            post('').
            reply(201, TestHelper.fakeTeamWithId());

        const {data: team} = await TeamsActions.createTeam(
            TestHelper.fakeTeam()
        )(store.dispatch, store.getState);

        const args = {
            channel_id: TestHelper.basicChannel.id,
            team_id: team.id,
        };

        nock(`${Client4.getCommandsRoute()}/execute`).
            post('').
            reply(200, []);

        await Actions.executeCommand('/echo message 5', args);

        const request = store.getState().requests.integrations.executeCommand;
        if (request.status === RequestStatus.FAILURE) {
            throw new Error(JSON.stringify(request.error));
        }
    });

    it('addCommand', async () => {
        nock(Client4.getTeamsRoute()).
            post('').
            reply(201, TestHelper.fakeTeamWithId());

        const {data: team} = await TeamsActions.createTeam(
            TestHelper.fakeTeam()
        )(store.dispatch, store.getState);

        const expected = TestHelper.testCommand(team.id);

        nock(Client4.getCommandsRoute()).
            post('').
            reply(201, {...expected, token: TestHelper.generateId(), id: TestHelper.generateId()});

        const {data: created} = await Actions.addCommand(expected)(store.dispatch, store.getState);

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
        nock(Client4.getTeamsRoute()).
            post('').
            reply(201, TestHelper.fakeTeamWithId());

        const {data: team} = await TeamsActions.createTeam(
            TestHelper.fakeTeam()
        )(store.dispatch, store.getState);

        const command = TestHelper.testCommand(team.id);

        nock(Client4.getCommandsRoute()).
            post('').
            reply(201, {...command, token: TestHelper.generateId(), id: TestHelper.generateId()});

        const {data: created} = await Actions.addCommand(
            command
        )(store.dispatch, store.getState);

        nock(Client4.getCommandsRoute()).
            put(`/${created.id}/regen_token`).
            reply(200, {...created, token: TestHelper.generateId()});

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
        nock(Client4.getTeamsRoute()).
            post('').
            reply(201, TestHelper.fakeTeamWithId());

        const {data: team} = await TeamsActions.createTeam(
            TestHelper.fakeTeam()
        )(store.dispatch, store.getState);

        const command = TestHelper.testCommand(team.id);

        nock(Client4.getCommandsRoute()).
            post('').
            reply(201, {...command, token: TestHelper.generateId(), id: TestHelper.generateId()});

        const {data: created} = await Actions.addCommand(
            command
        )(store.dispatch, store.getState);

        const expected = Object.assign({}, created);
        expected.trigger = 'modified';
        expected.method = 'G';
        expected.username = 'modified';
        expected.auto_complete = false;

        nock(Client4.getCommandsRoute()).
            put(`/${expected.id}`).
            reply(200, {...expected, update_at: 123});

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
        nock(Client4.getTeamsRoute()).
            post('').
            reply(201, TestHelper.fakeTeamWithId());

        const {data: team} = await TeamsActions.createTeam(
            TestHelper.fakeTeam()
        )(store.dispatch, store.getState);

        const command = TestHelper.testCommand(team.id);

        nock(Client4.getCommandsRoute()).
            post('').
            reply(201, {...command, token: TestHelper.generateId(), id: TestHelper.generateId()});

        const {data: created} = await Actions.addCommand(
            command
        )(store.dispatch, store.getState);

        nock(Client4.getCommandsRoute()).
            delete(`/${created.id}`).
            reply(200, OK_RESPONSE);

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
        nock(Client4.getOAuthAppsRoute()).
            post('').
            reply(201, TestHelper.fakeOAuthAppWithId());

        const {data: created} = await Actions.addOAuthApp(TestHelper.fakeOAuthApp())(store.dispatch, store.getState);

        const request = store.getState().requests.integrations.addOAuthApp;
        if (request.status === RequestStatus.FAILURE) {
            throw new Error(JSON.stringify(request.error));
        }

        const {oauthApps} = store.getState().entities.integrations;
        assert.ok(oauthApps[created.id]);
    });

    it('getOAuthApp', async () => {
        nock(Client4.getOAuthAppsRoute()).
            post('').
            reply(201, TestHelper.fakeOAuthAppWithId());

        const {data: created} = await Actions.addOAuthApp(TestHelper.fakeOAuthApp())(store.dispatch, store.getState);

        nock(Client4.getOAuthAppsRoute()).
            get(`/${created.id}`).
            reply(200, created);

        await Actions.getOAuthApp(created.id)(store.dispatch, store.getState);

        const request = store.getState().requests.integrations.getOAuthApp;
        if (request.status === RequestStatus.FAILURE) {
            throw new Error(JSON.stringify(request.error));
        }

        const {oauthApps} = store.getState().entities.integrations;
        assert.ok(oauthApps[created.id]);
    });

    it('editOAuthApp', async () => {
        nock(Client4.getOAuthAppsRoute()).
            post('').
            reply(201, TestHelper.fakeOAuthAppWithId());

        const {data: created} = await Actions.addOAuthApp(TestHelper.fakeOAuthApp())(store.dispatch, store.getState);

        const expected = Object.assign({}, created);
        expected.name = 'modified';
        expected.description = 'modified';
        expected.homepage = 'https://modified.com';
        expected.icon_url = 'https://modified.com/icon';
        expected.callback_urls = ['https://modified.com/callback1', 'https://modified.com/callback2'];
        expected.is_trusted = true;

        const nockReply = Object.assign({}, expected);
        nockReply.update_at += 1;
        nock(Client4.getBaseRoute()).
            put(`/oauth/apps/${created.id}`).reply(200, nockReply);

        await Actions.editOAuthApp(expected)(store.dispatch, store.getState);

        const request = store.getState().requests.integrations.updateOAuthApp;
        if (request.status === RequestStatus.FAILURE) {
            throw new Error(JSON.stringify(request.error));
        }

        const {oauthApps} = store.getState().entities.integrations;
        assert.ok(oauthApps[created.id]);

        const actual = oauthApps[created.id];

        assert.notEqual(actual.update_at, expected.update_at);
        expected.update_at = actual.update_at;
        assert.equal(JSON.stringify(actual), JSON.stringify(expected));
    });

    it('getOAuthApps', async () => {
        nock(Client4.getOAuthAppsRoute()).
            post('').
            reply(201, TestHelper.fakeOAuthAppWithId());

        const {data: created} = await Actions.addOAuthApp(TestHelper.fakeOAuthApp())(store.dispatch, store.getState);

        nock(Client4.getOAuthAppsRoute()).
            get('').
            query(true).
            reply(200, [created]);

        await Actions.getOAuthApps()(store.dispatch, store.getState);

        const request = store.getState().requests.integrations.getOAuthApps;
        if (request.status === RequestStatus.FAILURE) {
            throw new Error(JSON.stringify(request.error));
        }

        const {oauthApps} = store.getState().entities.integrations;
        assert.ok(oauthApps);
    });

    it('getAuthorizedOAuthApps', async () => {
        nock(Client4.getOAuthAppsRoute()).
            post('').
            reply(201, TestHelper.fakeOAuthAppWithId());

        const {data: created} = await Actions.addOAuthApp(TestHelper.fakeOAuthApp())(store.dispatch, store.getState);

        const user = TestHelper.basicUser;
        nock(`${Client4.getUserRoute(user.id)}/oauth/apps/authorized`).
            get('').
            reply(200, [created]);

        await Actions.getAuthorizedOAuthApps()(store.dispatch, store.getState);

        const request = store.getState().requests.integrations.getOAuthApps;
        if (request.status === RequestStatus.FAILURE) {
            throw new Error(JSON.stringify(request.error));
        }

        const {oauthApps} = store.getState().entities.integrations;
        assert.ok(oauthApps);
    });

    it('deleteOAuthApp', async () => {
        nock(Client4.getOAuthAppsRoute()).
            post('').
            reply(201, TestHelper.fakeOAuthAppWithId());

        const {data: created} = await Actions.addOAuthApp(TestHelper.fakeOAuthApp())(store.dispatch, store.getState);

        nock(Client4.getOAuthAppsRoute()).
            delete(`/${created.id}`).
            reply(200, OK_RESPONSE);

        await Actions.deleteOAuthApp(created.id)(store.dispatch, store.getState);

        const request = store.getState().requests.integrations.deleteOAuthApp;
        if (request.status === RequestStatus.FAILURE) {
            throw new Error(JSON.stringify(request.error));
        }

        const {oauthApps} = store.getState().entities.integrations;
        assert.ok(!oauthApps[created.id]);
    });

    it('regenOAuthAppSecret', async () => {
        nock(Client4.getOAuthAppsRoute()).
            post('').
            reply(201, TestHelper.fakeOAuthAppWithId());

        const {data: created} = await Actions.addOAuthApp(TestHelper.fakeOAuthApp())(store.dispatch, store.getState);

        nock(Client4.getOAuthAppsRoute()).
            post(`/${created.id}/regen_secret`).
            reply(200, {...created, client_secret: TestHelper.generateId()});

        await Actions.regenOAuthAppSecret(created.id)(store.dispatch, store.getState);

        const request = store.getState().requests.integrations.updateOAuthApp;
        if (request.status === RequestStatus.FAILURE) {
            throw new Error(JSON.stringify(request.error));
        }

        const {oauthApps} = store.getState().entities.integrations;
        assert.ok(oauthApps[created.id].client_secret !== created.client_secret);
    });

    it('submitInteractiveDialog', async () => {
        nock(Client4.getBaseRoute()).
            post('/actions/dialogs/submit').
            reply(200, {errors: {name: 'some error'}});

        const submit = {
            url: 'https://mattermost.com',
            callback_id: '123',
            state: '123',
            channel_id: TestHelper.generateId(),
            team_id: TestHelper.generateId(),
            submission: {name: 'value'},
        };

        const {data} = await store.dispatch(Actions.submitInteractiveDialog(submit));

        const request = store.getState().requests.integrations.submitInteractiveDialog;
        if (request.status === RequestStatus.FAILURE) {
            throw new Error(JSON.stringify(request.error));
        }

        assert.ok(data.errors);
        assert.equal(data.errors.name, 'some error');
    });
});
