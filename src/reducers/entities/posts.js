// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {
    ChannelTypes,
    GeneralTypes,
    PostTypes,
    UserTypes,
} from 'action_types';
import {Posts} from 'constants';
import {comparePosts} from 'utils/post_utils';

export function removeUnneededMetadata(post) {
    if (!post.metadata) {
        return post;
    }

    const metadata = {...post.metadata};
    let changed = false;

    // These fields are stored separately
    if (metadata.emojis) {
        Reflect.deleteProperty(metadata, 'emojis');
        changed = true;
    }

    if (metadata.files) {
        Reflect.deleteProperty(metadata, 'files');
        changed = true;
    }

    if (metadata.reactions) {
        Reflect.deleteProperty(metadata, 'reactions');
        changed = true;
    }

    if (metadata.embeds) {
        let embedsChanged = false;

        const newEmbeds = metadata.embeds.map((embed) => {
            if (embed.type !== 'opengraph') {
                return embed;
            }

            const newEmbed = {...embed};
            Reflect.deleteProperty(newEmbed, 'data');

            embedsChanged = true;

            return newEmbed;
        });

        if (embedsChanged) {
            metadata.embeds = newEmbeds;
            changed = true;
        }
    }

    if (!changed) {
        // Nothing changed
        return post;
    }

    return {
        ...post,
        metadata,
    };
}

export function handlePosts(state = {}, action) {
    switch (action.type) {
    case PostTypes.RECEIVED_POST:
    case PostTypes.RECEIVED_NEW_POST: {
        const post = removeUnneededMetadata(action.data);

        const nextState = {
            ...state,
            [post.id]: post,
        };

        if (post.id && post.pending_post_id !== post.id) {
            // Remove any pending posts
            Reflect.deleteProperty(nextState, post.pending_post_id);
        }

        return nextState;
    }

    case PostTypes.RECEIVED_POSTS: {
        const posts = Object.values(action.data.posts);

        if (posts.length === 0) {
            return state;
        }

        const nextState = {...state};

        for (let post of posts) {
            post = removeUnneededMetadata(post);

            if (post.delete_at > 0) {
                // Mark the post as deleted if we have it
                if (nextState[post.id]) {
                    nextState[post.id] = {
                        ...post,
                        state: Posts.POST_DELETED,
                        file_ids: [],
                        has_reactions: false,
                    };
                } else {
                    continue;
                }
            }

            // Only change the stored post if it's changed since we last received it
            if (!nextState[post.id] || nextState[post.id].update_at < post.update_at) {
                nextState[post.id] = post;
            }

            // Remove any temporary posts
            if (nextState[post.pending_post_id]) {
                Reflect.deleteProperty(nextState, post.pending_post_id);
            }
        }

        return nextState;
    }

    case PostTypes.POST_DELETED: {
        const post = action.data;

        if (!state[post.id]) {
            return state;
        }

        // Mark the post as deleted
        const nextState = {
            ...state,
            [post.id]: {
                ...state[post.id],
                state: Posts.POST_DELETED,
                file_ids: [],
                has_reactions: false,
            },
        };

        // Remove any of its comments
        for (const otherPost of Object.values(state)) {
            if (otherPost.root_id === post.id) {
                Reflect.deleteProperty(nextState, otherPost.id);
            }
        }

        return nextState;
    }

    case PostTypes.POST_REMOVED: {
        const post = action.data;

        if (!state[post.id]) {
            return state;
        }

        // Remove the post itself
        const nextState = {...state};
        Reflect.deleteProperty(nextState, post.id);

        // Remove any of its comments
        for (const otherPost of Object.values(state)) {
            if (otherPost.root_id === post.id) {
                Reflect.deleteProperty(nextState, otherPost.id);
            }
        }

        return nextState;
    }

    case ChannelTypes.RECEIVED_CHANNEL_DELETED:
    case ChannelTypes.DELETE_CHANNEL_SUCCESS: {
        if (action.data.viewArchivedChannels) {
            // Nothing to do since we still want to store posts in archived channels
            return state;
        }

        const channelId = action.data.id;

        let postDeleted = false;

        // Remove any posts in the deleted channel
        const nextState = {...state};
        for (const post of Object.values(state)) {
            if (post.channel_id === channelId) {
                Reflect.deleteProperty(nextState, post.id);
                postDeleted = true;
            }
        }

        if (!postDeleted) {
            // Nothing changed
            return state;
        }

        return nextState;
    }

    case UserTypes.LOGOUT_SUCCESS:
        return {};
    default:
        return state;
    }
}

