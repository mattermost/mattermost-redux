// Copyright (c) 2016 Mattermost, Inc. All Rights Reserved.
// See License.txt for license information.

import assert from 'assert';

import * as Actions from 'actions/posts';
import {login} from 'actions/users';
import {Client, Client4} from 'client';
import configureStore from 'store';
import {Preferences, Posts, RequestStatus} from 'constants';
import TestHelper from 'test/test_helper';
import {getPreferenceKey} from 'utils/preference_utils';

describe('Actions.Posts', () => {
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

    it('createPost', async () => {
        const channelId = TestHelper.basicChannel.id;
        const post = TestHelper.fakePost(channelId);

        await Actions.createPost(post)(store.dispatch, store.getState);

        const state = store.getState();
        const createRequest = state.requests.posts.createPost;
        if (createRequest.status === RequestStatus.FAILURE) {
            throw new Error(JSON.stringify(createRequest.error));
        }

        const {posts, postsByChannel} = state.entities.posts;
        assert.ok(posts);
        assert.ok(postsByChannel);
        assert.ok(postsByChannel[channelId]);

        let found = false;
        for (const storedPost of Object.values(posts)) {
            if (storedPost.message === post.message) {
                found = true;
                break;
            }
        }
        assert.ok(found, 'failed to find new post in posts');

        found = false;
        for (const postIdInChannel of postsByChannel[channelId]) {
            if (posts[postIdInChannel].message === post.message) {
                found = true;
                break;
            }
        }
        assert.ok(found, 'failed to find new post in postsByChannel');
    });

    it('editPost', async () => {
        const channelId = TestHelper.basicChannel.id;

        const post = await Client4.createPost(
            TestHelper.fakePost(channelId)
        );
        const message = post.message;

        post.message = `${message} (edited)`;
        await Actions.editPost(
            post
        )(store.dispatch, store.getState);

        const state = store.getState();
        const editRequest = state.requests.posts.editPost;
        const {posts} = state.entities.posts;

        if (editRequest.status === RequestStatus.FAILURE) {
            throw new Error(JSON.stringify(editRequest.error));
        }

        assert.ok(posts);
        assert.ok(posts[post.id]);

        assert.strictEqual(
            posts[post.id].message,
            `${message} (edited)`
        );
    });

    it('deletePost', async () => {
        const channelId = TestHelper.basicChannel.id;

        await Actions.createPost(TestHelper.fakePost(channelId))(store.dispatch, store.getState);

        const initialPosts = store.getState().entities.posts;
        const created = initialPosts.posts[initialPosts.postsByChannel[channelId][0]];

        await Actions.deletePost(created)(store.dispatch, store.getState);

        const state = store.getState();
        const deleteRequest = state.requests.posts.deletePost;
        const {posts} = state.entities.posts;

        if (deleteRequest.status === RequestStatus.FAILURE) {
            throw new Error(JSON.stringify(deleteRequest.error));
        }

        assert.ok(posts);
        assert.ok(posts[created.id]);

        assert.strictEqual(
            posts[created.id].state,
            Posts.POST_DELETED
        );
    });

    it('removePost', async () => {
        const channelId = TestHelper.basicChannel.id;
        const postId = TestHelper.basicPost.id;

        const post1a = await Client4.createPost(
            {...TestHelper.fakePost(channelId), root_id: postId}
        );

        await Actions.getPosts(
            channelId
        )(store.dispatch, store.getState);

        const postsCount = store.getState().entities.posts.postsByChannel[channelId].length;

        await Actions.removePost(
            TestHelper.basicPost
        )(store.dispatch, store.getState);

        const {posts, postsByChannel} = store.getState().entities.posts;

        assert.ok(posts);
        assert.ok(postsByChannel);
        assert.ok(postsByChannel[channelId]);

        // this should count that the basic post and post1a were removed
        assert.equal(postsByChannel[channelId].length, postsCount - 2);
        assert.ok(!posts[postId]);
        assert.ok(!posts[post1a.id]);
    });

    it('getPostThread', async () => {
        const channelId = TestHelper.basicChannel.id;

        const post = await Client4.createPost(
            TestHelper.fakePost(channelId)
        );

        await Actions.getPostThread(post.id)(store.dispatch, store.getState);

        const state = store.getState();
        const getRequest = state.requests.posts.getPostThread;
        const {posts, postsByChannel} = state.entities.posts;

        if (getRequest.status === RequestStatus.FAILURE) {
            throw new Error(JSON.stringify(getRequest.error));
        }

        assert.ok(posts);
        assert.ok(postsByChannel);
        assert.ok(postsByChannel[channelId]);

        assert.ok(posts[post.id]);

        let found = false;
        for (const postIdInChannel of postsByChannel[channelId]) {
            if (postIdInChannel === post.id) {
                found = true;
                break;
            }
        }
        assert.ok(found, 'failed to find post in postsByChannel');
    });

    it('getPosts', async () => {
        const channelId = TestHelper.basicChannel.id;

        const post1 = await Client4.createPost(
            TestHelper.fakePost(channelId)
        );
        const post1a = await Client4.createPost(
            {...TestHelper.fakePost(channelId), root_id: post1.id}
        );
        const post2 = await Client4.createPost(
            TestHelper.fakePost(channelId)
        );
        const post3 = await Client4.createPost(
            TestHelper.fakePost(channelId)
        );
        const post3a = await Client4.createPost(
            {...TestHelper.fakePost(channelId), root_id: post3.id}
        );

        await Actions.getPosts(
            channelId
        )(store.dispatch, store.getState);

        const state = store.getState();
        const getRequest = state.requests.posts.getPosts;
        const {posts, postsByChannel} = state.entities.posts;

        if (getRequest.status === RequestStatus.FAILURE) {
            throw new Error(JSON.stringify(getRequest.error));
        }

        assert.ok(posts);
        assert.ok(postsByChannel);

        const postsInChannel = postsByChannel[channelId];
        assert.ok(postsInChannel);
        assert.equal(postsInChannel[0], post3a.id, 'wrong order for post3a');
        assert.equal(postsInChannel[1], post3.id, 'wrong order for post3');
        assert.equal(postsInChannel[3], post1a.id, 'wrong order for post1a');

        assert.ok(posts[post1.id]);
        assert.ok(posts[post1a.id]);
        assert.ok(posts[post2.id]);
        assert.ok(posts[post3.id]);
        assert.ok(posts[post3a.id]);
    });

    it('getPostsSince', async () => {
        const channelId = TestHelper.basicChannel.id;

        const post1 = await Client4.createPost(
            TestHelper.fakePost(channelId)
        );
        await Client4.createPost(
            {...TestHelper.fakePost(channelId), root_id: post1.id}
        );
        const post2 = await Client4.createPost(
            TestHelper.fakePost(channelId)
        );
        const post3 = await Client4.createPost(
            TestHelper.fakePost(channelId)
        );
        const post3a = await Client4.createPost(
            {...TestHelper.fakePost(channelId), root_id: post3.id}
        );

        await Actions.getPostsSince(
            channelId,
            post2.create_at
        )(store.dispatch, store.getState);

        const state = store.getState();
        const getRequest = state.requests.posts.getPostsSince;
        const {posts, postsByChannel} = state.entities.posts;

        if (getRequest.status === RequestStatus.FAILURE) {
            throw new Error(JSON.stringify(getRequest.error));
        }

        assert.ok(posts);
        assert.ok(postsByChannel);

        const postsInChannel = postsByChannel[channelId];
        assert.ok(postsInChannel);
        assert.equal(postsInChannel[0], post3a.id, 'wrong order for post3a');
        assert.equal(postsInChannel[1], post3.id, 'wrong order for post3');
        assert.equal(postsInChannel.length, 2, 'wrong size');
    });

    it('getPostsBefore', async () => {
        const channelId = TestHelper.basicChannel.id;

        const post1 = await Client4.createPost(
            TestHelper.fakePost(channelId)
        );
        const post1a = await Client4.createPost(
            {...TestHelper.fakePost(channelId), root_id: post1.id}
        );
        const post2 = await Client4.createPost(
            TestHelper.fakePost(channelId)
        );
        const post3 = await Client4.createPost(
            TestHelper.fakePost(channelId)
        );
        await Client4.createPost(
            {...TestHelper.fakePost(channelId), root_id: post3.id}
        );

        await Actions.getPostsBefore(
            channelId,
            post2.id,
            0,
            10
        )(store.dispatch, store.getState);

        const state = store.getState();
        const getRequest = state.requests.posts.getPostsBefore;
        const {posts, postsByChannel} = state.entities.posts;

        if (getRequest.status === RequestStatus.FAILURE) {
            throw new Error(JSON.stringify(getRequest.error));
        }

        assert.ok(posts);
        assert.ok(postsByChannel);

        const postsInChannel = postsByChannel[channelId];
        assert.ok(postsInChannel);
        assert.equal(postsInChannel[0], post1a.id, 'wrong order for post1a');
        assert.equal(postsInChannel[1], post1.id, 'wrong order for post1');
        assert.equal(postsInChannel.length, 10, 'wrong size');
    });

    it('getPostsAfter', async () => {
        const channelId = TestHelper.basicChannel.id;

        const post1 = await Client4.createPost(
            TestHelper.fakePost(channelId)
        );
        await Client4.createPost(
            {...TestHelper.fakePost(channelId), root_id: post1.id}
        );
        const post2 = await Client4.createPost(
            TestHelper.fakePost(channelId)
        );
        const post3 = await Client4.createPost(
            TestHelper.fakePost(channelId)
        );
        const post3a = await Client4.createPost(
            {...TestHelper.fakePost(channelId), root_id: post3.id}
        );

        await Actions.getPostsAfter(
            channelId,
            post2.id,
            0,
            10
        )(store.dispatch, store.getState);

        const state = store.getState();
        const getRequest = state.requests.posts.getPostsAfter;
        const {posts, postsByChannel} = state.entities.posts;

        if (getRequest.status === RequestStatus.FAILURE) {
            throw new Error(JSON.stringify(getRequest.error));
        }

        assert.ok(posts);
        assert.ok(postsByChannel);

        const postsInChannel = postsByChannel[channelId];
        assert.ok(postsInChannel);
        assert.equal(postsInChannel[0], post3a.id, 'wrong order for post3a');
        assert.equal(postsInChannel[1], post3.id, 'wrong order for post3');
        assert.equal(postsInChannel.length, 2, 'wrong size');
    });

    it('flagPost', async () => {
        const {dispatch, getState} = store;
        const channelId = TestHelper.basicChannel.id;
        await TestHelper.basicClient4.logout();
        await login(TestHelper.basicUser.email, 'password1')(store.dispatch, store.getState);

        const post1 = await Client4.createPost(
            TestHelper.fakePost(channelId)
        );

        await Actions.flagPost(post1.id)(dispatch, getState);
        const state = getState();
        const prefKey = getPreferenceKey(Preferences.CATEGORY_FLAGGED_POST, post1.id);
        const preference = state.entities.preferences.myPreferences[prefKey];
        assert.ok(preference);
    });

    it('unflagPost', async () => {
        const {dispatch, getState} = store;
        const channelId = TestHelper.basicChannel.id;
        await TestHelper.basicClient4.logout();
        await login(TestHelper.basicUser.email, 'password1')(store.dispatch, store.getState);

        const post1 = await Client4.createPost(
            TestHelper.fakePost(channelId)
        );

        await Actions.flagPost(post1.id)(dispatch, getState);
        let state = getState();
        const prefKey = getPreferenceKey(Preferences.CATEGORY_FLAGGED_POST, post1.id);
        const preference = state.entities.preferences.myPreferences[prefKey];
        assert.ok(preference);

        await Actions.unflagPost(post1.id)(dispatch, getState);
        state = getState();
        const unflagged = state.entities.preferences.myPreferences[prefKey];
        assert.ifError(unflagged);
    });
});
