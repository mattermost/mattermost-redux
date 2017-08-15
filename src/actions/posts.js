// Copyright (c) 2016-present Mattermost, Inc. All Rights Reserved.
// See License.txt for license information.

import {batchActions} from 'redux-batched-actions';

import {Client4} from 'client';
import {General, Preferences, Posts} from 'constants';
import {PostTypes, FileTypes} from 'action_types';
import {getUsersByUsername} from 'selectors/entities/users';

import * as Selectors from 'selectors/entities/posts';

import {bindClientFunc, forceLogoutIfNecessary} from './helpers';
import {logError} from './errors';
import {deletePreferences, savePreferences} from './preferences';
import {getProfilesByIds, getProfilesByUsernames, getStatusesByIds} from './users';

export function createPost(post, files = []) {
    return async (dispatch, getState) => {
        const state = getState();
        const currentUserId = state.entities.users.currentUserId;

        const timestamp = Date.now();
        const pendingPostId = post.pending_post_id || `${currentUserId}:${timestamp}`;

        let newPost = {
            ...post,
            pending_post_id: pendingPostId,
            create_at: timestamp,
            update_at: timestamp
        };

        // We are retrying a pending post that had files
        if (newPost.file_ids && !files.length) {
            files = newPost.file_ids.map((id) => state.entities.files.files[id]); // eslint-disable-line
        }

        if (files.length) {
            const fileIds = files.map((file) => file.id);

            newPost = {
                ...newPost,
                file_ids: fileIds
            };

            dispatch({
                type: FileTypes.RECEIVED_FILES_FOR_POST,
                postId: pendingPostId,
                data: files
            });
        }

        dispatch({
            type: PostTypes.RECEIVED_POST,
            data: {
                id: pendingPostId,
                ...newPost
            },
            meta: {
                offline: {
                    effect: () => Client4.createPost({...newPost, create_at: 0}),
                    commit: (success, payload) => {
                        // Use RECEIVED_POSTS to clear pending posts
                        const actions = [{
                            type: PostTypes.RECEIVED_POSTS,
                            data: {
                                order: [],
                                posts: {
                                    [payload.id]: payload
                                }
                            },
                            channelId: payload.channel_id
                        }];

                        if (files) {
                            actions.push({
                                type: FileTypes.RECEIVED_FILES_FOR_POST,
                                postId: payload.id,
                                data: files
                            });
                        }

                        actions.push({
                            type: PostTypes.CREATE_POST_SUCCESS
                        });

                        dispatch(batchActions(actions), getState);
                    },
                    maxRetry: 0,
                    offlineRollback: true,
                    rollback: (success, error) => {
                        const data = {
                            ...newPost,
                            id: pendingPostId,
                            failed: true
                        };

                        const actions = [
                            {type: PostTypes.CREATE_POST_FAILURE, error}
                        ];

                        // If the failure was because: the root post was deleted or
                        // TownSquareIsReadOnly=true then remove the post
                        if (error.server_error_id === 'api.post.create_post.root_id.app_error' ||
                            error.server_error_id === 'api.post.create_post.town_square_read_only'
                        ) {
                            removePost(data)(dispatch, getState);
                        } else {
                            actions.push({
                                type: PostTypes.RECEIVED_POST,
                                data
                            });
                        }

                        dispatch(batchActions(actions));
                    }
                }
            }
        });
    };
}

export function deletePost(post) {
    return async (dispatch) => {
        const delPost = {...post};

        dispatch({
            type: PostTypes.POST_DELETED,
            data: delPost,
            meta: {
                offline: {
                    effect: () => Client4.deletePost(post.id),
                    commit: {type: PostTypes.POST_DELETED},
                    rollback: {
                        type: PostTypes.RECEIVED_POST,
                        data: delPost
                    }
                }
            }
        });
    };
}

export function editPost(post) {
    return bindClientFunc(
        Client4.patchPost,
        PostTypes.EDIT_POST_REQUEST,
        [PostTypes.RECEIVED_POST, PostTypes.EDIT_POST_SUCCESS],
        PostTypes.EDIT_POST_FAILURE,
        post
    );
}