export function handlePendingPosts(state = [], action) {
    switch (action.type) {
    case PostTypes.RECEIVED_NEW_POST: {
        const post = action.data;

        if (!post.pending_post_id) {
            // This is not a pending post
            return state;
        }

        const index = state.indexOf(post.pending_post_id);

        if (index !== -1) {
            // An entry already exists for this post
            return state;
        }

        // Add the new pending post ID
        const nextState = [...state];
        nextState.push(post.pending_post_id);

        return nextState;
    }
    case PostTypes.POST_REMOVED: {
        const post = action.data;

        const index = state.indexOf(post.id);

        if (index === -1) {
            // There's nothing to remove
            return state;
        }

        // The post has been removed, so remove the entry for it
        const nextState = [...state];
        nextState.splice(index, 1);

        return nextState;
    }
    case PostTypes.RECEIVED_POST: {
        const post = action.data;

        if (!post.pending_post_id) {
            // This isn't a pending post
            return state;
        }

        const index = state.indexOf(post.pending_post_id);

        if (index === -1) {
            // There's nothing to remove
            return state;
        }

        // The post has actually been created, so remove the entry for it
        const nextState = [...state];
        nextState.splice(index, 1);

        return nextState;
    }

    default:
        return state;
    }
}

export function postsInChannel(state = {}, action, prevPosts, nextPosts) {
    switch (action.type) {
    case PostTypes.RECEIVED_NEW_POST: {
        const post = action.data;

        if (!state[post.channel_id]) {
            // Don't save newly created posts until the channel has been properly loaded
            return state;
        }

        const postsForChannel = state[post.channel_id];
        const nextPostsForChannel = [...postsForChannel];

        let changed = false;

        // Add the new post to the channel
        if (!nextPostsForChannel.includes(post.id)) {
            nextPostsForChannel.unshift(post.id);
            changed = true;
        }

        // If this is a new non-pending post, remove any pending post that exists for it
        if (post.pending_post_id && post.id !== post.pending_post_id) {
            const index = nextPostsForChannel.indexOf(post.pending_post_id);

            if (index !== -1) {
                nextPostsForChannel.splice(index, 1);
                changed = true;
            }
        }

        if (!changed) {
            return state;
        }

        return {
            ...state,
            [post.channel_id]: nextPostsForChannel,
        };
    }

    case PostTypes.RECEIVED_POST: {
        const post = action.data;

        // Receiving a single post doesn't usually affect the order of posts in a channel, except for when we we've
        // received a newly created post that was previously stored as pending

        if (!post.pending_post_id) {
            return state;
        }

        const postsForChannel = state[post.channel_id] || [];

        const index = postsForChannel.indexOf(post.pending_post_id);
        if (index === -1) {
            // We don't have the pending post stored
            return state;
        }

        // Replace the pending post with the newly created one
        const nextPostsForChannel = [...postsForChannel];
        nextPostsForChannel[index] = post.id;

        return {
            ...state,
            [post.channel_id]: nextPostsForChannel,
        };
    }

    case PostTypes.RECEIVED_POSTS_IN_CHANNEL:
    case PostTypes.RECEIVED_POSTS_SINCE: {
        const posts = Object.values(action.data.posts);

        if (posts.length === 0 && state[action.channelId]) {
            // No new posts received when we already have posts
            return state;
        }

        const postsForChannel = state[action.channelId] || [];
        const nextPostsForChannel = [...postsForChannel];

        for (const post of posts) {
            if (nextPostsForChannel.includes(post.id)) {
                // We already have the post
                continue;
            }

            // Just add the post id to the end of the order and we'll sort it out later
            nextPostsForChannel.push(post.id);
        }

        nextPostsForChannel.sort((a, b) => {
            return comparePosts(nextPosts[a], nextPosts[b]);
        });

        return {
            ...state,
            [action.channelId]: nextPostsForChannel,
        };
    }

    case PostTypes.POST_DELETED: {
        const post = action.data;

        const postsForChannel = state[post.channel_id];
        if (!postsForChannel) {
            return state;
        }

        // Remove this post's comments from the channel
        const nextPostsForChannel = postsForChannel.filter((postId) => prevPosts[postId].root_id !== post.id);
        if (nextPostsForChannel.length === postsForChannel.length) {
            return state;
        }

        return {
            ...state,
            [post.channel_id]: nextPostsForChannel,
        };
    }

    case PostTypes.POST_REMOVED: {
        const post = action.data;

        const postsForChannel = state[post.channel_id];
        if (!postsForChannel) {
            return state;
        }

        // Remove the post and its comments from the channel
        const nextPostsForChannel = postsForChannel.filter((postId) => prevPosts[postId].id !== post.id && prevPosts[postId].root_id !== post.id);
        if (nextPostsForChannel.length === postsForChannel.length) {
            return state;
        }

        return {
            ...state,
            [post.channel_id]: nextPostsForChannel,
        };
    }

    case ChannelTypes.RECEIVED_CHANNEL_DELETED:
    case ChannelTypes.DELETE_CHANNEL_SUCCESS: {
        if (action.data.viewArchivedChannels) {
            // Nothing to do since we still want to store posts in archived channels
            return state;
        }

        const channelId = action.data.id;

        if (!state[channelId]) {
            // Nothing to do since we have no posts for this channel
            return state;
        }

        // Remove the entry for the deleted channel
        const nextState = {...state};
        Reflect.deleteProperty(nextState, channelId);

        return nextState;
    }

    case UserTypes.LOGOUT_SUCCESS:
        return {};
    default:
        return state;
    }
}

