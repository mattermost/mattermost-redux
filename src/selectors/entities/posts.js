// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
// @flow

import {createSelector} from 'reselect';

import {getCurrentUser} from 'selectors/entities/common';
import {getMyPreferences} from 'selectors/entities/preferences';
import {createIdsSelector} from 'utils/helpers';

import {Posts, Preferences} from 'constants';
import {isPostEphemeral, isSystemMessage, shouldFilterJoinLeavePost, comparePosts, isPostPendingOrFailed, isPostCommentMention} from 'utils/post_utils';
import {getPreferenceKey} from 'utils/preference_utils';

import type {GlobalState} from 'types/store';
import type {Post, PostWithFormatData} from 'types/posts';
import type {Reaction} from 'types/reactions';
import type {UserProfile} from 'types/users';
import type {Channel} from 'types/channels';

import type {$ID, IDMappedObjects, RelationOneToOne, RelationOneToMany} from '../../types/utilities';

export function getAllPosts(state: GlobalState) {
    return state.entities.posts.posts;
}

export function getPost(state: GlobalState, postId: $ID<Post>): Post {
    return getAllPosts(state)[postId];
}

export function getPostsInThread(state: GlobalState): RelationOneToMany<Post, Post> {
    return state.entities.posts.postsInThread;
}

export function getReactionsForPosts(state: GlobalState): RelationOneToOne<Post, {[string]: Reaction}> {
    return state.entities.posts.reactions;
}

export function makeGetReactionsForPost(): (GlobalState, $ID<Post>) => ?{[string]: Reaction} {
    return createSelector(
        getReactionsForPosts,
        (state: GlobalState, postId) => postId,
        (reactions, postId) => {
            if (reactions[postId]) {
                return reactions[postId];
            }

            return null;
        }
    );
}

export function getOpenGraphMetadata(state: GlobalState): RelationOneToOne<Post, Object> {
    return state.entities.posts.openGraph;
}

export function getOpenGraphMetadataForUrl(state: GlobalState, url: string): Object {
    return state.entities.posts.openGraph[url];
}

// getPostIdsInCurrentChannel returns the IDs of posts loaded at the bottom of the channel. It does not include older
// posts such as those loaded by viewing a thread or a permalink.
export function getPostIdsInCurrentChannel(state: GlobalState): ?Array<$ID<Post>> {
    return getPostIdsInChannel(state, state.entities.channels.currentChannelId);
}

// getPostsInCurrentChannel returns the posts loaded at the bottom of the channel. It does not include older posts
// such as those loaded by viewing a thread or a permalink.
export const getPostsInCurrentChannel: (GlobalState) => ?Array<PostWithFormatData> = (() => {
    const getPostsInChannel = makeGetPostsInChannel();

    return (state: GlobalState) => getPostsInChannel(state, state.entities.channels.currentChannelId, -1);
})();

export function makeGetPostIdsForThread(): (GlobalState, $ID<Post>) => Array<$ID<Post>> {
    return createIdsSelector(
        getAllPosts,
        (state: GlobalState, rootId) => state.entities.posts.postsInThread[rootId] || [],
        (state: GlobalState, rootId) => state.entities.posts.posts[rootId],
        (posts, postsForThread, rootPost) => {
            const thread = [];

            if (rootPost) {
                thread.push(rootPost);
            }

            postsForThread.forEach((id) => {
                const post = posts[id];
                if (post) {
                    thread.push(post);
                }
            });

            thread.sort(comparePosts);

            return thread.map((post) => post.id);
        }
    );
}

export function makeGetPostIdsAroundPost(): (GlobalState, $ID<Post>, $ID<Channel>, {postsBeforeCount: number, postsAfterCount: number}) => ?Array<$ID<Post>> {
    return createIdsSelector(
        (state: GlobalState, postId, channelId) => state.entities.posts.postsInChannel[channelId],
        (state: GlobalState, postId) => postId,
        (state: GlobalState, postId, channelId, options) => options && options.postsBeforeCount,
        (state: GlobalState, postId, channelId, options) => options && options.postsAfterCount,
        (postsForChannel, postId, postsBeforeCount = Posts.POST_CHUNK_SIZE / 2, postsAfterCount = Posts.POST_CHUNK_SIZE / 2) => {
            if (!postsForChannel) {
                return null;
            }

            let postIds: ?Array<$ID<Post>> = null;
            let postIndex = -1;

            for (const block of postsForChannel) {
                const index = block.order.indexOf(postId);

                if (index === -1) {
                    continue;
                }

                postIds = block.order;
                postIndex = index;
            }

            if (postIndex === -1 || !postIds) {
                return null;
            }

            // Remember that posts that come after the post have a smaller index
            const minPostIndex = postsAfterCount === -1 ? 0 : Math.max(postIndex - postsAfterCount, 0);
            const maxPostIndex = postsBeforeCount === -1 ? postIds.length : Math.min(postIndex + postsBeforeCount + 1, postIds.length); // Needs the extra 1 to include the focused post

            return postIds.slice(minPostIndex, maxPostIndex);
        }
    );
}

