// Copyright (c) 2017-present Mattermost, Inc. All Rights Reserved.
// See License.txt for license information.

import {combineReducers} from 'redux';
import {IntegrationTypes} from 'action_types';

import {handleRequest, initialRequestState} from './helpers';

function createIncomingHook(state = initialRequestState(), action) {
    return handleRequest(
        IntegrationTypes.CREATE_INCOMING_HOOK_REQUEST,
        IntegrationTypes.CREATE_INCOMING_HOOK_SUCCESS,
        IntegrationTypes.CREATE_INCOMING_HOOK_FAILURE,
        state,
        action
    );
}

function getIncomingHooks(state = initialRequestState(), action) {
    return handleRequest(
        IntegrationTypes.GET_INCOMING_HOOKS_REQUEST,
        IntegrationTypes.GET_INCOMING_HOOKS_SUCCESS,
        IntegrationTypes.GET_INCOMING_HOOKS_FAILURE,
        state,
        action
    );
}

function deleteIncomingHook(state = initialRequestState(), action) {
    return handleRequest(
        IntegrationTypes.DELETE_INCOMING_HOOK_REQUEST,
        IntegrationTypes.DELETE_INCOMING_HOOK_SUCCESS,
        IntegrationTypes.DELETE_INCOMING_HOOK_FAILURE,
        state,
        action
    );
}

function updateIncomingHook(state = initialRequestState(), action) {
    return handleRequest(
        IntegrationTypes.UPDATE_INCOMING_HOOK_REQUEST,
        IntegrationTypes.UPDATE_INCOMING_HOOK_SUCCESS,
        IntegrationTypes.UPDATE_INCOMING_HOOK_FAILURE,
        state,
        action
    );
}

function createOutgoingHook(state = initialRequestState(), action) {
    return handleRequest(
        IntegrationTypes.CREATE_OUTGOING_HOOK_REQUEST,
        IntegrationTypes.CREATE_OUTGOING_HOOK_SUCCESS,
        IntegrationTypes.CREATE_OUTGOING_HOOK_FAILURE,
        state,
        action
    );
}

function getOutgoingHooks(state = initialRequestState(), action) {
    return handleRequest(
        IntegrationTypes.GET_OUTGOING_HOOKS_REQUEST,
        IntegrationTypes.GET_OUTGOING_HOOKS_SUCCESS,
        IntegrationTypes.GET_OUTGOING_HOOKS_FAILURE,
        state,
        action
    );
}

function deleteOutgoingHook(state = initialRequestState(), action) {
    return handleRequest(
        IntegrationTypes.DELETE_OUTGOING_HOOK_REQUEST,
        IntegrationTypes.DELETE_OUTGOING_HOOK_SUCCESS,
        IntegrationTypes.DELETE_OUTGOING_HOOK_FAILURE,
        state,
        action
    );
}

function updateOutgoingHook(state = initialRequestState(), action) {
    return handleRequest(
        IntegrationTypes.UPDATE_OUTGOING_HOOK_REQUEST,
        IntegrationTypes.UPDATE_OUTGOING_HOOK_SUCCESS,
        IntegrationTypes.UPDATE_OUTGOING_HOOK_FAILURE,
        state,
        action
    );
}

export default combineReducers({
    createIncomingHook,
    getIncomingHooks,
    deleteIncomingHook,
    updateIncomingHook,
    createOutgoingHook,
    getOutgoingHooks,
    deleteOutgoingHook,
    updateOutgoingHook
});
