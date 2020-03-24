// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import {Client4} from 'client';

import {GeneralTypes} from 'action_types';

import {getServerVersion} from 'selectors/entities/general';
import {isMinimumServerVersion} from 'utils/helpers';
import {GeneralState} from 'types/general';
import {logLevel} from 'types/client4';
import {GetStateFunc, DispatchFunc, ActionFunc, batchActions} from 'types/actions';

import {logError} from './errors';
import {loadRolesIfNeeded} from './roles';
import {loadMe} from './users';
import {bindClientFunc, forceLogoutIfNecessary, FormattedError} from './helpers';

export function getPing(cookies: any): ActionFunc {
    return async () => {
        let data;
        let pingError = new FormattedError(
            'mobile.server_ping_failed',
            'Cannot connect to the server. Please check your server URL and internet connection.'
        );
        try {
            data = await Client4.ping(cookies);
            if (data.status !== 'OK') {
                // console.log('w22222');
                
                // successful ping but not the right return {data}
                return {error: pingError};
            }
        } catch (error) { // Client4Error
            // console.log('99990', error);
        
            if (error.status_code === 401) {
                // When the server requires a client certificate to connect.
                pingError = error;
            }
            return {error: pingError};
        }

        return {data};
    };
}

export function resetPing(): ActionFunc {
    return async (dispatch: DispatchFunc, getState: GetStateFunc) => {
        dispatch({type: GeneralTypes.PING_RESET, data: {}});

        return {data: true};
    };
}

export function getClientConfig(cookies?: any): ActionFunc {
    return async (dispatch: DispatchFunc, getState: GetStateFunc) => {
        let data;
        
        if (cookies) {
            try {
                data = await Client4.getClientConfigOld(cookies);
            } catch (error) {
                forceLogoutIfNecessary(error, dispatch, getState);
                return {error};
            }
        } else {
            data = {"AboutLink": "https://about.mattermost.com/default-about/", "AndroidAppDownloadLink": "https://about.mattermost.com/mattermost-android-app/", "AndroidLatestVersion": "", "AndroidMinVersion": "", "AppDownloadLink": "https://about.mattermost.com/downloads/", "AsymmetricSigningPublicKey": "MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEVHXSZCnHvbk5VrsSn7sXPxxwVRwlySIKvuscsm9D6F6EUdvBE4n6jZ3LLwqxuq2nQcIP4KR0i8LnKSEOjrT/BQ==", "BuildDate": "Sat Jun 15 09:02:48 UTC 2019", "BuildEnterpriseReady": "false", "BuildHash": "bfd66aa445a2df8c6ed6ba9f2567021ecf6c9f3b", "BuildHashEnterprise": "none", "BuildNumber": "5.12.0", "CustomBrandText": "", "CustomDescriptionText": "", "DefaultClientLocale": "en", "DesktopLatestVersion": "", "DesktopMinVersion": "", "DiagnosticId": "1hyiyhpwrfgp5qocb3zrdk8bcw", "DiagnosticsEnabled": "true", "EmailLoginButtonBorderColor": "#2389D7", "EmailLoginButtonColor": "#0000", "EmailLoginButtonTextColor": "#2389D7", "EnableBotAccountCreation": "false", "EnableCustomBrand": "false", "EnableCustomEmoji": "true", "EnableDiagnostics": "true", "EnableLdap": "false", "EnableMultifactorAuthentication": "false", "EnableOpenServer": "false", "EnableSaml": "false", "EnableSignInWithEmail": "true", "EnableSignInWithUsername": "true", "EnableSignUpWithEmail": "true", "EnableSignUpWithGitLab": "true", "EnableSignUpWithGoogle": "false", "EnableSignUpWithOffice365": "false", "EnableUserCreation": "true", "EnforceMultifactorAuthentication": "false", "HasImageProxy": "false", "HelpLink": "https://about.mattermost.com/default-help/", "IosAppDownloadLink": "https://about.mattermost.com/mattermost-ios-app/", "IosLatestVersion": "", "IosMinVersion": "", "LdapLoginButtonBorderColor": "", "LdapLoginButtonColor": "", "LdapLoginButtonTextColor": "", "LdapLoginFieldName": "", "NoAccounts": "false", "PluginsEnabled": "true", "PrivacyPolicyLink": "https://about.mattermost.com/default-privacy-policy/", "ReportAProblemLink": "https://about.mattermost.com/default-report-a-problem/", "SamlLoginButtonBorderColor": "", "SamlLoginButtonColor": "", "SamlLoginButtonText": "", "SamlLoginButtonTextColor": "", "SiteName": "Mattermost", "SupportEmail": "feedback@mattermost.com", "TermsOfServiceLink": "https://about.mattermost.com/default-terms/", "Version": "5.12.0", "WebsocketPort": "80", "WebsocketSecurePort": "443", "WebsocketURL": ""}
        }

        Client4.setEnableLogging(data.EnableDeveloper === 'true');
        Client4.setDiagnosticId(data.DiagnosticId);

        dispatch(batchActions([
            {type: GeneralTypes.CLIENT_CONFIG_RECEIVED, data},
        ]));

        

        return {data};
    };
}

export function getDataRetentionPolicy(): ActionFunc {
    return async (dispatch: DispatchFunc, getState: GetStateFunc) => {
        let data;
        try {
            data = await Client4.getDataRetentionPolicy();
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch, getState);
            dispatch(batchActions([
                {
                    type: GeneralTypes.RECEIVED_DATA_RETENTION_POLICY,
                    error,
                },
                logError(error),
            ]));
            return {error};
        }

        dispatch(batchActions([
            {type: GeneralTypes.RECEIVED_DATA_RETENTION_POLICY, data},
        ]));

        return {data};
    };
}

export function getLicenseConfig(cookies?: any): ActionFunc {
    
    const licenseConfig = bindClientFunc({
        clientFunc: cookies ? Client4.getClientLicenseOld : async () => { return await Promise.resolve({"IsLicensed": "false"}) },
        onSuccess: [GeneralTypes.CLIENT_LICENSE_RECEIVED],
        params: [cookies]
    });
    // console.log('licenseConfiglicenseConfiglicenseConfig', licenseConfig);
    return licenseConfig
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

export function setAppState(state: GeneralState['appState']): ActionFunc {
    return async (dispatch: DispatchFunc, getState: GetStateFunc) => {
        dispatch({type: GeneralTypes.RECEIVED_APP_STATE, data: state});

        return {data: true};
    };
}

export function setDeviceToken(token: GeneralState['deviceToken']): ActionFunc {
    return async (dispatch: DispatchFunc, getState: GetStateFunc) => {
        dispatch({type: GeneralTypes.RECEIVED_APP_DEVICE_TOKEN, data: token});

        return {data: true};
    };
}

export function setServerVersion(serverVersion: string): ActionFunc {
    return async (dispatch, getState: GetStateFunc) => {
        dispatch({type: GeneralTypes.RECEIVED_SERVER_VERSION, data: serverVersion});
        dispatch(loadRolesIfNeeded([]));

        return {data: true};
    };
}

export function setStoreFromLocalData(data: { token: string; url: string }): ActionFunc {
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
        let pendingData: Promise<any>;
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
            dispatch({type: GeneralTypes.REDIRECT_LOCATION_FAILURE, data: {error, url}});
            return {error};
        }

        dispatch({type: GeneralTypes.REDIRECT_LOCATION_SUCCESS, data: {...data, url}});
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
