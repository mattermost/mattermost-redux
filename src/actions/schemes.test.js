// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import assert from 'assert';
import nock from 'nock';

import * as Actions from 'actions/schemes';
import {Client4} from 'client';
import {RequestStatus} from 'constants';

import TestHelper from 'test/test_helper';
import configureStore from 'test/test_store';

describe('Actions.Schemes', () => {
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

    it('getSchemes', async () => {
        const mockScheme = TestHelper.basicScheme;

        nock(Client4.getSchemesRoute()).
            get('').
            query(true).
            reply(200, [mockScheme]);

        await Actions.getSchemes()(store.dispatch, store.getState);
        const request = store.getState().requests.schemes.getSchemes;
        const {schemes} = store.getState().entities.schemes;
        if (request.status === RequestStatus.FAILURE) {
            throw new Error(JSON.stringify(request.error));
        }

        assert.ok(Object.keys(schemes).length > 0);
    });

    it('createScheme', async () => {
        const mockScheme = TestHelper.basicScheme;

        nock(Client4.getSchemesRoute()).
            post('').
            reply(201, mockScheme);
        await Actions.createScheme(TestHelper.mockScheme())(store.dispatch, store.getState);

        const request = store.getState().requests.schemes.createScheme;
        const {schemes} = store.getState().entities.schemes;

        if (request.status === RequestStatus.FAILURE) {
            throw new Error(JSON.stringify(request.error));
        }

        const schemeId = Object.keys(schemes)[0];
        assert.strictEqual(Object.keys(schemes).length, 1);
        assert.strictEqual(mockScheme.id, schemeId);
    });

    it('getScheme', async () => {
        nock(Client4.getSchemesRoute()).
            get('/' + TestHelper.basicScheme.id).
            reply(200, TestHelper.basicScheme);

        await Actions.getScheme(TestHelper.basicScheme.id)(store.dispatch, store.getState);

        const state = store.getState();
        const request = state.requests.schemes.getScheme;
        const {schemes} = state.entities.schemes;

        if (request.status === RequestStatus.FAILURE) {
            throw new Error(JSON.stringify(request.error));
        }

        assert.equal(schemes[TestHelper.basicScheme.id].name, TestHelper.basicScheme.name);
    });

    it('patchScheme', async () => {
        const patchData = {name: 'The Updated Scheme', description: 'This is a scheme created by unit tests'};
        const scheme = {
            ...TestHelper.basicScheme,
            ...patchData,
        };

        nock(Client4.getSchemesRoute()).
            put('/' + TestHelper.basicScheme.id + '/patch').
            reply(200, scheme);

        await Actions.patchScheme(TestHelper.basicScheme.id, scheme)(store.dispatch, store.getState);

        const state = store.getState();
        const request = state.requests.schemes.patchScheme;
        const {schemes} = state.entities.schemes;

        if (request.status === RequestStatus.FAILURE) {
            throw new Error(JSON.stringify(request.error));
        }

        const updated = schemes[TestHelper.basicScheme.id];
        assert.ok(updated);
        assert.strictEqual(updated.name, patchData.name);
        assert.strictEqual(updated.description, patchData.description);
    });

    it('deleteScheme', async () => {
        nock(Client4.getSchemesRoute()).
            delete('/' + TestHelper.basicScheme.id).
            reply(200, {status: 'OK'});

        await Actions.deleteScheme(TestHelper.basicScheme.id)(store.dispatch, store.getState);

        const state = store.getState();
        const request = state.requests.schemes.deleteScheme;
        const {schemes} = state.entities.schemes;

        if (request.state === RequestStatus.FAILURE) {
            throw new Error(JSON.stringify(request.error));
        }

        assert.notStrictEqual(schemes, {});
    });
});
