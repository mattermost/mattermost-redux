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

function getPostThreadWithRetryAttempt(state = 0, action) {
    switch (action.type) {
    case PostTypes.GET_POST_THREAD_WITH_RETRY_ATTEMPT:
        return state + 1;
    case PostTypes.GET_POST_THREAD_REQUEST:
    case PostTypes.GET_POST_THREAD_SUCCESS:
        return 0;
    default:
        return state;
    }
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

function getPostsWithRetryAttempt(state = 0, action) {
    switch (action.type) {
    case PostTypes.GET_POSTS_WITH_RETRY_ATTEMPT:
        return state + 1;
    case PostTypes.GET_POSTS_REQUEST:
    case PostTypes.GET_POSTS_SUCCESS:
        return 0;
    default:
        return state;
    }
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

function getPostsSinceWithRetryAttempt(state = 0, action) {
    switch (action.type) {
    case PostTypes.GET_POSTS_SINCE_WITH_RETRY_ATTEMPT:
        return state + 1;
    case PostTypes.GET_POSTS_REQUEST:
    case PostTypes.GET_POSTS_SINCE_REQUEST:
    case PostTypes.GET_POSTS_SINCE_SUCCESS:
        return 0;
    default:
        return state;
    }
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

function getPostsBeforeWithRetryAttempt(state = 0, action) {
    switch (action.type) {
    case PostTypes.GET_POSTS_BEFORE_WITH_RETRY_ATTEMPT:
        return state + 1;
    case PostTypes.GET_POSTS_REQUEST:
    case PostTypes.GET_POSTS_BEFORE_REQUEST:
    case PostTypes.GET_POSTS_BEFORE_SUCCESS:
        return 0;
    default:
        return state;
    }
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

function getPostsAfterWithRetryAttempt(state = 0, action) {
    switch (action.type) {
    case PostTypes.GET_POSTS_AFTER_WITH_RETRY_ATTEMPT:
        return state + 1;
    case PostTypes.GET_POSTS_REQUEST:
    case PostTypes.GET_POSTS_AFTER_REQUEST:
    case PostTypes.GET_POSTS_AFTER_SUCCESS:
        return 0;
    default:
        return state;
    }
}

function reaction(state = initialRequestState(), action) {
    return handleRequest(
        PostTypes.REACTION_REQUEST,
        PostTypes.REACTION_SUCCESS,
        PostTypes.REACTION_FAILURE,
        state,
        action
    );
}

function openGraph(state = initialRequestState(), action) {
    return handleRequest(
        PostTypes.OPEN_GRAPH_REQUEST,
        PostTypes.OPEN_GRAPH_SUCCESS,
        PostTypes.OPEN_GRAPH_FAILURE,
        state,
        action
    );
}

export default combineReducers({
    createPost,
    editPost,
    deletePost,
    getPostThread,
    getPostThreadRetryAttempts: getPostThreadWithRetryAttempt,
    getPosts,
    getPostsRetryAttempts: getPostsWithRetryAttempt,
    getPostsSince,
    getPostsSinceRetryAttempts: getPostsSinceWithRetryAttempt,
    getPostsBefore,
    getPostsBeforeRetryAttempts: getPostsBeforeWithRetryAttempt,
    getPostsAfter,
    getPostsAfterRetryAttempts: getPostsAfterWithRetryAttempt,
    reaction,
    openGraph
});
