// Copyright (c) 2016-present Mattermost, Inc. All Rights Reserved.
// See License.txt for license information.

import {createSelector} from 'reselect';

import {getCurrentUser} from 'selectors/entities/users';

import {Posts} from 'constants';
import {isSystemMessage} from 'utils/post_utils';

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

function getPostIdsInCurrentChannel(state) {
    return state.entities.posts.postsInChannel[state.entities.channels.currentChannelId] || [];
}

export const getPostsInCurrentChannel = createSelector(
    getAllPosts,
    getPostIdsInCurrentChannel,
    (posts, postIds) => {
        return postIds.map((id) => posts[id]);
    }
);

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
    postIds.forEach((pid) => {
        const p = allPosts[pid];
        if (p.root_id === rootId) {
            replyCount += 1;

            if (p.user_id === currentUser.id) {
                threadRepliedToByCurrentUser = true;
            }
        }

        if (p.id === rootId && p.user_id === currentUser.id) {
            threadCreatedByCurrentUser = true;
        }
    });

    let isCommentMention = false;
    if (post.commentedOnPost && rootId) {
        const commentsNotifyLevel = currentUser.notify_props.comments || 'never';
        const notCurrentUser = post.user_id !== currentUser.id || (post.props && post.props.from_webhook);
        if (notCurrentUser) {
            if (commentsNotifyLevel === 'any' && (threadCreatedByCurrentUser || threadRepliedToByCurrentUser)) {
                isCommentMention = true;
            } else if (commentsNotifyLevel === 'root' && threadCreatedByCurrentUser) {
                isCommentMention = true;
            }
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
        (allPosts, postIds, currentUser) => {
            if (postIds == null) {
                return null;
            }

            const posts = [];

            for (let i = 0; i < postIds.length; i++) {
                const post = allPosts[postIds[i]];
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
        (allPosts, postIds, focusedPostId, currentUser) => {
            if (postIds == null) {
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

            for (let i = 0; i < slicedPostIds.length; i++) {
                const post = allPosts[slicedPostIds[i]];
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
// That selector will take a props object (containing a channelId field and a rootId field) as its
// only argument and will be memoized based on that argument.
export function makeGetPostsForThread() {
    return createSelector(
        getAllPosts,
        (state, props) => state.entities.posts.postsInChannel[props.channelId],
        (state, props) => props,
        (posts, postIds, {rootId}) => {
            const thread = [];

            for (const id of postIds) {
                const post = posts[id];

                if (id === rootId || post.root_id === rootId) {
                    thread.push(post);
                }
            }

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
          for (const id in posts) {
              if (posts.hasOwnProperty(id)) {
                  const post = posts[id];

                  if (post.root_id === currentPost.id && post.state !== Posts.POST_DELETED) {
                      count += 1;
                  }
              }
          }

          return count;
      }
    );
}
