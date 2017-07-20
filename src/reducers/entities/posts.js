// Copyright (c) 2016-present Mattermost, Inc. All Rights Reserved.
// See License.txt for license information.

import {PostTypes, SearchTypes, UserTypes} from 'action_types';
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

function handlePostsFromSearch(posts = {}, postsInChannel = {}, action) {
    const newPosts = action.data.posts;
    let info = {posts, postsInChannel};
    const postsForChannel = new Map();

    const postIds = Object.keys(newPosts);
    for (const id of postIds) {
        const nextPost = newPosts[id];
        const channelId = nextPost.channel_id;
        if (postsForChannel.has(channelId)) {
            postsForChannel.get(channelId)[id] = nextPost;
        } else {
            postsForChannel.set(channelId, {[id]: nextPost});
        }
    }

    postsForChannel.forEach((postList, channelId) => {
        info = handleReceivedPosts(info.posts, postsInChannel, {channelId, data: {posts: postList}});
    });

    return info;
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
        const channelPosts = postsInChannel[channelId] ? [...postsInChannel[channelId]] : [];
        const postsForChannel = [...channelPosts]; // make sure we don't modify the array we loop over
        for (const id of channelPosts) {
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
        const channelPosts = postsInChannel[channelId] ? [...postsInChannel[channelId]] : [];

        // Remove the post itself
        Reflect.deleteProperty(nextPosts, post.id);

        const index = channelPosts.indexOf(post.id);
        if (index !== -1) {
            channelPosts.splice(index, 1);
        }

        // Create a copy of the channelPosts after we splice the
        // parent post so we can safely loop and have the latest changes
        const postsForChannel = [...channelPosts];

        // Remove any of its comments
        for (const id of channelPosts) {
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

    case SearchTypes.RECEIVED_SEARCH_POSTS:
        return handlePostsFromSearch(posts, postsInChannel, action);

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

function reactions(state = {}, action) {
    switch (action.type) {
    case PostTypes.RECEIVED_REACTIONS: {
        const reactionsList = action.data;
        const nextReactions = {};
        reactionsList.forEach((reaction) => {
            nextReactions[reaction.user_id + '-' + reaction.emoji_name] = reaction;
        });

        return {
            ...state,
            [action.postId]: nextReactions
        };
    }
    case PostTypes.RECEIVED_REACTION: {
        const reaction = action.data;
        const nextReactions = {...(state[reaction.post_id] || {})};
        nextReactions[reaction.user_id + '-' + reaction.emoji_name] = reaction;

        return {
            ...state,
            [reaction.post_id]: nextReactions
        };
    }
    case PostTypes.REACTION_DELETED: {
        const reaction = action.data;
        const nextReactions = {...(state[reaction.post_id] || {})};
        if (!nextReactions[reaction.user_id + '-' + reaction.emoji_name]) {
            return state;
        }

        Reflect.deleteProperty(nextReactions, reaction.user_id + '-' + reaction.emoji_name);

        return {
            ...state,
            [reaction.post_id]: nextReactions
        };
    }
    case PostTypes.POST_DELETED:
    case PostTypes.REMOVE_POST: {
        const post = action.data;

        if (post && state[post.id]) {
            const nextState = {...state};
            Reflect.deleteProperty(nextState, post.id);

            return nextState;
        }

        return state;
    }

    case UserTypes.LOGOUT_SUCCESS:
        return {};
    default:
        return state;
    }
}

function openGraph(state = {}, action) {
    switch (action.type) {
    case PostTypes.RECEIVED_OPEN_GRAPH_METADATA: {
        const nextState = {...state};
        nextState[action.url] = action.data;

        return nextState;
    }
    case UserTypes.LOGOUT_SUCCESS:
        return {};
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
        currentFocusedPostId: currentFocusedPostId(state.currentFocusedPostId, action),

        // Object mapping post ids to an object of emoji reactions using userId-emojiName as keys
        reactions: reactions(state.reactions, action),

        // Object mapping URLs to their relevant opengraph metadata for link previews
        openGraph: openGraph(state.openGraph, action)
    };

    if (state.posts === nextState.posts && state.postsInChannel === nextState.postsInChannel &&
        state.selectedPostId === nextState.selectedPostId &&
        state.currentFocusedPostId === nextState.currentFocusedPostId &&
        state.reactions === nextState.reactions &&
        state.openGraph === nextState.openGraph) {
        // None of the children have changed so don't even let the parent object change
        return state;
    }

    return nextState;
}