function formatPostInChannel(post: Post, previousPost: ?Post, index: number, allPosts: IDMappedObjects<Post>, postsInThread: RelationOneToMany<Post, Post>, postIds: Array<$ID<Post>>, currentUser: UserProfile, focusedPostId: $ID<Post>): PostWithFormatData {
    let isFirstReply = false;
    let isLastReply = false;
    let highlight = false;
    let commentedOnPost;

    if (post.id === focusedPostId) {
        highlight = true;
    }

    if (post.root_id) {
        if (previousPost && previousPost.root_id !== post.root_id) {
            // Post is the first reply in a list of consecutive replies
            isFirstReply = true;

            if (previousPost && previousPost.id !== post.root_id) {
                commentedOnPost = allPosts[post.root_id];
            }
        }

        if (index - 1 < 0 || allPosts[postIds[index - 1]].root_id !== post.root_id) {
            // Post is the last reply in a list of consecutive replies
            isLastReply = true;
        }
    }

    let previousPostIsComment = false;
    if (previousPost && previousPost.root_id) {
        previousPostIsComment = true;
    }

    const postFromWebhook = Boolean(post.props && post.props.from_webhook);
    const prevPostFromWebhook = Boolean(previousPost && previousPost.props && previousPost.props.from_webhook);
    let consecutivePostByUser = false;
    if (previousPost &&
            previousPost.user_id === post.user_id &&
            post.create_at - previousPost.create_at <= Posts.POST_COLLAPSE_TIMEOUT &&
            !postFromWebhook && !prevPostFromWebhook &&
            !isSystemMessage(post) && !isSystemMessage(previousPost)) {
        // The last post and this post were made by the same user within some time
        consecutivePostByUser = true;
    }

    let threadRepliedToByCurrentUser = false;
    let replyCount = 0;
    let isCommentMention = false;

    if (currentUser) {
        const rootId = post.root_id || post.id;
        const threadIds = postsInThread[rootId] || [];

        for (const pid of threadIds) {
            const p = allPosts[pid];
            if (!p) {
                continue;
            }

            if (p.user_id === currentUser.id) {
                threadRepliedToByCurrentUser = true;
            }

            if (!isPostEphemeral(p)) {
                replyCount += 1;
            }
        }

        const rootPost = allPosts[rootId];

        isCommentMention = isPostCommentMention({post, currentUser, threadRepliedToByCurrentUser, rootPost});
    }

    return {
        ...post,
        isFirstReply,
        isLastReply,
        previousPostIsComment,
        commentedOnPost,
        consecutivePostByUser,
        replyCount,
        isCommentMention,
        highlight,
    };
}

// makeGetPostsInChannel creates a selector that returns up to the given number of posts loaded at the bottom of the
// given channel. It does not include older posts such as those loaded by viewing a thread or a permalink.
export function makeGetPostsInChannel(): (GlobalState, $ID<Channel>, number) => ?Array<PostWithFormatData> {
    return createSelector(
        getAllPosts,
        getPostsInThread,
        (state: GlobalState, channelId: $ID<Channel>) => getPostIdsInChannel(state, channelId),
        getCurrentUser,
        getMyPreferences,
        (state: GlobalState, channelId: $ID<Channel>, numPosts: number) => numPosts || Posts.POST_CHUNK_SIZE,
        (allPosts, postsInThread, allPostIds, currentUser, myPreferences, numPosts) => {
            if (!allPostIds) {
                return null;
            }

            const posts = [];

            const joinLeavePref = myPreferences[getPreferenceKey(Preferences.CATEGORY_ADVANCED_SETTINGS, Preferences.ADVANCED_FILTER_JOIN_LEAVE)];
            const showJoinLeave = joinLeavePref ? joinLeavePref.value !== 'false' : true;

            const postIds = numPosts === -1 ? allPostIds : allPostIds.slice(0, numPosts);

            for (let i = 0; i < postIds.length; i++) {
                const post = allPosts[postIds[i]];

                if (shouldFilterJoinLeavePost(post, showJoinLeave, currentUser ? currentUser.username : '')) {
                    continue;
                }

                const previousPost = allPosts[postIds[i + 1]] || null;
                posts.push(formatPostInChannel(post, previousPost, i, allPosts, postsInThread, postIds, currentUser, ''));
            }

            return posts;
        }
    );
}