export function pinPost(postId) {
    return async (dispatch, getState) => {
        dispatch({type: PostTypes.EDIT_POST_REQUEST}, getState);
        let posts;

        try {
            posts = await Client4.pinPost(postId);
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch);
            dispatch(batchActions([
                {type: PostTypes.EDIT_POST_FAILURE, error},
                logError(error)(dispatch)
            ]), getState);
            return null;
        }

        const actions = [
            {
                type: PostTypes.EDIT_POST_SUCCESS
            }
        ];

        const post = Selectors.getPost(getState(), postId);
        if (post) {
            actions.push(
                {
                    type: PostTypes.RECEIVED_POST,
                    data: {...post, is_pinned: true}
                }
            );
        }

        dispatch(batchActions(actions), getState);

        return posts;
    };
}

export function unpinPost(postId) {
    return async (dispatch, getState) => {
        dispatch({type: PostTypes.EDIT_POST_REQUEST}, getState);
        let posts;

        try {
            posts = await Client4.unpinPost(postId);
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch);
            dispatch(batchActions([
                {type: PostTypes.EDIT_POST_FAILURE, error},
                logError(error)(dispatch)
            ]), getState);
            return null;
        }

        const actions = [
            {
                type: PostTypes.EDIT_POST_SUCCESS
            }
        ];

        const post = Selectors.getPost(getState(), postId);
        if (post) {
            actions.push(
                {
                    type: PostTypes.RECEIVED_POST,
                    data: {...post, is_pinned: false}
                }
            );
        }

        dispatch(batchActions(actions), getState);

        return posts;
    };
}

export function addReaction(postId, emojiName) {
    return async (dispatch, getState) => {
        dispatch({type: PostTypes.REACTION_REQUEST}, getState);

        const currentUserId = getState().entities.users.currentUserId;

        let reaction;
        try {
            reaction = await Client4.addReaction(currentUserId, postId, emojiName);
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch);
            dispatch(batchActions([
                {type: PostTypes.REACTION_FAILURE, error},
                logError(error)(dispatch)
            ]), getState);
            return null;
        }

        dispatch(batchActions([
            {
                type: PostTypes.REACTION_SUCCESS
            },
            {
                type: PostTypes.RECEIVED_REACTION,
                data: reaction
            }
        ]));

        return true;
    };
}

export function removeReaction(postId, emojiName) {
    return async (dispatch, getState) => {
        dispatch({type: PostTypes.REACTION_REQUEST}, getState);

        const currentUserId = getState().entities.users.currentUserId;

        try {
            await Client4.removeReaction(currentUserId, postId, emojiName);
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch);
            dispatch(batchActions([
                {type: PostTypes.REACTION_FAILURE, error},
                logError(error)(dispatch)
            ]), getState);
            return null;
        }

        dispatch(batchActions([
            {
                type: PostTypes.REACTION_SUCCESS
            },
            {
                type: PostTypes.REACTION_DELETED,
                data: {user_id: currentUserId, post_id: postId, emoji_name: emojiName}
            }
        ]));

        return true;
    };
}

export function getReactionsForPost(postId) {
    return async (dispatch, getState) => {
        dispatch({type: PostTypes.REACTION_REQUEST}, getState);

        let reactions;
        try {
            reactions = await Client4.getReactionsForPost(postId);
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch);
            dispatch(batchActions([
                {type: PostTypes.REACTION_FAILURE, error},
                logError(error)(dispatch)
            ]), getState);
            return null;
        }

        dispatch(batchActions([
            {
                type: PostTypes.REACTION_SUCCESS
            },
            {
                type: PostTypes.RECEIVED_REACTIONS,
                data: reactions,
                postId
            }
        ]));

        return reactions;
    };
}

