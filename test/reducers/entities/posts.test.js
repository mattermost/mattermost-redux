// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import assert from 'assert';

import {PostTypes, ChannelTypes} from 'action_types';
import postsReducer from 'reducers/entities/posts';

describe('Reducers.posts', () => {
    it('REMOVE_PENDING_POST on posts', async () => {
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

    it('RECEIVED_CHANNEL_DELETED and DELETE_CHANNEL_SUCCESS on posts with viewArchivedChannels false', async () => {
        const posts = {
            post_id: {channel_id: 'channel_id'},
            other_post_id: {channel_id: 'other_channel_id'},
            other_post_more_id: {channel_id: 'other_channel_more_id'},
        };
        const postsInChannel = {
            channel_id: ['post_id', 'post_id2'],
            other_channel_id: ['other_post_id', 'other_post_id2'],
            other_channel_more_id: ['other_post_more_id', 'other_post_more_id2'],
        };
        const postsInThread = {
            post_id: ['other_post_id', 'other_post_more_id'],
            other_post_id: ['post_id', 'other_post_more_id'],
        };

        let state = {posts, postsInChannel, postsInThread};
        const testAction = {
            type: ChannelTypes.RECEIVED_CHANNEL_DELETED,
            data: {id: 'channel_id', viewArchivedChannels: false},
            result: {
                currentFocusedPostId: '',
                messagesHistory: {},
                openGraph: {},
                reactions: {},
                selectedPostId: '',
                posts: {
                    other_post_id: {channel_id: 'other_channel_id'},
                    other_post_more_id: {channel_id: 'other_channel_more_id'},
                },
                postsInChannel: {
                    other_channel_id: ['other_post_id', 'other_post_id2'],
                    other_channel_more_id: ['other_post_more_id', 'other_post_more_id2'],
                },
                postsInThread: {
                    other_post_id: ['other_post_more_id'],
                },
                pendingPostIds: [],
                sendingPostIds: [],
            },
        };

        state = postsReducer(state, testAction);
        assert.deepEqual(state, testAction.result);
    });

    it('RECEIVED_CHANNEL_DELETED and DELETE_CHANNEL_SUCCESS on posts with viewArchivedChannels true', async () => {
        const posts = {
            post_id: {channel_id: 'channel_id'},
            other_post_id: {channel_id: 'other_channel_id'},
            other_post_more_id: {channel_id: 'other_channel_more_id'},
        };
        const postsInChannel = {
            channel_id: ['post_id', 'post_id2'],
            other_channel_id: ['other_post_id', 'other_post_id2'],
            other_channel_more_id: ['other_post_more_id', 'other_post_more_id2'],
        };
        const postsInThread = {
            post_id: ['other_post_id', 'other_post_more_id'],
            other_post_id: ['post_id', 'other_post_more_id'],
        };

        let state = {posts, postsInChannel, postsInThread};

        const testAction = {
            type: ChannelTypes.RECEIVED_CHANNEL_DELETED,
            data: {id: 'channel_id', viewArchivedChannels: true},
            result: {
                currentFocusedPostId: '',
                messagesHistory: {},
                openGraph: {},
                reactions: {},
                selectedPostId: '',
                posts,
                postsInChannel,
                postsInThread,
                pendingPostIds: [],
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
});
