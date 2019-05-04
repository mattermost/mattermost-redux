// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
// @flow

import {IntegrationTypes} from 'action_types';
import {General} from 'constants';
import {batchActions} from 'redux-batched-actions';

import {Client4} from 'client';

import {getCurrentUserId} from 'selectors/entities/users';
import {getCurrentChannelId} from 'selectors/entities/channels';
import {getCurrentTeamId} from 'selectors/entities/teams';

import {logError} from './errors';
import {bindClientFunc, forceLogoutIfNecessary} from './helpers';

import type {DispatchFunc, GetStateFunc} from 'types/actions';
import type {Command, DialogSubmission, IncomingWebhook, OAuthApp, OutgoingWebhook} from 'types/integrations';

export function createIncomingHook(hook: IncomingWebhook) {
    return bindClientFunc({
        clientFunc: Client4.createIncomingWebhook,
        onRequest: IntegrationTypes.CREATE_INCOMING_HOOK_REQUEST,
        onSuccess: [IntegrationTypes.RECEIVED_INCOMING_HOOK, IntegrationTypes.CREATE_INCOMING_HOOK_SUCCESS],
        onFailure: IntegrationTypes.CREATE_INCOMING_HOOK_FAILURE,
        params: [
            hook,
        ],
    });
}

export function getIncomingHook(hookId: string) {
    return bindClientFunc({
        clientFunc: Client4.getIncomingWebhook,
        onRequest: IntegrationTypes.GET_INCOMING_HOOKS_REQUEST,
        onSuccess: [IntegrationTypes.RECEIVED_INCOMING_HOOK, IntegrationTypes.GET_INCOMING_HOOKS_SUCCESS],
        onFailure: IntegrationTypes.GET_INCOMING_HOOKS_FAILURE,
        params: [
            hookId,
        ],
    });
}

export function getIncomingHooks(teamId: string = '', page: number = 0, perPage: number = General.PAGE_SIZE_DEFAULT) {
    return bindClientFunc({
        clientFunc: Client4.getIncomingWebhooks,
        onRequest: IntegrationTypes.GET_INCOMING_HOOKS_REQUEST,
        onSuccess: [IntegrationTypes.RECEIVED_INCOMING_HOOKS, IntegrationTypes.GET_INCOMING_HOOKS_SUCCESS],
        onFailure: IntegrationTypes.GET_INCOMING_HOOKS_FAILURE,
        params: [
            teamId,
            page,
            perPage,
        ],
    });
}

export function removeIncomingHook(hookId: string) {
    return async (dispatch: DispatchFunc, getState: GetStateFunc) => {
        dispatch({type: IntegrationTypes.DELETE_INCOMING_HOOK_REQUEST, data: {}}, getState);

        try {
            await Client4.removeIncomingWebhook(hookId);
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch, getState);

            dispatch(batchActions([
                {type: IntegrationTypes.DELETE_INCOMING_HOOK_FAILURE, error},
                logError(error),
            ]), getState);
            return {error};
        }

        dispatch(batchActions([
            {
                type: IntegrationTypes.DELETED_INCOMING_HOOK,
                data: {id: hookId},
            },
            {
                type: IntegrationTypes.DELETE_INCOMING_HOOK_SUCCESS,
            },
        ]), getState);

        return {data: true};
    };
}

export function updateIncomingHook(hook: IncomingWebhook) {
    return bindClientFunc({
        clientFunc: Client4.updateIncomingWebhook,
        onRequest: IntegrationTypes.UPDATE_INCOMING_HOOK_REQUEST,
        onSuccess: [IntegrationTypes.RECEIVED_INCOMING_HOOK, IntegrationTypes.UPDATE_INCOMING_HOOK_SUCCESS],
        onFailure: IntegrationTypes.UPDATE_INCOMING_HOOK_FAILURE,
        params: [
            hook,
        ],
    });
}

export function createOutgoingHook(hook: OutgoingWebhook) {
    return bindClientFunc({
        clientFunc: Client4.createOutgoingWebhook,
        onRequest: IntegrationTypes.CREATE_OUTGOING_HOOK_REQUEST,
        onSuccess: [IntegrationTypes.RECEIVED_OUTGOING_HOOK, IntegrationTypes.CREATE_OUTGOING_HOOK_SUCCESS],
        onFailure: IntegrationTypes.CREATE_OUTGOING_HOOK_FAILURE,
        params: [
            hook,
        ],
    });
}