export function flagPost(postId) {
    return async (dispatch, getState) => {
        const {currentUserId} = getState().entities.users;
        const preference = {
            user_id: currentUserId,
            category: Preferences.CATEGORY_FLAGGED_POST,
            name: postId,
            value: 'true'
        };

        Client4.trackEvent('action', 'action_posts_flag');

        savePreferences(currentUserId, [preference])(dispatch, getState);
    };
}

export function getPostThread(postId) {
    return async (dispatch, getState) => {
        dispatch({type: PostTypes.GET_POST_THREAD_REQUEST}, getState);

        let posts;
        try {
            posts = await Client4.getPostThread(postId);
            getProfilesAndStatusesForPosts(posts.posts, dispatch, getState);
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch);
            dispatch(batchActions([
                {type: PostTypes.GET_POST_THREAD_FAILURE, error},
                logError(error)(dispatch)
            ]), getState);
            return null;
        }

        const post = posts.posts[postId];

        dispatch(batchActions([
            {
                type: PostTypes.RECEIVED_POSTS,
                data: posts,
                channelId: post.channel_id,
                skipAddToChannel: true
            },
            {
                type: PostTypes.GET_POST_THREAD_SUCCESS
            }
        ]), getState);

        return posts;
    };
}

export function getPostThreadWithRetry(postId) {
    return async (dispatch, getState) => {
        dispatch({
            type: PostTypes.GET_POST_THREAD_REQUEST
        });

        dispatch({
            type: PostTypes.GET_POST_THREAD_WITH_RETRY_ATTEMPT,
            data: {},
            meta: {
                offline: {
                    effect: () => Client4.getPostThread(postId),
                    commit: (success, payload) => {
                        const {posts} = payload;
                        const post = posts[postId];
                        getProfilesAndStatusesForPosts(posts, dispatch, getState);

                        dispatch(batchActions([
                            {
                                type: PostTypes.RECEIVED_POSTS,
                                data: payload,
                                channelId: post.channel_id,
                                skipAddToChannel: true
                            },
                            {
                                type: PostTypes.GET_POST_THREAD_SUCCESS
                            }
                        ]), getState);
                    },
                    maxRetry: 2,
                    cancel: true,
                    onRetryScheduled: () => {
                        dispatch({
                            type: PostTypes.GET_POST_THREAD_WITH_RETRY_ATTEMPT
                        });
                    },
                    rollback: (success, error) => {
                        forceLogoutIfNecessary(error, dispatch);
                        dispatch(batchActions([
                            {type: PostTypes.GET_POST_THREAD_FAILURE, error},
                            logError(error)(dispatch)
                        ]), getState);
                    }
                }
            }
        });
    };
}

export function getPosts(channelId, page = 0, perPage = Posts.POST_CHUNK_SIZE) {
    return async (dispatch, getState) => {
        dispatch({type: PostTypes.GET_POSTS_REQUEST}, getState);
        let posts;

        try {
            posts = await Client4.getPosts(channelId, page, perPage);
            getProfilesAndStatusesForPosts(posts.posts, dispatch, getState);
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch);
            dispatch(batchActions([
                {type: PostTypes.GET_POSTS_FAILURE, error},
                logError(error)(dispatch)
            ]), getState);
            return null;
        }

        dispatch(batchActions([
            {
                type: PostTypes.RECEIVED_POSTS,
                data: posts,
                channelId
            },
            {
                type: PostTypes.GET_POSTS_SUCCESS
            }
        ]), getState);

        return posts;
    };
}

