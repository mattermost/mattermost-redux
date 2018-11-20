// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
// @flow

import {IntegrationTypes} from 'action_types';
import {General} from 'constants';
import {batchActions} from 'redux-batched-actions';

import {Client4} from 'client';

import {getCurrentChannelId} from 'selectors/entities/channels';
import {getCurrentTeamId} from 'selectors/entities/teams';

import {logError} from './errors';
import {bindClientFunc, forceLogoutIfNecessary} from './helpers';

import type {DispatchFunc, GetStateFunc} from '../types/actions';
import type {Command, DialogSubmission, IncomingWebhook, OAuthApp, OutgoingWebhook} from '../types/integrations';

export function createIncomingHook(hook: IncomingWebhook) {
    return bindClientFunc(
        Client4.createIncomingWebhook,
        IntegrationTypes.CREATE_INCOMING_HOOK_REQUEST,
        [IntegrationTypes.RECEIVED_INCOMING_HOOK, IntegrationTypes.CREATE_INCOMING_HOOK_SUCCESS],
        IntegrationTypes.CREATE_INCOMING_HOOK_FAILURE,
        hook
    );
}

export function getIncomingHook(hookId: string) {
    return bindClientFunc(
        Client4.getIncomingWebhook,
        IntegrationTypes.GET_INCOMING_HOOKS_REQUEST,
        [IntegrationTypes.RECEIVED_INCOMING_HOOK, IntegrationTypes.GET_INCOMING_HOOKS_SUCCESS],
        IntegrationTypes.GET_INCOMING_HOOKS_FAILURE,
        hookId
    );
}

export function getIncomingHooks(teamId: string = '', page: number = 0, perPage: number = General.PAGE_SIZE_DEFAULT) {
    return bindClientFunc(
        Client4.getIncomingWebhooks,
        IntegrationTypes.GET_INCOMING_HOOKS_REQUEST,
        [IntegrationTypes.RECEIVED_INCOMING_HOOKS, IntegrationTypes.GET_INCOMING_HOOKS_SUCCESS],
        IntegrationTypes.GET_INCOMING_HOOKS_FAILURE,
        teamId,
        page,
        perPage
    );
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
    return bindClientFunc(
        Client4.updateIncomingWebhook,
        IntegrationTypes.UPDATE_INCOMING_HOOK_REQUEST,
        [IntegrationTypes.RECEIVED_INCOMING_HOOK, IntegrationTypes.UPDATE_INCOMING_HOOK_SUCCESS],
        IntegrationTypes.UPDATE_INCOMING_HOOK_FAILURE,
        hook
    );
}

export function createOutgoingHook(hook: OutgoingWebhook) {
    return bindClientFunc(
        Client4.createOutgoingWebhook,
        IntegrationTypes.CREATE_OUTGOING_HOOK_REQUEST,
        [IntegrationTypes.RECEIVED_OUTGOING_HOOK, IntegrationTypes.CREATE_OUTGOING_HOOK_SUCCESS],
        IntegrationTypes.CREATE_OUTGOING_HOOK_FAILURE,
        hook
    );
}

export function getOutgoingHook(hookId: string) {
    return bindClientFunc(
        Client4.getOutgoingWebhook,
        IntegrationTypes.GET_OUTGOING_HOOKS_REQUEST,
        [IntegrationTypes.RECEIVED_OUTGOING_HOOK, IntegrationTypes.GET_OUTGOING_HOOKS_SUCCESS],
        IntegrationTypes.GET_OUTGOING_HOOKS_FAILURE,
        hookId
    );
}

export function getOutgoingHooks(channelId: string = '', teamId: string = '', page: number = 0, perPage: number = General.PAGE_SIZE_DEFAULT) {
    return bindClientFunc(
        Client4.getOutgoingWebhooks,
        IntegrationTypes.GET_OUTGOING_HOOKS_REQUEST,
        [IntegrationTypes.RECEIVED_OUTGOING_HOOKS, IntegrationTypes.GET_OUTGOING_HOOKS_SUCCESS],
        IntegrationTypes.GET_OUTGOING_HOOKS_FAILURE,
        channelId,
        teamId,
        page,
        perPage
    );
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
    return bindClientFunc(
        Client4.updateOutgoingWebhook,
        IntegrationTypes.UPDATE_OUTGOING_HOOK_REQUEST,
        [IntegrationTypes.RECEIVED_OUTGOING_HOOK, IntegrationTypes.UPDATE_OUTGOING_HOOK_SUCCESS],
        IntegrationTypes.UPDATE_OUTGOING_HOOK_FAILURE,
        hook
    );
}

export function regenOutgoingHookToken(hookId: string) {
    return bindClientFunc(
        Client4.regenOutgoingHookToken,
        IntegrationTypes.UPDATE_OUTGOING_HOOK_REQUEST,
        [IntegrationTypes.RECEIVED_OUTGOING_HOOK, IntegrationTypes.UPDATE_OUTGOING_HOOK_SUCCESS],
        IntegrationTypes.UPDATE_OUTGOING_HOOK_FAILURE,
        hookId
    );
}

