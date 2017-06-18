// Copyright (c) 2017-present Mattermost, Inc. All Rights Reserved.
// See License.txt for license information.

import {IntegrationTypes} from 'action_types';
import {General} from 'constants';
import {batchActions} from 'redux-batched-actions';

import {Client4} from 'client';

import {getLogErrorAction} from './errors';
import {bindClientFunc, forceLogoutIfNecessary} from './helpers';

export function createIncomingHook(hook) {
    return bindClientFunc(
        Client4.createIncomingWebhook,
        IntegrationTypes.CREATE_INCOMING_HOOK_REQUEST,
        [IntegrationTypes.RECEIVED_INCOMING_HOOK, IntegrationTypes.CREATE_INCOMING_HOOK_SUCCESS],
        IntegrationTypes.CREATE_INCOMING_HOOK_FAILURE,
        hook
    );
}

export function getIncomingHooks(teamId = '', page = 0, perPage = General.PAGE_SIZE_DEFAULT) {
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

export function removeIncomingHook(hookId) {
    return async (dispatch, getState) => {
        dispatch({type: IntegrationTypes.DELETE_INCOMING_HOOK_REQUEST}, getState);

        try {
            await Client4.removeIncomingWebhook(hookId);
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch);

            dispatch(batchActions([
                {type: IntegrationTypes.DELETE_INCOMING_HOOK_FAILURE, error},
                getLogErrorAction(error)
            ]), getState);
            return null;
        }

        dispatch(batchActions([
            {
                type: IntegrationTypes.DELETED_INCOMING_HOOK,
                data: {id: hookId}
            },
            {
                type: IntegrationTypes.DELETE_INCOMING_HOOK_SUCCESS
            }
        ]), getState);

        return true;
    };
}

export function updateIncomingHook(hook) {
    return bindClientFunc(
        Client4.updateIncomingWebhook,
        IntegrationTypes.UPDATE_INCOMING_HOOK_REQUEST,
        [IntegrationTypes.RECEIVED_INCOMING_HOOK, IntegrationTypes.UPDATE_INCOMING_HOOK_SUCCESS],
        IntegrationTypes.UPDATE_INCOMING_HOOK_FAILURE,
        hook
    );
}

export function createOutgoingHook(hook) {
    return bindClientFunc(
        Client4.createOutgoingWebhook,
        IntegrationTypes.CREATE_OUTGOING_HOOK_REQUEST,
        [IntegrationTypes.RECEIVED_OUTGOING_HOOK, IntegrationTypes.CREATE_OUTGOING_HOOK_SUCCESS],
        IntegrationTypes.CREATE_OUTGOING_HOOK_FAILURE,
        hook
    );
}

export function getOutgoingHooks(channelId = '', teamId = '', page = 0, perPage = General.PAGE_SIZE_DEFAULT) {
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

export function removeOutgoingHook(hookId) {
    return async (dispatch, getState) => {
        dispatch({type: IntegrationTypes.DELETE_OUTGOING_HOOK_REQUEST}, getState);

        try {
            await Client4.removeOutgoingWebhook(hookId);
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch);

            dispatch(batchActions([
                {type: IntegrationTypes.DELETE_OUTGOING_HOOK_FAILURE, error},
                getLogErrorAction(error)
            ]), getState);
            return null;
        }

        dispatch(batchActions([
            {
                type: IntegrationTypes.DELETED_OUTGOING_HOOK,
                data: {id: hookId}
            },
            {
                type: IntegrationTypes.DELETE_OUTGOING_HOOK_SUCCESS
            }
        ]), getState);

        return true;
    };
}

export function updateOutgoingHook(hook) {
    return bindClientFunc(
        Client4.updateOutgoingWebhook,
        IntegrationTypes.UPDATE_OUTGOING_HOOK_REQUEST,
        [IntegrationTypes.RECEIVED_OUTGOING_HOOK, IntegrationTypes.UPDATE_OUTGOING_HOOK_SUCCESS],
        IntegrationTypes.UPDATE_OUTGOING_HOOK_FAILURE,
        hook
    );
}

export function regenOutgoingHookToken(hookId) {
    return bindClientFunc(
        Client4.regenOutgoingHookToken,
        IntegrationTypes.UPDATE_OUTGOING_HOOK_REQUEST,
        [IntegrationTypes.RECEIVED_OUTGOING_HOOK, IntegrationTypes.UPDATE_OUTGOING_HOOK_SUCCESS],
        IntegrationTypes.UPDATE_OUTGOING_HOOK_FAILURE,
        hookId
    );
}

export function getCustomTeamCommands(teamId) {
    return bindClientFunc(
        Client4.getCustomTeamCommands,
        IntegrationTypes.GET_CUSTOM_TEAM_COMMANDS_REQUEST,
        [IntegrationTypes.RECEIVED_CUSTOM_TEAM_COMMANDS, IntegrationTypes.GET_CUSTOM_TEAM_COMMANDS_SUCCESS],
        IntegrationTypes.GET_CUSTOM_TEAM_COMMANDS_FAILURE,
        teamId
    );
}