export function makeGetPostsAroundPost(): (GlobalState, $ID<Post>, $ID<Channel>) => ?Array<PostWithFormatData> {
    const getPostIdsAroundPost = makeGetPostIdsAroundPost();
    const options = {
        postsBeforeCount: -1, // Where this is used in the web app, view state is used to determine how far back to display
        postsAfterCount: Posts.POST_CHUNK_SIZE / 2,
    };

    return createSelector(
        (state: GlobalState, focusedPostId, channelId) => getPostIdsAroundPost(state, focusedPostId, channelId, options),
        getAllPosts,
        getPostsInThread,
        (state: GlobalState, focusedPostId) => focusedPostId,
        getCurrentUser,
        getMyPreferences,
        (postIds, allPosts, postsInThread, focusedPostId, currentUser, myPreferences) => {
            if (!postIds || !currentUser) {
                return null;
            }

            const posts = [];
            const joinLeavePref = myPreferences[getPreferenceKey(Preferences.CATEGORY_ADVANCED_SETTINGS, Preferences.ADVANCED_FILTER_JOIN_LEAVE)];
            const showJoinLeave = joinLeavePref ? joinLeavePref.value !== 'false' : true;

            for (let i = 0; i < postIds.length; i++) {
                const post = allPosts[postIds[i]];

                if (shouldFilterJoinLeavePost(post, showJoinLeave, currentUser.username)) {
                    continue;
                }

                const previousPost = allPosts[postIds[i + 1]] || null;
                const formattedPost = formatPostInChannel(post, previousPost, i, allPosts, postsInThread, postIds, currentUser, focusedPostId);

                posts.push(formattedPost);
            }

            return posts;
        }
    );
}

// Returns a function that creates a creates a selector that will get the posts for a given thread.
// That selector will take a props object (containing a rootId field) as its
// only argument and will be memoized based on that argument.
export function makeGetPostsForThread(): (GlobalState, {rootId: $ID<Post>}) => Array<Post> {
    return createSelector(
        getAllPosts,
        (state: GlobalState, {rootId}) => state.entities.posts.postsInThread[rootId] || [],
        (state: GlobalState, {rootId}) => state.entities.posts.posts[rootId],
        (posts, postsForThread, rootPost) => {
            const thread = [];

            if (rootPost) {
                thread.push(rootPost);
            }

            postsForThread.forEach((id) => {
                const post = posts[id];
                if (post) {
                    thread.push(post);
                }
            });

            thread.sort(comparePosts);

            return thread;
        }
    );
}

export function makeGetCommentCountForPost(): (GlobalState, {post: Post}) => number {
    return createSelector(
        getAllPosts,
        (state, {post}) => state.entities.posts.postsInThread[post ? post.id : ''] || [],
        (state, props) => props,
        (posts, postsForThread, {post: currentPost}) => {
            if (!currentPost) {
                return 0;
            }

            let count = 0;
            postsForThread.forEach((id) => {
                const post = posts[id];
                if (post && post.state !== Posts.POST_DELETED && !isPostEphemeral(post)) {
                    count += 1;
                }
            });
            return count;
        }
    );
}

export const getSearchResults: (GlobalState) => Array<Post> = createSelector(
    getAllPosts,
    (state: GlobalState) => state.entities.search.results,
    (posts, postIds) => {
        if (!postIds) {
            return [];
        }

        return postIds.map((id) => posts[id]);
    }
);

// Returns the matched text from the search results, if the server has provided them.
// These matches will only be present if the server is running Mattermost 5.1 or higher
// with Elasticsearch enabled to search posts. Otherwise, null will be returned.
export function getSearchMatches(state: GlobalState): {[string]: Array<string>} {
    return state.entities.search.matches;
}

export function makeGetMessageInHistoryItem(type: string): (GlobalState) => string {
    return createSelector(
        (state: GlobalState) => state.entities.posts.messagesHistory,
        (messagesHistory) => {
            const idx = messagesHistory.index[type];
            const messages = messagesHistory.messages;
            if (idx >= 0 && messages && messages.length > idx) {
                return messages[idx];
            }
            return '';
        }
    );
}

export function makeGetPostsForIds(): (GlobalState, Array<$ID<Post>>) => Array<Post> {
    return createIdsSelector(
        getAllPosts,
        (state: GlobalState, postIds) => postIds,
        (allPosts, postIds) => {
            if (!postIds) {
                return [];
            }

            return postIds.map((id) => allPosts[id]);
        }
    );
}

