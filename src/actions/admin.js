// Copyright (c) 2017 Mattermost, Inc. All Rights Reserved.
// See License.txt for license information.

import {AdminTypes} from 'action_types';
import {General} from 'constants';

import {Client4} from 'client';

import {bindClientFunc} from './helpers';

export function getLogs(page = 0, perPage = General.PAGE_SIZE_DEFAULT) {
    return bindClientFunc(
        Client4.getLogs,
        AdminTypes.GET_LOGS_REQUEST,
        [AdminTypes.RECEIVED_LOGS, AdminTypes.GET_LOGS_SUCCESS],
        AdminTypes.GET_LOGS_FAILURE,
        page,
        perPage
    );
}

export function getAudits(page = 0, perPage = General.PAGE_SIZE_DEFAULT) {
    return bindClientFunc(
        Client4.getAudits,
        AdminTypes.GET_AUDITS_REQUEST,
        [AdminTypes.RECEIVED_AUDITS, AdminTypes.GET_AUDITS_SUCCESS],
        AdminTypes.GET_AUDITS_FAILURE,
        page,
        perPage
    );
}

export function getConfig() {
    return bindClientFunc(
        Client4.getConfig,
        AdminTypes.GET_CONFIG_REQUEST,
        [AdminTypes.RECEIVED_CONFIG, AdminTypes.GET_CONFIG_SUCCESS],
        AdminTypes.GET_CONFIG_FAILURE
    );
}

export function updateConfig() {
    return bindClientFunc(
        Client4.updateConfig,
        AdminTypes.UPDATE_CONFIG_REQUEST,
        [AdminTypes.RECEIVED_CONFIG, AdminTypes.UPDATE_CONFIG_SUCCESS],
        AdminTypes.UPDATE_CONFIG_FAILURE
    );
}

