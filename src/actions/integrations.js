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

export function addCommand(teamId, command) {
    return bindClientFunc(
        Client4.addCommand,
        IntegrationTypes.ADD_COMMAND_REQUEST,
        [IntegrationTypes.RECEIVED_COMMAND, IntegrationTypes.ADD_COMMAND_SUCCESS],
        IntegrationTypes.ADD_COMMAND_FAILURE,
        teamId,
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
