// Copyright (c) 2016-present Mattermost, Inc. All Rights Reserved.
// See License.txt for license information.

import {batchActions} from 'redux-batched-actions';

import {PostTypes, FileTypes} from 'action_types';
import {Client4} from 'client';
import {Preferences, Posts} from 'constants';
import {getUsersByUsername} from 'selectors/entities/users';

import {bindClientFunc, forceLogoutIfNecessary} from './helpers';
import {getLogErrorAction} from './errors';
import {deletePreferences, savePreferences} from './preferences';
import {getProfilesByIds, getProfilesByUsernames, getStatusesByIds} from './users';

export function createPost(post, files) {
    return async (dispatch, getState) => {
        dispatch({type: PostTypes.CREATE_POST_REQUEST}, getState);

        let newPost = post;
        if (files) {
            const fileIds = files.map((file) => file.id);
            newPost = {
                ...newPost,
                file_ids: fileIds
            };
        }

        let createdPost;
        try {
            createdPost = await Client4.createPost(newPost);
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch);
            dispatch(batchActions([
                {type: PostTypes.CREATE_POST_FAILURE, error},
                getLogErrorAction(error)
            ]), getState);
            return;
        }

        const actions = [{
            type: PostTypes.RECEIVED_POST,
            data: {...createdPost}
        }];

        if (files) {
            actions.push({
                type: FileTypes.RECEIVED_FILES_FOR_POST,
                postId: createdPost.id,
                data: files
            });
        }

        actions.push({
            type: PostTypes.CREATE_POST_SUCCESS
        });

        dispatch(batchActions(actions), getState);
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
        Client4.updatePost,
        PostTypes.EDIT_POST_REQUEST,
        [PostTypes.RECEIVED_POST, PostTypes.EDIT_POST_SUCCESS],
        PostTypes.EDIT_POST_FAILURE,
        post
    );
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

        savePreferences(currentUserId, [preference])(dispatch, getState);
    };
}

export function getPostThread(postId) {
    return async (dispatch, getState) => {
        dispatch({type: PostTypes.GET_POST_THREAD_REQUEST}, getState);

        let posts;
        try {
            posts = await Client4.getPostThread(postId);
            getProfilesAndStatusesForPosts(posts, dispatch, getState);
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch);
            dispatch(batchActions([
                {type: PostTypes.GET_POST_THREAD_FAILURE, error},
                getLogErrorAction(error)
            ]), getState);
            return;
        }

        const post = posts.posts[postId];

        dispatch(batchActions([
            {
                type: PostTypes.RECEIVED_POSTS,
                data: posts,
                channelId: post.channel_id
            },
            {
                type: PostTypes.GET_POST_THREAD_SUCCESS
            }
        ]), getState);
    };
}

export function getPosts(channelId, page = 0, perPage = Posts.POST_CHUNK_SIZE) {
    return async (dispatch, getState) => {
        dispatch({type: PostTypes.GET_POSTS_REQUEST}, getState);
        let posts;

        try {
            posts = await Client4.getPosts(channelId, page, perPage);
            getProfilesAndStatusesForPosts(posts, dispatch, getState);
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch);
            dispatch(batchActions([
                {type: PostTypes.GET_POSTS_FAILURE, error},
                getLogErrorAction(error)
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

export function getPostsSince(channelId, since) {
    return async (dispatch, getState) => {
        dispatch({type: PostTypes.GET_POSTS_SINCE_REQUEST}, getState);

        let posts;
        try {
            posts = await Client4.getPostsSince(channelId, since);
            getProfilesAndStatusesForPosts(posts, dispatch, getState);
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch);
            dispatch(batchActions([
                {type: PostTypes.GET_POSTS_SINCE_FAILURE, error},
                getLogErrorAction(error)
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

export function getPostsBefore(channelId, postId, page = 0, perPage = Posts.POST_CHUNK_SIZE) {
    return async (dispatch, getState) => {
        dispatch({type: PostTypes.GET_POSTS_BEFORE_REQUEST}, getState);

        let posts;
        try {
            posts = await Client4.getPostsBefore(channelId, postId, page, perPage);
            getProfilesAndStatusesForPosts(posts, dispatch, getState);
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch);
            dispatch(batchActions([
                {type: PostTypes.GET_POSTS_BEFORE_FAILURE, error},
                getLogErrorAction(error)
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

export function getPostsAfter(channelId, postId, page = 0, perPage = Posts.POST_CHUNK_SIZE) {
    return async (dispatch, getState) => {
        dispatch({type: PostTypes.GET_POSTS_AFTER_REQUEST}, getState);

        let posts;
        try {
            posts = await Client4.getPostsAfter(channelId, postId, page, perPage);
            getProfilesAndStatusesForPosts(posts, dispatch, getState);
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch);
            dispatch(batchActions([
                {type: PostTypes.GET_POSTS_AFTER_FAILURE, error},
                getLogErrorAction(error)
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

async function getProfilesAndStatusesForPosts(list, dispatch, getState) {
    const state = getState();
    const {currentUserId, profiles, statuses} = state.entities.users;
    const posts = list.posts;

    const userIdsToLoad = new Set();
    const statusesToLoad = new Set();

    Object.values(posts).forEach((post) => {
        const userId = post.user_id;

        if (userId === currentUserId) {
            return;
        }

        if (!profiles[userId]) {
            userIdsToLoad.add(userId);
        }

        if (!statuses[userId]) {
            statusesToLoad.add(userId);
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

        deletePreferences(currentUserId, [preference])(dispatch, getState);
    };
}

export default {
    createPost,
    editPost,
    deletePost,
    removePost,
    getPostThread,
    getPosts,
    getPostsSince,
    getPostsBefore,
    getPostsAfter,
    selectPost
};
