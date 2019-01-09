// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
// @flow

import {combineReducers} from 'redux';
import {IntegrationTypes} from 'action_types';

import {handleRequest, initialRequestState} from './helpers';

import type {GenericAction} from 'types/actions';
import type {IntegrationsRequestsStatuses, RequestStatusType} from 'types/requests';

function createIncomingHook(state: RequestStatusType = initialRequestState(), action: GenericAction): RequestStatusType {
    return handleRequest(
        IntegrationTypes.CREATE_INCOMING_HOOK_REQUEST,
        IntegrationTypes.CREATE_INCOMING_HOOK_SUCCESS,
        IntegrationTypes.CREATE_INCOMING_HOOK_FAILURE,
        state,
        action
    );
}

function getIncomingHooks(state: RequestStatusType = initialRequestState(), action: GenericAction): RequestStatusType {
    return handleRequest(
        IntegrationTypes.GET_INCOMING_HOOKS_REQUEST,
        IntegrationTypes.GET_INCOMING_HOOKS_SUCCESS,
        IntegrationTypes.GET_INCOMING_HOOKS_FAILURE,
        state,
        action
    );
}

function deleteIncomingHook(state: RequestStatusType = initialRequestState(), action: GenericAction): RequestStatusType {
    return handleRequest(
        IntegrationTypes.DELETE_INCOMING_HOOK_REQUEST,
        IntegrationTypes.DELETE_INCOMING_HOOK_SUCCESS,
        IntegrationTypes.DELETE_INCOMING_HOOK_FAILURE,
        state,
        action
    );
}

function updateIncomingHook(state: RequestStatusType = initialRequestState(), action: GenericAction): RequestStatusType {
    return handleRequest(
        IntegrationTypes.UPDATE_INCOMING_HOOK_REQUEST,
        IntegrationTypes.UPDATE_INCOMING_HOOK_SUCCESS,
        IntegrationTypes.UPDATE_INCOMING_HOOK_FAILURE,
        state,
        action
    );
}

function createOutgoingHook(state: RequestStatusType = initialRequestState(), action: GenericAction): RequestStatusType {
    return handleRequest(
        IntegrationTypes.CREATE_OUTGOING_HOOK_REQUEST,
        IntegrationTypes.CREATE_OUTGOING_HOOK_SUCCESS,
        IntegrationTypes.CREATE_OUTGOING_HOOK_FAILURE,
        state,
        action
    );
}

function getOutgoingHooks(state: RequestStatusType = initialRequestState(), action: GenericAction): RequestStatusType {
    return handleRequest(
        IntegrationTypes.GET_OUTGOING_HOOKS_REQUEST,
        IntegrationTypes.GET_OUTGOING_HOOKS_SUCCESS,
        IntegrationTypes.GET_OUTGOING_HOOKS_FAILURE,
        state,
        action
    );
}

function deleteOutgoingHook(state: RequestStatusType = initialRequestState(), action: GenericAction): RequestStatusType {
    return handleRequest(
        IntegrationTypes.DELETE_OUTGOING_HOOK_REQUEST,
        IntegrationTypes.DELETE_OUTGOING_HOOK_SUCCESS,
        IntegrationTypes.DELETE_OUTGOING_HOOK_FAILURE,
        state,
        action
    );
}

function updateOutgoingHook(state: RequestStatusType = initialRequestState(), action: GenericAction): RequestStatusType {
    return handleRequest(
        IntegrationTypes.UPDATE_OUTGOING_HOOK_REQUEST,
        IntegrationTypes.UPDATE_OUTGOING_HOOK_SUCCESS,
        IntegrationTypes.UPDATE_OUTGOING_HOOK_FAILURE,
        state,
        action
    );
}

function getCommands(state: RequestStatusType = initialRequestState(), action: GenericAction): RequestStatusType {
    return handleRequest(
        IntegrationTypes.GET_COMMANDS_REQUEST,
        IntegrationTypes.GET_COMMANDS_SUCCESS,
        IntegrationTypes.GET_COMMANDS_FAILURE,
        state,
        action
    );
}

function getAutocompleteCommands(state: RequestStatusType = initialRequestState(), action: GenericAction): RequestStatusType {
    return handleRequest(
        IntegrationTypes.GET_AUTOCOMPLETE_COMMANDS_REQUEST,
        IntegrationTypes.GET_AUTOCOMPLETE_COMMANDS_SUCCESS,
        IntegrationTypes.GET_AUTOCOMPLETE_COMMANDS_FAILURE,
        state,
        action
    );
}

function getCustomTeamCommands(state: RequestStatusType = initialRequestState(), action: GenericAction): RequestStatusType {
    return handleRequest(
        IntegrationTypes.GET_CUSTOM_TEAM_COMMANDS_REQUEST,
        IntegrationTypes.GET_CUSTOM_TEAM_COMMANDS_SUCCESS,
        IntegrationTypes.GET_CUSTOM_TEAM_COMMANDS_FAILURE,
        state,
        action
    );
}

