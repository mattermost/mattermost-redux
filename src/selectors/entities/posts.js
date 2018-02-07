// Copyright (c) 2016-present Mattermost, Inc. All Rights Reserved.
// See License.txt for license information.

import {createSelector} from 'reselect';

import {getCurrentUser} from 'selectors/entities/common';
import {getMyPreferences} from 'selectors/entities/preferences';
import {createIdsSelector} from 'utils/helpers';

import {Posts, Preferences} from 'constants';
import {isPostEphemeral, isSystemMessage, shouldFilterJoinLeavePost, comparePosts} from 'utils/post_utils';
import {getPreferenceKey} from 'utils/preference_utils';

export function getAllPosts(state) {
    return state.entities.posts.posts;
}

export function getPost(state, postId) {
    return getAllPosts(state)[postId];
}

export function getReactionsForPosts(state) {
    return state.entities.posts.reactions;
}

export function makeGetReactionsForPost() {
    return createSelector(
        getReactionsForPosts,
        (state, postId) => postId,
        (reactions, postId) => {
            return Object.values(reactions[postId] || {});
        }
    );
}

export function getOpenGraphMetadata(state) {
    return state.entities.posts.openGraph;
}

export function getOpenGraphMetadataForUrl(state, url) {
    return state.entities.posts.openGraph[url];
}

export const getPostIdsInCurrentChannel = createIdsSelector(
    (state) => state.entities.posts.postsInChannel[state.entities.channels.currentChannelId],
    (postIdsInCurrentChannel) => {
        return postIdsInCurrentChannel || [];
    }
);

export const getPostsInCurrentChannel = createSelector(
    getAllPosts,
    getPostIdsInCurrentChannel,
    (posts, postIds) => {
        return postIds.map((id) => posts[id]);
    }
);

export function makeGetPostIdsForThread() {
    return createIdsSelector(
        getAllPosts,
        (state, rootId) => rootId,
        (posts, rootId) => {
            const thread = [];

            for (const id in posts) {
                if (posts.hasOwnProperty(id)) {
                    const post = posts[id];

                    if (id === rootId || post.root_id === rootId) {
                        thread.push(post);
                    }
                }
            }

            thread.sort(comparePosts);

            return thread.map((post) => post.id);
        }
    );
}

export function makeGetPostIdsAroundPost() {
    return createIdsSelector(
        (state, focusedPostId, channelId) => state.entities.posts.postsInChannel[channelId],
        (state, focusedPostId) => focusedPostId,
        (state, focusedPostId, channelId, options) => options && options.postsBeforeCount,
        (state, focusedPostId, channelId, options) => options && options.postsAfterCount,
        (postIds, focusedPostId, postsBeforeCount = Posts.POST_CHUNK_SIZE / 2, postsAfterCount = Posts.POST_CHUNK_SIZE / 2) => {
            if (!postIds) {
                return null;
            }

            const focusedPostIndex = postIds.indexOf(focusedPostId);
            if (focusedPostIndex === -1) {
                return null;
            }

            const desiredPostIndexBefore = focusedPostIndex - postsBeforeCount;
            const minPostIndex = desiredPostIndexBefore < 0 ? 0 : desiredPostIndexBefore;
            const maxPostIndex = focusedPostIndex + postsAfterCount + 1; // Needs the extra 1 to include the focused post

            return postIds.slice(minPostIndex, maxPostIndex);
        }
    );
}

