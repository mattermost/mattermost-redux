// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import fs from 'fs';
import assert from 'assert';
import nock from 'nock';

import * as Actions from 'actions/emojis';
import {Client4} from 'client';

import {GeneralTypes} from 'action_types';
import TestHelper from 'test/test_helper';
import configureStore from 'test/test_store';

const OK_RESPONSE = {status: 'OK'};

describe('Actions.Emojis', () => {
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

    it('createCustomEmoji', async () => {
        const testImageData = fs.createReadStream('test/assets/images/test.png');

        nock(Client4.getEmojisRoute()).
            post('').
            reply(201, {id: TestHelper.generateId(), create_at: 1507918415696, update_at: 1507918415696, delete_at: 0, creator_id: TestHelper.basicUser.id, name: TestHelper.generateId()});

        const {data: created} = await Actions.createCustomEmoji(
            {
                name: TestHelper.generateId(),
                creator_id: TestHelper.basicUser.id,
            },
            testImageData
        )(store.dispatch, store.getState);

        const state = store.getState();

        const emojis = state.entities.emojis.customEmoji;
        assert.ok(emojis);
        assert.ok(emojis[created.id]);
    });

    it('getCustomEmojis', async () => {
        const testImageData = fs.createReadStream('test/assets/images/test.png');

        nock(Client4.getEmojisRoute()).
            post('').
            reply(201, {id: TestHelper.generateId(), create_at: 1507918415696, update_at: 1507918415696, delete_at: 0, creator_id: TestHelper.basicUser.id, name: TestHelper.generateId()});

        const {data: created} = await Actions.createCustomEmoji(
            {
                name: TestHelper.generateId(),
                creator_id: TestHelper.basicUser.id,
            },
            testImageData
        )(store.dispatch, store.getState);

        nock(Client4.getEmojisRoute()).
            get('').
            query(true).
            reply(200, [created]);

        await Actions.getCustomEmojis()(store.dispatch, store.getState);

        const state = store.getState();

        const emojis = state.entities.emojis.customEmoji;
        assert.ok(emojis);
        assert.ok(emojis[created.id]);
    });

    it('getAllCustomEmojis', async () => {
        store.dispatch({type: GeneralTypes.RECEIVED_SERVER_VERSION, data: '4.0.0'});

        nock(Client4.getEmojisRoute()).
            post('').
            reply(201, {id: TestHelper.generateId(), create_at: 1507918415696, update_at: 1507918415696, delete_at: 0, creator_id: TestHelper.basicUser.id, name: TestHelper.generateId()});
        const {data: created1} = await Actions.createCustomEmoji(
            {
                name: TestHelper.generateId(),
                creator_id: TestHelper.basicUser.id,
            },
            fs.createReadStream('test/assets/images/test.png')
        )(store.dispatch, store.getState);

        nock(Client4.getEmojisRoute()).
            post('').
            reply(201, {id: TestHelper.generateId(), create_at: 1507918415696, update_at: 1507918415696, delete_at: 0, creator_id: TestHelper.basicUser.id, name: TestHelper.generateId()});
        const {data: created2} = await Actions.createCustomEmoji(
            {
                name: TestHelper.generateId(),
                creator_id: TestHelper.basicUser.id,
            },
            fs.createReadStream('test/assets/images/test.png')
        )(store.dispatch, store.getState);

        nock(Client4.getEmojisRoute()).
            get('').
            query(true).
            reply(200, [created1]);

        nock(Client4.getEmojisRoute()).
            get('').
            query(true).
            reply(200, [created2]);

        nock(Client4.getEmojisRoute()).
            get('').
            query(true).
            reply(200, []);
        await Actions.getAllCustomEmojis(1)(store.dispatch, store.getState);

        let state = store.getState();

        let emojis = state.entities.emojis.customEmoji;
        assert.ok(emojis);
        assert.ok(emojis[created1.id]);
        assert.ok(emojis[created2.id]);

        nock(Client4.getEmojisRoute()).
            delete(`/${created2.id}`).
            reply(200, OK_RESPONSE);

        // Should have all emojis minus the deleted one
        await Client4.deleteCustomEmoji(created2.id);

        nock(Client4.getEmojisRoute()).
            get('').
            query(true).
            reply(200, [created1]);

        nock(Client4.getEmojisRoute()).
            get('').
            query(true).
            reply(200, []);
        await Actions.getAllCustomEmojis(1)(store.dispatch, store.getState);

        state = store.getState();

        emojis = state.entities.emojis.customEmoji;
        assert.ok(emojis);
        assert.ok(emojis[created1.id]);
        assert.ok(!emojis[created2.id]);

        nock(Client4.getEmojisRoute()).
            delete(`/${created1.id}`).
            reply(200, OK_RESPONSE);

        // Cleanup
        Client4.deleteCustomEmoji(created1.id);
    });

    it('deleteCustomEmoji', async () => {
        const testImageData = fs.createReadStream('test/assets/images/test.png');

        nock(Client4.getEmojisRoute()).
            post('').
            reply(201, {id: TestHelper.generateId(), create_at: 1507918415696, update_at: 1507918415696, delete_at: 0, creator_id: TestHelper.basicUser.id, name: TestHelper.generateId()});
        const {data: created} = await Actions.createCustomEmoji(
            {
                name: TestHelper.generateId(),
                creator_id: TestHelper.basicUser.id,
            },
            testImageData
        )(store.dispatch, store.getState);

        nock(Client4.getEmojisRoute()).
            delete(`/${created.id}`).
            reply(200, OK_RESPONSE);

        await Actions.deleteCustomEmoji(created.id)(store.dispatch, store.getState);

        const state = store.getState();

        const emojis = state.entities.emojis.customEmoji;
        assert.ok(!emojis[created.id]);
    });

    it('loadProfilesForCustomEmojis', async () => {
        const fakeUser = TestHelper.fakeUser();
        fakeUser.id = TestHelper.generateId();
        const junkUserId = TestHelper.generateId();

        const testEmojis = [{
            name: TestHelper.generateId(),
            creator_id: TestHelper.basicUser.id,
        },
        {
            name: TestHelper.generateId(),
            creator_id: TestHelper.basicUser.id,
        },
        {
            name: TestHelper.generateId(),
            creator_id: fakeUser.id,
        },
        {
            name: TestHelper.generateId(),
            creator_id: junkUserId,
        }];

        nock(Client4.getUsersRoute()).
            post('/ids').
            reply(200, [TestHelper.basicUser, fakeUser]);

        await store.dispatch(Actions.loadProfilesForCustomEmojis(testEmojis));

        const state = store.getState();
        const profiles = state.entities.users.profiles;
        assert.ok(profiles[TestHelper.basicUser.id]);
        assert.ok(profiles[fakeUser.id]);
        assert.ok(!profiles[junkUserId]);
    });

    it('searchCustomEmojis', async () => {
        const testImageData = fs.createReadStream('test/assets/images/test.png');

        const oldVersion = Client4.getServerVersion();
        Client4.serverVersion = '4.7.0';

        nock(Client4.getEmojisRoute()).
            post('').
            reply(201, {id: TestHelper.generateId(), create_at: 1507918415696, update_at: 1507918415696, delete_at: 0, creator_id: TestHelper.basicUser.id, name: TestHelper.generateId()});

        const {data: created} = await Actions.createCustomEmoji(
            {
                name: TestHelper.generateId(),
                creator_id: TestHelper.basicUser.id,
            },
            testImageData
        )(store.dispatch, store.getState);

        nock(Client4.getEmojisRoute()).
            post('/search').
            reply(200, [created]);

        await Actions.searchCustomEmojis(created.name, {prefix_only: true})(store.dispatch, store.getState);

        const state = store.getState();

        const emojis = state.entities.emojis.customEmoji;
        assert.ok(emojis);
        assert.ok(emojis[created.id]);

        Client4.serverVersion = '4.6.0';
        const {data} = await Actions.searchCustomEmojis(created.name, {prefix_only: true})(store.dispatch, store.getState);
        assert.ok(data.length === 0);

        Client4.serverVersion = oldVersion;
    });

    it('autocompleteCustomEmojis', async () => {
        const testImageData = fs.createReadStream('test/assets/images/test.png');

        const oldVersion = Client4.getServerVersion();
        Client4.serverVersion = '4.7.0';

        nock(Client4.getEmojisRoute()).
            post('').
            reply(201, {id: TestHelper.generateId(), create_at: 1507918415696, update_at: 1507918415696, delete_at: 0, creator_id: TestHelper.basicUser.id, name: TestHelper.generateId()});

        const {data: created} = await Actions.createCustomEmoji(
            {
                name: TestHelper.generateId(),
                creator_id: TestHelper.basicUser.id,
            },
            testImageData
        )(store.dispatch, store.getState);

        nock(Client4.getEmojisRoute()).
            get('/autocomplete').
            query(true).
            reply(200, [created]);

        await Actions.autocompleteCustomEmojis(created.name)(store.dispatch, store.getState);

        const state = store.getState();

        const emojis = state.entities.emojis.customEmoji;
        assert.ok(emojis);
        assert.ok(emojis[created.id]);

        Client4.serverVersion = '4.6.0';
        const {data} = await Actions.autocompleteCustomEmojis(created.name)(store.dispatch, store.getState);
        assert.ok(data.length === 0);

        Client4.serverVersion = oldVersion;
    });

    it('getCustomEmoji', async () => {
        const testImageData = fs.createReadStream('test/assets/images/test.png');

        nock(Client4.getEmojisRoute()).
            post('').
            reply(201, {id: TestHelper.generateId(), create_at: 1507918415696, update_at: 1507918415696, delete_at: 0, creator_id: TestHelper.basicUser.id, name: TestHelper.generateId()});

        const {data: created} = await Actions.createCustomEmoji(
            {
                name: TestHelper.generateId(),
                creator_id: TestHelper.basicUser.id,
            },
            testImageData
        )(store.dispatch, store.getState);

        nock(Client4.getEmojisRoute()).
            get(`/${created.id}`).
            reply(200, created);

        await Actions.getCustomEmoji(created.id)(store.dispatch, store.getState);

        const state = store.getState();

        const emojis = state.entities.emojis.customEmoji;
        assert.ok(emojis);
        assert.ok(emojis[created.id]);
    });

    it('getCustomEmojiByName', async () => {
        const testImageData = fs.createReadStream('test/assets/images/test.png');

        const oldVersion = Client4.getServerVersion();
        Client4.serverVersion = '4.7.0';

        nock(Client4.getEmojisRoute()).
            post('').
            reply(201, {id: TestHelper.generateId(), create_at: 1507918415696, update_at: 1507918415696, delete_at: 0, creator_id: TestHelper.basicUser.id, name: TestHelper.generateId()});

        const {data: created} = await Actions.createCustomEmoji(
            {
                name: TestHelper.generateId(),
                creator_id: TestHelper.basicUser.id,
            },
            testImageData
        )(store.dispatch, store.getState);

        nock(Client4.getEmojisRoute()).
            get(`/name/${created.name}`).
            reply(200, created);

        await Actions.getCustomEmojiByName(created.name)(store.dispatch, store.getState);

        let state = store.getState();

        const emojis = state.entities.emojis.customEmoji;
        assert.ok(emojis);
        assert.ok(emojis[created.id]);

        const missingName = TestHelper.generateId();

        nock(Client4.getEmojisRoute()).
            get(`/name/${missingName}`).
            reply(404, {message: 'Not found', status_code: 404});

        await Actions.getCustomEmojiByName(missingName)(store.dispatch, store.getState);

        state = store.getState();
        assert.ok(state.entities.emojis.nonExistentEmoji.has(missingName));

        Client4.serverVersion = '4.6.0';
        const {data} = await Actions.getCustomEmojiByName(created.name)(store.dispatch, store.getState);
        assert.ok(Object.keys(data).length === 0);

        Client4.serverVersion = oldVersion;
    });

    it('getCustomEmojisByName', async () => {
        const testImageData = fs.createReadStream('test/assets/images/test.png');

        const oldVersion = Client4.getServerVersion();
        Client4.serverVersion = '4.7.0';

        nock(Client4.getEmojisRoute()).
            post('').
            reply(201, {id: TestHelper.generateId(), create_at: 1507918415696, update_at: 1507918415696, delete_at: 0, creator_id: TestHelper.basicUser.id, name: TestHelper.generateId()});

        const {data: created} = await Actions.createCustomEmoji(
            {
                name: TestHelper.generateId(),
                creator_id: TestHelper.basicUser.id,
            },
            testImageData
        )(store.dispatch, store.getState);

        nock(Client4.getEmojisRoute()).
            get(`/name/${created.name}`).
            reply(200, created);

        const missingName = TestHelper.generateId();

        nock(Client4.getEmojisRoute()).
            get(`/name/${missingName}`).
            reply(404, {message: 'Not found', status_code: 404});

        await Actions.getCustomEmojisByName([created.name, missingName])(store.dispatch, store.getState);

        const state = store.getState();
        assert.ok(state.entities.emojis.customEmoji[created.id]);
        assert.ok(state.entities.emojis.nonExistentEmoji.has(missingName));

        Client4.serverVersion = oldVersion;
    });

    it('getCustomEmojisInText', async () => {
        const testImageData = fs.createReadStream('test/assets/images/test.png');

        const oldVersion = Client4.getServerVersion();
        Client4.serverVersion = '4.7.0';

        nock(Client4.getEmojisRoute()).
            post('').
            reply(201, {id: TestHelper.generateId(), create_at: 1507918415696, update_at: 1507918415696, delete_at: 0, creator_id: TestHelper.basicUser.id, name: TestHelper.generateId()});

        const {data: created} = await Actions.createCustomEmoji(
            {
                name: TestHelper.generateId(),
                creator_id: TestHelper.basicUser.id,
            },
            testImageData
        )(store.dispatch, store.getState);

        nock(Client4.getEmojisRoute()).
            get(`/name/${created.name}`).
            reply(200, created);

        const missingName = TestHelper.generateId();

        nock(Client4.getEmojisRoute()).
            get(`/name/${missingName}`).
            reply(404, {message: 'Not found', status_code: 404});

        await Actions.getCustomEmojisInText(`some text :${created.name}: :${missingName}:`)(store.dispatch, store.getState);

        const state = store.getState();
        assert.ok(state.entities.emojis.customEmoji[created.id]);
        assert.ok(state.entities.emojis.nonExistentEmoji.has(missingName));

        Client4.serverVersion = oldVersion;
    });
});