export function postsInThread(state = {}, action, prevPosts) {
    switch (action.type) {
    case PostTypes.RECEIVED_NEW_POST: {
        const post = action.data;

        if (!post.root_id) {
            // Only store comments, not the root post
            return state;
        }

        const postsForThread = state[post.root_id] || [];

        if (postsForThread.includes(post.id)) {
            // Don't store duplicates
            return state;
        }

        return {
            ...state,
            [post.root_id]: [...postsForThread, post.id],
        };
    }

    case PostTypes.RECEIVED_POST: {
        const post = action.data;

        if (!post.root_id) {
            // Only store comments, not the root post
            return state;
        }

        const postsForThread = state[post.root_id] || [];
        const nextPostsForThread = [...postsForThread];

        let changed = false;

        // Add the post to the thread if we don't have it already
        if (!nextPostsForThread.includes(post.id)) {
            nextPostsForThread.push(post.id);
            changed = true;
        }

        // If this is a new non-pending post, remove any pending post that exists for it
        if (post.pending_post_id && post.id !== post.pending_post_id) {
            const index = nextPostsForThread.indexOf(post.pending_post_id);

            if (index !== -1) {
                nextPostsForThread.splice(index, 1);
                changed = true;
            }
        }

        if (!changed) {
            return state;
        }

        return {
            ...state,
            [post.root_id]: nextPostsForThread,
        };
    }

    case PostTypes.RECEIVED_POSTS_IN_CHANNEL:
    case PostTypes.RECEIVED_POSTS_SINCE: {
        const newPosts = Object.values(action.data.posts);

        if (newPosts.length === 0) {
            // Nothing to add
            return state;
        }

        const nextState = {};

        for (const post of newPosts) {
            if (!post.root_id) {
                // Only store comments, not the root post
                continue;
            }

            const postsForThread = state[post.root_id] || [];
            const nextPostsForThread = nextState[post.root_id] || [...postsForThread];

            // Add the post to the thread
            if (!nextPostsForThread.includes(post.id)) {
                nextPostsForThread.push(post.id);
            }

            nextState[post.root_id] = nextPostsForThread;
        }

        if (Object.keys(nextState).length === 0) {
            return state;
        }

        return {
            ...state,
            ...nextState,
        };
    }

    case PostTypes.RECEIVED_POSTS_IN_THREAD: {
        const newPosts = Object.values(action.data.posts);

        if (newPosts.length === 0) {
            // Nothing to add
            return state;
        }

        const postsForThread = state[action.rootId] || [];
        const nextPostsForThread = [...postsForThread];

        for (const post of newPosts) {
            if (post.root_id !== action.rootId) {
                // Only store comments
                continue;
            }

            if (nextPostsForThread.includes(post.id)) {
                // Don't store duplicates
                continue;
            }

            nextPostsForThread.push(post.id);
        }

        return {
            ...state,
            [action.rootId]: nextPostsForThread,
        };
    }

    case PostTypes.POST_DELETED: {
        const post = action.data;

        const postsForThread = state[post.id];
        if (!postsForThread) {
            // Nothing to remove
            return state;
        }

        const nextState = {...state};
        Reflect.deleteProperty(nextState, post.id);

        return nextState;
    }

    case PostTypes.POST_REMOVED: {
        const post = action.data;

        if (post.root_id) {
            // This is a comment, so remove it from the thread
            const postsForThread = state[post.root_id];
            if (!postsForThread) {
                return state;
            }

            const index = postsForThread.findIndex((postId) => postId === post.id);
            if (index === -1) {
                return state;
            }

            const nextPostsForThread = [...postsForThread];
            nextPostsForThread.splice(index, 1);

            return {
                ...state,
                [post.root_id]: nextPostsForThread,
            };
        }

        // This is not a comment, so remove any comments on it
        const postsForThread = state[post.id];
        if (!postsForThread) {
            return state;
        }

        const nextState = {...state};
        Reflect.deleteProperty(nextState, post.id);

        return nextState;
    }

    case ChannelTypes.RECEIVED_CHANNEL_DELETED:
    case ChannelTypes.DELETE_CHANNEL_SUCCESS: {
        if (action.data.viewArchivedChannels) {
            // Nothing to do since we still want to store posts in archived channels
            return state;
        }

        const channelId = action.data.id;

        let postDeleted = false;

        // Remove entries for any thread in the channel
        const nextState = {...state};
        for (const rootId of Object.keys(state)) {
            if (prevPosts[rootId].channel_id === channelId) {
                Reflect.deleteProperty(nextState, rootId);
                postDeleted = true;
            }
        }

        if (!postDeleted) {
            // Nothing was actually removed
            return state;
        }

        return nextState;
    }

    case UserTypes.LOGOUT_SUCCESS:
        return {};
    default:
        return state;
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
    case PostTypes.RECEIVED_FOCUSED_POST:
        return action.data;
    case UserTypes.LOGOUT_SUCCESS:
        return '';
    default:
        return state;
    }
}