function addCommand(state: RequestStatusType = initialRequestState(), action: GenericAction): RequestStatusType {
    return handleRequest(
        IntegrationTypes.ADD_COMMAND_REQUEST,
        IntegrationTypes.ADD_COMMAND_SUCCESS,
        IntegrationTypes.ADD_COMMAND_FAILURE,
        state,
        action
    );
}

function editCommand(state: RequestStatusType = initialRequestState(), action: GenericAction): RequestStatusType {
    return handleRequest(
        IntegrationTypes.EDIT_COMMAND_REQUEST,
        IntegrationTypes.EDIT_COMMAND_SUCCESS,
        IntegrationTypes.EDIT_COMMAND_FAILURE,
        state,
        action
    );
}

function regenCommandToken(state: RequestStatusType = initialRequestState(), action: GenericAction): RequestStatusType {
    return handleRequest(
        IntegrationTypes.REGEN_COMMAND_TOKEN_REQUEST,
        IntegrationTypes.REGEN_COMMAND_TOKEN_SUCCESS,
        IntegrationTypes.REGEN_COMMAND_TOKEN_FAILURE,
        state,
        action
    );
}

function deleteCommand(state: RequestStatusType = initialRequestState(), action: GenericAction): RequestStatusType {
    return handleRequest(
        IntegrationTypes.DELETE_COMMAND_REQUEST,
        IntegrationTypes.DELETE_COMMAND_SUCCESS,
        IntegrationTypes.DELETE_COMMAND_FAILURE,
        state,
        action
    );
}

function addOAuthApp(state: RequestStatusType = initialRequestState(), action: GenericAction): RequestStatusType {
    return handleRequest(
        IntegrationTypes.ADD_OAUTH_APP_REQUEST,
        IntegrationTypes.ADD_OAUTH_APP_SUCCESS,
        IntegrationTypes.ADD_OAUTH_APP_FAILURE,
        state,
        action
    );
}

function getOAuthApps(state: RequestStatusType = initialRequestState(), action: GenericAction): RequestStatusType {
    return handleRequest(
        IntegrationTypes.GET_OAUTH_APPS_REQUEST,
        IntegrationTypes.GET_OAUTH_APPS_SUCCESS,
        IntegrationTypes.GET_OAUTH_APPS_FAILURE,
        state,
        action
    );
}

function getOAuthApp(state: RequestStatusType = initialRequestState(), action: GenericAction): RequestStatusType {
    return handleRequest(
        IntegrationTypes.GET_OAUTH_APP_REQUEST,
        IntegrationTypes.GET_OAUTH_APP_SUCCESS,
        IntegrationTypes.GET_OAUTH_APP_FAILURE,
        state,
        action
    );
}

function deleteOAuthApp(state: RequestStatusType = initialRequestState(), action: GenericAction): RequestStatusType {
    return handleRequest(
        IntegrationTypes.DELETE_OAUTH_APP_REQUEST,
        IntegrationTypes.DELETE_OAUTH_APP_SUCCESS,
        IntegrationTypes.DELETE_OAUTH_APP_FAILURE,
        state,
        action
    );
}

function updateOAuthApp(state: RequestStatusType = initialRequestState(), action: GenericAction): RequestStatusType {
    return handleRequest(
        IntegrationTypes.UPDATE_OAUTH_APP_REQUEST,
        IntegrationTypes.UPDATE_OAUTH_APP_SUCCESS,
        IntegrationTypes.UPDATE_OAUTH_APP_FAILURE,
        state,
        action
    );
}

function executeCommand(state: RequestStatusType = initialRequestState(), action: GenericAction): RequestStatusType {
    return handleRequest(
        IntegrationTypes.EXECUTE_COMMAND_REQUEST,
        IntegrationTypes.EXECUTE_COMMAND_SUCCESS,
        IntegrationTypes.EXECUTE_COMMAND_FAILURE,
        state,
        action
    );
}

function submitInteractiveDialog(state: RequestStatusType = initialRequestState(), action: GenericAction): RequestStatusType {
    return handleRequest(
        IntegrationTypes.SUBMIT_INTERACTIVE_DIALOG_REQUEST,
        IntegrationTypes.SUBMIT_INTERACTIVE_DIALOG_SUCCESS,
        IntegrationTypes.SUBMIT_INTERACTIVE_DIALOG_FAILURE,
        state,
        action
    );
}

export default (combineReducers({
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
    getAutocompleteCommands,
    submitInteractiveDialog,
}): (IntegrationsRequestsStatuses, GenericAction) => IntegrationsRequestsStatuses);
