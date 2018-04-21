// Copyright (c) 2016 Mattermost, Inc. All Rights Reserved.
// See License.txt for license information.

import assert from 'assert';
import nock from 'nock';

import {logError} from 'actions/errors';
import {Client4} from 'client';

import TestHelper from 'test/test_helper';
import configureStore from 'test/test_store';

describe('Actions.Errors', () => {
    let store;
    before(async () => {
        await TestHelper.initBasic(Client4);
        Client4.setEnableLogging(true);
    });

    beforeEach(async () => {
        store = await configureStore();
    });

    after(async () => {
        await TestHelper.tearDown();
        Client4.setEnableLogging(false);
    });

    it('logError should hit /logs endpoint, unless server error', async () => {
        let count = 0;

        nock(Client4.getBaseRoute()).
            post('/logs').
            reply(200, () => {
                count++;
                return '{}';
            }).
            post('/logs').
            reply(200, () => {
                count++;
                return '{}';
            }).
            post('/logs').
            reply(200, () => {
                count++;
                return '{}';
            });

        await logError({message: 'error'})(store.dispatch, store.getState);
        await logError({message: 'error', server_error_id: 'error_id'})(store.dispatch, store.getState);
        await logError({message: 'error'})(store.dispatch, store.getState);

        if (count > 2) {
            assert.fail(`should not hit /logs endpoint, called ${count} times`);
        }
    });
});