export function getOutgoingHook(hookId: string) {
    return bindClientFunc({
        clientFunc: Client4.getOutgoingWebhook,
        onRequest: IntegrationTypes.GET_OUTGOING_HOOKS_REQUEST,
        onSuccess: [IntegrationTypes.RECEIVED_OUTGOING_HOOK, IntegrationTypes.GET_OUTGOING_HOOKS_SUCCESS],
        onFailure: IntegrationTypes.GET_OUTGOING_HOOKS_FAILURE,
        params: [
            hookId,
        ],
    });
}

export function getOutgoingHooks(channelId: string = '', teamId: string = '', page: number = 0, perPage: number = General.PAGE_SIZE_DEFAULT) {
    return bindClientFunc({
        clientFunc: Client4.getOutgoingWebhooks,
        onRequest: IntegrationTypes.GET_OUTGOING_HOOKS_REQUEST,
        onSuccess: [IntegrationTypes.RECEIVED_OUTGOING_HOOKS, IntegrationTypes.GET_OUTGOING_HOOKS_SUCCESS],
        onFailure: IntegrationTypes.GET_OUTGOING_HOOKS_FAILURE,
        params: [
            channelId,
            teamId,
            page,
            perPage,
        ],
    });
}

export function removeOutgoingHook(hookId: string) {
    return async (dispatch: DispatchFunc, getState: GetStateFunc) => {
        dispatch({type: IntegrationTypes.DELETE_OUTGOING_HOOK_REQUEST, data: {}}, getState);

        try {
            await Client4.removeOutgoingWebhook(hookId);
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch, getState);

            dispatch(batchActions([
                {type: IntegrationTypes.DELETE_OUTGOING_HOOK_FAILURE, error},
                logError(error),
            ]), getState);
            return {error};
        }

        dispatch(batchActions([
            {
                type: IntegrationTypes.DELETED_OUTGOING_HOOK,
                data: {id: hookId},
            },
            {
                type: IntegrationTypes.DELETE_OUTGOING_HOOK_SUCCESS,
            },
        ]), getState);

        return {data: true};
    };
}

export function updateOutgoingHook(hook: OutgoingWebhook) {
    return bindClientFunc({
        clientFunc: Client4.updateOutgoingWebhook,
        onRequest: IntegrationTypes.UPDATE_OUTGOING_HOOK_REQUEST,
        onSuccess: [IntegrationTypes.RECEIVED_OUTGOING_HOOK, IntegrationTypes.UPDATE_OUTGOING_HOOK_SUCCESS],
        onFailure: IntegrationTypes.UPDATE_OUTGOING_HOOK_FAILURE,
        params: [
            hook,
        ],
    });
}

export function regenOutgoingHookToken(hookId: string) {
    return bindClientFunc({
        clientFunc: Client4.regenOutgoingHookToken,
        onRequest: IntegrationTypes.UPDATE_OUTGOING_HOOK_REQUEST,
        onSuccess: [IntegrationTypes.RECEIVED_OUTGOING_HOOK, IntegrationTypes.UPDATE_OUTGOING_HOOK_SUCCESS],
        onFailure: IntegrationTypes.UPDATE_OUTGOING_HOOK_FAILURE,
        params: [
            hookId,
        ],
    });
}

export function getCommands(teamId: string) {
    return bindClientFunc({
        clientFunc: Client4.getCommandsList,
        onRequest: IntegrationTypes.GET_COMMANDS_REQUEST,
        onSuccess: [IntegrationTypes.RECEIVED_COMMANDS, IntegrationTypes.GET_COMMANDS_SUCCESS],
        onFailure: IntegrationTypes.GET_COMMANDS_FAILURE,
        params: [
            teamId,
        ],
    });
}

export function getAutocompleteCommands(teamId: string, page: number = 0, perPage: number = General.PAGE_SIZE_DEFAULT) {
    return bindClientFunc({
        clientFunc: Client4.getAutocompleteCommandsList,
        onRequest: IntegrationTypes.GET_AUTOCOMPLETE_COMMANDS_REQUEST,
        onSuccess: [IntegrationTypes.RECEIVED_COMMANDS, IntegrationTypes.GET_AUTOCOMPLETE_COMMANDS_SUCCESS],
        onFailure: IntegrationTypes.GET_AUTOCOMPLETE_COMMANDS_FAILURE,
        params: [
            teamId,
            page,
            perPage,
        ],
    });
}

