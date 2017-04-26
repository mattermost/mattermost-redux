// Copyright (c) 2016-present Mattermost, Inc. All Rights Reserved.
// See License.txt for license information.

import {PostTypes, UserTypes} from 'action_types';
import {Posts} from 'constants';

function handleReceivedPost(posts = {}, postsInChannel = {}, action) {
    const post = action.data;
    const channelId = post.channel_id;

    const nextPosts = {
        ...posts,
        [post.id]: post
    };

    let nextPostsForChannel = postsInChannel;

    // Only change postsInChannel if the order of the posts needs to change
    if (!postsInChannel[channelId] || postsInChannel[channelId].indexOf(post.id) === -1) {
        // If we don't already have the post, assume it's the most recent one
        const postsForChannel = postsInChannel[channelId] || [];

        nextPostsForChannel = {...postsInChannel};
        nextPostsForChannel[channelId] = [
            post.id,
            ...postsForChannel
        ];
    }

    return {posts: nextPosts, postsInChannel: nextPostsForChannel};
}

function handleReceivedPosts(posts = {}, postsInChannel = {}, action) {
    const newPosts = action.data.posts;
    const channelId = action.channelId;

    const nextPosts = {...posts};
    const nextPostsForChannel = {...postsInChannel};
    const postsForChannel = postsInChannel[channelId] ? [...postsInChannel[channelId]] : [];

    for (const newPost of Object.values(newPosts)) {
        if (newPost.delete_at > 0) {
            // Mark the post as deleted if we have it
            if (nextPosts[newPost.id]) {
                nextPosts[newPost.id] = {
                    ...newPost,
                    state: Posts.POST_DELETED,
                    file_ids: [],
                    has_reactions: false
                };
            } else {
                continue;
            }
        }

        // Only change the stored post if it's changed since we last received it
        if (!nextPosts[newPost.id] || nextPosts[newPost.id].update_at < newPost.update_at) {
            nextPosts[newPost.id] = newPost;
        }

        if (postsForChannel.indexOf(newPost.id) === -1) {
            // Just add the post id to the end of the order and we'll sort it out later
            postsForChannel.push(newPost.id);
        }

        // Remove any temporary posts
        if (nextPosts[newPost.pending_post_id]) {
            Reflect.deleteProperty(nextPosts, newPost.pending_post_id);

            const index = postsForChannel.indexOf(newPost.pending_post_id);
            if (index !== -1) {
                postsForChannel.splice(index, 1);
            }
        }
    }

    // Sort to ensure that the most recent posts are first
    postsForChannel.sort((a, b) => {
        if (nextPosts[a].create_at > nextPosts[b].create_at) {
            return -1;
        } else if (nextPosts[a].create_at < nextPosts[b].create_at) {
            return 1;
        }

        return 0;
    });

    nextPostsForChannel[channelId] = postsForChannel;

    return {posts: nextPosts, postsInChannel: nextPostsForChannel};
}

function handlePostDeleted(posts = {}, postsInChannel = {}, action) {
    const post = action.data;
    const channelId = post.channel_id;

    const nextPosts = {...posts};
    const nextPostsForChannel = {...postsInChannel};

    // We only need to do something if already have the post
    if (posts[post.id]) {
        // Mark the post as deleted
        nextPosts[post.id] = {
            ...posts[post.id],
            state: Posts.POST_DELETED,
            file_ids: [],
            has_reactions: false
        };

        // Remove any of its comments
        const postsForChannel = postsInChannel[channelId] ? [...postsInChannel[channelId]] : [];
        for (const id of postsForChannel) {
            if (nextPosts[id].root_id === post.id) {
                Reflect.deleteProperty(nextPosts, id);

                const commentIndex = postsForChannel.indexOf(id);
                if (commentIndex !== -1) {
                    postsForChannel.splice(commentIndex, 1);
                }
            }
        }

        nextPostsForChannel[channelId] = postsForChannel;
    }

    return {posts: nextPosts, postsInChannel: nextPostsForChannel};
}

function handleRemovePost(posts = {}, postsInChannel = {}, action) {
    const post = action.data;
    const channelId = post.channel_id;

    let nextPosts = posts;
    let nextPostsForChannel = postsInChannel;

    // We only need to do something if already have the post
    if (nextPosts[post.id]) {
        nextPosts = {...posts};
        nextPostsForChannel = {...postsInChannel};
        const postsForChannel = postsInChannel[channelId] ? [...postsInChannel[channelId]] : [];

        // Remove the post itself
        Reflect.deleteProperty(nextPosts, post.id);

        const index = postsForChannel.indexOf(post.id);
        if (index !== -1) {
            postsForChannel.splice(index, 1);
        }

        // Remove any of its comments
        for (const id of postsForChannel) {
            if (nextPosts[id].root_id === post.id) {
                Reflect.deleteProperty(nextPosts, id);

                const commentIndex = postsForChannel.indexOf(id);
                if (commentIndex !== -1) {
                    postsForChannel.splice(commentIndex, 1);
                }
            }
        }

        nextPostsForChannel[channelId] = postsForChannel;
    }

    return {posts: nextPosts, postsInChannel: nextPostsForChannel};
}

function handlePosts(posts = {}, postsInChannel = {}, action) {
    switch (action.type) {
    case PostTypes.RECEIVED_POST:
        return handleReceivedPost(posts, postsInChannel, action);
    case PostTypes.RECEIVED_POSTS:
        return handleReceivedPosts(posts, postsInChannel, action);
    case PostTypes.POST_DELETED:
        if (action.data) {
            return handlePostDeleted(posts, postsInChannel, action);
        }
        return {posts, postsInChannel};
    case PostTypes.REMOVE_POST:
        return handleRemovePost(posts, postsInChannel, action);

    case UserTypes.LOGOUT_SUCCESS:
        return {
            posts: {},
            postsInChannel: {}
        };
    default:
        return {
            posts,
            postsInChannel
        };
    }
}

function selectedPostId(state = '', action) {
    switch (action.type) {
    case PostTypes.RECEIVED_POST_SELECTED:
        return action.data;
    case UserTypes.LOGOUT_SUCCESS:
        return '';
    default:
        return state;
    }
}

function currentFocusedPostId(state = '', action) {
    switch (action.type) {
    case UserTypes.LOGOUT_SUCCESS:
        return '';
    default:
        return state;
    }
}

export default function(state = {}, action) {
    const {posts, postsInChannel} = handlePosts(state.posts, state.postsInChannel, action);

    const nextState = {

        // Object mapping post ids to post objects
        posts,

        // Object mapping channel ids to an list of posts ids in that channel with the most recent post first
        postsInChannel,

        // The current selected post
        selectedPostId: selectedPostId(state.selectedPostId, action),

        // The current selected focused post (permalink view)
        currentFocusedPostId: currentFocusedPostId(state.currentFocusedPostId, action)
    };

    if (state.posts === nextState.posts && state.postsInChannel === nextState.postsInChannel &&
        state.selectedPostId === nextState.selectedPostId &&
        state.currentFocusedPostId === nextState.currentFocusedPostId) {
        // None of the children have changed so don't even let the parent object change
        return state;
    }

    return nextState;
}
