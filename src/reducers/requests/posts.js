// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
// @flow

import {combineReducers} from 'redux';
import {PostTypes} from 'action_types';

import {handleRequest, initialRequestState} from './helpers';

import type {GenericAction} from '../../types/actions';
import type {PostsRequestsStatuses, RequestStatusType} from '../../types/requests';

function createPost(state: RequestStatusType = initialRequestState(), action: GenericAction): RequestStatusType {
    if (action.type === PostTypes.CREATE_POST_RESET_REQUEST) {
        return initialRequestState();
    }

    return handleRequest(
        PostTypes.CREATE_POST_REQUEST,
        PostTypes.CREATE_POST_SUCCESS,
        PostTypes.CREATE_POST_FAILURE,
        state,
        action
    );
}

function editPost(state: RequestStatusType = initialRequestState(), action: GenericAction): RequestStatusType {
    return handleRequest(
        PostTypes.EDIT_POST_REQUEST,
        PostTypes.EDIT_POST_SUCCESS,
        PostTypes.EDIT_POST_FAILURE,
        state,
        action
    );
}

function deletePost(state: RequestStatusType = initialRequestState(), action: GenericAction): RequestStatusType {
    return handleRequest(
        PostTypes.DELETE_POST_REQUEST,
        PostTypes.DELETE_POST_SUCCESS,
        PostTypes.DELETE_POST_FAILURE,
        state,
        action
    );
}

function getPostThread(state: RequestStatusType = initialRequestState(), action: GenericAction): RequestStatusType {
    return handleRequest(
        PostTypes.GET_POST_THREAD_REQUEST,
        PostTypes.GET_POST_THREAD_SUCCESS,
        PostTypes.GET_POST_THREAD_FAILURE,
        state,
        action
    );
}

function getPostThreadWithRetryAttempt(state: number = 0, action: GenericAction): number {
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

function getPosts(state: RequestStatusType = initialRequestState(), action: GenericAction): RequestStatusType {
    return handleRequest(
        PostTypes.GET_POSTS_REQUEST,
        PostTypes.GET_POSTS_SUCCESS,
        PostTypes.GET_POSTS_FAILURE,
        state,
        action
    );
}

function getPostsWithRetryAttempt(state: number = 0, action: GenericAction): number {
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

function getPostsSince(state: RequestStatusType = initialRequestState(), action: GenericAction): RequestStatusType {
    return handleRequest(
        PostTypes.GET_POSTS_SINCE_REQUEST,
        PostTypes.GET_POSTS_SINCE_SUCCESS,
        PostTypes.GET_POSTS_SINCE_FAILURE,
        state,
        action
    );
}

function getPostsSinceWithRetryAttempt(state: number = 0, action: GenericAction): number {
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

function getPostsBefore(state: RequestStatusType = initialRequestState(), action: GenericAction): RequestStatusType {
    return handleRequest(
        PostTypes.GET_POSTS_BEFORE_REQUEST,
        PostTypes.GET_POSTS_BEFORE_SUCCESS,
        PostTypes.GET_POSTS_BEFORE_FAILURE,
        state,
        action
    );
}

function getPostsBeforeWithRetryAttempt(state: number = 0, action: GenericAction): number {
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

function getPostsAfter(state: RequestStatusType = initialRequestState(), action: GenericAction): RequestStatusType {
    return handleRequest(
        PostTypes.GET_POSTS_AFTER_REQUEST,
        PostTypes.GET_POSTS_AFTER_SUCCESS,
        PostTypes.GET_POSTS_AFTER_FAILURE,
        state,
        action
    );
}

function getPostsAfterWithRetryAttempt(state: number = 0, action: GenericAction): number {
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

function reaction(state: RequestStatusType = initialRequestState(), action: GenericAction): RequestStatusType {
    return handleRequest(
        PostTypes.REACTION_REQUEST,
        PostTypes.REACTION_SUCCESS,
        PostTypes.REACTION_FAILURE,
        state,
        action
    );
}

function openGraph(state: RequestStatusType = initialRequestState(), action: GenericAction): RequestStatusType {
    return handleRequest(
        PostTypes.OPEN_GRAPH_REQUEST,
        PostTypes.OPEN_GRAPH_SUCCESS,
        PostTypes.OPEN_GRAPH_FAILURE,
        state,
        action
    );
}

function doPostAction(state: RequestStatusType = initialRequestState(), action: GenericAction): RequestStatusType {
    return handleRequest(
        PostTypes.DO_POST_ACTION_REQUEST,
        PostTypes.DO_POST_ACTION_SUCCESS,
        PostTypes.DO_POST_ACTION_FAILURE,
        state,
        action
    );
}

export default (combineReducers({
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
    openGraph,
    doPostAction,
}): (PostsRequestsStatuses, GenericAction) => PostsRequestsStatuses);
