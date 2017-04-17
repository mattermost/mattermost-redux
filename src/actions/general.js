// Copyright (c) 2016-present Mattermost, Inc. All Rights Reserved.
// See License.txt for license information.

import {Client4} from 'client';
import {bindClientFunc, FormattedError} from './helpers.js';
import {GeneralTypes} from 'action_types';
import {getMyChannelMembers} from './channels';
import {loadMe} from './users';

export function getPing() {
    return async (dispatch, getState) => {
        dispatch({type: GeneralTypes.PING_REQUEST}, getState);

        let data;
        const pingError = new FormattedError(
            'mobile.server_ping_failed',
            'Cannot connect to the server. Please check your server URL and internet connection.'
        );
        try {
            data = await Client4.ping();
            if (!data.status) {
                // successful ping but not the right return data
                dispatch({type: GeneralTypes.PING_FAILURE, error: pingError}, getState);
                return;
            }
        } catch (error) {
            dispatch({type: GeneralTypes.PING_FAILURE, error: pingError}, getState);
            return;
        }

        dispatch({type: GeneralTypes.PING_SUCCESS, data}, getState);
    };
}

export function resetPing() {
    return async (dispatch, getState) => {
        dispatch({type: GeneralTypes.PING_RESET}, getState);
    };
}

export function getClientConfig() {
    return bindClientFunc(
        Client4.getClientConfigOld,
        GeneralTypes.CLIENT_CONFIG_REQUEST,
        [GeneralTypes.CLIENT_CONFIG_RECEIVED, GeneralTypes.CLIENT_CONFIG_SUCCESS],
        GeneralTypes.CLIENT_CONFIG_FAILURE
    );
}

export function getLicenseConfig() {
    return bindClientFunc(
        Client4.getClientLicenseOld,
        GeneralTypes.CLIENT_LICENSE_REQUEST,
        [GeneralTypes.CLIENT_LICENSE_RECEIVED, GeneralTypes.CLIENT_LICENSE_SUCCESS],
        GeneralTypes.CLIENT_LICENSE_FAILURE
    );
}

export function logClientError(message, level = 'ERROR') {
    return bindClientFunc(
        Client4.logClientError,
        GeneralTypes.LOG_CLIENT_ERROR_REQUEST,
        GeneralTypes.LOG_CLIENT_ERROR_SUCCESS,
        GeneralTypes.LOG_CLIENT_ERROR_FAILURE,
        message,
        level
    );
}

export function setAppState(state) {
    return async (dispatch, getState) => {
        dispatch({type: GeneralTypes.RECEIVED_APP_STATE, data: state}, getState);

        if (state) {
            const {currentTeamId} = getState().entities.teams;
            if (currentTeamId) {
                getMyChannelMembers(currentTeamId)(dispatch, getState);
            }
        }
    };
}

export function setDeviceToken(token) {
    return async (dispatch, getState) => {
        dispatch({type: GeneralTypes.RECEIVED_APP_DEVICE_TOKEN, data: token}, getState);
    };
}

export function setServerVersion(serverVersion) {
    return async (dispatch, getState) => {
        dispatch({type: GeneralTypes.RECEIVED_SERVER_VERSION, data: serverVersion}, getState);
    };
}

export function setStoreFromLocalData(data) {
    return async (dispatch, getState) => {
        Client4.setToken(data.token);
        Client4.setUrl(data.url);

        return loadMe()(dispatch, getState);
    };
}

export default {
    getPing,
    getClientConfig,
    getLicenseConfig,
    logClientError,
    setAppState,
    setDeviceToken,
    setServerVersion,
    setStoreFromLocalData
};