export function getCommands(teamId: string) {
    return bindClientFunc(
        Client4.getCommandsList,
        IntegrationTypes.GET_COMMANDS_REQUEST,
        [IntegrationTypes.RECEIVED_COMMANDS, IntegrationTypes.GET_COMMANDS_SUCCESS],
        IntegrationTypes.GET_COMMANDS_FAILURE,
        teamId
    );
}

export function getAutocompleteCommands(teamId: string, page: number = 0, perPage: number = General.PAGE_SIZE_DEFAULT) {
    return bindClientFunc(
        Client4.getAutocompleteCommandsList,
        IntegrationTypes.GET_AUTOCOMPLETE_COMMANDS_REQUEST,
        [IntegrationTypes.RECEIVED_COMMANDS, IntegrationTypes.GET_AUTOCOMPLETE_COMMANDS_SUCCESS],
        IntegrationTypes.GET_AUTOCOMPLETE_COMMANDS_FAILURE,
        teamId,
        page,
        perPage
    );
}

export function getCustomTeamCommands(teamId: string) {
    return bindClientFunc(
        Client4.getCustomTeamCommands,
        IntegrationTypes.GET_CUSTOM_TEAM_COMMANDS_REQUEST,
        [IntegrationTypes.RECEIVED_CUSTOM_TEAM_COMMANDS, IntegrationTypes.GET_CUSTOM_TEAM_COMMANDS_SUCCESS],
        IntegrationTypes.GET_CUSTOM_TEAM_COMMANDS_FAILURE,
        teamId
    );
}

export function addCommand(command: Command) {
    return bindClientFunc(
        Client4.addCommand,
        IntegrationTypes.ADD_COMMAND_REQUEST,
        [IntegrationTypes.RECEIVED_COMMAND, IntegrationTypes.ADD_COMMAND_SUCCESS],
        IntegrationTypes.ADD_COMMAND_FAILURE,
        command
    );
}

export function editCommand(command: Command) {
    return bindClientFunc(
        Client4.editCommand,
        IntegrationTypes.EDIT_COMMAND_REQUEST,
        [IntegrationTypes.RECEIVED_COMMAND, IntegrationTypes.EDIT_COMMAND_SUCCESS],
        IntegrationTypes.EDIT_COMMAND_FAILURE,
        command
    );
}

export function executeCommand(command: Command, args: Array<string>) {
    return bindClientFunc(
        Client4.executeCommand,
        IntegrationTypes.EXECUTE_COMMAND_REQUEST,
        IntegrationTypes.EXECUTE_COMMAND_SUCCESS,
        IntegrationTypes.EXECUTE_COMMAND_FAILURE,
        command,
        args
    );
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
    return bindClientFunc(
        Client4.createOAuthApp,
        IntegrationTypes.ADD_OAUTH_APP_REQUEST,
        [IntegrationTypes.RECEIVED_OAUTH_APP, IntegrationTypes.ADD_OAUTH_APP_SUCCESS],
        IntegrationTypes.ADD_OAUTH_APP_FAILURE,
        app
    );
}

export function editOAuthApp(app: OAuthApp) {
    return bindClientFunc(
        Client4.editOAuthApp,
        IntegrationTypes.UPDATE_OAUTH_APP_REQUEST,
        [IntegrationTypes.RECEIVED_OAUTH_APP, IntegrationTypes.UPDATE_OAUTH_APP_SUCCESS],
        IntegrationTypes.UPDATE_OAUTH_APP_FAILURE,
        app
    );
}

export function getOAuthApps(page: number = 0, perPage: number = General.PAGE_SIZE_DEFAULT) {
    return bindClientFunc(
        Client4.getOAuthApps,
        IntegrationTypes.GET_OAUTH_APPS_REQUEST,
        [IntegrationTypes.RECEIVED_OAUTH_APPS, IntegrationTypes.GET_OAUTH_APPS_SUCCESS],
        IntegrationTypes.GET_OAUTH_APPS_FAILURE,
        page,
        perPage
    );
}

export function getOAuthApp(appId: string) {
    return bindClientFunc(
        Client4.getOAuthApp,
        IntegrationTypes.GET_OAUTH_APP_REQUEST,
        [IntegrationTypes.RECEIVED_OAUTH_APP, IntegrationTypes.GET_OAUTH_APP_SUCCESS],
        IntegrationTypes.GET_OAUTH_APP_FAILURE,
        appId
    );
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
    return bindClientFunc(
        Client4.regenOAuthAppSecret,
        IntegrationTypes.UPDATE_OAUTH_APP_REQUEST,
        [IntegrationTypes.RECEIVED_OAUTH_APP, IntegrationTypes.UPDATE_OAUTH_APP_SUCCESS],
        IntegrationTypes.UPDATE_OAUTH_APP_FAILURE,
        appId
    );
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