export function addCommand(command) {
    return bindClientFunc(
        Client4.addCommand,
        IntegrationTypes.ADD_COMMAND_REQUEST,
        [IntegrationTypes.RECEIVED_COMMAND, IntegrationTypes.ADD_COMMAND_SUCCESS],
        IntegrationTypes.ADD_COMMAND_FAILURE,
        command
    );
}

export function editCommand(command) {
    return bindClientFunc(
        Client4.editCommand,
        IntegrationTypes.EDIT_COMMAND_REQUEST,
        [IntegrationTypes.RECEIVED_COMMAND, IntegrationTypes.EDIT_COMMAND_SUCCESS],
        IntegrationTypes.EDIT_COMMAND_FAILURE,
        command
    );
}

export function regenCommandToken(id) {
    return async (dispatch, getState) => {
        dispatch({type: IntegrationTypes.REGEN_COMMAND_TOKEN_REQUEST}, getState);

        let res;
        try {
            res = await Client4.regenCommandToken(id);
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch);

            dispatch(batchActions([
                {type: IntegrationTypes.REGEN_COMMAND_TOKEN_FAILURE, error},
                getLogErrorAction(error)
            ]), getState);
            return null;
        }

        dispatch(batchActions([
            {
                type: IntegrationTypes.RECEIVED_COMMAND_TOKEN,
                data: {
                    id,
                    token: res.token
                }
            },
            {
                type: IntegrationTypes.REGEN_COMMAND_TOKEN_SUCCESS
            }
        ]), getState);

        return true;
    };
}

export function deleteCommand(id) {
    return async (dispatch, getState) => {
        dispatch({type: IntegrationTypes.DELETE_COMMAND_REQUEST}, getState);

        try {
            await Client4.deleteCommand(id);
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch);

            dispatch(batchActions([
                {type: IntegrationTypes.DELETE_COMMAND_FAILURE, error},
                getLogErrorAction(error)
            ]), getState);
            return null;
        }

        dispatch(batchActions([
            {
                type: IntegrationTypes.DELETED_COMMAND,
                data: {id}
            },
            {
                type: IntegrationTypes.DELETE_COMMAND_SUCCESS
            }
        ]), getState);

        return true;
    };
}

export function addOAuthApp(app) {
    return bindClientFunc(
        Client4.createOAuthApp,
        IntegrationTypes.ADD_OAUTH_APP_REQUEST,
        [IntegrationTypes.RECEIVED_OAUTH_APP, IntegrationTypes.ADD_OAUTH_APP_SUCCESS],
        IntegrationTypes.ADD_OAUTH_APP_FAILURE,
        app
    );
}

export function getOAuthApps(page = 0, perPage = General.PAGE_SIZE_DEFAULT) {
    return bindClientFunc(
        Client4.getOAuthApps,
        IntegrationTypes.GET_OAUTH_APPS_REQUEST,
        [IntegrationTypes.RECEIVED_OAUTH_APPS, IntegrationTypes.GET_OAUTH_APPS_SUCCESS],
        IntegrationTypes.GET_OAUTH_APPS_FAILURE,
        page,
        perPage
    );
}

export function getOAuthApp(appId) {
    return bindClientFunc(
        Client4.getOAuthApp,
        IntegrationTypes.GET_OAUTH_APP_REQUEST,
        [IntegrationTypes.RECEIVED_OAUTH_APP, IntegrationTypes.GET_OAUTH_APP_SUCCESS],
        IntegrationTypes.GET_OAUTH_APP_FAILURE,
        appId
    );
}

export function deleteOAuthApp(id) {
    return async (dispatch, getState) => {
        dispatch({type: IntegrationTypes.DELETE_OAUTH_APP_REQUEST}, getState);

        try {
            await Client4.deleteOAuthApp(id);
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch);

            dispatch(batchActions([
                {type: IntegrationTypes.DELETE_OAUTH_APP_FAILURE, error},
                getLogErrorAction(error)
            ]), getState);
            return null;
        }

        dispatch(batchActions([
            {
                type: IntegrationTypes.DELETED_OAUTH_APP,
                data: {id}
            },
            {
                type: IntegrationTypes.DELETE_OAUTH_APP_SUCCESS
            }
        ]), getState);

        return true;
    };
}

export function regenOAuthAppSecret(appId) {
    return bindClientFunc(
        Client4.regenOAuthAppSecret,
        IntegrationTypes.UPDATE_OAUTH_APP_REQUEST,
        [IntegrationTypes.RECEIVED_OAUTH_APP, IntegrationTypes.UPDATE_OAUTH_APP_SUCCESS],
        IntegrationTypes.UPDATE_OAUTH_APP_FAILURE,
        appId
    );
}
