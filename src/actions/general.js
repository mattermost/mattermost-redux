// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
// @flow

import {Client4} from 'client';
import {bindClientFunc, forceLogoutIfNecessary, FormattedError} from './helpers.js';
import {GeneralTypes} from 'action_types';
import {loadMe} from './users';
import {loadRolesIfNeeded} from './roles';
import {logError} from './errors';
import {batchActions} from 'redux-batched-actions';
import {getServerVersion} from 'selectors/entities/general';
import {isMinimumServerVersion} from 'utils/helpers';

import type {GeneralState} from 'types/general';
import type {GenericClientResponse, logLevel} from 'types/client4';
import type {GetStateFunc, DispatchFunc, ActionFunc} from 'types/actions';

export function getPing(): ActionFunc {
    return async (dispatch: DispatchFunc, getState: GetStateFunc) => {
        dispatch({type: GeneralTypes.PING_REQUEST, data: {}}, getState);

        let data: GenericClientResponse;
        let pingError = new FormattedError(
            'mobile.server_ping_failed',
            'Cannot connect to the server. Please check your server URL and internet connection.'
        );
        try {
            data = await Client4.ping();
            if (data.status !== 'OK') {
                // successful ping but not the right return {data}
                dispatch({type: GeneralTypes.PING_FAILURE, data: {}, error: pingError}, getState);
                return {error: pingError};
            }
        } catch (error) { // Client4Error
            if (error.status_code === 401) {
                // When the server requires a client certificate to connect.
                pingError = error;
            }
            dispatch({type: GeneralTypes.PING_FAILURE, data: {}, error: pingError}, getState);
            return {error: pingError};
        }

        dispatch({type: GeneralTypes.PING_SUCCESS, data}, getState);
        return {data};
    };
}

export function resetPing(): ActionFunc {
    return async (dispatch: DispatchFunc, getState: GetStateFunc) => {
        dispatch({type: GeneralTypes.PING_RESET, data: {}}, getState);

        return {data: true};
    };
}

export function getClientConfig(): ActionFunc {
    return async (dispatch: DispatchFunc, getState: GetStateFunc) => {
        dispatch({type: GeneralTypes.CLIENT_CONFIG_REQUEST, data: {}}, getState);

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
                logError(error),
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

export function getDataRetentionPolicy(): ActionFunc {
    return async (dispatch: DispatchFunc, getState: GetStateFunc) => {
        dispatch({type: GeneralTypes.DATA_RETENTION_POLICY_REQUEST, data: {}}, getState);

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
                logError(error),
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

export function getLicenseConfig(): ActionFunc {
    return bindClientFunc({
        clientFunc: Client4.getClientLicenseOld,
        onRequest: GeneralTypes.CLIENT_LICENSE_REQUEST,
        onSuccess: [GeneralTypes.CLIENT_LICENSE_RECEIVED, GeneralTypes.CLIENT_LICENSE_SUCCESS],
        onFailure: GeneralTypes.CLIENT_LICENSE_FAILURE,
    });
}

export function logClientError(message: string, level: logLevel = 'ERROR') {
    return bindClientFunc({
        clientFunc: Client4.logClientError,
        onRequest: GeneralTypes.LOG_CLIENT_ERROR_REQUEST,
        onSuccess: GeneralTypes.LOG_CLIENT_ERROR_SUCCESS,
        onFailure: GeneralTypes.LOG_CLIENT_ERROR_FAILURE,
        params: [
            message,
            level,
        ],
    });
}

export function setAppState(state: $PropertyType<GeneralState, 'appState'>): ActionFunc {
    return async (dispatch: DispatchFunc, getState: GetStateFunc) => {
        dispatch({type: GeneralTypes.RECEIVED_APP_STATE, data: state}, getState);

        return {data: true};
    };
}

export function setDeviceToken(token: $PropertyType<GeneralState, 'deviceToken'>): ActionFunc {
    return async (dispatch: DispatchFunc, getState: GetStateFunc) => {
        dispatch({type: GeneralTypes.RECEIVED_APP_DEVICE_TOKEN, data: token}, getState);

        return {data: true};
    };
}

export function setServerVersion(serverVersion: string): ActionFunc {
    return async (dispatch, getState: GetStateFunc) => {
        dispatch({type: GeneralTypes.RECEIVED_SERVER_VERSION, data: serverVersion}, getState);
        dispatch(loadRolesIfNeeded([]));

        return {data: true};
    };
}

export function setStoreFromLocalData(data: { token: string, url: string }): ActionFunc {
    return async (dispatch: DispatchFunc, getState) => {
        Client4.setToken(data.token);
        Client4.setUrl(data.url);

        return loadMe()(dispatch, getState);
    };
}

export function getSupportedTimezones() {
    return bindClientFunc({
        clientFunc: Client4.getTimezones,
        onRequest: GeneralTypes.SUPPORTED_TIMEZONES_REQUEST,
        onSuccess: [GeneralTypes.SUPPORTED_TIMEZONES_RECEIVED, GeneralTypes.SUPPORTED_TIMEZONES_SUCCESS],
        onFailure: GeneralTypes.SUPPORTED_TIMEZONES_FAILURE,
    });
}

export function setUrl(url: string) {
    Client4.setUrl(url);
    return true;
}

export function getRedirectLocation(url: string): ActionFunc {
    return async (dispatch: DispatchFunc, getState: GetStateFunc) => {
        dispatch({type: GeneralTypes.REDIRECT_LOCATION_REQUEST, data: {}}, getState);

        let pendingData: Promise<Object>;
        if (isMinimumServerVersion(getServerVersion(getState()), 5, 3)) {
            pendingData = Client4.getRedirectLocation(url);
        } else {
            pendingData = Promise.resolve({location: url});
        }

        let data;
        try {
            data = await pendingData;
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch, getState);
            dispatch({type: GeneralTypes.REDIRECT_LOCATION_FAILURE, data: {error, url}}, getState);
            return {error};
        }

        dispatch({type: GeneralTypes.REDIRECT_LOCATION_SUCCESS, data: {...data, url}}, getState);
        return {data};
    };
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
    getRedirectLocation,
};