export function getCustomTeamCommands(teamId: string) {
    return bindClientFunc({
        clientFunc: Client4.getCustomTeamCommands,
        onRequest: IntegrationTypes.GET_CUSTOM_TEAM_COMMANDS_REQUEST,
        onSuccess: [IntegrationTypes.RECEIVED_CUSTOM_TEAM_COMMANDS, IntegrationTypes.GET_CUSTOM_TEAM_COMMANDS_SUCCESS],
        onFailure: IntegrationTypes.GET_CUSTOM_TEAM_COMMANDS_FAILURE,
        params: [
            teamId,
        ],
    });
}

export function addCommand(command: Command) {
    return bindClientFunc({
        clientFunc: Client4.addCommand,
        onRequest: IntegrationTypes.ADD_COMMAND_REQUEST,
        onSuccess: [IntegrationTypes.RECEIVED_COMMAND, IntegrationTypes.ADD_COMMAND_SUCCESS],
        onFailure: IntegrationTypes.ADD_COMMAND_FAILURE,
        params: [
            command,
        ],
    });
}

export function editCommand(command: Command) {
    return bindClientFunc({
        clientFunc: Client4.editCommand,
        onRequest: IntegrationTypes.EDIT_COMMAND_REQUEST,
        onSuccess: [IntegrationTypes.RECEIVED_COMMAND, IntegrationTypes.EDIT_COMMAND_SUCCESS],
        onFailure: IntegrationTypes.EDIT_COMMAND_FAILURE,
        params: [
            command,
        ],
    });
}

export function executeCommand(command: Command, args: Array<string>) {
    return bindClientFunc({
        clientFunc: Client4.executeCommand,
        onRequest: IntegrationTypes.EXECUTE_COMMAND_REQUEST,
        onSuccess: IntegrationTypes.EXECUTE_COMMAND_SUCCESS,
        onFailure: IntegrationTypes.EXECUTE_COMMAND_FAILURE,
        params: [
            command,
            args,
        ],
    });
}

export function regenCommandToken(id: string) {
    return async (dispatch: DispatchFunc, getState: GetStateFunc) => {
        dispatch({type: IntegrationTypes.REGEN_COMMAND_TOKEN_REQUEST, data: {}}, getState);

        let res;
        try {
            res = await Client4.regenCommandToken(id);
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch, getState);

            dispatch(batchActions([
                {type: IntegrationTypes.REGEN_COMMAND_TOKEN_FAILURE, error},
                logError(error),
            ]), getState);
            return {error};
        }

        dispatch(batchActions([
            {
                type: IntegrationTypes.RECEIVED_COMMAND_TOKEN,
                data: {
                    id,
                    token: res.token,
                },
            },
            {
                type: IntegrationTypes.REGEN_COMMAND_TOKEN_SUCCESS,
            },
        ]), getState);

        return {data: true};
    };
}

export function deleteCommand(id: string) {
    return async (dispatch: DispatchFunc, getState: GetStateFunc) => {
        dispatch({type: IntegrationTypes.DELETE_COMMAND_REQUEST, data: {}}, getState);

        try {
            await Client4.deleteCommand(id);
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch, getState);

            dispatch(batchActions([
                {type: IntegrationTypes.DELETE_COMMAND_FAILURE, error},
                logError(error),
            ]), getState);
            return {error};
        }

        dispatch(batchActions([
            {
                type: IntegrationTypes.DELETED_COMMAND,
                data: {id},
            },
            {
                type: IntegrationTypes.DELETE_COMMAND_SUCCESS,
            },
        ]), getState);

        return {data: true};
    };
}

export function addOAuthApp(app: OAuthApp) {
    return bindClientFunc({
        clientFunc: Client4.createOAuthApp,
        onRequest: IntegrationTypes.ADD_OAUTH_APP_REQUEST,
        onSuccess: [IntegrationTypes.RECEIVED_OAUTH_APP, IntegrationTypes.ADD_OAUTH_APP_SUCCESS],
        onFailure: IntegrationTypes.ADD_OAUTH_APP_FAILURE,
        params: [
            app,
        ],
    });
}

export function editOAuthApp(app: OAuthApp) {
    return bindClientFunc({
        clientFunc: Client4.editOAuthApp,
        onRequest: IntegrationTypes.UPDATE_OAUTH_APP_REQUEST,
        onSuccess: [IntegrationTypes.RECEIVED_OAUTH_APP, IntegrationTypes.UPDATE_OAUTH_APP_SUCCESS],
        onFailure: IntegrationTypes.UPDATE_OAUTH_APP_FAILURE,
        params: [
            app,
        ],
    });
}