export function getPostsWithRetry(channelId, page = 0, perPage = Posts.POST_CHUNK_SIZE) {
    return async (dispatch, getState) => {
        dispatch({
            type: PostTypes.GET_POSTS_REQUEST
        });

        dispatch({
            type: PostTypes.GET_POSTS_WITH_RETRY_ATTEMPT,
            data: {},
            meta: {
                offline: {
                    effect: () => Client4.getPosts(channelId, page, perPage),
                    commit: (success, payload) => {
                        const {posts} = payload;
                        getProfilesAndStatusesForPosts(posts, dispatch, getState);

                        dispatch(batchActions([
                            {
                                type: PostTypes.RECEIVED_POSTS,
                                data: payload,
                                channelId
                            },
                            {
                                type: PostTypes.GET_POSTS_SUCCESS
                            }
                        ]), getState);
                    },
                    maxRetry: 2,
                    cancel: true,
                    onRetryScheduled: () => {
                        dispatch({
                            type: PostTypes.GET_POSTS_WITH_RETRY_ATTEMPT
                        });
                    },
                    rollback: (success, error) => {
                        forceLogoutIfNecessary(error, dispatch);
                        dispatch(batchActions([
                            {type: PostTypes.GET_POSTS_FAILURE, error},
                            logError(error)(dispatch)
                        ]), getState);
                    }
                }
            }
        });
    };
}

export function getPostsSince(channelId, since) {
    return async (dispatch, getState) => {
        dispatch({type: PostTypes.GET_POSTS_SINCE_REQUEST}, getState);

        let posts;
        try {
            posts = await Client4.getPostsSince(channelId, since);
            getProfilesAndStatusesForPosts(posts.posts, dispatch, getState);
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch);
            dispatch(batchActions([
                {type: PostTypes.GET_POSTS_SINCE_FAILURE, error},
                logError(error)(dispatch)
            ]), getState);
            return null;
        }

        dispatch(batchActions([
            {
                type: PostTypes.RECEIVED_POSTS,
                data: posts,
                channelId
            },
            {
                type: PostTypes.GET_POSTS_SINCE_SUCCESS
            }
        ]), getState);

        return posts;
    };
}

export function getPostsSinceWithRetry(channelId, since) {
    return async (dispatch, getState) => {
        dispatch({type: PostTypes.GET_POSTS_SINCE_REQUEST}, getState);

        dispatch({
            type: PostTypes.GET_POSTS_SINCE_WITH_RETRY_ATTEMPT,
            data: {},
            meta: {
                offline: {
                    effect: () => Client4.getPostsSince(channelId, since),
                    commit: (success, payload) => {
                        const {posts} = payload;
                        getProfilesAndStatusesForPosts(posts, dispatch, getState);

                        dispatch(batchActions([
                            {
                                type: PostTypes.RECEIVED_POSTS,
                                data: payload,
                                channelId
                            },
                            {
                                type: PostTypes.GET_POSTS_SINCE_SUCCESS
                            }
                        ]), getState);
                    },
                    maxRetry: 2,
                    cancel: true,
                    onRetryScheduled: () => {
                        dispatch({
                            type: PostTypes.GET_POSTS_SINCE_WITH_RETRY_ATTEMPT
                        });
                    },
                    rollback: (success, error) => {
                        forceLogoutIfNecessary(error, dispatch);
                        dispatch(batchActions([
                            {type: PostTypes.GET_POSTS_SINCE_FAILURE, error},
                            logError(error)(dispatch)
                        ]), getState);
                    }
                }
            }
        });
    };
}

export function getPostsBefore(channelId, postId, page = 0, perPage = Posts.POST_CHUNK_SIZE) {
    return async (dispatch, getState) => {
        dispatch({type: PostTypes.GET_POSTS_BEFORE_REQUEST}, getState);

        let posts;
        try {
            posts = await Client4.getPostsBefore(channelId, postId, page, perPage);
            getProfilesAndStatusesForPosts(posts.posts, dispatch, getState);
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch);
            dispatch(batchActions([
                {type: PostTypes.GET_POSTS_BEFORE_FAILURE, error},
                logError(error)(dispatch)
            ]), getState);
            return null;
        }

        dispatch(batchActions([
            {
                type: PostTypes.RECEIVED_POSTS,
                data: posts,
                channelId
            },
            {
                type: PostTypes.GET_POSTS_BEFORE_SUCCESS
            }
        ]), getState);

        return posts;
    };
}