export function reactions(state = {}, action) {
    switch (action.type) {
    case PostTypes.RECEIVED_REACTIONS: {
        const reactionsList = action.data;
        const nextReactions = {};
        reactionsList.forEach((reaction) => {
            nextReactions[reaction.user_id + '-' + reaction.emoji_name] = reaction;
        });

        return {
            ...state,
            [action.postId]: nextReactions,
        };
    }
    case PostTypes.RECEIVED_REACTION: {
        const reaction = action.data;
        const nextReactions = {...(state[reaction.post_id] || {})};
        nextReactions[reaction.user_id + '-' + reaction.emoji_name] = reaction;

        return {
            ...state,
            [reaction.post_id]: nextReactions,
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
            [reaction.post_id]: nextReactions,
        };
    }

    case PostTypes.RECEIVED_NEW_POST:
    case PostTypes.RECEIVED_POST: {
        const post = action.data;

        return storeReactionsForPost(state, post);
    }

    case PostTypes.RECEIVED_POSTS: {
        const posts = Object.values(action.data.posts);

        return posts.reduce(storeReactionsForPost, state);
    }

    case PostTypes.POST_DELETED:
    case PostTypes.POST_REMOVED: {
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

function storeReactionsForPost(state, post) {
    if (!post.metadata || !post.metadata.reactions) {
        return state;
    }

    const reactionsForPost = {};
    if (post.metadata.reactions && post.metadata.reactions.length > 0) {
        for (const reaction of post.metadata.reactions) {
            reactionsForPost[reaction.user_id + '-' + reaction.emoji_name] = reaction;
        }
    }

    return {
        ...state,
        [post.id]: reactionsForPost,
    };
}

export function openGraph(state = {}, action) {
    switch (action.type) {
    case PostTypes.RECEIVED_OPEN_GRAPH_METADATA: {
        const nextState = {...state};
        nextState[action.url] = action.data;

        return nextState;
    }

    case PostTypes.RECEIVED_NEW_POST:
    case PostTypes.RECEIVED_POST: {
        const post = action.data;

        return storeOpenGraphForPost(state, post);
    }
    case PostTypes.RECEIVED_POSTS: {
        const posts = Object.values(action.data.posts);

        return posts.reduce(storeOpenGraphForPost, state);
    }

    case UserTypes.LOGOUT_SUCCESS:
        return {};
    default:
        return state;
    }
}

function storeOpenGraphForPost(state, post) {
    if (!post.metadata || !post.metadata.embeds) {
        return state;
    }

    return post.metadata.embeds.reduce((nextState, embed) => {
        if (embed.type !== 'opengraph' || !embed.data) {
            // Not an OpenGraph embed
            return nextState;
        }

        return {
            ...nextState,
            [embed.url]: embed.data,
        };
    }, state);
}

function messagesHistory(state = {}, action) {
    switch (action.type) {
    case PostTypes.ADD_MESSAGE_INTO_HISTORY: {
        const nextIndex = {};
        let nextMessages = state.messages ? [...state.messages] : [];
        nextMessages.push(action.data);
        nextIndex[Posts.MESSAGE_TYPES.POST] = nextMessages.length;
        nextIndex[Posts.MESSAGE_TYPES.COMMENT] = nextMessages.length;

        if (nextMessages.length > Posts.MAX_PREV_MSGS) {
            nextMessages = nextMessages.slice(1, Posts.MAX_PREV_MSGS + 1);
        }

        return {
            messages: nextMessages,
            index: nextIndex,
        };
    }
    case PostTypes.RESET_HISTORY_INDEX: {
        const index = {};
        index[Posts.MESSAGE_TYPES.POST] = -1;
        index[Posts.MESSAGE_TYPES.COMMENT] = -1;

        const messages = state.messages || [];
        const nextIndex = state.index ? {...state.index} : index;
        nextIndex[action.data] = messages.length;
        return {
            messages: state.messages,
            index: nextIndex,
        };
    }
    case PostTypes.MOVE_HISTORY_INDEX_BACK: {
        const index = {};
        index[Posts.MESSAGE_TYPES.POST] = -1;
        index[Posts.MESSAGE_TYPES.COMMENT] = -1;

        const nextIndex = state.index ? {...state.index} : index;
        if (nextIndex[action.data] > 0) {
            nextIndex[action.data]--;
        }
        return {
            messages: state.messages,
            index: nextIndex,
        };
    }
    case PostTypes.MOVE_HISTORY_INDEX_FORWARD: {
        const index = {};
        index[Posts.MESSAGE_TYPES.POST] = -1;
        index[Posts.MESSAGE_TYPES.COMMENT] = -1;

        const messages = state.messages || [];
        const nextIndex = state.index ? {...state.index} : index;
        if (nextIndex[action.data] < messages.length) {
            nextIndex[action.data]++;
        }
        return {
            messages: state.messages,
            index: nextIndex,
        };
    }
    case UserTypes.LOGOUT_SUCCESS: {
        const index = {};
        index[Posts.MESSAGE_TYPES.POST] = -1;
        index[Posts.MESSAGE_TYPES.COMMENT] = -1;

        return {
            messages: [],
            index,
        };
    }
    default:
        return state;
    }
}

export function expandedURLs(state = {}, action) {
    switch (action.type) {
    case GeneralTypes.REDIRECT_LOCATION_SUCCESS:
        return {
            ...state,
            [action.data.url]: action.data.location,
        };
    case GeneralTypes.REDIRECT_LOCATION_FAILURE:
        return {
            ...state,
            [action.data.url]: action.data.url,
        };
    default:
        return state;
    }
}

export default function(state = {}, action) {
    const nextPosts = handlePosts(state.posts, action);
    const nextPostsInChannel = postsInChannel(state.postsInChannel, action, state.posts, nextPosts);

    const nextState = {

        // Object mapping post ids to post objects
        posts: nextPosts,

        // Array that contains the pending post ids for those messages that are in transition to being created
        pendingPostIds: handlePendingPosts(state.pendingPostIds, action),

        // Object mapping channel ids to an array of posts ids in that channel with the most recent post first
        postsInChannel: nextPostsInChannel,

        // Object mapping post root ids to an array of posts ids of comments (but not the root post) in that thread
        // with no guaranteed order
        postsInThread: postsInThread(state.postsInThread, action, state.posts),

        // The current selected post
        selectedPostId: selectedPostId(state.selectedPostId, action),

        // The current selected focused post (permalink view)
        currentFocusedPostId: currentFocusedPostId(state.currentFocusedPostId, action),

        // Object mapping post ids to an object of emoji reactions using userId-emojiName as keys
        reactions: reactions(state.reactions, action),

        // Object mapping URLs to their relevant opengraph metadata for link previews
        openGraph: openGraph(state.openGraph, action),

        // History of posts and comments
        messagesHistory: messagesHistory(state.messagesHistory, action),

        expandedURLs: expandedURLs(state.expandedURLs, action),
    };

    if (state.posts === nextState.posts && state.postsInChannel === nextState.postsInChannel &&
        state.postsInThread === nextState.postsInThread &&
        state.pendingPostIds === nextState.pendingPostIds &&
        state.selectedPostId === nextState.selectedPostId &&
        state.currentFocusedPostId === nextState.currentFocusedPostId &&
        state.reactions === nextState.reactions &&
        state.openGraph === nextState.openGraph &&
        state.messagesHistory === nextState.messagesHistory &&
        state.expandedURLs === nextState.expandedURLs) {
        // None of the children have changed so don't even let the parent object change
        return state;
    }

    return nextState;
}
