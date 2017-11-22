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

function getCommands(state = initialRequestState(), action) {
    return handleRequest(
        IntegrationTypes.GET_COMMANDS_REQUEST,
        IntegrationTypes.GET_COMMANDS_SUCCESS,
        IntegrationTypes.GET_COMMANDS_FAILURE,
        state,
        action
    );
}

function getAutocompleteCommands(state = initialRequestState(), action) {
    return handleRequest(
        IntegrationTypes.GET_AUTOCOMPLETE_COMMANDS_REQUEST,
        IntegrationTypes.GET_AUTOCOMPLETE_COMMANDS_SUCCESS,
        IntegrationTypes.GET_AUTOCOMPLETE_COMMANDS_FAILURE,
        state,
        action
    );
}

function getCustomTeamCommands(state = initialRequestState(), action) {
    return handleRequest(
        IntegrationTypes.GET_CUSTOM_TEAM_COMMANDS_REQUEST,
        IntegrationTypes.GET_CUSTOM_TEAM_COMMANDS_SUCCESS,
        IntegrationTypes.GET_CUSTOM_TEAM_COMMANDS_FAILURE,
        state,
        action
    );
}

function addCommand(state = initialRequestState(), action) {
    return handleRequest(
        IntegrationTypes.ADD_COMMAND_REQUEST,
        IntegrationTypes.ADD_COMMAND_SUCCESS,
        IntegrationTypes.ADD_COMMAND_FAILURE,
        state,
        action
    );
}

function editCommand(state = initialRequestState(), action) {
    return handleRequest(
        IntegrationTypes.EDIT_COMMAND_REQUEST,
        IntegrationTypes.EDIT_COMMAND_SUCCESS,
        IntegrationTypes.EDIT_COMMAND_FAILURE,
        state,
        action
    );
}

function regenCommandToken(state = initialRequestState(), action) {
    return handleRequest(
        IntegrationTypes.REGEN_COMMAND_TOKEN_REQUEST,
        IntegrationTypes.REGEN_COMMAND_TOKEN_SUCCESS,
        IntegrationTypes.REGEN_COMMAND_TOKEN_FAILURE,
        state,
        action
    );
}

function deleteCommand(state = initialRequestState(), action) {
    return handleRequest(
        IntegrationTypes.DELETE_COMMAND_REQUEST,
        IntegrationTypes.DELETE_COMMAND_SUCCESS,
        IntegrationTypes.DELETE_COMMAND_FAILURE,
        state,
        action
    );
}

function addOAuthApp(state = initialRequestState(), action) {
    return handleRequest(
        IntegrationTypes.ADD_OAUTH_APP_REQUEST,
        IntegrationTypes.ADD_OAUTH_APP_SUCCESS,
        IntegrationTypes.ADD_OAUTH_APP_FAILURE,
        state,
        action
    );
}

function getOAuthApps(state = initialRequestState(), action) {
    return handleRequest(
        IntegrationTypes.GET_OAUTH_APPS_REQUEST,
        IntegrationTypes.GET_OAUTH_APPS_SUCCESS,
        IntegrationTypes.GET_OAUTH_APPS_FAILURE,
        state,
        action
    );
}

function getOAuthApp(state = initialRequestState(), action) {
    return handleRequest(
        IntegrationTypes.GET_OAUTH_APP_REQUEST,
        IntegrationTypes.GET_OAUTH_APP_SUCCESS,
        IntegrationTypes.GET_OAUTH_APP_FAILURE,
        state,
        action
    );
}

function deleteOAuthApp(state = initialRequestState(), action) {
    return handleRequest(
        IntegrationTypes.DELETE_OAUTH_APP_REQUEST,
        IntegrationTypes.DELETE_OAUTH_APP_SUCCESS,
        IntegrationTypes.DELETE_OAUTH_APP_FAILURE,
        state,
        action
    );
}

function updateOAuthApp(state = initialRequestState(), action) {
    return handleRequest(
        IntegrationTypes.UPDATE_OAUTH_APP_REQUEST,
        IntegrationTypes.UPDATE_OAUTH_APP_SUCCESS,
        IntegrationTypes.UPDATE_OAUTH_APP_FAILURE,
        state,
        action
    );
}

function executeCommand(state = initialRequestState(), action) {
    return handleRequest(
        IntegrationTypes.EXECUTE_COMMAND_REQUEST,
        IntegrationTypes.EXECUTE_COMMAND_SUCCESS,
        IntegrationTypes.EXECUTE_COMMAND_FAILURE,
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
    updateOutgoingHook,
    getCommands,
    getCustomTeamCommands,
    addCommand,
    editCommand,
    regenCommandToken,
    deleteCommand,
    addOAuthApp,
    getOAuthApps,
    getOAuthApp,
    deleteOAuthApp,
    updateOAuthApp,
    executeCommand,
    getAutocompleteCommands
});
