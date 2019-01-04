// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import fs from 'fs';
import assert from 'assert';
import nock from 'nock';

import * as Actions from 'actions/posts';
import {login} from 'actions/users';
import {setSystemEmojis, createCustomEmoji} from 'actions/emojis';
import {Client4} from 'client';
import {Preferences, Posts, RequestStatus} from 'constants';
import {PostTypes} from 'action_types';
import TestHelper from 'test/test_helper';
import configureStore from 'test/test_store';
import {getPreferenceKey} from 'utils/preference_utils';

const OK_RESPONSE = {status: 'OK'};

describe('Actions.Posts', () => {
    let store;
    before(async () => {
        await TestHelper.initBasic(Client4);
    });

    beforeEach(async () => {
        store = await configureStore();
    });

    after(async () => {
        await TestHelper.tearDown();
    });

    it('createPost', async () => {
        const channelId = TestHelper.basicChannel.id;
        const post = TestHelper.fakePost(channelId);

        nock(Client4.getPostsRoute()).
            post('').
            reply(201, {...post, id: TestHelper.generateId()});

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

    it('resetCreatePostRequest', async () => {
        const channelId = TestHelper.basicChannel.id;
        const post = TestHelper.fakePost(channelId);
        const createPostError = {
            message: 'Invalid RootId parameter',
            server_error_id: 'api.post.create_post.root_id.app_error',
            status_code: 400,
            url: 'http://localhost:8065/api/v4/posts',
        };

        nock(Client4.getPostsRoute()).
            post('').
            reply(400, createPostError);

        await Actions.createPost(post)(store.dispatch, store.getState);
        await TestHelper.wait(50);

        let state = store.getState();
        let createRequest = state.requests.posts.createPost;
        if (createRequest.status !== RequestStatus.FAILURE) {
            throw new Error(JSON.stringify(createRequest.error));
        }

        assert.equal(createRequest.status, RequestStatus.FAILURE);
        assert.equal(createRequest.error.message, createPostError.message);
        assert.equal(createRequest.error.status_code, createPostError.status_code);

        store.dispatch(Actions.resetCreatePostRequest());
        await TestHelper.wait(50);

        state = store.getState();
        createRequest = state.requests.posts.createPost;
        if (createRequest.status === RequestStatus.FAILURE) {
            throw new Error(JSON.stringify(createRequest.error));
        }

        assert.equal(createRequest.status, RequestStatus.NOT_STARTED);
        assert.equal(createRequest.error, null);
    });

    it('createPost with file attachments', async () => {
        const channelId = TestHelper.basicChannel.id;
        const post = TestHelper.fakePost(channelId);
        const files = TestHelper.fakeFiles(3);

        nock(Client4.getPostsRoute()).
            post('').
            reply(201, {...post, id: TestHelper.generateId(), file_ids: [files[0].id, files[1].id, files[2].id]});

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

    // it('retry failed post', async () => {
    //     if (TestHelper.isLiveServer()) {
    //         console.log('Skipping mock-only test');
    //         return;
    //     }

    //     const channelId = TestHelper.basicChannel.id;
    //     const post = TestHelper.fakePost(channelId);

    //     nock(Client4.getBaseRoute()).
    //         post('/posts').
    //         reply(400, {});

    //     nock(Client4.getPostsRoute()).
    //         post('').
    //         reply(201, {...post, id: TestHelper.generateId()});

    //     await Actions.createPost(post)(store.dispatch, store.getState);

    //     await TestHelper.wait(200);

    //     let state = store.getState();

    //     const {posts} = state.entities.posts;
    //     assert.ok(posts);

    //     let failedPost;
    //     for (const storedPost of Object.values(posts)) {
    //         if (storedPost.failed) {
    //             failedPost = storedPost;
    //             break;
    //         }
    //     }

    //     assert.ok(failedPost, 'failed to find failed post');

    //     // Retry the post
    //     const {id, failed, ...retryPost} = failedPost; // eslint-disable-line
    //     await Actions.createPost(retryPost)(store.dispatch, store.getState);

    //     await TestHelper.wait(500);

    //     state = store.getState();
    //     const {posts: nextPosts} = state.entities.posts;

    //     let found = false;
    //     for (const storedPost of Object.values(nextPosts)) {
    //         if (storedPost.pending_post_id === failedPost.pending_post_id) {
    //             if (!storedPost.failed) {
    //                 found = true;
    //                 break;
    //             }
    //         }
    //     }

    //     assert.ok(found, 'Retried post failed again.');
    // });

    it('editPost', async () => {
        const channelId = TestHelper.basicChannel.id;

        nock(Client4.getPostsRoute()).
            post('').
            reply(201, TestHelper.fakePostWithId(channelId));

        const post = await Client4.createPost(
            TestHelper.fakePost(channelId)
        );
        const message = post.message;

        post.message = `${message} (edited)`;

        nock(Client4.getPostsRoute()).
            put(`/${post.id}/patch`).
            reply(200, post);

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

        nock(Client4.getPostsRoute()).
            post('').
            reply(201, TestHelper.fakePostWithId(channelId));
        await Actions.createPost(TestHelper.fakePost(channelId))(store.dispatch, store.getState);

        const initialPosts = store.getState().entities.posts;
        const created = initialPosts.posts[initialPosts.postsInChannel[channelId][0]];

        await Actions.deletePost(created)(store.dispatch, store.getState);

        const state = store.getState();
        const {posts} = state.entities.posts;

        assert.ok(posts);
        assert.ok(posts[created.id]);

        assert.strictEqual(
            posts[created.id].state,
            Posts.POST_DELETED
        );
    });

    it('deletePostWithReaction', async () => {
        TestHelper.mockLogin();
        await login(TestHelper.basicUser.email, 'password1')(store.dispatch, store.getState);

        nock(Client4.getPostsRoute()).
            post('').
            reply(201, TestHelper.fakePostWithId(TestHelper.basicChannel.id));

        const post1 = await Client4.createPost(
            TestHelper.fakePost(TestHelper.basicChannel.id)
        );

        const emojiName = '+1';

        nock(Client4.getReactionsRoute()).
            post('').
            reply(201, {user_id: TestHelper.basicUser.id, post_id: post1.id, emoji_name: emojiName, create_at: 1508168444721});
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

        nock(Client4.getPostsRoute()).
            post('').
            reply(201, {...TestHelper.fakePostWithId(channelId), root_id: postId});
        const post1a = await Client4.createPost(
            {...TestHelper.fakePost(channelId), root_id: postId}
        );

        const postList = {order: [postId, post1a.id], posts: {}};
        postList.posts[postId] = TestHelper.basicPost;
        postList.posts[post1a.id] = post1a;

        nock(Client4.getChannelsRoute()).
            get(`/${channelId}/posts`).
            query(true).
            reply(200, postList);
        await Actions.getPosts(
            channelId
        )(store.dispatch, store.getState);

        const postsCount = store.getState().entities.posts.postsInChannel[channelId].length;

        await Actions.removePost(
            TestHelper.basicPost
        )(store.dispatch, store.getState);

        const {posts, postsInChannel, postsInThread} = store.getState().entities.posts;

        assert.ok(posts);
        assert.ok(postsInChannel);
        assert.ok(postsInChannel[channelId]);

        // this should count that the basic post and post1a were removed
        assert.equal(postsInChannel[channelId].length, postsCount - 2);
        assert.ok(!posts[postId]);
        assert.ok(!posts[post1a.id]);
        assert.ok(!postsInThread[postId]);
    });

    it('removePostWithReaction', async () => {
        TestHelper.mockLogin();
        await login(TestHelper.basicUser.email, 'password1')(store.dispatch, store.getState);

        nock(Client4.getPostsRoute()).
            post('').
            reply(201, TestHelper.fakePostWithId(TestHelper.basicChannel.id));
        const post1 = await Client4.createPost(
            TestHelper.fakePost(TestHelper.basicChannel.id)
        );

        const emojiName = '+1';

        nock(Client4.getReactionsRoute()).
            post('').
            reply(201, {user_id: TestHelper.basicUser.id, post_id: post1.id, emoji_name: emojiName, create_at: 1508168444721});
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

        nock(Client4.getPostsRoute()).
            post('').
            reply(201, TestHelper.fakePostWithId(channelId));
        const post = await Client4.createPost(
            TestHelper.fakePost(channelId)
        );

        const postList = {order: [post.id], posts: {}};
        postList.posts[post.id] = post;

        nock(Client4.getPostsRoute()).
            get(`/${post.id}/thread`).
            reply(200, postList);
        await Actions.getPostThread(post.id)(store.dispatch, store.getState);

        const state = store.getState();
        const getRequest = state.requests.posts.getPostThread;
        const {posts, postsInChannel} = state.entities.posts;

        if (getRequest.status === RequestStatus.FAILURE) {
            throw new Error(JSON.stringify(getRequest.error));
        }

        assert.ok(posts);
        assert.ok(posts[post.id]);

        let found = false;
        for (const postIdInChannel of postsInChannel[channelId]) {
            if (postIdInChannel === post.id) {
                found = true;
                break;
            }
        }
        assert.ok(!found, 'found post in postsInChannel');
    });

    it('getPostThreadWithRetry', async () => {
        if (TestHelper.isLiveServer()) {
            console.log('Skipping mock-only test');
            return;
        }

        const channelId = TestHelper.basicChannel.id;

        nock(Client4.getPostsRoute()).
            post('').
            reply(201, TestHelper.fakePostWithId(channelId));
        const post = await Client4.createPost(
            TestHelper.fakePost(channelId)
        );

        nock(Client4.getPostsRoute()).get(`/${post.id}/thread`).reply(400, {});

        const postList = {order: [post.id], posts: {}};
        postList.posts[post.id] = post;

        nock(Client4.getPostsRoute()).
            get(`/${post.id}/thread`).
            reply(200, postList);

        await Actions.getPostThreadWithRetry(post.id)(store.dispatch, store.getState);

        await TestHelper.wait(500);

        const state = store.getState();
        const getRequest = state.requests.posts.getPostThread;
        const {posts, postsInChannel} = state.entities.posts;

        if (getRequest.status === RequestStatus.FAILURE) {
            throw new Error(JSON.stringify(getRequest.error));
        }

        assert.ok(posts);
        assert.ok(posts[post.id]);

        let found = false;
        for (const postIdInChannel of postsInChannel[channelId]) {
            if (postIdInChannel === post.id) {
                found = true;
                break;
            }
        }
        assert.ok(!found, 'found post in postsInChannel');
    });

    it('getPosts', async () => {
        const channelId = TestHelper.basicChannel.id;
        const post = TestHelper.basicPost;

        nock(Client4.getPostsRoute()).
            post('').
            reply(201, {...TestHelper.fakePostWithId(TestHelper.basicChannel.id), create_at: post.create_at + 1});
        const post1 = await Client4.createPost(
            TestHelper.fakePost(channelId)
        );
        nock(Client4.getPostsRoute()).
            post('').
            reply(201, {...TestHelper.fakePostWithId(TestHelper.basicChannel.id), root_id: post1.id, create_at: post.create_at + 2});
        const post1a = await Client4.createPost(
            {...TestHelper.fakePost(channelId), root_id: post1.id}
        );
        nock(Client4.getPostsRoute()).
            post('').
            reply(201, {...TestHelper.fakePostWithId(TestHelper.basicChannel.id), create_at: post.create_at + 3});
        const post2 = await Client4.createPost(
            TestHelper.fakePost(channelId)
        );
        nock(Client4.getPostsRoute()).
            post('').
            reply(201, {...TestHelper.fakePostWithId(TestHelper.basicChannel.id), create_at: post.create_at + 4});
        const post3 = await Client4.createPost(
            TestHelper.fakePost(channelId)
        );
        nock(Client4.getPostsRoute()).
            post('').
            reply(201, {...TestHelper.fakePostWithId(TestHelper.basicChannel.id), root_id: post3.id, create_at: post.create_at + 5});
        const post3a = await Client4.createPost(
            {...TestHelper.fakePost(channelId), root_id: post3.id}
        );

        const postList = {order: [post3a.id, post3.id, post2.id, post1a.id, post1.id, post.id], posts: {}};
        postList.posts[post.id] = TestHelper.basicPost;
        postList.posts[post1.id] = post1;
        postList.posts[post1a.id] = post1a;
        postList.posts[post2.id] = post2;
        postList.posts[post3.id] = post3;
        postList.posts[post3a.id] = post3a;

        nock(Client4.getChannelsRoute()).
            get(`/${channelId}/posts`).
            query(true).
            reply(200, postList);
        await Actions.getPosts(
            channelId
        )(store.dispatch, store.getState);

        const state = store.getState();
        const {posts, postsInChannel, postsInThread} = state.entities.posts;

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

        let postsForThread = postsInThread[post1.id];
        assert.ok(postsForThread);
        assert.ok(postsForThread.includes(post1a.id));

        postsForThread = postsInThread[post3.id];
        assert.ok(postsForThread);
        assert.ok(postsForThread.includes(post3a.id));
    });

    it('getPostsWithRetry', async () => {
        if (TestHelper.isLiveServer()) {
            console.log('Skipping mock-only test');
            return;
        }

        const channelId = TestHelper.basicChannel.id;
        const post = TestHelper.basicPost;

        nock(Client4.getPostsRoute()).
            post('').
            reply(201, {...TestHelper.fakePostWithId(TestHelper.basicChannel.id), create_at: post.create_at + 1});
        const post1 = await Client4.createPost(
            TestHelper.fakePost(channelId)
        );
        nock(Client4.getPostsRoute()).
            post('').
            reply(201, {...TestHelper.fakePostWithId(TestHelper.basicChannel.id), root_id: post1.id, create_at: post.create_at + 2});
        const post1a = await Client4.createPost(
            {...TestHelper.fakePost(channelId), root_id: post1.id}
        );
        nock(Client4.getPostsRoute()).
            post('').
            reply(201, {...TestHelper.fakePostWithId(TestHelper.basicChannel.id), create_at: post.create_at + 3});
        const post2 = await Client4.createPost(
            TestHelper.fakePost(channelId)
        );
        nock(Client4.getPostsRoute()).
            post('').
            reply(201, {...TestHelper.fakePostWithId(TestHelper.basicChannel.id), create_at: post.create_at + 4});
        const post3 = await Client4.createPost(
            TestHelper.fakePost(channelId)
        );
        nock(Client4.getPostsRoute()).
            post('').
            reply(201, {...TestHelper.fakePostWithId(TestHelper.basicChannel.id), root_id: post3.id, create_at: post.create_at + 5});
        const post3a = await Client4.createPost(
            {...TestHelper.fakePost(channelId), root_id: post3.id}
        );

        nock(Client4.getChannelsRoute()).get(`/${channelId}/posts`).query(true).reply(400, {});

        const postList = {order: [post3a.id, post3.id, post2.id, post1a.id, post1.id, post.id], posts: {}};
        postList.posts[post.id] = TestHelper.basicPost;
        postList.posts[post1.id] = post1;
        postList.posts[post1a.id] = post1a;
        postList.posts[post2.id] = post2;
        postList.posts[post3.id] = post3;
        postList.posts[post3a.id] = post3a;

        nock(Client4.getChannelsRoute()).
            get(`/${channelId}/posts`).
            query(true).
            reply(200, postList);

        Actions.getPostsWithRetry(
            channelId
        )(store.dispatch, store.getState);

        await TestHelper.wait(500); // wait for retry action to complete after 200ms

        const state = store.getState();
        const {posts, postsInChannel, postsInThread} = state.entities.posts;

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

        let postsForThread = postsInThread[post1.id];
        assert.ok(postsForThread);
        assert.ok(postsForThread.includes(post1a.id));

        postsForThread = postsInThread[post3.id];
        assert.ok(postsForThread);
        assert.ok(postsForThread.includes(post3a.id));
    });

    it('getNeededAtMentionedUsernames', async () => {
        const state = {
            entities: {
                users: {
                    profiles: {
                        1: {
                            id: '1',
                            username: 'aaa',
                        },
                    },
                },
            },
        };

        assert.deepEqual(
            Actions.getNeededAtMentionedUsernames(state, [
                {message: 'aaa'},
            ]),
            new Set()
        );

        assert.deepEqual(
            Actions.getNeededAtMentionedUsernames(state, [
                {message: '@aaa'},
            ]),
            new Set()
        );

        assert.deepEqual(
            Actions.getNeededAtMentionedUsernames(state, [
                {message: '@aaa @bbb @ccc'},
            ]),
            new Set(['bbb', 'ccc'])
        );

        assert.deepEqual(
            Actions.getNeededAtMentionedUsernames(state, [
                {message: '@bbb. @ccc.ddd'},
            ]),
            new Set(['bbb.', 'bbb', 'ccc.ddd'])
        );

        assert.deepEqual(
            Actions.getNeededAtMentionedUsernames(state, [
                {message: '@bbb- @ccc-ddd'},
            ]),
            new Set(['bbb-', 'bbb', 'ccc-ddd'])
        );

        assert.deepEqual(
            Actions.getNeededAtMentionedUsernames(state, [
                {message: '@bbb_ @ccc_ddd'},
            ]),
            new Set(['bbb_', 'ccc_ddd'])
        );

        assert.deepEqual(
            Actions.getNeededAtMentionedUsernames(state, [
                {message: '(@bbb/@ccc) ddd@eee'},
            ]),
            new Set(['bbb', 'ccc'])
        );

        assert.deepEqual(
            Actions.getNeededAtMentionedUsernames(state, [
                {message: '@all'},
                {message: '@here'},
                {message: '@channel'},
                {message: '@all.'},
                {message: '@here.'},
                {message: '@channel.'},
            ]),
            new Set(),
            'should never try to request usernames matching special mentions'
        );
    });

    describe('getNeededCustomEmojis', async () => {
        const state = {
            entities: {
                emojis: {
                    customEmoji: {
                        1: {
                            id: '1',
                            creator_id: '1',
                            name: 'name1',
                        },
                    },
                    nonExistentEmoji: new Set(['name2']),
                },
                general: {
                    config: {
                        EnableCustomEmoji: 'true',
                    },
                },
            },
        };

        setSystemEmojis(new Map([['systemEmoji1', {}]]));

        it('no emojis in post', () => {
            assert.deepEqual(
                Actions.getNeededCustomEmojis(state, [
                    {message: 'aaa'},
                ]),
                new Set()
            );
        });

        it('already loaded custom emoji in post', () => {
            assert.deepEqual(
                Actions.getNeededCustomEmojis(state, [
                    {message: ':name1:'},
                ]),
                new Set()
            );
        });

        it('system emoji in post', () => {
            assert.deepEqual(
                Actions.getNeededCustomEmojis(state, [
                    {message: ':systemEmoji1:'},
                ]),
                new Set()
            );
        });

        it('mixed emojis in post', () => {
            assert.deepEqual(
                Actions.getNeededCustomEmojis(state, [
                    {message: ':systemEmoji1: :name1: :name2: :name3:'},
                ]),
                new Set(['name3'])
            );
        });

        it('custom emojis and text in post', () => {
            assert.deepEqual(
                Actions.getNeededCustomEmojis(state, [
                    {message: 'aaa :name3: :name4:'},
                ]),
                new Set(['name3', 'name4'])
            );
        });

        it('custom emoji followed by punctuation', () => {
            assert.deepEqual(
                Actions.getNeededCustomEmojis(state, [
                    {message: ':name3:!'},
                ]),
                new Set(['name3'])
            );
        });

        it('custom emoji including hyphen', () => {
            assert.deepEqual(
                Actions.getNeededCustomEmojis(state, [
                    {message: ':name-3:'},
                ]),
                new Set(['name-3'])
            );
        });

        it('custom emoji including underscore', () => {
            assert.deepEqual(
                Actions.getNeededCustomEmojis(state, [
                    {message: ':name_3:'},
                ]),
                new Set(['name_3'])
            );
        });

        it('custom emoji in message attachment text', () => {
            assert.deepEqual(
                Actions.getNeededCustomEmojis(state, [
                    {message: '', props: {attachments: [{text: ':name3:'}]}},
                ]),
                new Set(['name3'])
            );
        });

        it('custom emoji in message attachment pretext', () => {
            assert.deepEqual(
                Actions.getNeededCustomEmojis(state, [
                    {message: '', props: {attachments: [{pretext: ':name3:'}]}},
                ]),
                new Set(['name3'])
            );
        });

        it('custom emoji in message attachment field', () => {
            assert.deepEqual(
                Actions.getNeededCustomEmojis(state, [
                    {message: '', props: {attachments: [{fields: [{value: ':name3:'}]}]}},
                ]),
                new Set(['name3'])
            );
        });

        it('mixed emojis in message attachment', () => {
            assert.deepEqual(
                Actions.getNeededCustomEmojis(state, [
                    {message: '', props: {attachments: [{text: ':name4: :name1:', pretext: ':name3: :systemEmoji1:', fields: [{value: ':name3:'}]}]}},
                ]),
                new Set(['name3', 'name4'])
            );
        });

        it('empty message attachment field', () => {
            assert.deepEqual(
                Actions.getNeededCustomEmojis(state, [
                    {message: '', props: {attachments: [{fields: [{}]}]}},
                ]),
                new Set([])
            );
        });

        it('null message attachment contents', () => {
            assert.deepEqual(
                Actions.getNeededCustomEmojis(state, [
                    {message: '', props: {attachments: [{text: null, pretext: null, fields: null}]}},
                ]),
                new Set([])
            );
        });

        it('null message attachment', () => {
            assert.deepEqual(
                Actions.getNeededCustomEmojis(state, [
                    {message: '', props: {attachments: null}},
                ]),
                new Set([])
            );
        });

        it('multiple posts', () => {
            assert.deepEqual(
                Actions.getNeededCustomEmojis(state, [
                    {message: ':emoji3:'},
                    {message: ':emoji4:'},
                ]),
                new Set(['emoji3', 'emoji4'])
            );
        });

        it('with custom emojis disabled', () => {
            assert.deepEqual(
                Actions.getNeededCustomEmojis({
                    entities: {
                        ...state.entities,
                        general: {
                            config: {
                                EnableCustomEmoji: 'false',
                            },
                        },
                    },
                }, [
                    {message: ':emoji3:'},
                ]),
                new Set([])
            );
        });

        it('do not load emojis when the post has metadata', () => {
            assert.deepEqual(
                Actions.getNeededCustomEmojis(state, [
                    {
                        message: ':emoji3:',
                        metadata: {
                            emojis: [{name: 'emoji3'}],
                        },
                    },
                ]),
                new Set([])
            );
        });
    });

    it('getPostsSince', async () => {
        const channelId = TestHelper.basicChannel.id;
        const post = TestHelper.basicPost;

        nock(Client4.getPostsRoute()).
            post('').
            reply(201, {...TestHelper.fakePostWithId(TestHelper.basicChannel.id), create_at: post.create_at + 1});
        const post1 = await Client4.createPost(
            TestHelper.fakePost(channelId)
        );
        nock(Client4.getPostsRoute()).
            post('').
            reply(201, {...TestHelper.fakePostWithId(TestHelper.basicChannel.id), create_at: post.create_at + 2, root_id: post1.id});
        await Client4.createPost(
            {...TestHelper.fakePost(channelId), root_id: post1.id}
        );
        nock(Client4.getPostsRoute()).
            post('').
            reply(201, {...TestHelper.fakePostWithId(TestHelper.basicChannel.id), create_at: post.create_at + 3});
        const post2 = await Client4.createPost(
            TestHelper.fakePost(channelId)
        );
        nock(Client4.getPostsRoute()).
            post('').
            reply(201, {...TestHelper.fakePostWithId(TestHelper.basicChannel.id), create_at: post.create_at + 4});
        const post3 = await Client4.createPost(
            TestHelper.fakePost(channelId)
        );
        nock(Client4.getPostsRoute()).
            post('').
            reply(201, {...TestHelper.fakePostWithId(TestHelper.basicChannel.id), create_at: post.create_at + 5});
        const post3a = await Client4.createPost(
            {...TestHelper.fakePost(channelId), root_id: post3.id}
        );

        const postList = {order: [post3a.id, post3.id], posts: {}};
        postList.posts[post3.id] = post3;
        postList.posts[post3a.id] = post3a;

        nock(Client4.getChannelsRoute()).
            get(`/${channelId}/posts`).
            query(true).
            reply(200, postList);
        await Actions.getPostsSince(
            channelId,
            post2.create_at
        )(store.dispatch, store.getState);

        const state = store.getState();
        const {posts, postsInChannel} = state.entities.posts;

        assert.ok(posts);
        assert.ok(postsInChannel);

        const postsForChannel = postsInChannel[channelId];
        assert.ok(postsForChannel);
        assert.equal(postsForChannel[0], post3a.id, 'wrong order for post3a');
        assert.equal(postsForChannel[1], post3.id, 'wrong order for post3');
        assert.equal(postsForChannel.length, 2, 'wrong size');
    });

    it('getPostsSinceWithRetry', async () => {
        if (TestHelper.isLiveServer()) {
            console.log('Skipping mock-only test');
            return;
        }

        const channelId = TestHelper.basicChannel.id;
        const post = TestHelper.basicPost;

        nock(Client4.getPostsRoute()).
            post('').
            reply(201, {...TestHelper.fakePostWithId(TestHelper.basicChannel.id), create_at: post.create_at + 1});
        const post1 = await Client4.createPost(
            TestHelper.fakePost(channelId)
        );
        nock(Client4.getPostsRoute()).
            post('').
            reply(201, {...TestHelper.fakePostWithId(TestHelper.basicChannel.id), create_at: post.create_at + 2, root_id: post1.id});
        await Client4.createPost(
            {...TestHelper.fakePost(channelId), root_id: post1.id}
        );
        nock(Client4.getPostsRoute()).
            post('').
            reply(201, {...TestHelper.fakePostWithId(TestHelper.basicChannel.id), create_at: post.create_at + 3});
        const post2 = await Client4.createPost(
            TestHelper.fakePost(channelId)
        );
        nock(Client4.getPostsRoute()).
            post('').
            reply(201, {...TestHelper.fakePostWithId(TestHelper.basicChannel.id), create_at: post.create_at + 4});
        const post3 = await Client4.createPost(
            TestHelper.fakePost(channelId)
        );
        nock(Client4.getPostsRoute()).
            post('').
            reply(201, {...TestHelper.fakePostWithId(TestHelper.basicChannel.id), create_at: post.create_at + 5});
        const post3a = await Client4.createPost(
            {...TestHelper.fakePost(channelId), root_id: post3.id}
        );

        nock(Client4.getChannelsRoute()).get(`/${channelId}/posts`).query(true).reply(400, {});

        const postList = {order: [post3a.id, post3.id], posts: {}};
        postList.posts[post3.id] = post3;
        postList.posts[post3a.id] = post3a;

        nock(Client4.getChannelsRoute()).
            get(`/${channelId}/posts`).
            query(true).
            reply(200, postList);

        Actions.getPostsSinceWithRetry(
            channelId,
            post2.create_at
        )(store.dispatch, store.getState);

        await TestHelper.wait(300);

        const state = store.getState();
        const {posts, postsInChannel} = state.entities.posts;

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
        const post = TestHelper.basicPost;

        nock(Client4.getPostsRoute()).
            post('').
            reply(201, {...TestHelper.fakePostWithId(TestHelper.basicChannel.id), create_at: post.create_at + 1});
        const post1 = await Client4.createPost(
            TestHelper.fakePost(channelId)
        );
        nock(Client4.getPostsRoute()).
            post('').
            reply(201, {...TestHelper.fakePostWithId(TestHelper.basicChannel.id), create_at: post.create_at + 2, root_id: post1.id});
        const post1a = await Client4.createPost(
            {...TestHelper.fakePost(channelId), root_id: post1.id}
        );
        nock(Client4.getPostsRoute()).
            post('').
            reply(201, {...TestHelper.fakePostWithId(TestHelper.basicChannel.id), create_at: post.create_at + 3});
        const post2 = await Client4.createPost(
            TestHelper.fakePost(channelId)
        );
        nock(Client4.getPostsRoute()).
            post('').
            reply(201, {...TestHelper.fakePostWithId(TestHelper.basicChannel.id), create_at: post.create_at + 4});
        const post3 = await Client4.createPost(
            TestHelper.fakePost(channelId)
        );
        nock(Client4.getPostsRoute()).
            post('').
            reply(201, {...TestHelper.fakePostWithId(TestHelper.basicChannel.id), create_at: post.create_at + 5, root_id: post3.id});
        await Client4.createPost(
            {...TestHelper.fakePost(channelId), root_id: post3.id}
        );

        const postList = {order: [post1a.id, post1.id], posts: {}};
        postList.posts[post1a.id] = post1a;
        postList.posts[post1.id] = post1;

        nock(Client4.getChannelsRoute()).
            get(`/${channelId}/posts`).
            query(true).
            reply(200, postList);
        await Actions.getPostsBefore(
            channelId,
            post2.id,
            0,
            10
        )(store.dispatch, store.getState);

        const state = store.getState();
        const {posts, postsInChannel, postsInThread} = state.entities.posts;

        assert.ok(posts);
        assert.ok(postsInChannel);

        const postsForChannel = postsInChannel[channelId];
        assert.ok(postsForChannel);
        assert.equal(postsForChannel[0], post1a.id, 'wrong order for post1a');
        assert.equal(postsForChannel[1], post1.id, 'wrong order for post1');
        assert.ok(postsForChannel.length <= 10, 'wrong size');

        const postsForThread = postsInThread[post1.id];
        assert.ok(postsForThread);
        assert.ok(postsForThread.includes(post1a.id));
    });

    it('getPostsBeforeWithRetry', async () => {
        if (TestHelper.isLiveServer()) {
            console.log('Skipping mock-only test');
            return;
        }

        const channelId = TestHelper.basicChannel.id;
        const post = TestHelper.basicPost;

        nock(Client4.getPostsRoute()).
            post('').
            reply(201, {...TestHelper.fakePostWithId(TestHelper.basicChannel.id), create_at: post.create_at + 1});
        const post1 = await Client4.createPost(
            TestHelper.fakePost(channelId)
        );
        nock(Client4.getPostsRoute()).
            post('').
            reply(201, {...TestHelper.fakePostWithId(TestHelper.basicChannel.id), create_at: post.create_at + 2, root_id: post1.id});
        const post1a = await Client4.createPost(
            {...TestHelper.fakePost(channelId), root_id: post1.id}
        );
        nock(Client4.getPostsRoute()).
            post('').
            reply(201, {...TestHelper.fakePostWithId(TestHelper.basicChannel.id), create_at: post.create_at + 3});
        const post2 = await Client4.createPost(
            TestHelper.fakePost(channelId)
        );
        nock(Client4.getPostsRoute()).
            post('').
            reply(201, {...TestHelper.fakePostWithId(TestHelper.basicChannel.id), create_at: post.create_at + 4});
        const post3 = await Client4.createPost(
            TestHelper.fakePost(channelId)
        );
        nock(Client4.getPostsRoute()).
            post('').
            reply(201, {...TestHelper.fakePostWithId(TestHelper.basicChannel.id), create_at: post.create_at + 5, root_id: post3.id});
        await Client4.createPost(
            {...TestHelper.fakePost(channelId), root_id: post3.id}
        );

        nock(Client4.getChannelsRoute()).get(`/${channelId}/posts`).query(true).reply(400, {});

        const postList = {order: [post1a.id, post1.id], posts: {}};
        postList.posts[post1a.id] = post1a;
        postList.posts[post1.id] = post1;

        nock(Client4.getChannelsRoute()).
            get(`/${channelId}/posts`).
            query(true).
            reply(200, postList);

        Actions.getPostsBeforeWithRetry(
            channelId,
            post2.id,
            0,
            10
        )(store.dispatch, store.getState);

        await TestHelper.wait(300);

        const state = store.getState();
        const {posts, postsInChannel} = state.entities.posts;

        assert.ok(posts);
        assert.ok(postsInChannel);

        const postsForChannel = postsInChannel[channelId];
        assert.ok(postsForChannel);
        assert.equal(postsForChannel[0], post1a.id, 'wrong order for post1a');
        assert.equal(postsForChannel[1], post1.id, 'wrong order for post1');
        assert.ok(postsForChannel.length <= 10, 'wrong size');
    });

    it('getPostsAfter', async () => {
        const channelId = TestHelper.basicChannel.id;
        const post = TestHelper.basicPost;

        nock(Client4.getPostsRoute()).
            post('').
            reply(201, {...TestHelper.fakePostWithId(TestHelper.basicChannel.id), create_at: post.create_at + 1});
        const post1 = await Client4.createPost(
            TestHelper.fakePost(channelId)
        );
        nock(Client4.getPostsRoute()).
            post('').
            reply(201, {...TestHelper.fakePostWithId(TestHelper.basicChannel.id), create_at: post.create_at + 2, root_id: post1.id});
        await Client4.createPost(
            {...TestHelper.fakePost(channelId), root_id: post1.id}
        );
        nock(Client4.getPostsRoute()).
            post('').
            reply(201, {...TestHelper.fakePostWithId(TestHelper.basicChannel.id), create_at: post.create_at + 3});
        const post2 = await Client4.createPost(
            TestHelper.fakePost(channelId)
        );
        nock(Client4.getPostsRoute()).
            post('').
            reply(201, {...TestHelper.fakePostWithId(TestHelper.basicChannel.id), create_at: post.create_at + 4});
        const post3 = await Client4.createPost(
            TestHelper.fakePost(channelId)
        );
        nock(Client4.getPostsRoute()).
            post('').
            reply(201, {...TestHelper.fakePostWithId(TestHelper.basicChannel.id), create_at: post.create_at + 5, root_id: post3.id});
        const post3a = await Client4.createPost(
            {...TestHelper.fakePost(channelId), root_id: post3.id}
        );

        const postList = {order: [post3a.id, post3.id], posts: {}};
        postList.posts[post3a.id] = post3a;
        postList.posts[post3.id] = post3;

        nock(Client4.getChannelsRoute()).
            get(`/${channelId}/posts`).
            query(true).
            reply(200, postList);

        await Actions.getPostsAfter(
            channelId,
            post2.id,
            0,
            10
        )(store.dispatch, store.getState);

        const state = store.getState();
        const {posts, postsInChannel, postsInThread} = state.entities.posts;

        assert.ok(posts);
        assert.ok(postsInChannel);

        const postsForChannel = postsInChannel[channelId];
        assert.ok(postsForChannel);
        assert.equal(postsForChannel[0], post3a.id, 'wrong order for post3a');
        assert.equal(postsForChannel[1], post3.id, 'wrong order for post3');
        assert.equal(postsForChannel.length, 2, 'wrong size');

        const postsForThread = postsInThread[post3.id];
        assert.ok(postsForThread);
        assert.ok(postsForThread.includes(post3a.id));
    });

    it('getPostsAfterWithRetry', async () => {
        if (TestHelper.isLiveServer()) {
            console.log('Skipping mock-only test');
            return;
        }

        const channelId = TestHelper.basicChannel.id;
        const post = TestHelper.basicPost;

        nock(Client4.getPostsRoute()).
            post('').
            reply(201, {...TestHelper.fakePostWithId(TestHelper.basicChannel.id), create_at: post.create_at + 1});
        const post1 = await Client4.createPost(
            TestHelper.fakePost(channelId)
        );
        nock(Client4.getPostsRoute()).
            post('').
            reply(201, {...TestHelper.fakePostWithId(TestHelper.basicChannel.id), create_at: post.create_at + 2, root_id: post1.id});
        await Client4.createPost(
            {...TestHelper.fakePost(channelId), root_id: post1.id}
        );
        nock(Client4.getPostsRoute()).
            post('').
            reply(201, {...TestHelper.fakePostWithId(TestHelper.basicChannel.id), create_at: post.create_at + 3});
        const post2 = await Client4.createPost(
            TestHelper.fakePost(channelId)
        );
        nock(Client4.getPostsRoute()).
            post('').
            reply(201, {...TestHelper.fakePostWithId(TestHelper.basicChannel.id), create_at: post.create_at + 4});
        const post3 = await Client4.createPost(
            TestHelper.fakePost(channelId)
        );
        nock(Client4.getPostsRoute()).
            post('').
            reply(201, {...TestHelper.fakePostWithId(TestHelper.basicChannel.id), create_at: post.create_at + 5, root_id: post3.id});
        const post3a = await Client4.createPost(
            {...TestHelper.fakePost(channelId), root_id: post3.id}
        );

        nock(Client4.getChannelsRoute()).get(`/${channelId}/posts`).query(true).reply(400, {});

        const postList = {order: [post3a.id, post3.id], posts: {}};
        postList.posts[post3a.id] = post3a;
        postList.posts[post3.id] = post3;

        nock(Client4.getChannelsRoute()).
            get(`/${channelId}/posts`).
            query(true).
            reply(200, postList);

        Actions.getPostsAfterWithRetry(
            channelId,
            post2.id,
            0,
            10
        )(store.dispatch, store.getState);

        await TestHelper.wait(300);

        const state = store.getState();
        const {posts, postsInChannel} = state.entities.posts;

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

        nock(Client4.getUsersRoute()).
            post('/logout').
            reply(200, OK_RESPONSE);
        await TestHelper.basicClient4.logout();

        TestHelper.mockLogin();
        await login(TestHelper.basicUser.email, 'password1')(store.dispatch, store.getState);

        nock(Client4.getPostsRoute()).
            post('').
            reply(201, TestHelper.fakePostWithId(TestHelper.basicChannel.id));

        const post1 = await Client4.createPost(
            TestHelper.fakePost(channelId)
        );

        nock(Client4.getUsersRoute()).
            put(`/${TestHelper.basicUser.id}/preferences`).
            reply(200, OK_RESPONSE);

        Actions.flagPost(post1.id)(dispatch, getState);
        const state = getState();
        const prefKey = getPreferenceKey(Preferences.CATEGORY_FLAGGED_POST, post1.id);
        const preference = state.entities.preferences.myPreferences[prefKey];
        assert.ok(preference);
    });

    it('unflagPost', async () => {
        const {dispatch, getState} = store;
        const channelId = TestHelper.basicChannel.id;
        nock(Client4.getUsersRoute()).
            post('/logout').
            reply(200, OK_RESPONSE);
        await TestHelper.basicClient4.logout();

        TestHelper.mockLogin();
        await login(TestHelper.basicUser.email, 'password1')(store.dispatch, store.getState);

        nock(Client4.getPostsRoute()).
            post('').
            reply(201, TestHelper.fakePostWithId(TestHelper.basicChannel.id));
        const post1 = await Client4.createPost(
            TestHelper.fakePost(channelId)
        );

        nock(Client4.getUsersRoute()).
            put(`/${TestHelper.basicUser.id}/preferences`).
            reply(200, OK_RESPONSE);
        Actions.flagPost(post1.id)(dispatch, getState);
        let state = getState();
        const prefKey = getPreferenceKey(Preferences.CATEGORY_FLAGGED_POST, post1.id);
        const preference = state.entities.preferences.myPreferences[prefKey];
        assert.ok(preference);

        nock(Client4.getUsersRoute()).
            delete(`/${TestHelper.basicUser.id}/preferences`).
            reply(200, OK_RESPONSE);
        Actions.unflagPost(post1.id)(dispatch, getState);
        state = getState();
        const unflagged = state.entities.preferences.myPreferences[prefKey];
        assert.ifError(unflagged);
    });

    it('pinPost', async () => {
        const {dispatch, getState} = store;

        nock(Client4.getPostsRoute()).
            post('').
            reply(201, TestHelper.fakePostWithId(TestHelper.basicChannel.id));
        const post1 = await Client4.createPost(
            TestHelper.fakePost(TestHelper.basicChannel.id)
        );

        const postList = {order: [post1.id], posts: {}};
        postList.posts[post1.id] = post1;

        nock(Client4.getPostsRoute()).
            get(`/${post1.id}/thread`).
            reply(200, postList);
        await Actions.getPostThread(post1.id)(dispatch, getState);

        nock(Client4.getPostsRoute()).
            post(`/${post1.id}/pin`).
            reply(200, OK_RESPONSE);
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

        nock(Client4.getPostsRoute()).
            post('').
            reply(201, TestHelper.fakePostWithId(TestHelper.basicChannel.id));
        const post1 = await Client4.createPost(
            TestHelper.fakePost(TestHelper.basicChannel.id)
        );

        const postList = {order: [post1.id], posts: {}};
        postList.posts[post1.id] = post1;

        nock(Client4.getPostsRoute()).
            get(`/${post1.id}/thread`).
            reply(200, postList);
        await Actions.getPostThread(post1.id)(dispatch, getState);

        nock(Client4.getPostsRoute()).
            post(`/${post1.id}/pin`).
            reply(200, OK_RESPONSE);
        await Actions.pinPost(post1.id)(dispatch, getState);

        nock(Client4.getPostsRoute()).
            post(`/${post1.id}/unpin`).
            reply(200, OK_RESPONSE);
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

        TestHelper.mockLogin();
        await login(TestHelper.basicUser.email, 'password1')(dispatch, getState);

        nock(Client4.getPostsRoute()).
            post('').
            reply(201, TestHelper.fakePostWithId(TestHelper.basicChannel.id));
        const post1 = await Client4.createPost(
            TestHelper.fakePost(TestHelper.basicChannel.id)
        );

        const emojiName = '+1';

        nock(Client4.getReactionsRoute()).
            post('').
            reply(201, {user_id: TestHelper.basicUser.id, post_id: post1.id, emoji_name: emojiName, create_at: 1508168444721});
        await Actions.addReaction(post1.id, emojiName)(dispatch, getState);

        const state = getState();
        const reactions = state.entities.posts.reactions[post1.id];
        assert.ok(reactions);
        assert.ok(reactions[TestHelper.basicUser.id + '-' + emojiName]);
    });

    it('removeReaction', async () => {
        const {dispatch, getState} = store;

        TestHelper.mockLogin();
        await login(TestHelper.basicUser.email, 'password1')(dispatch, getState);

        nock(Client4.getPostsRoute()).
            post('').
            reply(201, TestHelper.fakePostWithId(TestHelper.basicChannel.id));
        const post1 = await Client4.createPost(
            TestHelper.fakePost(TestHelper.basicChannel.id)
        );

        const emojiName = '+1';

        nock(Client4.getReactionsRoute()).
            post('').
            reply(201, {user_id: TestHelper.basicUser.id, post_id: post1.id, emoji_name: emojiName, create_at: 1508168444721});
        await Actions.addReaction(post1.id, emojiName)(dispatch, getState);

        nock(Client4.getUsersRoute()).
            delete(`/${TestHelper.basicUser.id}/posts/${post1.id}/reactions/${emojiName}`).
            reply(200, OK_RESPONSE);
        await Actions.removeReaction(post1.id, emojiName)(dispatch, getState);

        const state = getState();
        const reactions = state.entities.posts.reactions[post1.id];
        assert.ok(reactions);
        assert.ok(!reactions[TestHelper.basicUser.id + '-' + emojiName]);
    });

    it('getReactionsForPost', async () => {
        const {dispatch, getState} = store;

        TestHelper.mockLogin();
        await login(TestHelper.basicUser.email, 'password1')(dispatch, getState);

        nock(Client4.getPostsRoute()).
            post('').
            reply(201, TestHelper.fakePostWithId(TestHelper.basicChannel.id));
        const post1 = await Client4.createPost(
            TestHelper.fakePost(TestHelper.basicChannel.id)
        );

        const emojiName = '+1';

        nock(Client4.getReactionsRoute()).
            post('').
            reply(201, {user_id: TestHelper.basicUser.id, post_id: post1.id, emoji_name: emojiName, create_at: 1508168444721});
        await Actions.addReaction(post1.id, emojiName)(dispatch, getState);

        dispatch({
            type: PostTypes.REACTION_DELETED,
            data: {user_id: TestHelper.basicUser.id, post_id: post1.id, emoji_name: emojiName},
        });

        nock(Client4.getPostsRoute()).
            get(`/${post1.id}/reactions`).
            reply(200, [{user_id: TestHelper.basicUser.id, post_id: post1.id, emoji_name: emojiName, create_at: 1508168444721}]);
        await Actions.getReactionsForPost(post1.id)(dispatch, getState);

        const state = getState();
        const reactions = state.entities.posts.reactions[post1.id];

        assert.ok(reactions);
        assert.ok(reactions[TestHelper.basicUser.id + '-' + emojiName]);
    });

    it('getCustomEmojiForReaction', async () => {
        const oldVersion = Client4.getServerVersion();
        Client4.serverVersion = '4.7.0';

        const testImageData = fs.createReadStream('test/assets/images/test.png');
        const {dispatch, getState} = store;

        nock(Client4.getEmojisRoute()).
            post('').
            reply(201, {id: TestHelper.generateId(), create_at: 1507918415696, update_at: 1507918415696, delete_at: 0, creator_id: TestHelper.basicUser.id, name: TestHelper.generateId()});

        const {data: created} = await createCustomEmoji(
            {
                name: TestHelper.generateId(),
                creator_id: TestHelper.basicUser.id,
            },
            testImageData
        )(store.dispatch, store.getState);

        nock(Client4.getEmojisRoute()).
            get(`/name/${created.name}`).
            reply(200, created);

        const missingEmojiName = ':notrealemoji:';

        nock(Client4.getEmojisRoute()).
            get(`/name/${missingEmojiName}`).
            reply(404, {message: 'Not found', status_code: 404});

        await Actions.getCustomEmojiForReaction(missingEmojiName)(dispatch, getState);

        const state = getState();
        const emojis = state.entities.emojis.customEmoji;
        assert.ok(emojis);
        assert.ok(emojis[created.id]);
        assert.ok(state.entities.emojis.nonExistentEmoji.has(missingEmojiName));

        Client4.serverVersion = oldVersion;
    });

    it('getOpenGraphMetadata', async () => {
        const {dispatch, getState} = store;

        const url = 'https://about.mattermost.com';
        const docs = 'https://docs.mattermost.com/';

        nock(Client4.getBaseRoute()).
            post('/opengraph').
            reply(200, {type: 'article', url: 'https://about.mattermost.com/', title: 'Mattermost private cloud messaging', description: 'Open source,  private cloud\nSlack-alternative, \nWorkplace messaging for web, PCs and phones.'});
        await dispatch(Actions.getOpenGraphMetadata(url));

        nock(Client4.getBaseRoute()).
            post('/opengraph').
            reply(200, {type: '', url: '', title: '', description: ''});
        await dispatch(Actions.getOpenGraphMetadata(docs));

        nock(Client4.getBaseRoute()).
            post('/opengraph').
            reply(200, null);
        await dispatch(Actions.getOpenGraphMetadata(docs));

        const state = getState();
        const metadata = state.entities.posts.openGraph;
        assert.ok(metadata);
        assert.ok(metadata[url]);
        assert.ifError(metadata[docs]);
    });

    it('doPostAction', async () => {
        if (TestHelper.isLiveServer()) {
            console.log('Skipping mock-only test');
            return;
        }

        nock(Client4.getBaseRoute()).
            post('/posts/posth67ja7ntdkek6g13dp3wka/actions/action7ja7ntdkek6g13dp3wka').
            reply(200, {});

        const {data} = await Actions.doPostAction('posth67ja7ntdkek6g13dp3wka', 'action7ja7ntdkek6g13dp3wka', 'option')(store.dispatch, store.getState);
        assert.deepEqual(data, {});
    });

    it('addMessageIntoHistory', async () => {
        const {dispatch, getState} = store;

        await Actions.addMessageIntoHistory('test1')(dispatch, getState);

        let history = getState().entities.posts.messagesHistory.messages;
        assert.ok(history.length === 1);
        assert.ok(history[0] === 'test1');

        await Actions.addMessageIntoHistory('test2')(dispatch, getState);

        history = getState().entities.posts.messagesHistory.messages;
        assert.ok(history.length === 2);
        assert.ok(history[1] === 'test2');

        await Actions.addMessageIntoHistory('test3')(dispatch, getState);

        history = getState().entities.posts.messagesHistory.messages;
        assert.ok(history.length === 3);
        assert.ok(history[2] === 'test3');
    });

    it('resetHistoryIndex', async () => {
        const {dispatch, getState} = store;

        await Actions.addMessageIntoHistory('test1')(dispatch, getState);
        await Actions.addMessageIntoHistory('test2')(dispatch, getState);
        await Actions.addMessageIntoHistory('test3')(dispatch, getState);

        let index = getState().entities.posts.messagesHistory.index[Posts.MESSAGE_TYPES.POST];
        assert.ok(index === 3);
        index = getState().entities.posts.messagesHistory.index[Posts.MESSAGE_TYPES.COMMENT];
        assert.ok(index === 3);

        await Actions.moveHistoryIndexBack(Posts.MESSAGE_TYPES.POST)(dispatch, getState);
        await Actions.moveHistoryIndexBack(Posts.MESSAGE_TYPES.POST)(dispatch, getState);
        await Actions.moveHistoryIndexBack(Posts.MESSAGE_TYPES.COMMENT)(dispatch, getState);

        index = getState().entities.posts.messagesHistory.index[Posts.MESSAGE_TYPES.POST];
        assert.ok(index === 1);
        index = getState().entities.posts.messagesHistory.index[Posts.MESSAGE_TYPES.COMMENT];
        assert.ok(index === 2);

        await Actions.resetHistoryIndex(Posts.MESSAGE_TYPES.POST)(dispatch, getState);

        index = getState().entities.posts.messagesHistory.index[Posts.MESSAGE_TYPES.POST];
        assert.ok(index === 3);
        index = getState().entities.posts.messagesHistory.index[Posts.MESSAGE_TYPES.COMMENT];
        assert.ok(index === 2);

        await Actions.resetHistoryIndex(Posts.MESSAGE_TYPES.COMMENT)(dispatch, getState);

        index = getState().entities.posts.messagesHistory.index[Posts.MESSAGE_TYPES.POST];
        assert.ok(index === 3);
        index = getState().entities.posts.messagesHistory.index[Posts.MESSAGE_TYPES.COMMENT];
        assert.ok(index === 3);
    });

    it('moveHistoryIndexBack', async () => {
        const {dispatch, getState} = store;

        await Actions.moveHistoryIndexBack(Posts.MESSAGE_TYPES.POST)(dispatch, getState);

        let index = getState().entities.posts.messagesHistory.index[Posts.MESSAGE_TYPES.POST];
        assert.ok(index === -1);

        await Actions.moveHistoryIndexBack(Posts.MESSAGE_TYPES.POST)(dispatch, getState);

        index = getState().entities.posts.messagesHistory.index[Posts.MESSAGE_TYPES.POST];
        assert.ok(index === -1);

        await Actions.addMessageIntoHistory('test1')(dispatch, getState);
        await Actions.addMessageIntoHistory('test2')(dispatch, getState);
        await Actions.addMessageIntoHistory('test3')(dispatch, getState);

        index = getState().entities.posts.messagesHistory.index[Posts.MESSAGE_TYPES.POST];
        assert.ok(index === 3);
        index = getState().entities.posts.messagesHistory.index[Posts.MESSAGE_TYPES.COMMENT];
        assert.ok(index === 3);

        await Actions.moveHistoryIndexBack(Posts.MESSAGE_TYPES.POST)(dispatch, getState);
        await Actions.moveHistoryIndexBack(Posts.MESSAGE_TYPES.POST)(dispatch, getState);

        index = getState().entities.posts.messagesHistory.index[Posts.MESSAGE_TYPES.POST];
        assert.ok(index === 1);
        index = getState().entities.posts.messagesHistory.index[Posts.MESSAGE_TYPES.COMMENT];
        assert.ok(index === 3);

        await Actions.moveHistoryIndexBack(Posts.MESSAGE_TYPES.POST)(dispatch, getState);
        await Actions.moveHistoryIndexBack(Posts.MESSAGE_TYPES.POST)(dispatch, getState);

        index = getState().entities.posts.messagesHistory.index[Posts.MESSAGE_TYPES.POST];
        assert.ok(index === 0);
        index = getState().entities.posts.messagesHistory.index[Posts.MESSAGE_TYPES.COMMENT];
        assert.ok(index === 3);

        await Actions.moveHistoryIndexBack(Posts.MESSAGE_TYPES.COMMENT)(dispatch, getState);

        index = getState().entities.posts.messagesHistory.index[Posts.MESSAGE_TYPES.POST];
        assert.ok(index === 0);
        index = getState().entities.posts.messagesHistory.index[Posts.MESSAGE_TYPES.COMMENT];
        assert.ok(index === 2);
    });

    it('moveHistoryIndexForward', async () => {
        const {dispatch, getState} = store;

        await Actions.moveHistoryIndexForward(Posts.MESSAGE_TYPES.POST)(dispatch, getState);

        let index = getState().entities.posts.messagesHistory.index[Posts.MESSAGE_TYPES.POST];
        assert.ok(index === 0);

        await Actions.moveHistoryIndexForward(Posts.MESSAGE_TYPES.POST)(dispatch, getState);

        index = getState().entities.posts.messagesHistory.index[Posts.MESSAGE_TYPES.POST];
        assert.ok(index === 0);

        await Actions.addMessageIntoHistory('test1')(dispatch, getState);
        await Actions.addMessageIntoHistory('test2')(dispatch, getState);
        await Actions.addMessageIntoHistory('test3')(dispatch, getState);

        index = getState().entities.posts.messagesHistory.index[Posts.MESSAGE_TYPES.POST];
        assert.ok(index === 3);
        index = getState().entities.posts.messagesHistory.index[Posts.MESSAGE_TYPES.COMMENT];
        assert.ok(index === 3);

        await Actions.moveHistoryIndexForward(Posts.MESSAGE_TYPES.POST)(dispatch, getState);
        await Actions.moveHistoryIndexForward(Posts.MESSAGE_TYPES.POST)(dispatch, getState);

        index = getState().entities.posts.messagesHistory.index[Posts.MESSAGE_TYPES.POST];
        assert.ok(index === 3);
        index = getState().entities.posts.messagesHistory.index[Posts.MESSAGE_TYPES.COMMENT];
        assert.ok(index === 3);

        await Actions.moveHistoryIndexBack(Posts.MESSAGE_TYPES.POST)(dispatch, getState);
        await Actions.moveHistoryIndexBack(Posts.MESSAGE_TYPES.POST)(dispatch, getState);
        await Actions.moveHistoryIndexBack(Posts.MESSAGE_TYPES.COMMENT)(dispatch, getState);
        await Actions.moveHistoryIndexBack(Posts.MESSAGE_TYPES.COMMENT)(dispatch, getState);

        index = getState().entities.posts.messagesHistory.index[Posts.MESSAGE_TYPES.POST];
        assert.ok(index === 1);
        index = getState().entities.posts.messagesHistory.index[Posts.MESSAGE_TYPES.COMMENT];
        assert.ok(index === 1);

        await Actions.moveHistoryIndexForward(Posts.MESSAGE_TYPES.POST)(dispatch, getState);

        index = getState().entities.posts.messagesHistory.index[Posts.MESSAGE_TYPES.POST];
        assert.ok(index === 2);
        index = getState().entities.posts.messagesHistory.index[Posts.MESSAGE_TYPES.COMMENT];
        assert.ok(index === 1);

        await Actions.moveHistoryIndexForward(Posts.MESSAGE_TYPES.COMMENT)(dispatch, getState);

        index = getState().entities.posts.messagesHistory.index[Posts.MESSAGE_TYPES.POST];
        assert.ok(index === 2);
        index = getState().entities.posts.messagesHistory.index[Posts.MESSAGE_TYPES.COMMENT];
        assert.ok(index === 2);
    });

    describe('getProfilesAndStatusesForPosts', () => {
        describe('different values for posts argument', () => {
            // Mock the state to prevent any followup requests since we aren't testing those
            const currentUserId = 'user';
            const post = {id: 'post', user_id: currentUserId, message: 'This is a post'};

            const dispatch = null;
            const getState = () => ({
                entities: {
                    general: {
                        config: {
                            EnableCustomEmoji: 'false',
                        },
                    },
                    users: {
                        currentUserId,
                        statuses: {
                            [currentUserId]: 'status',
                        },
                    },
                },
            });

            it('null', async () => {
                await Actions.getProfilesAndStatusesForPosts(null, dispatch, getState);
            });

            it('array of posts', async () => {
                const posts = [post];

                await Actions.getProfilesAndStatusesForPosts(posts, dispatch, getState);
            });

            it('object map of posts', async () => {
                const posts = {
                    [post.id]: post,
                };

                await Actions.getProfilesAndStatusesForPosts(posts, dispatch, getState);
            });
        });
    });
});
