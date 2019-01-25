// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
// @flow

import {Client4} from 'client';
import {SchemeTypes} from 'action_types';
import {General} from 'constants';
import {batchActions} from 'redux-batched-actions';

import {bindClientFunc, forceLogoutIfNecessary} from './helpers';
import {logError} from './errors';
import type {Scheme, SchemeScope, SchemePatch} from 'types/schemes';
import type {ActionFunc} from 'types/actions';

export function getScheme(schemeId: string): ActionFunc {
    return bindClientFunc({
        clientFunc: Client4.getScheme,
        onRequest: SchemeTypes.GET_SCHEME_REQUEST,
        onSuccess: [SchemeTypes.RECEIVED_SCHEME, SchemeTypes.GET_SCHEME_SUCCESS],
        onFailure: SchemeTypes.GET_SCHEME_FAILURE,
        params: [
            schemeId,
        ],
    });
}

export function getSchemes(scope: SchemeScope, page: number = 0, perPage: number = General.PAGE_SIZE_DEFAULT): ActionFunc {
    return bindClientFunc({
        clientFunc: Client4.getSchemes,
        onRequest: SchemeTypes.GET_SCHEMES_REQUEST,
        onSuccess: [SchemeTypes.RECEIVED_SCHEMES, SchemeTypes.GET_SCHEMES_SUCCESS],
        onFailure: SchemeTypes.GET_SCHEMES_FAILURE,
        params: [
            scope,
            page,
            perPage,
        ],
    });
}

export function createScheme(scheme: Scheme): ActionFunc {
    return bindClientFunc({
        clientFunc: Client4.createScheme,
        onRequest: SchemeTypes.CREATE_SCHEME_REQUEST,
        onSuccess: [SchemeTypes.CREATED_SCHEME, SchemeTypes.CREATE_SCHEME_SUCCESS],
        onFailure: SchemeTypes.CREATE_SCHEME_FAILURE,
        params: [
            scheme,
        ],
    });
}

export function deleteScheme(schemeId: string): ActionFunc {
    return async (dispatch, getState) => {
        dispatch({type: SchemeTypes.DELETE_SCHEME_REQUEST, data: null}, getState);

        let data = null;
        try {
            data = await Client4.deleteScheme(schemeId);
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch, getState);
            dispatch(batchActions([
                {type: SchemeTypes.DELETE_SCHEME_FAILURE, error},
                logError(error),
            ]), getState);
            return {error};
        }

        dispatch({type: SchemeTypes.DELETED_SCHEME, data: {schemeId}}, getState);
        dispatch({type: SchemeTypes.DELETE_SCHEME_SUCCESS, data: null}, getState);

        return {data};
    };
}

export function patchScheme(schemeId: string, scheme: SchemePatch): ActionFunc {
    return bindClientFunc({
        clientFunc: Client4.patchScheme,
        onRequest: SchemeTypes.PATCH_SCHEME_REQUEST,
        onSuccess: [SchemeTypes.PATCHED_SCHEME, SchemeTypes.PATCH_SCHEME_SUCCESS],
        onFailure: SchemeTypes.PATCH_SCHEME_FAILURE,
        params: [
            schemeId,
            scheme,
        ],
    });
}

export function getSchemeTeams(schemeId: string, page: number = 0, perPage: number = General.PAGE_SIZE_DEFAULT): ActionFunc {
    return bindClientFunc({
        clientFunc: Client4.getSchemeTeams,
        onRequest: SchemeTypes.GET_SCHEME_TEAMS_REQUEST,
        onSuccess: [SchemeTypes.RECEIVED_SCHEME_TEAMS, SchemeTypes.GET_SCHEME_TEAMS_SUCCESS],
        onFailure: SchemeTypes.GET_SCHEME_TEAMS_FAILURE,
        params: [
            schemeId,
            page,
            perPage,
        ],
    });
}

export function getSchemeChannels(schemeId: string, page: number = 0, perPage: number = General.PAGE_SIZE_DEFAULT): ActionFunc {
    return bindClientFunc({
        clientFunc: Client4.getSchemeChannels,
        onRequest: SchemeTypes.GET_SCHEME_CHANNELS_REQUEST,
        onSuccess: [SchemeTypes.RECEIVED_SCHEME_CHANNELS, SchemeTypes.GET_SCHEME_CHANNELS_SUCCESS],
        onFailure: SchemeTypes.GET_SCHEME_CHANNELS_FAILURE,
        params: [
            schemeId,
            page,
            perPage,
        ],
    });
}