function formatPostInChannel(post, previousPost, index, allPosts, postIds, currentUser) {
    let isFirstReply = false;
    let isLastReply = false;
    let commentedOnPost;

    if (post.root_id) {
        if (previousPost.root_id !== post.root_id) {
            // Post is the first reply in a list of consecutive replies
            isFirstReply = true;

            if (previousPost.id !== post.root_id) {
                commentedOnPost = allPosts[post.root_id];
            }
        }

        if (index - 1 < 0 || allPosts[postIds[index - 1]].root_id !== post.root_id) {
            // Post is the last reply in a list of consecutive replies
            isLastReply = true;
        }
    }

    let previousPostIsComment = false;
    if (previousPost.root_id) {
        previousPostIsComment = true;
    }

    const postFromWebhook = Boolean(post.props && post.props.from_webhook);
    const prevPostFromWebhook = Boolean(previousPost.props && previousPost.props.from_webhook);
    let consecutivePostByUser = false;
    if (previousPost.user_id === post.user_id &&
            post.create_at - previousPost.create_at <= Posts.POST_COLLAPSE_TIMEOUT &&
            !postFromWebhook && !prevPostFromWebhook &&
            !isSystemMessage(post) && !isSystemMessage(previousPost)) {
        // The last post and this post were made by the same user within some time
        consecutivePostByUser = true;
    }

    let replyCount = 0;
    let threadRepliedToByCurrentUser = false;
    let threadCreatedByCurrentUser = false;
    const rootId = post.root_id || post.id;
    Object.values(allPosts).forEach((p) => {
        if (p.root_id === rootId && !isPostEphemeral(p)) {
            replyCount += 1;

            if (currentUser && p.user_id === currentUser.id) {
                threadRepliedToByCurrentUser = true;
            }
        }

        if (currentUser && p.id === rootId && p.user_id === currentUser.id) {
            threadCreatedByCurrentUser = true;
        }
    });

    let isCommentMention = false;
    let commentsNotifyLevel = 'never';
    if (currentUser && currentUser.notify_props && currentUser.notify_props.comments) {
        commentsNotifyLevel = currentUser.notify_props.comments;
    }

    const notCurrentUser = (currentUser && post.user_id !== currentUser.id) || (post.props && post.props.from_webhook);
    if (notCurrentUser) {
        if (commentsNotifyLevel === 'any' && (threadCreatedByCurrentUser || threadRepliedToByCurrentUser)) {
            isCommentMention = true;
        } else if (commentsNotifyLevel === 'root' && threadCreatedByCurrentUser) {
            isCommentMention = true;
        }
    }

    return {
        ...post,
        isFirstReply,
        isLastReply,
        previousPostIsComment,
        commentedOnPost,
        consecutivePostByUser,
        replyCount,
        isCommentMention
    };
}

export function makeGetPostsInChannel() {
    return createSelector(
        getAllPosts,
        (state, channelId) => state.entities.posts.postsInChannel[channelId],
        getCurrentUser,
        getMyPreferences,
        (allPosts, postIds, currentUser, myPreferences) => {
            if (!postIds || !currentUser) {
                return null;
            }

            const posts = [];

            const joinLeavePref = myPreferences[getPreferenceKey(Preferences.CATEGORY_ADVANCED_SETTINGS, 'join_leave')];
            const showJoinLeave = joinLeavePref ? joinLeavePref.value !== 'false' : true;

            for (let i = 0; i < postIds.length; i++) {
                const post = allPosts[postIds[i]];

                if (shouldFilterJoinLeavePost(post, showJoinLeave, currentUser.username)) {
                    continue;
                }

                const previousPost = allPosts[postIds[i + 1]] || {create_at: 0};
                posts.push(formatPostInChannel(post, previousPost, i, allPosts, postIds, currentUser));
            }

            return posts;
        }
    );
}

export function makeGetPostsAroundPost() {
    return createSelector(
        getAllPosts,
        (state, postId, channelId) => state.entities.posts.postsInChannel[channelId],
        (state, postId) => postId,
        getCurrentUser,
        getMyPreferences,
        (allPosts, postIds, focusedPostId, currentUser, myPreferences) => {
            if (!postIds || !currentUser) {
                return null;
            }

            const focusedPostIndex = postIds.indexOf(focusedPostId);
            if (focusedPostIndex === -1) {
                return null;
            }

            const desiredPostIndexBefore = focusedPostIndex - (Posts.POST_CHUNK_SIZE / 2);
            const minPostIndex = desiredPostIndexBefore < 0 ? 0 : desiredPostIndexBefore;

            const slicedPostIds = postIds.slice(minPostIndex);

            const posts = [];
            const joinLeavePref = myPreferences[getPreferenceKey(Preferences.CATEGORY_ADVANCED_SETTINGS, 'join_leave')];
            const showJoinLeave = joinLeavePref ? joinLeavePref.value !== 'false' : true;

            for (let i = 0; i < slicedPostIds.length; i++) {
                const post = allPosts[slicedPostIds[i]];

                if (shouldFilterJoinLeavePost(post, showJoinLeave, currentUser.username)) {
                    continue;
                }

                const previousPost = allPosts[slicedPostIds[i + 1]] || {create_at: 0};
                const formattedPost = formatPostInChannel(post, previousPost, i, allPosts, slicedPostIds, currentUser);

                if (post.id === focusedPostId) {
                    formattedPost.highlight = true;
                }

                posts.push(formattedPost);
            }

            return posts;
        }
    );
}

