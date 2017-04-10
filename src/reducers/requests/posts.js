// Copyright (c) 2016-present Mattermost, Inc. All Rights Reserved.
// See License.txt for license information.

import {combineReducers} from 'redux';
import {PostTypes} from 'action_types';

import {handleRequest, initialRequestState} from './helpers';

function createPost(state = initialRequestState(), action) {
    return handleRequest(
        PostTypes.CREATE_POST_REQUEST,
        PostTypes.CREATE_POST_SUCCESS,
        PostTypes.CREATE_POST_FAILURE,
        state,
        action
    );
}

function editPost(state = initialRequestState(), action) {
    return handleRequest(
        PostTypes.EDIT_POST_REQUEST,
        PostTypes.EDIT_POST_SUCCESS,
        PostTypes.EDIT_POST_FAILURE,
        state,
        action
    );
}

function deletePost(state = initialRequestState(), action) {
    return handleRequest(
        PostTypes.DELETE_POST_REQUEST,
        PostTypes.DELETE_POST_SUCCESS,
        PostTypes.DELETE_POST_FAILURE,
        state,
        action
    );
}

function getPostThread(state = initialRequestState(), action) {
    return handleRequest(
        PostTypes.GET_POST_THREAD_REQUEST,
        PostTypes.GET_POST_THREAD_SUCCESS,
        PostTypes.GET_POST_THREAD_FAILURE,
        state,
        action
    );
}

function getPosts(state = initialRequestState(), action) {
    return handleRequest(
        PostTypes.GET_POSTS_REQUEST,
        PostTypes.GET_POSTS_SUCCESS,
        PostTypes.GET_POSTS_FAILURE,
        state,
        action
    );
}

function getPostsSince(state = initialRequestState(), action) {
    return handleRequest(
        PostTypes.GET_POSTS_SINCE_REQUEST,
        PostTypes.GET_POSTS_SINCE_SUCCESS,
        PostTypes.GET_POSTS_SINCE_FAILURE,
        state,
        action
    );
}

function getPostsBefore(state = initialRequestState(), action) {
    return handleRequest(
        PostTypes.GET_POSTS_BEFORE_REQUEST,
        PostTypes.GET_POSTS_BEFORE_SUCCESS,
        PostTypes.GET_POSTS_BEFORE_FAILURE,
        state,
        action
    );
}

function getPostsAfter(state = initialRequestState(), action) {
    return handleRequest(
        PostTypes.GET_POSTS_AFTER_REQUEST,
        PostTypes.GET_POSTS_AFTER_SUCCESS,
        PostTypes.GET_POSTS_AFTER_FAILURE,
        state,
        action
    );
}

export default combineReducers({
    createPost,
    editPost,
    deletePost,
    getPostThread,
    getPosts,
    getPostsSince,
    getPostsBefore,
    getPostsAfter
});
