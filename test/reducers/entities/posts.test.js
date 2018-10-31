// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import assert from 'assert';

import {PostTypes} from 'action_types';
import postsReducer, {removeUnneededMetadata} from 'reducers/entities/posts';
import deepFreeze from 'utils/deep_freeze';

describe('Reducers.posts', () => {
    describe('RECEIVED_POST', () => {
        it('should remove unneeded metadata', () => {
            const state = deepFreeze({
                posts: {},
                postsInChannel: {},
            });
            const post = {
                id: 'post',
                metadata: {
                    emojis: [{name: 'emoji'}],
                    files: [{id: 'file', post_id: 'post'}],
                },
            };
            const action = {
                type: PostTypes.RECEIVED_POST,
                data: post,
            };

            const nextState = postsReducer(state, action);

            assert.deepEqual(nextState.posts, {
                post: {
                    id: 'post',
                    metadata: {},
                },
            });
        });
    });

    describe('RECEIVED_NEW_POST', () => {
        it('should remove unneeded metadata', () => {
            const state = deepFreeze({
                posts: {},
                postsInChannel: {},
            });
            const action = {
                type: PostTypes.RECEIVED_NEW_POST,
                data: {
                    id: 'post',
                    metadata: {
                        emojis: [{name: 'emoji'}],
                        files: [{id: 'file', post_id: 'post'}],
                    },
                },
            };

            const nextState = postsReducer(state, action);

            assert.deepEqual(nextState.posts, {
                post: {
                    id: 'post',
                    metadata: {},
                },
            });
        });
    });

    describe('RECEIVED_POSTS', () => {
        it('should remove unneeded metadata', () => {
            const state = deepFreeze({
                posts: {},
                postsInChannel: {},
            });
            const action = {
                type: PostTypes.RECEIVED_POSTS,
                data: {
                    order: ['post1'],
                    posts: {
                        post1: {
                            id: 'post1',
                            metadata: {
                                emojis: [{name: 'emoji'}],
                                files: [{id: 'file1', post_id: 'post1'}],
                            },
                        },
                        post2: {
                            id: 'post2',
                            root_id: 'post1',
                            metadata: {
                                emojis: [{name: 'emoji'}],
                                files: [{id: 'file2', post_id: 'post2'}],
                            },
                        },
                    },
                },
            };

            const nextState = postsReducer(state, action);

            assert.deepEqual(nextState.posts, {
                post1: {
                    id: 'post1',
                    metadata: {},
                },
                post2: {
                    id: 'post2',
                    root_id: 'post1',
                    metadata: {},
                },
            });
        });
    });

    it('REMOVE_PENDING_POST on posts', () => {
        const posts = {
            post_id: {},
            other_post_id: {},
        };
        const postsInChannel = {
            channel_id: ['post_id', 'other_post_id'],
            other_channel_id: ['post_id', 'other_post_id'],
        };
        const pendingPostIds = ['post_id', 'other_post_id'];

        let state = {posts, postsInChannel, pendingPostIds};
        const testAction = {
            type: PostTypes.REMOVE_PENDING_POST,
            data: {id: 'post_id', channel_id: 'channel_id'},
            result: {
                currentFocusedPostId: '',
                messagesHistory: {},
                openGraph: {},
                reactions: {},
                selectedPostId: '',
                posts: {
                    other_post_id: {},
                },
                postsInChannel: {
                    channel_id: ['other_post_id'],
                    other_channel_id: ['post_id', 'other_post_id'],
                },
                postsInThread: {},
                pendingPostIds: ['other_post_id'],
                sendingPostIds: [],
            },
        };

        state = postsReducer(state, testAction);
        assert.deepEqual(state, testAction.result);
    });

    describe('sendingPostIds', () => {
        it('should remain unchanged for an UNKNOWN action', () => {
            const state = ['other_post'];
            const action = {
                type: 'UNKNOWN',
            };
            const expectedState = state;

            const actualState = postsReducer({sendingPostIds: state}, action);
            assert.strictEqual(actualState.sendingPostIds, expectedState);
        });

        it('should add a new post id on RECEIVED_NEW_POST', () => {
            const state = ['other_post'];
            const action = {
                type: PostTypes.RECEIVED_NEW_POST,
                data: {
                    id: 'post_id',
                    channel_id: 'channel_id',
                    pending_post_id: 'post_id',
                },
            };
            const expectedState = ['other_post', 'post_id'];

            const actualState = postsReducer({sendingPostIds: state}, action);
            assert.deepEqual(expectedState, actualState.sendingPostIds);
        });

        it('should remain unchanged if given an existing post id on RECEIVED_NEW_POST', () => {
            const state = ['other_post', 'post_id'];
            const action = {
                type: PostTypes.RECEIVED_NEW_POST,
                data: {
                    id: 'post_id',
                    channel_id: 'channel_id',
                    pending_post_id: 'post_id',
                },
            };
            const expectedState = state;

            const actualState = postsReducer({sendingPostIds: state}, action);
            assert.strictEqual(actualState.sendingPostIds, expectedState);
        });

        it('should remain remove a post on RECEIVED_POST', () => {
            const state = ['other_post', 'post_id'];
            const action = {
                type: PostTypes.RECEIVED_POST,
                data: {
                    id: 'post_id',
                },
            };
            const expectedState = ['other_post'];

            const actualState = postsReducer({sendingPostIds: state}, action);
            assert.deepEqual(actualState.sendingPostIds, expectedState);
        });

        it('should remain unchanged if given a non-existing post on RECEIVED_POST', () => {
            const state = ['other_post'];
            const action = {
                type: PostTypes.RECEIVED_POST,
                data: {
                    id: 'post_id',
                },
            };
            const expectedState = state;

            const actualState = postsReducer({sendingPostIds: state}, action);
            assert.strictEqual(actualState.sendingPostIds, expectedState);
        });

        it('should remain remove a post on RECEIVED_POSTS', () => {
            const state = ['other_post', 'post_id'];
            const action = {
                type: PostTypes.RECEIVED_POSTS,
                data: {
                    posts: {
                        actual_post_id: {
                            id: 'actual_post_id',
                            pending_post_id: 'post_id',
                        },
                        different_actual_post_id: {
                            id: 'different_actual_post_id',
                            pending_post_id: 'different_post_id',
                        },
                    },
                },
            };
            const expectedState = ['other_post'];

            const actualState = postsReducer({sendingPostIds: state}, action);
            assert.deepEqual(actualState.sendingPostIds, expectedState);
        });

        it('should remain unchanged if given a non-existing post on RECEIVED_POSTS', () => {
            const state = ['other_post'];
            const action = {
                type: PostTypes.RECEIVED_POSTS,
                data: {
                    posts: {
                        actual_post_id: {
                            id: 'actual_post_id',
                            pending_post_id: 'post_id',
                        },
                        different_actual_post_id: {
                            id: 'different_actual_post_id',
                            pending_post_id: 'different_post_id',
                        },
                    },
                },
            };
            const expectedState = state;

            const actualState = postsReducer({sendingPostIds: state}, action);
            assert.strictEqual(actualState.sendingPostIds, expectedState);
        });
    });

    describe('removeUnneededMetadata', () => {
        it('without metadata', () => {
            const post = deepFreeze({
                id: 'post',
            });

            const nextPost = removeUnneededMetadata(post);

            assert.equal(nextPost, post);
        });

        it('with empty metadata', () => {
            const post = deepFreeze({
                id: 'post',
                metadata: {},
            });

            const nextPost = removeUnneededMetadata(post);

            assert.equal(nextPost, post);
        });

        it('should remove emojis', () => {
            const post = deepFreeze({
                id: 'post',
                metadata: {
                    emojis: [{name: 'emoji'}],
                },
            });

            const nextPost = removeUnneededMetadata(post);

            assert.notEqual(nextPost, post);
            assert.deepEqual(nextPost, {
                id: 'post',
                metadata: {},
            });
        });

        it('should remove files', () => {
            const post = deepFreeze({
                id: 'post',
                metadata: {
                    files: [{id: 'file', post_id: 'post'}],
                },
            });

            const nextPost = removeUnneededMetadata(post);

            assert.notEqual(nextPost, post);
            assert.deepEqual(nextPost, {
                id: 'post',
                metadata: {},
            });
        });
    });
});