// Returns a function that creates a creates a selector that will get the posts for a given thread.
// That selector will take a props object (containing a rootId field) as its
// only argument and will be memoized based on that argument.
export function makeGetPostsForThread() {
    return createSelector(
        getAllPosts,
        (state, props) => props,
        (posts, {rootId}) => {
            const thread = [];

            for (const id in posts) {
                if (posts.hasOwnProperty(id)) {
                    const post = posts[id];

                    if (id === rootId || post.root_id === rootId) {
                        thread.push(post);
                    }
                }
            }

            thread.sort(comparePosts);

            return thread;
        }
    );
}

export function makeGetCommentCountForPost() {
    return createSelector(
        getAllPosts,
        (state, props) => props,
        (posts, {post: currentPost}) => {
            let count = 0;
            if (currentPost) {
                for (const id in posts) {
                    if (posts.hasOwnProperty(id)) {
                        const post = posts[id];

                        if (post.root_id === currentPost.id && post.state !== Posts.POST_DELETED && !isPostEphemeral(post)) {
                            count += 1;
                        }
                    }
                }
            }
            return count;
        }
    );
}

export const getSearchResults = createSelector(
    getAllPosts,
    (state) => state.entities.search.results,
    (posts, postIds) => {
        if (!postIds) {
            return [];
        }

        return postIds.map((id) => posts[id]);
    }
);

export function makeGetMessageInHistoryItem(type) {
    return createSelector(
        (state) => state.entities.posts.messagesHistory,
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

export function makeGetPostsForIds() {
    return createIdsSelector(
        getAllPosts,
        (state, postIds) => postIds,
        (allPosts, postIds) => {
            if (!postIds) {
                return [];
            }

            return postIds.map((id) => allPosts[id]);
        }
    );
}

export const getLastPostPerChannel = createSelector(
    getAllPosts,
    (state) => state.entities.posts.postsInChannel,
    (allPosts, allChannels) => {
        const ret = {};

        for (const channelId in allChannels) {
            if (allChannels.hasOwnProperty(channelId)) {
                const channelPosts = allChannels[channelId];
                if (channelPosts.length > 0) {
                    const postId = channelPosts[0];
                    if (allPosts.hasOwnProperty(postId)) {
                        ret[channelId] = allPosts[postId];
                    }
                }
            }
        }

        return ret;
    }
);

export const getMostRecentPostIdInChannel = createSelector(
    getAllPosts,
    (state, channelId) => state.entities.posts.postsInChannel[channelId],
    getMyPreferences,
    (posts, postIdsInChannel, preferences) => {
        if (!postIdsInChannel) {
            return '';
        }
        const key = getPreferenceKey(Preferences.CATEGORY_ADVANCED_SETTINGS, 'join_leave');
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

export const getLatestReplyablePostId = createSelector(
    getPostsInCurrentChannel,
    (posts) => {
        for (const post of posts) {
            if (post.state !== Posts.POST_DELETED && !isSystemMessage(post) && !isPostEphemeral(post)) {
                return post.id;
            }
        }
        return null;
    }
);

export const getCurrentUsersLatestPost = createSelector(
    getPostsInCurrentChannel,
    getCurrentUser,
    (_, rootId) => rootId,
    (posts, currentUser, rootId) => {
        let lastPost = null;
        for (const post of posts) {
            // don't edit webhook posts, deleted posts, or system messages
            if (post.user_id !== currentUser.id ||
               (post.props && post.props.from_webhook) ||
               post.state === Posts.POST_DELETED ||
               (isSystemMessage(post) || isPostEphemeral(post))) {
                continue;
            }

            if (rootId) {
                if (post.root_id === rootId || post.id === rootId) {
                    lastPost = post;
                    break;
                }
            } else {
                lastPost = post;
                break;
            }
        }
        return lastPost;
    }
);

export const getPostIdsInChannel = createIdsSelector(
    (state, channelId) => state.entities.posts.postsInChannel[channelId],
    (postIdsInChannel) => {
        return postIdsInChannel || [];
    }
);