export function getPostsBeforeWithRetry(channelId, postId, page = 0, perPage = Posts.POST_CHUNK_SIZE) {
    return async (dispatch, getState) => {
        dispatch({
            type: PostTypes.GET_POSTS_BEFORE_REQUEST
        });

        dispatch({
            type: PostTypes.GET_POSTS_BEFORE_WITH_RETRY_ATTEMPT,
            data: {},
            meta: {
                offline: {
                    effect: () => Client4.getPostsBefore(channelId, postId, page, perPage),
                    commit: (success, payload) => {
                        const {posts} = payload;
                        getProfilesAndStatusesForPosts(posts, dispatch, getState);

                        dispatch(batchActions([
                            {
                                type: PostTypes.RECEIVED_POSTS,
                                data: payload,
                                channelId
                            },
                            {
                                type: PostTypes.GET_POSTS_BEFORE_SUCCESS
                            }
                        ]), getState);
                    },
                    maxRetry: 2,
                    cancel: true,
                    onRetryScheduled: () => {
                        dispatch({
                            type: PostTypes.GET_POSTS_BEFORE_WITH_RETRY_ATTEMPT
                        });
                    },
                    rollback: (success, error) => {
                        forceLogoutIfNecessary(error, dispatch);
                        dispatch(batchActions([
                            {type: PostTypes.GET_POSTS_BEFORE_FAILURE, error},
                            logError(error)(dispatch)
                        ]), getState);
                    }
                }
            }
        });
    };
}

export function getPostsAfter(channelId, postId, page = 0, perPage = Posts.POST_CHUNK_SIZE) {
    return async (dispatch, getState) => {
        dispatch({type: PostTypes.GET_POSTS_AFTER_REQUEST}, getState);

        let posts;
        try {
            posts = await Client4.getPostsAfter(channelId, postId, page, perPage);
            getProfilesAndStatusesForPosts(posts.posts, dispatch, getState);
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch);
            dispatch(batchActions([
                {type: PostTypes.GET_POSTS_AFTER_FAILURE, error},
                logError(error)(dispatch)
            ]), getState);
            return null;
        }

        dispatch(batchActions([
            {
                type: PostTypes.RECEIVED_POSTS,
                data: posts,
                channelId
            },
            {
                type: PostTypes.GET_POSTS_AFTER_SUCCESS
            }
        ]), getState);

        return posts;
    };
}

export function getPostsAfterWithRetry(channelId, postId, page = 0, perPage = Posts.POST_CHUNK_SIZE) {
    return async (dispatch, getState) => {
        dispatch({
            type: PostTypes.GET_POSTS_AFTER_REQUEST
        });

        dispatch({
            type: PostTypes.GET_POSTS_AFTER_WITH_RETRY_ATTEMPT,
            data: {},
            meta: {
                offline: {
                    effect: () => Client4.getPostsAfter(channelId, postId, page, perPage),
                    commit: (success, payload) => {
                        const {posts} = payload;
                        getProfilesAndStatusesForPosts(posts, dispatch, getState);

                        dispatch(batchActions([
                            {
                                type: PostTypes.RECEIVED_POSTS,
                                data: payload,
                                channelId
                            },
                            {
                                type: PostTypes.GET_POSTS_AFTER_SUCCESS
                            }
                        ]), getState);
                    },
                    maxRetry: 2,
                    cancel: true,
                    onRetryScheduled: () => {
                        dispatch({
                            type: PostTypes.GET_POSTS_AFTER_WITH_RETRY_ATTEMPT
                        });
                    },
                    rollback: (success, error) => {
                        forceLogoutIfNecessary(error, dispatch);
                        dispatch(batchActions([
                            {type: PostTypes.GET_POSTS_AFTER_FAILURE, error},
                            logError(error)(dispatch)
                        ]), getState);
                    }
                }
            }
        });
    };
}

