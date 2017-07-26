// Copyright (c) 2016 Mattermost, Inc. All Rights Reserved.
// See License.txt for license information.

import assert from 'assert';
import nock from 'nock';

import * as Actions from 'actions/posts';
import {login} from 'actions/users';
import {Client, Client4} from 'client';
import {Preferences, Posts, RequestStatus} from 'constants';
import {PostTypes} from 'action_types';
import TestHelper from 'test/test_helper';
import configureStore from 'test/test_store';
import {getPreferenceKey} from 'utils/preference_utils';

describe('Actions.Posts', () => {
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

    it('createPost', async () => {
        const channelId = TestHelper.basicChannel.id;
        const post = TestHelper.fakePost(channelId);

        await Actions.createPost(post)(store.dispatch, store.getState);

        const state = store.getState();
        const createRequest = state.requests.posts.createPost;
        if (createRequest.status === RequestStatus.FAILURE) {
            throw new Error(JSON.stringify(createRequest.error));
        }

        const {posts, postsInChannel} = state.entities.posts;
        assert.ok(posts);
        assert.ok(postsInChannel);
        assert.ok(postsInChannel[channelId]);

        let found = false;
        for (const storedPost of Object.values(posts)) {
            if (storedPost.message === post.message) {
                found = true;
                break;
            }
        }
        assert.ok(found, 'failed to find new post in posts');

        found = false;
        for (const postIdInChannel of postsInChannel[channelId]) {
            if (posts[postIdInChannel].message === post.message) {
                found = true;
                break;
            }
        }
        assert.ok(found, 'failed to find new post in postsInChannel');
    });

    it('createPost with file attachments', async () => {
        const channelId = TestHelper.basicChannel.id;
        const post = TestHelper.fakePost(channelId);
        const files = TestHelper.fakeFiles(3);

        await Actions.createPost(
            post,
            files
        )(store.dispatch, store.getState);

        const state = store.getState();
        const createRequest = state.requests.posts.createPost;
        if (createRequest.status === RequestStatus.FAILURE) {
            throw new Error(JSON.stringify(createRequest.error));
        }

        let newPost;
        for (const storedPost of Object.values(state.entities.posts.posts)) {
            if (storedPost.message === post.message) {
                newPost = storedPost;
                break;
            }
        }
        assert.ok(newPost, 'failed to find new post in posts');

        let found = true;
        for (const file of files) {
            if (!state.entities.files.files[file.id]) {
                found = false;
                break;
            }
        }
        assert.ok(found, 'failed to find uploaded files in files');

        const postIdForFiles = state.entities.files.fileIdsByPostId[newPost.id];
        assert.ok(postIdForFiles, 'failed to find files for post id in files Ids by post id');

        assert.equal(postIdForFiles.length, files.length);
    });

    it('retry failed post', async () => {
        const channelId = TestHelper.basicChannel.id;
        const post = TestHelper.fakePost(channelId);

        TestHelper.activateMocking();
        nock(Client4.getBaseRoute()).
        post('/posts').
        reply(400);
        await Actions.createPost(post)(store.dispatch, store.getState);

        await TestHelper.wait(200);
        nock.restore();

        let state = store.getState();

        const {posts} = state.entities.posts;
        assert.ok(posts);

        let failedPost;
        for (const storedPost of Object.values(posts)) {
            if (storedPost.failed) {
                failedPost = storedPost;
                break;
            }
        }

        assert.ok(failedPost, 'failed to find failed post');

        // Retry the post
        const {id, failed, ...retryPost} = failedPost; // eslint-disable-line
        await Actions.createPost(retryPost)(store.dispatch, store.getState);

        await TestHelper.wait(200);

        state = store.getState();
        const {posts: nextPosts} = state.entities.posts;

        let found = false;
        for (const storedPost of Object.values(nextPosts)) {
            if (storedPost.pending_post_id === failedPost.pending_post_id) {
                if (!storedPost.failed) {
                    found = true;
                    break;
                }
            }
        }

        assert.ok(found, 'Retried post failed again.');
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
        const created = initialPosts.posts[initialPosts.postsInChannel[channelId][0]];

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

    it('deletePostWithReaction', async () => {
        await login(TestHelper.basicUser.email, 'password1')(store.dispatch, store.getState);

        const post1 = await Client4.createPost(
            TestHelper.fakePost(TestHelper.basicChannel.id)
        );

        const emojiName = '+1';

        await Actions.addReaction(post1.id, emojiName)(store.dispatch, store.getState);

        let reactions = store.getState().entities.posts.reactions;
        assert.ok(reactions);
        assert.ok(reactions[post1.id]);
        assert.ok(reactions[post1.id][TestHelper.basicUser.id + '-' + emojiName]);

        await Actions.deletePost(post1)(store.dispatch, store.getState);

        reactions = store.getState().entities.posts.reactions;
        assert.ok(reactions);
        assert.ok(!reactions[post1.id]);
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

        const postsCount = store.getState().entities.posts.postsInChannel[channelId].length;

        await Actions.removePost(
            TestHelper.basicPost
        )(store.dispatch, store.getState);

        const {posts, postsInChannel} = store.getState().entities.posts;

        assert.ok(posts);
        assert.ok(postsInChannel);
        assert.ok(postsInChannel[channelId]);

        // this should count that the basic post and post1a were removed
        assert.equal(postsInChannel[channelId].length, postsCount - 2);
        assert.ok(!posts[postId]);
        assert.ok(!posts[post1a.id]);
    });

    it('removePostWithReaction', async () => {
        await login(TestHelper.basicUser.email, 'password1')(store.dispatch, store.getState);

        const post1 = await Client4.createPost(
            TestHelper.fakePost(TestHelper.basicChannel.id)
        );

        const emojiName = '+1';

        await Actions.addReaction(post1.id, emojiName)(store.dispatch, store.getState);

        let reactions = store.getState().entities.posts.reactions;
        assert.ok(reactions);
        assert.ok(reactions[post1.id]);
        assert.ok(reactions[post1.id][TestHelper.basicUser.id + '-' + emojiName]);

        await Actions.removePost(post1)(store.dispatch, store.getState);

        reactions = store.getState().entities.posts.reactions;
        assert.ok(reactions);
        assert.ok(!reactions[post1.id]);
    });

    it('getPostThread', async () => {
        const channelId = TestHelper.basicChannel.id;

        const post = await Client4.createPost(
            TestHelper.fakePost(channelId)
        );

        await Actions.getPostThread(post.id)(store.dispatch, store.getState);

        const state = store.getState();
        const getRequest = state.requests.posts.getPostThread;
        const {posts, postsInChannel} = state.entities.posts;

        if (getRequest.status === RequestStatus.FAILURE) {
            throw new Error(JSON.stringify(getRequest.error));
        }

        assert.ok(posts);
        assert.ok(postsInChannel);
        assert.ok(postsInChannel[channelId]);

        assert.ok(posts[post.id]);

        let found = false;
        for (const postIdInChannel of postsInChannel[channelId]) {
            if (postIdInChannel === post.id) {
                found = true;
                break;
            }
        }
        assert.ok(found, 'failed to find post in postsInChannel');
    });

    it('getPostThreadWithRetry', async () => {
        const channelId = TestHelper.basicChannel.id;

        const post = await Client4.createPost(
            TestHelper.fakePost(channelId)
        );

        TestHelper.activateMocking();
        nock(Client4.getBaseRoute()).post('/posts').reply(400);

        await Actions.getPostThreadWithRetry(post.id)(store.dispatch, store.getState);

        nock.restore();

        await TestHelper.wait(300);

        const state = store.getState();
        const getRequest = state.requests.posts.getPostThread;
        const {posts, postsInChannel} = state.entities.posts;

        if (getRequest.status === RequestStatus.FAILURE) {
            throw new Error(JSON.stringify(getRequest.error));
        }

        assert.ok(posts);
        assert.ok(postsInChannel);
        assert.ok(postsInChannel[channelId]);

        assert.ok(posts[post.id]);

        let found = false;
        for (const postIdInChannel of postsInChannel[channelId]) {
            if (postIdInChannel === post.id) {
                found = true;
                break;
            }
        }
        assert.ok(found, 'failed to find post in postsInChannel');
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
        const {posts, postsInChannel} = state.entities.posts;

        if (getRequest.status === RequestStatus.FAILURE) {
            throw new Error(JSON.stringify(getRequest.error));
        }

        assert.ok(posts);
        assert.ok(postsInChannel);

        const postsForChannel = postsInChannel[channelId];
        assert.ok(postsForChannel);
        assert.equal(postsForChannel[0], post3a.id, 'wrong order for post3a');
        assert.equal(postsForChannel[1], post3.id, 'wrong order for post3');
        assert.equal(postsForChannel[3], post1a.id, 'wrong order for post1a');

        assert.ok(posts[post1.id]);
        assert.ok(posts[post1a.id]);
        assert.ok(posts[post2.id]);
        assert.ok(posts[post3.id]);
        assert.ok(posts[post3a.id]);
    });

    it('getPostsWithRetry', async () => {
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

        TestHelper.activateMocking();
        nock(Client4.getBaseRoute()).post('/posts').reply(400);

        Actions.getPostsWithRetry(
            channelId
        )(store.dispatch, store.getState);

        nock.restore();

        await TestHelper.wait(300); // wait for retry action to complete after 200ms

        const state = store.getState();
        const getRequest = state.requests.posts.getPosts;
        const {posts, postsInChannel} = state.entities.posts;

        if (getRequest.status === RequestStatus.FAILURE) {
            throw new Error(JSON.stringify(getRequest.error));
        }

        assert.ok(posts);
        assert.ok(postsInChannel);

        const postsForChannel = postsInChannel[channelId];
        assert.ok(postsForChannel);
        assert.equal(postsForChannel[0], post3a.id, 'wrong order for post3a');
        assert.equal(postsForChannel[1], post3.id, 'wrong order for post3');
        assert.equal(postsForChannel[3], post1a.id, 'wrong order for post1a');

        assert.ok(posts[post1.id]);
        assert.ok(posts[post1a.id]);
        assert.ok(posts[post2.id]);
        assert.ok(posts[post3.id]);
        assert.ok(posts[post3a.id]);
    });

    it('getNeededAtMentionedUsernames', async () => {
        const state = {
            entities: {
                users: {
                    profiles: {
                        1: {
                            id: '1',
                            username: 'aaa'
                        }
                    }
                }
            }
        };

        assert.deepEqual(
            Actions.getNeededAtMentionedUsernames(state, {
                abcd: {message: 'aaa'}
            }),
            new Set()
        );

        assert.deepEqual(
            Actions.getNeededAtMentionedUsernames(state, {
                abcd: {message: '@aaa'}
            }),
            new Set()
        );

        assert.deepEqual(
            Actions.getNeededAtMentionedUsernames(state, {
                abcd: {message: '@aaa @bbb @ccc'}
            }),
            new Set(['bbb', 'ccc'])
        );

        assert.deepEqual(
            Actions.getNeededAtMentionedUsernames(state, {
                abcd: {message: '@bbb. @ccc.ddd'}
            }),
            new Set(['bbb.', 'bbb', 'ccc.ddd'])
        );

        assert.deepEqual(
            Actions.getNeededAtMentionedUsernames(state, {
                abcd: {message: '@bbb- @ccc-ddd'}
            }),
            new Set(['bbb-', 'bbb', 'ccc-ddd'])
        );

        assert.deepEqual(
            Actions.getNeededAtMentionedUsernames(state, {
                abcd: {message: '@bbb_ @ccc_ddd'}
            }),
            new Set(['bbb_', 'ccc_ddd'])
        );

        assert.deepEqual(
            Actions.getNeededAtMentionedUsernames(state, {
                abcd: {message: '(@bbb/@ccc) ddd@eee'}
            }),
            new Set(['bbb', 'ccc'])
        );

        assert.deepEqual(
            Actions.getNeededAtMentionedUsernames(state, {
                abcd: {message: '@all'},
                abcd1: {message: '@here'},
                abcd2: {message: '@channel'},
                abcd3: {message: '@all.'},
                abcd4: {message: '@here.'},
                abcd5: {message: '@channel.'}
            }),
            new Set(),
            'should never try to request usernames matching special mentions'
        );
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
        const {posts, postsInChannel} = state.entities.posts;

        if (getRequest.status === RequestStatus.FAILURE) {
            throw new Error(JSON.stringify(getRequest.error));
        }

        assert.ok(posts);
        assert.ok(postsInChannel);

        const postsForChannel = postsInChannel[channelId];
        assert.ok(postsForChannel);
        assert.equal(postsForChannel[0], post3a.id, 'wrong order for post3a');
        assert.equal(postsForChannel[1], post3.id, 'wrong order for post3');
        assert.equal(postsForChannel.length, 2, 'wrong size');
    });

    it('getPostsSinceWithRetry', async () => {
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

        TestHelper.activateMocking();
        nock(Client4.getBaseRoute()).post('/posts').reply(400);

        Actions.getPostsSinceWithRetry(
            channelId,
            post2.create_at
        )(store.dispatch, store.getState);

        nock.restore();

        await TestHelper.wait(300);

        const state = store.getState();
        const getRequest = state.requests.posts.getPostsSince;
        const {posts, postsInChannel} = state.entities.posts;

        if (getRequest.status === RequestStatus.FAILURE) {
            throw new Error(JSON.stringify(getRequest.error));
        }

        assert.ok(posts);
        assert.ok(postsInChannel);

        const postsForChannel = postsInChannel[channelId];
        assert.ok(postsForChannel);
        assert.equal(postsForChannel[0], post3a.id, 'wrong order for post3a');
        assert.equal(postsForChannel[1], post3.id, 'wrong order for post3');
        assert.equal(postsForChannel.length, 2, 'wrong size');
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
        const {posts, postsInChannel} = state.entities.posts;

        if (getRequest.status === RequestStatus.FAILURE) {
            throw new Error(JSON.stringify(getRequest.error));
        }

        assert.ok(posts);
        assert.ok(postsInChannel);

        const postsForChannel = postsInChannel[channelId];
        assert.ok(postsForChannel);
        assert.equal(postsForChannel[0], post1a.id, 'wrong order for post1a');
        assert.equal(postsForChannel[1], post1.id, 'wrong order for post1');
        assert.equal(postsForChannel.length, 10, 'wrong size');
    });

    it('getPostsBeforeWithRetry', async () => {
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

        TestHelper.activateMocking();
        nock(Client4.getBaseRoute()).post('/posts').reply(400);

        Actions.getPostsBeforeWithRetry(
            channelId,
            post2.id,
            0,
            10
        )(store.dispatch, store.getState);

        nock.restore();

        await TestHelper.wait(300);

        const state = store.getState();
        const getRequest = state.requests.posts.getPostsBefore;
        const {posts, postsInChannel} = state.entities.posts;

        if (getRequest.status === RequestStatus.FAILURE) {
            throw new Error(JSON.stringify(getRequest.error));
        }

        assert.ok(posts);
        assert.ok(postsInChannel);

        const postsForChannel = postsInChannel[channelId];
        assert.ok(postsForChannel);
        assert.equal(postsForChannel[0], post1a.id, 'wrong order for post1a');
        assert.equal(postsForChannel[1], post1.id, 'wrong order for post1');
        assert.equal(postsForChannel.length, 10, 'wrong size');
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
        const {posts, postsInChannel} = state.entities.posts;

        if (getRequest.status === RequestStatus.FAILURE) {
            throw new Error(JSON.stringify(getRequest.error));
        }

        assert.ok(posts);
        assert.ok(postsInChannel);

        const postsForChannel = postsInChannel[channelId];
        assert.ok(postsForChannel);
        assert.equal(postsForChannel[0], post3a.id, 'wrong order for post3a');
        assert.equal(postsForChannel[1], post3.id, 'wrong order for post3');
        assert.equal(postsForChannel.length, 2, 'wrong size');
    });

    it('getPostsAfterWithRetry', async () => {
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

        TestHelper.activateMocking();
        nock(Client4.getBaseRoute()).post('/posts').reply(400);

        Actions.getPostsAfterWithRetry(
            channelId,
            post2.id,
            0,
            10
        )(store.dispatch, store.getState);

        nock.restore();

        await TestHelper.wait(300);

        const state = store.getState();
        const getRequest = state.requests.posts.getPostsAfter;
        const {posts, postsInChannel} = state.entities.posts;

        if (getRequest.status === RequestStatus.FAILURE) {
            throw new Error(JSON.stringify(getRequest.error));
        }

        assert.ok(posts);
        assert.ok(postsInChannel);

        const postsForChannel = postsInChannel[channelId];
        assert.ok(postsForChannel);
        assert.equal(postsForChannel[0], post3a.id, 'wrong order for post3a');
        assert.equal(postsForChannel[1], post3.id, 'wrong order for post3');
        assert.equal(postsForChannel.length, 2, 'wrong size');
    });

    it('flagPost', async () => {
        const {dispatch, getState} = store;
        const channelId = TestHelper.basicChannel.id;
        await TestHelper.basicClient4.logout();
        await login(TestHelper.basicUser.email, 'password1')(store.dispatch, store.getState);

        const post1 = await Client4.createPost(
            TestHelper.fakePost(channelId)
        );

        Actions.flagPost(post1.id)(dispatch, getState);
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

        Actions.flagPost(post1.id)(dispatch, getState);
        let state = getState();
        const prefKey = getPreferenceKey(Preferences.CATEGORY_FLAGGED_POST, post1.id);
        const preference = state.entities.preferences.myPreferences[prefKey];
        assert.ok(preference);

        Actions.unflagPost(post1.id)(dispatch, getState);
        state = getState();
        const unflagged = state.entities.preferences.myPreferences[prefKey];
        assert.ifError(unflagged);
    });

    it('pinPost', async () => {
        const {dispatch, getState} = store;

        const post1 = await Client4.createPost(
            TestHelper.fakePost(TestHelper.basicChannel.id)
        );

        await Actions.getPostThread(post1.id)(dispatch, getState);
        await Actions.pinPost(post1.id)(dispatch, getState);

        const editRequest = getState().requests.posts.editPost;

        if (editRequest.status === RequestStatus.FAILURE) {
            throw new Error(JSON.stringify(editRequest.error));
        }

        const state = getState();
        const post = state.entities.posts.posts[post1.id];
        assert.ok(post);
        assert.ok(post.is_pinned === true);
    });

    it('unpinPost', async () => {
        const {dispatch, getState} = store;

        const post1 = await Client4.createPost(
            TestHelper.fakePost(TestHelper.basicChannel.id)
        );

        await Actions.getPostThread(post1.id)(dispatch, getState);
        await Actions.pinPost(post1.id)(dispatch, getState);
        await Actions.unpinPost(post1.id)(dispatch, getState);

        const editRequest = getState().requests.posts.editPost;

        if (editRequest.status === RequestStatus.FAILURE) {
            throw new Error(JSON.stringify(editRequest.error));
        }

        const state = getState();
        const post = state.entities.posts.posts[post1.id];
        assert.ok(post);
        assert.ok(post.is_pinned === false);
    });

    it('addReaction', async () => {
        const {dispatch, getState} = store;

        await login(TestHelper.basicUser.email, 'password1')(dispatch, getState);

        const post1 = await Client4.createPost(
            TestHelper.fakePost(TestHelper.basicChannel.id)
        );

        const emojiName = '+1';

        await Actions.addReaction(post1.id, emojiName)(dispatch, getState);

        const reactionRequest = getState().requests.posts.reaction;

        if (reactionRequest.status === RequestStatus.FAILURE) {
            throw new Error(JSON.stringify(reactionRequest.error));
        }

        const state = getState();
        const reactions = state.entities.posts.reactions[post1.id];
        assert.ok(reactions);
        assert.ok(reactions[TestHelper.basicUser.id + '-' + emojiName]);
    });

    it('removeReaction', async () => {
        const {dispatch, getState} = store;

        await login(TestHelper.basicUser.email, 'password1')(dispatch, getState);

        const post1 = await Client4.createPost(
            TestHelper.fakePost(TestHelper.basicChannel.id)
        );

        const emojiName = '+1';

        await Actions.addReaction(post1.id, emojiName)(dispatch, getState);
        await Actions.removeReaction(post1.id, emojiName)(dispatch, getState);

        const reactionRequest = getState().requests.posts.reaction;

        if (reactionRequest.status === RequestStatus.FAILURE) {
            throw new Error(JSON.stringify(reactionRequest.error));
        }

        const state = getState();
        const reactions = state.entities.posts.reactions[post1.id];
        assert.ok(reactions);
        assert.ok(!reactions[TestHelper.basicUser.id + '-' + emojiName]);
    });

    it('getReactionsForPost', async () => {
        const {dispatch, getState} = store;

        await login(TestHelper.basicUser.email, 'password1')(dispatch, getState);

        const post1 = await Client4.createPost(
            TestHelper.fakePost(TestHelper.basicChannel.id)
        );

        const emojiName = '+1';

        await Actions.addReaction(post1.id, emojiName)(dispatch, getState);

        dispatch({
            type: PostTypes.REACTION_DELETED,
            data: {user_id: TestHelper.basicUser.id, post_id: post1.id, emoji_name: emojiName}
        });

        await Actions.getReactionsForPost(post1.id)(dispatch, getState);

        const reactionRequest = getState().requests.posts.reaction;

        if (reactionRequest.status === RequestStatus.FAILURE) {
            throw new Error(JSON.stringify(reactionRequest.error));
        }

        const state = getState();
        const reactions = state.entities.posts.reactions[post1.id];
        assert.ok(reactions);
        assert.ok(reactions[TestHelper.basicUser.id + '-' + emojiName]);
    });

    it('getOpenGraphMetadata', async () => {
        const {dispatch, getState} = store;

        const url = 'https://about.mattermost.com';

        await Actions.getOpenGraphMetadata(url)(dispatch, getState);

        const openGraphRequest = getState().requests.posts.openGraph;

        if (openGraphRequest.status === RequestStatus.FAILURE) {
            throw new Error(JSON.stringify(openGraphRequest.error));
        }

        const state = getState();
        const metadata = state.entities.posts.openGraph;
        assert.ok(metadata);
        assert.ok(metadata[url]);
    });
});