export const getLastPostPerChannel: (GlobalState) => RelationOneToOne<Channel, Post> = createSelector(
    getAllPosts,
    (state: GlobalState) => state.entities.posts.postsInChannel,
    (allPosts, postsInChannel) => {
        const ret = {};

        for (const [channelId, postsForChannel] of Object.entries(postsInChannel)) {
            const recentBlock = (postsForChannel: any).find((block) => block.recent);
            if (!recentBlock) {
                continue;
            }

            const postId = recentBlock.order[0];
            if (allPosts.hasOwnProperty(postId)) {
                ret[channelId] = allPosts[postId];
            }
        }

        return ret;
    }
);

export const getMostRecentPostIdInChannel: (GlobalState, $ID<Channel>) => ?$ID<Post> = createSelector(
    getAllPosts,
    (state: GlobalState, channelId) => getPostIdsInChannel(state, channelId),
    getMyPreferences,
    (posts, postIdsInChannel, preferences) => {
        if (!postIdsInChannel) {
            return '';
        }
        const key = getPreferenceKey(Preferences.CATEGORY_ADVANCED_SETTINGS, Preferences.ADVANCED_FILTER_JOIN_LEAVE);
        const allowSystemMessages = preferences[key] ? preferences[key].value === 'true' : true;

        if (!allowSystemMessages) {
            // return the most recent non-system message in the channel
            let postId;
            for (let i = 0; i < postIdsInChannel.length; i++) {
                const p = posts[postIdsInChannel[i]];
                if (!p.type || !p.type.startsWith(Posts.SYSTEM_MESSAGE_PREFIX)) {
                    postId = p.id;
                    break;
                }
            }
            return postId;
        }

        // return the most recent message in the channel
        return postIdsInChannel[0];
    }
);

export const getLatestReplyablePostId: (GlobalState) => $ID<Post> = createSelector(
    getPostsInCurrentChannel,
    (posts) => {
        if (!posts) {
            return '';
        }

        const latestReplyablePost = posts.find((post) => post.state !== Posts.POST_DELETED && !isSystemMessage(post) && !isPostEphemeral(post));
        if (!latestReplyablePost) {
            return '';
        }

        return latestReplyablePost.id;
    }
);

export const getCurrentUsersLatestPost: (GlobalState, $ID<Post>) => ?PostWithFormatData = createSelector(
    getPostsInCurrentChannel,
    getCurrentUser,
    (_, rootId) => rootId,
    (posts, currentUser, rootId) => {
        if (!posts) {
            return null;
        }

        const lastPost = posts.find((post) => {
            // don't edit webhook posts, deleted posts, or system messages
            if (post.user_id !== currentUser.id ||
                (post.props && post.props.from_webhook) ||
                post.state === Posts.POST_DELETED ||
                (isSystemMessage(post) || isPostEphemeral(post)) || isPostPendingOrFailed(post)) {
                return false;
            }

            if (rootId) {
                return post.root_id === rootId || post.id === rootId;
            }

            return true;
        });

        return lastPost;
    }
);

// getPostIdsInChannel returns the IDs of posts loaded at the bottom of the given channel. It does not include older
// posts such as those loaded by viewing a thread or a permalink.
export function getPostIdsInChannel(state: GlobalState, channelId: $ID<Channel>): ?Array<$ID<Post>> {
    const postsForChannel = state.entities.posts.postsInChannel[channelId];
    if (!postsForChannel) {
        return null;
    }

    const recentBlock = postsForChannel.find((block) => block.recent);
    if (!recentBlock) {
        return null;
    }

    return recentBlock.order;
}

export const isPostIdSending = (state: GlobalState, postId: $ID<Post>): boolean =>
    state.entities.posts.pendingPostIds.some((sendingPostId) => sendingPostId === postId);

export const makeIsPostCommentMention = (): ((GlobalState, $ID<Post>) => boolean) => {
    return createSelector(
        getAllPosts,
        getPostsInThread,
        getCurrentUser,
        getPost,
        (allPosts, postsInThread, currentUser, post) => {
            if (!post) {
                return false;
            }

            let threadRepliedToByCurrentUser = false;
            let isCommentMention = false;
            if (currentUser) {
                const rootId = post.root_id || post.id;
                const threadIds = postsInThread[rootId] || [];

                for (const pid of threadIds) {
                    const p = allPosts[pid];
                    if (!p) {
                        continue;
                    }

                    if (p.user_id === currentUser.id) {
                        threadRepliedToByCurrentUser = true;
                    }
                }

                const rootPost = allPosts[rootId];

                isCommentMention = isPostCommentMention({post, currentUser, threadRepliedToByCurrentUser, rootPost});
            }

            return isCommentMention;
        }
    );
};

export function getExpandedLink(state: GlobalState, link: string): string {
    return state.entities.posts.expandedURLs[link];
}
