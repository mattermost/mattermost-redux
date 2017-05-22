// Copyright (c) 2017 Mattermost, Inc. All Rights Reserved.
// See License.txt for license information.

import assert from 'assert';

import {makeGetPostsForThread, getReactionsForPost, makeGetPostsInChannel} from 'selectors/entities/posts';
import {makeGetProfilesForReactions} from 'selectors/entities/users';
import deepFreezeAndThrowOnMutation from 'utils/deep_freeze';
import TestHelper from 'test/test_helper';

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
            commentedOnPost: undefined,
            consecutivePostByUser: false,
            replyCount: 2,
            isCommentMention: false
        };

        const post2 = {
            ...posts.b,
            isFirstReply: false,
            isLastReply: false,
            commentedOnPost: undefined,
            consecutivePostByUser: true,
            replyCount: 1,
            isCommentMention: false
        };

        const post3 = {
            ...posts.c,
            isFirstReply: true,
            isLastReply: true,
            commentedOnPost: posts.a,
            consecutivePostByUser: false,
            replyCount: 2,
            isCommentMention: false
        };

        const post4 = {
            ...posts.d,
            isFirstReply: true,
            isLastReply: true,
            commentedOnPost: posts.b,
            consecutivePostByUser: true,
            replyCount: 1,
            isCommentMention: false
        };

        const post5 = {
            ...posts.e,
            isFirstReply: true,
            isLastReply: true,
            commentedOnPost: posts.a,
            consecutivePostByUser: true,
            replyCount: 2,
            isCommentMention: false
        };

        const getPostsInChannel = makeGetPostsInChannel();
        assert.deepEqual(getPostsInChannel(testState, '1'), [post5, post4, post3, post2, post1]);
    });
});
