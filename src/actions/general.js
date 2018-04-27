// Copyright (c) 2016-present Mattermost, Inc. All Rights Reserved.
// See License.txt for license information.

import {Client, Client4} from 'client';
import {bindClientFunc, forceLogoutIfNecessary, FormattedError} from './helpers.js';
import {GeneralTypes} from 'action_types';
import {loadMe} from './users';
import {loadRolesIfNeeded} from './roles';
import {logError} from './errors';
import {batchActions} from 'redux-batched-actions';

export function getPing(useV3 = false) {
    return async (dispatch, getState) => {
        dispatch({type: GeneralTypes.PING_REQUEST}, getState);

        let data;
        let pingError = new FormattedError(
            'mobile.server_ping_failed',
            'Cannot connect to the server. Please check your server URL and internet connection.'
        );
        try {
            if (useV3) {
                data = await Client.getPing();
            } else {
                data = await Client4.ping();
            }
            if ((useV3 && !data.version) || (!useV3 && data.status !== 'OK')) {
                // successful ping but not the right return {data}
                dispatch({type: GeneralTypes.PING_FAILURE, error: pingError}, getState);
                return {error: pingError};
            }
        } catch (error) {
            if (!useV3 && error.status_code === 404) {
                if (!Client.getUrl()) {
                    Client.setUrl(Client4.getUrl());
                }
                return getPing(true)(dispatch, getState);
            } else if (error.status_code === 401) {
                // When the server requires a client certificate to connect.
                pingError = error;
            }
            dispatch({type: GeneralTypes.PING_FAILURE, error: pingError}, getState);
            return {error: pingError};
        }

        dispatch({type: GeneralTypes.PING_SUCCESS, data}, getState);
        return {data};
    };
}

export function resetPing() {
    return async (dispatch, getState) => {
        dispatch({type: GeneralTypes.PING_RESET}, getState);

        return {data: true};
    };
}

export function getClientConfig() {
    return async (dispatch, getState) => {
        dispatch({type: GeneralTypes.CLIENT_CONFIG_REQUEST}, getState);

        let data;
        try {
            data = await Client4.getClientConfigOld();
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch, getState);
            dispatch(batchActions([
                {
                    type: GeneralTypes.CLIENT_CONFIG_FAILURE,
                    error,
                },
                logError(error)(dispatch),
            ]), getState);
            return {error};
        }

        Client4.setEnableLogging(data.EnableDeveloper === 'true');
        Client4.setDiagnosticId(data.DiagnosticId);

        dispatch(batchActions([
            {type: GeneralTypes.CLIENT_CONFIG_RECEIVED, data},
            {type: GeneralTypes.CLIENT_CONFIG_SUCCESS},
        ]));

        return {data};
    };
}

export function getDataRetentionPolicy() {
    return async (dispatch, getState) => {
        dispatch({type: GeneralTypes.DATA_RETENTION_POLICY_REQUEST}, getState);

        let data;
        try {
            data = await Client4.getDataRetentionPolicy();
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch, getState);
            dispatch(batchActions([
                {
                    type: GeneralTypes.DATA_RETENTION_POLICY_FAILURE,
                    error,
                },
                logError(error)(dispatch),
            ]), getState);
            return {error};
        }

        dispatch(batchActions([
            {type: GeneralTypes.RECEIVED_DATA_RETENTION_POLICY, data},
            {type: GeneralTypes.DATA_RETENTION_POLICY_SUCCESS},
        ]));

        return {data};
    };
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

        return {data: true};
    };
}

export function setDeviceToken(token) {
    return async (dispatch, getState) => {
        dispatch({type: GeneralTypes.RECEIVED_APP_DEVICE_TOKEN, data: token}, getState);

        return {data: true};
    };
}

export function setServerVersion(serverVersion) {
    return async (dispatch, getState) => {
        dispatch({type: GeneralTypes.RECEIVED_SERVER_VERSION, data: serverVersion}, getState);
        dispatch(loadRolesIfNeeded([]));

        return {data: true};
    };
}

export function setStoreFromLocalData(data) {
    return async (dispatch, getState) => {
        Client.setToken(data.token);
        Client.setUrl(data.url);
        Client4.setToken(data.token);
        Client4.setUrl(data.url);

        return loadMe()(dispatch, getState);
    };
}

export function getSupportedTimezones() {
    return bindClientFunc(
        Client4.getTimezones,
        GeneralTypes.SUPPORTED_TIMEZONES_REQUEST,
        [GeneralTypes.SUPPORTED_TIMEZONES_RECEIVED, GeneralTypes.SUPPORTED_TIMEZONES_SUCCESS],
        GeneralTypes.SUPPORTED_TIMEZONES_FAILURE,
    );
}

export function setUrl(url) {
    Client.setUrl(url);
    Client4.setUrl(url);
    return true;
}

export default {
    getPing,
    getClientConfig,
    getDataRetentionPolicy,
    getSupportedTimezones,
    getLicenseConfig,
    logClientError,
    setAppState,
    setDeviceToken,
    setServerVersion,
    setStoreFromLocalData,
    setUrl,
};
