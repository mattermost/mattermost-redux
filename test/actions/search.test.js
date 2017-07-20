// Copyright (c) 2017-present Mattermost, Inc. All Rights Reserved.
// See License.txt for license information.

import assert from 'assert';

import * as Actions from 'actions/search';
import {Client, Client4} from 'client';

import TestHelper from 'test/test_helper';
import configureStore from 'test/test_store';

describe('Actions.Search', () => {
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

    it('Perform Search', async () => {
        const {dispatch, getState} = store;

        await Client4.createPost({
            ...TestHelper.fakePost(TestHelper.basicChannel.id),
            message: 'try searching for this using the first and last word'
        });
        await Client4.createPost({
            ...TestHelper.fakePost(TestHelper.basicChannel.id),
            message: 'return this message in second attempt'
        });

        // Test for a couple of words
        const search1 = 'try word';
        await Actions.searchPosts(TestHelper.basicTeam.id, search1)(dispatch, getState);

        let state = getState();
        let {recent, results} = state.entities.search;
        const {posts} = state.entities.posts;
        assert.ok(recent[TestHelper.basicTeam.id]);
        let searchIsPresent = recent[TestHelper.basicTeam.id].findIndex((r) => r.terms === search1);
        assert.ok(searchIsPresent !== -1);
        assert.equal(Object.keys(recent[TestHelper.basicTeam.id]).length, 1);
        assert.equal(results.length, 1);
        assert.ok(posts[results[0]]);

        // Test for posts from a user in a channel
        const search2 = `from: ${TestHelper.basicUser.username} in: ${TestHelper.basicChannel.name}`;
        await Actions.searchPosts(
            TestHelper.basicTeam.id,
            search2
        )(dispatch, getState);

        state = getState();
        recent = state.entities.search.recent;
        results = state.entities.search.results;
        searchIsPresent = recent[TestHelper.basicTeam.id].findIndex((r) => r.terms === search1);
        assert.ok(searchIsPresent !== -1);
        assert.equal(Object.keys(recent[TestHelper.basicTeam.id]).length, 2);
        assert.equal(results.length, 3);

        // Clear posts from the search store
        await Actions.clearSearch()(dispatch, getState);
        state = getState();
        recent = state.entities.search.recent;
        results = state.entities.search.results;
        searchIsPresent = recent[TestHelper.basicTeam.id].findIndex((r) => r.terms === search1);
        assert.ok(searchIsPresent !== -1);
        assert.equal(Object.keys(recent[TestHelper.basicTeam.id]).length, 2);
        assert.equal(results.length, 0);

        // Clear a recent term
        await Actions.removeSearchTerms(TestHelper.basicTeam.id, search2)(dispatch, getState);
        state = getState();
        recent = state.entities.search.recent;
        results = state.entities.search.results;
        searchIsPresent = recent[TestHelper.basicTeam.id].findIndex((r) => r.terms === search1);
        assert.ok(searchIsPresent !== -1);
        searchIsPresent = recent[TestHelper.basicTeam.id].findIndex((r) => r.terms === search2);
        assert.ok(searchIsPresent === -1);
        assert.equal(Object.keys(recent[TestHelper.basicTeam.id]).length, 1);
        assert.equal(results.length, 0);
    });
});
