// Copyright (c) 2017 Mattermost, Inc. All Rights Reserved.
// See License.txt for license information.

import assert from 'assert';

import {makeGetPostsForThread, makeGetReactionsForPost, makeGetPostsInChannel, makeGetPostsAroundPost} from 'selectors/entities/posts';
import {makeGetProfilesForReactions} from 'selectors/entities/users';
import deepFreezeAndThrowOnMutation from 'utils/deep_freeze';
import TestHelper from 'test/test_helper';
import {Posts} from 'constants';

describe('Selectors.Posts', () => {
    const user1 = TestHelper.fakeUserWithId();
    user1.notify_props = {};
    const profiles = {};
    profiles[user1.id] = user1;

    const posts = {
        a: {id: 'a', channel_id: '1', create_at: 1, user_id: user1.id},
        b: {id: 'b', channel_id: '1', create_at: 2, user_id: user1.id},
        c: {id: 'c', root_id: 'a', channel_id: '1', create_at: 3, user_id: 'b'},
        d: {id: 'd', root_id: 'b', channel_id: '1', create_at: 4, user_id: 'b'},
        e: {id: 'e', root_id: 'a', channel_id: '1', create_at: 5, user_id: 'b'},
        f: {id: 'f', channel_id: '2', create_at: 6, user_id: 'b'}
    };

    const reaction1 = {user_id: user1.id, emoji_name: '+1'};
    const reactions = {
        a: {[reaction1.user_id + '-' + reaction1.emoji_name]: reaction1}
    };

    const testState = deepFreezeAndThrowOnMutation({
        entities: {
            users: {
                currentUserId: user1.id,
                profiles
            },
            posts: {
                posts,
                postsInChannel: {
                    1: ['e', 'd', 'c', 'b', 'a'],
                    2: ['f']
                },
                reactions
            },
            preferences: {
                myPreferences: {}
            }
        }
    });

    it('should return single post with no children', () => {
        const getPostsForThread = makeGetPostsForThread();

        assert.deepEqual(getPostsForThread(testState, {channelId: '2', rootId: 'f'}), [posts.f]);
    });

    it('should return post with children', () => {
        const getPostsForThread = makeGetPostsForThread();

        assert.deepEqual(getPostsForThread(testState, {channelId: '1', rootId: 'a'}), [posts.e, posts.c, posts.a]);
    });

    it('should return memoized result for identical props', () => {
        const getPostsForThread = makeGetPostsForThread();

        const props = {channelId: '1', rootId: 'a'};
        const result = getPostsForThread(testState, props);

        assert.equal(result, getPostsForThread(testState, props));
    });

    it('should return different result for different props', () => {
        const getPostsForThread = makeGetPostsForThread();

        const result = getPostsForThread(testState, {channelId: '1', rootId: 'a'});

        assert.notEqual(result, getPostsForThread(testState, {channelId: '1', rootId: 'a'}));
        assert.deepEqual(result, getPostsForThread(testState, {channelId: '1', rootId: 'a'}));
    });

    it('should return memoized result for multiple selectors with different props', () => {
        const getPostsForThread1 = makeGetPostsForThread();
        const getPostsForThread2 = makeGetPostsForThread();

        const props1 = {channelId: '1', rootId: 'a'};
        const result1 = getPostsForThread1(testState, props1);

        const props2 = {channelId: '1', rootId: 'b'};
        const result2 = getPostsForThread2(testState, props2);

        assert.equal(result1, getPostsForThread1(testState, props1));
        assert.equal(result2, getPostsForThread2(testState, props2));
    });

    it('should return reactions for post', () => {
        const getReactionsForPost = makeGetReactionsForPost();
        assert.deepEqual(getReactionsForPost(testState, posts.a.id), [reaction1]);
    });

    it('should return profiles for reactions', () => {
        const getProfilesForReactions = makeGetProfilesForReactions();
        assert.deepEqual(getProfilesForReactions(testState, [reaction1]), [user1]);
    });

    it('get posts in channel', () => {
        const post1 = {
            ...posts.a,
            isFirstReply: false,
            isLastReply: false,
            previousPostIsComment: false,
            commentedOnPost: undefined,
            consecutivePostByUser: false,
            replyCount: 2,
            isCommentMention: false
        };

        const post2 = {
            ...posts.b,
            isFirstReply: false,
            isLastReply: false,
            previousPostIsComment: false,
            commentedOnPost: undefined,
            consecutivePostByUser: true,
            replyCount: 1,
            isCommentMention: false
        };

        const post3 = {
            ...posts.c,
            isFirstReply: true,
            isLastReply: true,
            previousPostIsComment: false,
            commentedOnPost: posts.a,
            consecutivePostByUser: false,
            replyCount: 2,
            isCommentMention: false
        };

        const post4 = {
            ...posts.d,
            isFirstReply: true,
            isLastReply: true,
            previousPostIsComment: true,
            commentedOnPost: posts.b,
            consecutivePostByUser: true,
            replyCount: 1,
            isCommentMention: false
        };

        const post5 = {
            ...posts.e,
            isFirstReply: true,
            isLastReply: true,
            previousPostIsComment: true,
            commentedOnPost: posts.a,
            consecutivePostByUser: true,
            replyCount: 2,
            isCommentMention: false
        };

        const getPostsInChannel = makeGetPostsInChannel();
        assert.deepEqual(getPostsInChannel(testState, '1'), [post5, post4, post3, post2, post1]);
    });

    it('get posts around post in channel', () => {
        const post1 = {
            ...posts.a,
            isFirstReply: false,
            isLastReply: false,
            previousPostIsComment: false,
            commentedOnPost: undefined,
            consecutivePostByUser: false,
            replyCount: 2,
            isCommentMention: false
        };

        const post2 = {
            ...posts.b,
            isFirstReply: false,
            isLastReply: false,
            previousPostIsComment: false,
            commentedOnPost: undefined,
            consecutivePostByUser: true,
            replyCount: 1,
            isCommentMention: false
        };

        const post3 = {
            ...posts.c,
            isFirstReply: true,
            isLastReply: true,
            previousPostIsComment: false,
            commentedOnPost: posts.a,
            consecutivePostByUser: false,
            replyCount: 2,
            isCommentMention: false,
            highlight: true
        };

        const post4 = {
            ...posts.d,
            isFirstReply: true,
            isLastReply: true,
            previousPostIsComment: true,
            commentedOnPost: posts.b,
            consecutivePostByUser: true,
            replyCount: 1,
            isCommentMention: false
        };

        const post5 = {
            ...posts.e,
            isFirstReply: true,
            isLastReply: true,
            previousPostIsComment: true,
            commentedOnPost: posts.a,
            consecutivePostByUser: true,
            replyCount: 2,
            isCommentMention: false
        };

        const getPostsAroundPost = makeGetPostsAroundPost();
        assert.deepEqual(getPostsAroundPost(testState, post3.id, '1'), [post5, post4, post3, post2, post1]);
    });

    it('get posts in channel with notify comments as any', () => {
        const userAny = TestHelper.fakeUserWithId();
        userAny.notify_props = {comments: 'any'};
        const profilesAny = {};
        profilesAny[userAny.id] = userAny;

        const postsAny = {
            a: {id: 'a', channel_id: '1', create_at: 1, user_id: userAny.id},
            b: {id: 'b', channel_id: '1', create_at: 2, user_id: 'b'},
            c: {id: 'c', root_id: 'a', channel_id: '1', create_at: 3, user_id: 'b'},
            d: {id: 'd', root_id: 'b', channel_id: '1', create_at: 4, user_id: userAny.id},
            e: {id: 'e', root_id: 'a', channel_id: '1', create_at: 5, user_id: 'b'},
            f: {id: 'f', root_id: 'b', channel_id: '1', create_at: 6, user_id: 'b'},
            g: {id: 'g', channel_id: '2', create_at: 7, user_id: 'b'}
        };

        const testStateAny = deepFreezeAndThrowOnMutation({
            entities: {
                users: {
                    currentUserId: userAny.id,
                    profiles: profilesAny
                },
                posts: {
                    posts: postsAny,
                    postsInChannel: {
                        1: ['f', 'e', 'd', 'c', 'b', 'a'],
                        2: ['g']
                    }
                },
                preferences: {
                    myPreferences: {}
                }
            }
        });

        const post1 = {
            ...postsAny.a,
            isFirstReply: false,
            isLastReply: false,
            previousPostIsComment: false,
            commentedOnPost: undefined,
            consecutivePostByUser: false,
            replyCount: 2,
            isCommentMention: false
        };

        const post2 = {
            ...postsAny.b,
            isFirstReply: false,
            isLastReply: false,
            previousPostIsComment: false,
            commentedOnPost: undefined,
            consecutivePostByUser: false,
            replyCount: 2,
            isCommentMention: true
        };

        const post3 = {
            ...postsAny.c,
            isFirstReply: true,
            isLastReply: true,
            previousPostIsComment: false,
            commentedOnPost: postsAny.a,
            consecutivePostByUser: true,
            replyCount: 2,
            isCommentMention: true
        };

        const post4 = {
            ...postsAny.d,
            isFirstReply: true,
            isLastReply: true,
            previousPostIsComment: true,
            commentedOnPost: postsAny.b,
            consecutivePostByUser: false,
            replyCount: 2,
            isCommentMention: false
        };

        const post5 = {
            ...postsAny.e,
            isFirstReply: true,
            isLastReply: true,
            previousPostIsComment: true,
            commentedOnPost: postsAny.a,
            consecutivePostByUser: false,
            replyCount: 2,
            isCommentMention: true
        };

        const post6 = {
            ...postsAny.f,
            isFirstReply: true,
            isLastReply: true,
            previousPostIsComment: true,
            commentedOnPost: postsAny.b,
            consecutivePostByUser: true,
            replyCount: 2,
            isCommentMention: true
        };

        const getPostsInChannel = makeGetPostsInChannel();
        assert.deepEqual(getPostsInChannel(testStateAny, '1'), [post6, post5, post4, post3, post2, post1]);
    });

    it('get posts in channel with notify comments as root', () => {
        const userRoot = TestHelper.fakeUserWithId();
        userRoot.notify_props = {comments: 'root'};
        const profilesRoot = {};
        profilesRoot[userRoot.id] = userRoot;

        const postsRoot = {
            a: {id: 'a', channel_id: '1', create_at: 1, user_id: userRoot.id},
            b: {id: 'b', channel_id: '1', create_at: 2, user_id: 'b'},
            c: {id: 'c', root_id: 'a', channel_id: '1', create_at: 3, user_id: 'b'},
            d: {id: 'd', root_id: 'b', channel_id: '1', create_at: 4, user_id: userRoot.id},
            e: {id: 'e', root_id: 'a', channel_id: '1', create_at: 5, user_id: 'b'},
            f: {id: 'f', root_id: 'b', channel_id: '1', create_at: 6, user_id: 'b'},
            g: {id: 'g', channel_id: '2', create_at: 7, user_id: 'b'}
        };

        const testStateRoot = deepFreezeAndThrowOnMutation({
            entities: {
                users: {
                    currentUserId: userRoot.id,
                    profiles: profilesRoot
                },
                posts: {
                    posts: postsRoot,
                    postsInChannel: {
                        1: ['f', 'e', 'd', 'c', 'b', 'a'],
                        2: ['g']
                    }
                },
                preferences: {
                    myPreferences: {}
                }
            }
        });

        const post1 = {
            ...postsRoot.a,
            isFirstReply: false,
            isLastReply: false,
            previousPostIsComment: false,
            commentedOnPost: undefined,
            consecutivePostByUser: false,
            replyCount: 2,
            isCommentMention: false
        };

        const post2 = {
            ...postsRoot.b,
            isFirstReply: false,
            isLastReply: false,
            previousPostIsComment: false,
            commentedOnPost: undefined,
            consecutivePostByUser: false,
            replyCount: 2,
            isCommentMention: false
        };

        const post3 = {
            ...postsRoot.c,
            isFirstReply: true,
            isLastReply: true,
            previousPostIsComment: false,
            commentedOnPost: postsRoot.a,
            consecutivePostByUser: true,
            replyCount: 2,
            isCommentMention: true
        };

        const post4 = {
            ...postsRoot.d,
            isFirstReply: true,
            isLastReply: true,
            previousPostIsComment: true,
            commentedOnPost: postsRoot.b,
            consecutivePostByUser: false,
            replyCount: 2,
            isCommentMention: false
        };

        const post5 = {
            ...postsRoot.e,
            isFirstReply: true,
            isLastReply: true,
            previousPostIsComment: true,
            commentedOnPost: postsRoot.a,
            consecutivePostByUser: false,
            replyCount: 2,
            isCommentMention: true
        };

        const post6 = {
            ...postsRoot.f,
            isFirstReply: true,
            isLastReply: true,
            previousPostIsComment: true,
            commentedOnPost: postsRoot.b,
            consecutivePostByUser: true,
            replyCount: 2,
            isCommentMention: false
        };

        const getPostsInChannel = makeGetPostsInChannel();
        assert.deepEqual(getPostsInChannel(testStateRoot, '1'), [post6, post5, post4, post3, post2, post1]);
    });

    it('get posts in channel with notify comments as never', () => {
        const userNever = TestHelper.fakeUserWithId();
        userNever.notify_props = {comments: 'never'};
        const profilesNever = {};
        profilesNever[userNever.id] = userNever;

        const postsNever = {
            a: {id: 'a', channel_id: '1', create_at: 1, user_id: userNever.id},
            b: {id: 'b', channel_id: '1', create_at: 2, user_id: 'b'},
            c: {id: 'c', root_id: 'a', channel_id: '1', create_at: 3, user_id: 'b'},
            d: {id: 'd', root_id: 'b', channel_id: '1', create_at: 4, user_id: userNever.id},
            e: {id: 'e', root_id: 'a', channel_id: '1', create_at: 5, user_id: 'b'},
            f: {id: 'f', root_id: 'b', channel_id: '1', create_at: 6, user_id: 'b'},
            g: {id: 'g', channel_id: '2', create_at: 7, user_id: 'b'}
        };

        const testStateNever = deepFreezeAndThrowOnMutation({
            entities: {
                users: {
                    currentUserId: userNever.id,
                    profiles: profilesNever
                },
                posts: {
                    posts: postsNever,
                    postsInChannel: {
                        1: ['f', 'e', 'd', 'c', 'b', 'a'],
                        2: ['g']
                    }
                },
                preferences: {
                    myPreferences: {}
                }
            }
        });

        const post1 = {
            ...postsNever.a,
            isFirstReply: false,
            isLastReply: false,
            previousPostIsComment: false,
            commentedOnPost: undefined,
            consecutivePostByUser: false,
            replyCount: 2,
            isCommentMention: false
        };

        const post2 = {
            ...postsNever.b,
            isFirstReply: false,
            isLastReply: false,
            previousPostIsComment: false,
            commentedOnPost: undefined,
            consecutivePostByUser: false,
            replyCount: 2,
            isCommentMention: false
        };

        const post3 = {
            ...postsNever.c,
            isFirstReply: true,
            isLastReply: true,
            previousPostIsComment: false,
            commentedOnPost: postsNever.a,
            consecutivePostByUser: true,
            replyCount: 2,
            isCommentMention: false
        };

        const post4 = {
            ...postsNever.d,
            isFirstReply: true,
            isLastReply: true,
            previousPostIsComment: true,
            commentedOnPost: postsNever.b,
            consecutivePostByUser: false,
            replyCount: 2,
            isCommentMention: false
        };

        const post5 = {
            ...postsNever.e,
            isFirstReply: true,
            isLastReply: true,
            previousPostIsComment: true,
            commentedOnPost: postsNever.a,
            consecutivePostByUser: false,
            replyCount: 2,
            isCommentMention: false
        };

        const post6 = {
            ...postsNever.f,
            isFirstReply: true,
            isLastReply: true,
            previousPostIsComment: true,
            commentedOnPost: postsNever.b,
            consecutivePostByUser: true,
            replyCount: 2,
            isCommentMention: false
        };

        const getPostsInChannel = makeGetPostsInChannel();
        assert.deepEqual(getPostsInChannel(testStateNever, '1'), [post6, post5, post4, post3, post2, post1]);
    });

    it('gets posts around post in channel not adding ephemeral post to replyCount', () => {
        const userAny = TestHelper.fakeUserWithId();
        userAny.notify_props = {comments: 'any'};
        const profilesAny = {};
        profilesAny[userAny.id] = userAny;

        const postsAny = {
            a: {id: 'a', channel_id: '1', create_at: 1, user_id: userAny.id},
            b: {id: 'b', root_id: 'a', channel_id: '1', create_at: 2, user_id: 'b'},
            c: {id: 'c', root_id: 'a', channel_id: '1', create_at: 3, user_id: 'b', type: Posts.POST_TYPES.EPHEMERAL},
            d: {id: 'd', channel_id: '2', create_at: 4, user_id: 'b'}
        };

        const testStateAny = deepFreezeAndThrowOnMutation({
            entities: {
                users: {
                    currentUserId: userAny.id,
                    profiles: profilesAny
                },
                posts: {
                    posts: postsAny,
                    postsInChannel: {
                        1: ['c', 'b', 'a'],
                        2: ['d']
                    }
                },
                preferences: {
                    myPreferences: {}
                }
            }
        });

        const post1 = {
            ...postsAny.a,
            isFirstReply: false,
            isLastReply: false,
            previousPostIsComment: false,
            commentedOnPost: undefined,
            consecutivePostByUser: false,
            replyCount: 1,
            isCommentMention: false,
            highlight: true
        };

        const post2 = {
            ...postsAny.b,
            isFirstReply: true,
            isLastReply: false,
            previousPostIsComment: false,
            commentedOnPost: undefined,
            consecutivePostByUser: false,
            replyCount: 1,
            isCommentMention: true
        };

        const post3 = {
            ...postsAny.c,
            isFirstReply: false,
            isLastReply: true,
            previousPostIsComment: true,
            commentedOnPost: undefined,
            consecutivePostByUser: false,
            replyCount: 1,
            isCommentMention: true
        };

        const getPostsAroundPost = makeGetPostsAroundPost();
        assert.deepEqual(getPostsAroundPost(testStateAny, post1.id, '1'), [post3, post2, post1]);
    });

    it('gets posts in channel not adding ephemeral post to replyCount', () => {
        const userAny = TestHelper.fakeUserWithId();
        userAny.notify_props = {comments: 'any'};
        const profilesAny = {};
        profilesAny[userAny.id] = userAny;

        const postsAny = {
            a: {id: 'a', channel_id: '1', create_at: 1, user_id: userAny.id},
            b: {id: 'b', root_id: 'a', channel_id: '1', create_at: 2, user_id: 'b', type: Posts.POST_TYPES.EPHEMERAL},
            c: {id: 'c', root_id: 'a', channel_id: '1', create_at: 3, user_id: 'b', state: Posts.POST_DELETED},
            d: {id: 'd', channel_id: '2', create_at: 4, user_id: 'b'}
        };

        const testStateAny = deepFreezeAndThrowOnMutation({
            entities: {
                users: {
                    currentUserId: userAny.id,
                    profiles: profilesAny
                },
                posts: {
                    posts: postsAny,
                    postsInChannel: {
                        1: ['c', 'b', 'a'],
                        2: ['d']
                    }
                },
                preferences: {
                    myPreferences: {}
                }
            }
        });

        const post1 = {
            ...postsAny.a,
            isFirstReply: false,
            isLastReply: false,
            previousPostIsComment: false,
            commentedOnPost: undefined,
            consecutivePostByUser: false,
            replyCount: 0,
            isCommentMention: false
        };

        const post2 = {
            ...postsAny.b,
            isFirstReply: true,
            isLastReply: false,
            previousPostIsComment: false,
            commentedOnPost: undefined,
            consecutivePostByUser: false,
            replyCount: 0,
            isCommentMention: true
        };

        const post3 = {
            ...postsAny.c,
            isFirstReply: false,
            isLastReply: true,
            previousPostIsComment: true,
            commentedOnPost: undefined,
            consecutivePostByUser: false,
            replyCount: 0,
            isCommentMention: true
        };

        const getPostsInChannel = makeGetPostsInChannel();
        assert.deepEqual(getPostsInChannel(testStateAny, '1'), [post3, post2, post1]);
    });
});
