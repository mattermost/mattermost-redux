// Copyright (c) 2018-present Mattermost, Inc. All Rights Reserved.
// See License.txt for license information.
// @flow

import {Client4} from 'client';
import {SchemeTypes} from 'action_types';
import {General} from 'constants';
import {bindClientFunc} from './helpers';
import type {Scheme, SchemeScope, SchemePatch} from '../types/schemes';

export function getScheme(schemeId: string) {
    return bindClientFunc(
        Client4.getScheme,
        SchemeTypes.GET_SCHEME_REQUEST,
        [SchemeTypes.RECEIVED_SCHEME, SchemeTypes.GET_SCHEME_SUCCESS],
        SchemeTypes.GET_SCHEME_FAILURE,
        schemeId
    );
}

export function getSchemes(scope: SchemeScope, page: number = 0, perPage: number = General.PAGE_SIZE_DEFAULT) {
    return bindClientFunc(
        Client4.getSchemes,
        SchemeTypes.GET_SCHEMES_REQUEST,
        [SchemeTypes.RECEIVED_SCHEMES, SchemeTypes.GET_SCHEMES_SUCCESS],
        SchemeTypes.GET_SCHEMES_FAILURE,
        scope,
        page,
        perPage
    );
}

export function createScheme(scheme: Scheme) {
    return bindClientFunc(
        Client4.createScheme,
        SchemeTypes.CREATE_SCHEME_REQUEST,
        [SchemeTypes.CREATED_SCHEME, SchemeTypes.CREATE_SCHEME_SUCCESS],
        SchemeTypes.CREATE_SCHEME_FAILURE,
        scheme
    );
}

export function deleteScheme(schemeId: string) {
    return bindClientFunc(
        Client4.deleteScheme,
        SchemeTypes.DELETE_SCHEME_REQUEST,
        [SchemeTypes.DELETED_SCHEME, SchemeTypes.DELETE_SCHEME_SUCCESS],
        SchemeTypes.DELETE_SCHEME_FAILURE,
        schemeId
    );
}

export function patchScheme(scheme: SchemePatch) {
    return bindClientFunc(
        Client4.patchScheme,
        SchemeTypes.PATCH_SCHEME_REQUEST,
        [SchemeTypes.PATCHED_SCHEME, SchemeTypes.PATCH_SCHEME_SUCCESS],
        SchemeTypes.PATCH_SCHEME_FAILURE,
        scheme
    );
}

export function getSchemeTeams(schemeId: string, page: number = 0, perPage: number = General.PAGE_SIZE_DEFAULT) {
    return bindClientFunc(
        Client4.getSchemeTeams,
        SchemeTypes.GET_SCHEME_TEAMS_REQUEST,
        [SchemeTypes.RECEIVED_SCHEME_TEAMS, SchemeTypes.GET_SCHEME_TEAMS_SUCCESS],
        SchemeTypes.GET_SCHEME_TEAMS_FAILURE,
        schemeId,
        page,
        perPage
    );
}

export function getSchemeChannels(schemeId: string, page: number = 0, perPage: number = General.PAGE_SIZE_DEFAULT) {
    return bindClientFunc(
        Client4.getSchemeChannels,
        SchemeTypes.GET_SCHEME_CHANNELS_REQUEST,
        [SchemeTypes.RECEIVED_SCHEME_CHANNELS, SchemeTypes.GET_SCHEME_CHANNELS_SUCCESS],
        SchemeTypes.GET_SCHEME_CHANNELS_FAILURE,
        schemeId,
        page,
        perPage
    );
}