export function getOAuthApps(page: number = 0, perPage: number = General.PAGE_SIZE_DEFAULT) {
    return bindClientFunc({
        clientFunc: Client4.getOAuthApps,
        onRequest: IntegrationTypes.GET_OAUTH_APPS_REQUEST,
        onSuccess: [IntegrationTypes.RECEIVED_OAUTH_APPS, IntegrationTypes.GET_OAUTH_APPS_SUCCESS],
        onFailure: IntegrationTypes.GET_OAUTH_APPS_FAILURE,
        params: [
            page,
            perPage,
        ],
    });
}

export function getOAuthApp(appId: string) {
    return bindClientFunc({
        clientFunc: Client4.getOAuthApp,
        onRequest: IntegrationTypes.GET_OAUTH_APP_REQUEST,
        onSuccess: [IntegrationTypes.RECEIVED_OAUTH_APP, IntegrationTypes.GET_OAUTH_APP_SUCCESS],
        onFailure: IntegrationTypes.GET_OAUTH_APP_FAILURE,
        params: [
            appId,
        ],
    });
}

export function getAuthorizedOAuthApps() {
    return async (dispatch: DispatchFunc, getState: GetStateFunc) => {
        dispatch({type: IntegrationTypes.GET_AUTHORIZED_OAUTH_APPS_REQUEST, data: {}});

        const state = getState();
        const currentUserId = getCurrentUserId(state);

        let data;
        try {
            data = await Client4.getAuthorizedOAuthApps(currentUserId);
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch, getState);

            dispatch(batchActions([
                {type: IntegrationTypes.GET_AUTHORIZED_OAUTH_APPS_FAILURE, error},
                logError(error),
            ]), getState);

            return {error};
        }

        dispatch({type: IntegrationTypes.GET_AUTHORIZED_OAUTH_APPS_SUCCESS, data: {}});

        return {data};
    };
}

export function deauthorizeOAuthApp(clientId: string) {
    return bindClientFunc({
        clientFunc: Client4.deauthorizeOAuthApp,
        onRequest: IntegrationTypes.DEAUTHORIZE_OAUTH_APP_REQUEST,
        onSuccess: IntegrationTypes.DEAUTHORIZE_OAUTH_APP_SUCCESS,
        onFailure: IntegrationTypes.DEAUTHORIZE_OAUTH_APP_FAILURE,
        params: [clientId],
    });
}

export function deleteOAuthApp(id: string) {
    return async (dispatch: DispatchFunc, getState: GetStateFunc) => {
        dispatch({type: IntegrationTypes.DELETE_OAUTH_APP_REQUEST, data: {}}, getState);

        try {
            await Client4.deleteOAuthApp(id);
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch, getState);

            dispatch(batchActions([
                {type: IntegrationTypes.DELETE_OAUTH_APP_FAILURE, error},
                logError(error),
            ]), getState);
            return {error};
        }

        dispatch(batchActions([
            {
                type: IntegrationTypes.DELETED_OAUTH_APP,
                data: {id},
            },
            {
                type: IntegrationTypes.DELETE_OAUTH_APP_SUCCESS,
            },
        ]), getState);

        return {data: true};
    };
}

export function regenOAuthAppSecret(appId: string) {
    return bindClientFunc({
        clientFunc: Client4.regenOAuthAppSecret,
        onRequest: IntegrationTypes.UPDATE_OAUTH_APP_REQUEST,
        onSuccess: [IntegrationTypes.RECEIVED_OAUTH_APP, IntegrationTypes.UPDATE_OAUTH_APP_SUCCESS],
        onFailure: IntegrationTypes.UPDATE_OAUTH_APP_FAILURE,
        params: [
            appId,
        ],
    });
}

export function submitInteractiveDialog(submission: DialogSubmission) {
    return async (dispatch: DispatchFunc, getState: GetStateFunc) => {
        dispatch({type: IntegrationTypes.SUBMIT_INTERACTIVE_DIALOG_REQUEST, data: {}});

        const state = getState();
        submission.channel_id = getCurrentChannelId(state);
        submission.team_id = getCurrentTeamId(state);

        let data;
        try {
            data = await Client4.submitInteractiveDialog(submission);
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch, getState);

            dispatch(batchActions([
                {type: IntegrationTypes.SUBMIT_INTERACTIVE_DIALOG_FAILURE, error},
                logError(error),
            ]), getState);
            return {error};
        }

        dispatch({type: IntegrationTypes.SUBMIT_INTERACTIVE_DIALOG_SUCCESS, data: {}});

        return {data};
    };
}