// Note that getProfilesAndStatusesForPosts can take either an array of posts or a map of ids to posts
export async function getProfilesAndStatusesForPosts(posts, dispatch, getState) {
    if (!posts) {
        // Some API methods return null for no results
        return Promise.resolve();
    }

    const state = getState();
    const {currentUserId, profiles, statuses} = state.entities.users;

    const userIdsToLoad = new Set();
    const statusesToLoad = new Set();

    Object.values(posts).forEach((post) => {
        const userId = post.user_id;

        if (!statuses[userId]) {
            statusesToLoad.add(userId);
        }

        if (userId === currentUserId) {
            return;
        }

        if (!profiles[userId]) {
            userIdsToLoad.add(userId);
        }
    });

    const promises = [];
    if (userIdsToLoad.size > 0) {
        promises.push(getProfilesByIds(Array.from(userIdsToLoad))(dispatch, getState));
    }

    if (statusesToLoad.size > 0) {
        promises.push(getStatusesByIds(Array.from(statusesToLoad))(dispatch, getState));
    }

    // Do this after firing the other requests as it's more expensive
    const usernamesToLoad = getNeededAtMentionedUsernames(state, posts);

    if (usernamesToLoad.size > 0) {
        promises.push(getProfilesByUsernames(Array.from(usernamesToLoad))(dispatch, getState));
    }

    return Promise.all(promises);
}

export function getNeededAtMentionedUsernames(state, posts) {
    let usersByUsername; // Populate this lazily since it's relatively expensive

    const usernamesToLoad = new Set();

    Object.values(posts).forEach((post) => {
        if (!post.message.includes('@')) {
            return;
        }

        if (!usersByUsername) {
            usersByUsername = getUsersByUsername(state);
        }

        const pattern = /\B@(([a-z0-9_.-]*[a-z0-9_])[.-]*)/gi;

        let match;
        while ((match = pattern.exec(post.message)) !== null) {
            // match[1] is the matched mention including trailing punctuation
            // match[2] is the matched mention without trailing punctuation
            if (General.SPECIAL_MENTIONS.indexOf(match[2]) !== -1) {
                continue;
            }

            if (usersByUsername[match[1]] || usersByUsername[match[2]]) {
                // We have the user, go to the next match
                continue;
            }

            // If there's no trailing punctuation, this will only add 1 item to the set
            usernamesToLoad.add(match[1]);
            usernamesToLoad.add(match[2]);
        }
    });

    return usernamesToLoad;
}

export function removePost(post) {
    return async (dispatch, getState) => {
        dispatch({
            type: PostTypes.REMOVE_POST,
            data: {...post}
        }, getState);
    };
}

export function selectPost(postId) {
    return async (dispatch, getState) => {
        dispatch({
            type: PostTypes.RECEIVED_POST_SELECTED,
            data: postId
        }, getState);
    };
}

export function unflagPost(postId) {
    return async (dispatch, getState) => {
        const {currentUserId} = getState().entities.users;
        const preference = {
            user_id: currentUserId,
            category: Preferences.CATEGORY_FLAGGED_POST,
            name: postId
        };

        Client4.trackEvent('action', 'action_posts_unflag');

        deletePreferences(currentUserId, [preference])(dispatch, getState);
    };
}

export function getOpenGraphMetadata(url) {
    return async (dispatch, getState) => {
        dispatch({type: PostTypes.OPEN_GRAPH_REQUEST}, getState);

        let data;
        try {
            data = await Client4.getOpenGraphMetadata(url);
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch);
            dispatch(batchActions([
                {type: PostTypes.OPEN_GRAPH_FAILURE, error},
                logError(error)(dispatch)
            ]), getState);
            return null;
        }

        dispatch(batchActions([
            {
                type: PostTypes.RECEIVED_OPEN_GRAPH_METADATA,
                data,
                url
            },
            {
                type: PostTypes.OPEN_GRAPH_SUCCESS
            }
        ]), getState);

        return data;
    };
}

export default {
    createPost,
    editPost,
    deletePost,
    removePost,
    getPostThread,
    getPostThreadWithRetry,
    getPosts,
    getPostsWithRetry,
    getPostsSince,
    getPostsSinceWithRetry,
    getPostsBefore,
    getPostsBeforeWithRetry,
    getPostsAfter,
    getPostsAfterWithRetry,
    selectPost
};
