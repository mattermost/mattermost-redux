// Copyright (c) 2016 Mattermost, Inc. All Rights Reserved.
// See License.txt for license information.

import {batchActions} from 'redux-batched-actions';

import Client from 'client';
import {Constants, PostsTypes, Preferences} from 'constants';

import {bindClientFunc, forceLogoutIfNecessary} from './helpers';
import {getLogErrorAction} from './errors';
import {deletePreferences, savePreferences} from './preferences';
import {getProfilesByIds, getStatusesByIds} from './users';

export function createPost(teamId, post) {
    return bindClientFunc(
        Client.createPost,
        PostsTypes.CREATE_POST_REQUEST,
        [PostsTypes.RECEIVED_POST, PostsTypes.CREATE_POST_SUCCESS],
        PostsTypes.CREATE_POST_FAILURE,
        teamId,
        post
    );
}

export function deletePost(teamId, post) {
    return async (dispatch, getState) => {
        dispatch({type: PostsTypes.DELETE_POST_REQUEST}, getState);

        try {
            await Client.deletePost(teamId, post.channel_id, post.id);
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch);
            dispatch(batchActions([
                {type: PostsTypes.DELETE_POST_FAILURE, error},
                getLogErrorAction(error)
            ]), getState);
            return;
        }

        dispatch(batchActions([
            {
                type: PostsTypes.POST_DELETED,
                data: {...post}
            },
            {
                type: PostsTypes.DELETE_POST_SUCCESS
            }
        ]), getState);
    };
}

export function editPost(teamId, post) {
    return bindClientFunc(
        Client.editPost,
        PostsTypes.EDIT_POST_REQUEST,
        [PostsTypes.RECEIVED_POST, PostsTypes.EDIT_POST_SUCCESS],
        PostsTypes.EDIT_POST_FAILURE,
        teamId,
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

        return savePreferences([preference])(dispatch, getState);
    };
}

export function getPost(teamId, channelId, postId) {
    return async (dispatch, getState) => {
        dispatch({type: PostsTypes.GET_POST_REQUEST}, getState);

        let post;
        try {
            post = await Client.getPost(teamId, channelId, postId);
            getProfilesAndStatusesForPosts(post, dispatch, getState);
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch);
            dispatch(batchActions([
                {type: PostsTypes.GET_POST_FAILURE, error},
                getLogErrorAction(error)
            ]), getState);
            return;
        }

        dispatch(batchActions([
            {
                type: PostsTypes.RECEIVED_POSTS,
                data: {...post},
                channelId
            },
            {
                type: PostsTypes.GET_POST_SUCCESS
            }
        ]), getState);
    };
}

export function getPosts(teamId, channelId, offset = 0, limit = Constants.POST_CHUNK_SIZE) {
    return async (dispatch, getState) => {
        dispatch({type: PostsTypes.GET_POSTS_REQUEST}, getState);
        let posts;

        try {
            posts = await Client.getPosts(teamId, channelId, offset, limit);
            getProfilesAndStatusesForPosts(posts, dispatch, getState);
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch);
            dispatch(batchActions([
                {type: PostsTypes.GET_POSTS_FAILURE, error},
                getLogErrorAction(error)
            ]), getState);
            return null;
        }

        dispatch(batchActions([
            {
                type: PostsTypes.RECEIVED_POSTS,
                data: posts,
                channelId
            },
            {
                type: PostsTypes.GET_POSTS_SUCCESS
            }
        ]), getState);

        return posts;
    };
}

export function getPostsSince(teamId, channelId, since) {
    return async (dispatch, getState) => {
        dispatch({type: PostsTypes.GET_POSTS_SINCE_REQUEST}, getState);

        let posts;
        try {
            posts = await Client.getPostsSince(teamId, channelId, since);
            getProfilesAndStatusesForPosts(posts, dispatch, getState);
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch);
            dispatch(batchActions([
                {type: PostsTypes.GET_POSTS_SINCE_FAILURE, error},
                getLogErrorAction(error)
            ]), getState);
            return null;
        }

        dispatch(batchActions([
            {
                type: PostsTypes.RECEIVED_POSTS,
                data: posts,
                channelId
            },
            {
                type: PostsTypes.GET_POSTS_SINCE_SUCCESS
            }
        ]), getState);

        return posts;
    };
}

export function getPostsBefore(teamId, channelId, postId, offset = 0, limit = Constants.POST_CHUNK_SIZE) {
    return async (dispatch, getState) => {
        dispatch({type: PostsTypes.GET_POSTS_BEFORE_REQUEST}, getState);

        let posts;
        try {
            posts = await Client.getPostsBefore(teamId, channelId, postId, offset, limit);
            getProfilesAndStatusesForPosts(posts, dispatch, getState);
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch);
            dispatch(batchActions([
                {type: PostsTypes.GET_POSTS_BEFORE_FAILURE, error},
                getLogErrorAction(error)
            ]), getState);
            return null;
        }

        dispatch(batchActions([
            {
                type: PostsTypes.RECEIVED_POSTS,
                data: posts,
                channelId
            },
            {
                type: PostsTypes.GET_POSTS_BEFORE_SUCCESS
            }
        ]), getState);

        return posts;
    };
}

export function getPostsAfter(teamId, channelId, postId, offset = 0, limit = Constants.POST_CHUNK_SIZE) {
    return async (dispatch, getState) => {
        dispatch({type: PostsTypes.GET_POSTS_AFTER_REQUEST}, getState);

        let posts;
        try {
            posts = await Client.getPostsAfter(teamId, channelId, postId, offset, limit);
            getProfilesAndStatusesForPosts(posts, dispatch, getState);
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch);
            dispatch(batchActions([
                {type: PostsTypes.GET_POSTS_AFTER_FAILURE, error},
                getLogErrorAction(error)
            ]), getState);
            return null;
        }

        dispatch(batchActions([
            {
                type: PostsTypes.RECEIVED_POSTS,
                data: posts,
                channelId
            },
            {
                type: PostsTypes.GET_POSTS_AFTER_SUCCESS
            }
        ]), getState);

        return posts;
    };
}

async function getProfilesAndStatusesForPosts(list, dispatch, getState) {
    const {profiles, statuses} = getState().entities.users;
    const posts = list.posts;
    const profilesToLoad = [];
    const statusesToLoad = [];

    Object.keys(posts).forEach((key) => {
        const post = posts[key];
        const userId = post.user_id;

        if (!profiles[userId]) {
            profilesToLoad.push(userId);
        }

        if (!statuses[userId]) {
            statusesToLoad.push(userId);
        }
    });

    if (profilesToLoad.length) {
        await getProfilesByIds(profilesToLoad)(dispatch, getState);
    }

    if (statusesToLoad.length) {
        await getStatusesByIds(statusesToLoad)(dispatch, getState);
    }
}

export function removePost(post) {
    return async (dispatch, getState) => {
        dispatch({
            type: PostsTypes.REMOVE_POST,
            data: {...post}
        }, getState);
    };
}

export function selectPost(postId) {
    return async (dispatch, getState) => {
        dispatch({
            type: PostsTypes.RECEIVED_POST_SELECTED,
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

        return deletePreferences([preference])(dispatch, getState);
    };
}

export default {
    createPost,
    editPost,
    deletePost,
    removePost,
    getPost,
    getPosts,
    getPostsSince,
    getPostsBefore,
    getPostsAfter,
    selectPost
};
