// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {createSelector} from 'reselect';

import {General} from '../../constants';

import {GlobalState} from 'types/store';
import {ClientConfig} from 'types/config';

import {isMinimumServerVersion} from 'utils/helpers';

export function getConfig(state: GlobalState): Partial<ClientConfig> {
    return state.entities.general.config;
}

export function getLicense(state: GlobalState): any {
    return state.entities.general.license;
}

export function getSupportedTimezones(state: GlobalState): string[] {
    return state.entities.general.timezones;
}

export function getCurrentUrl(state: GlobalState): string {
    return state.entities.general.credentials.url;
}

export function warnMetricsStatus(state: GlobalState): any {
    return state.entities.general.warnMetricsStatus;
}

export function isCompatibleWithJoinViewTeamPermissions(state: GlobalState): boolean {
    const version = state.entities.general.serverVersion;
    return isMinimumServerVersion(version, 5, 10, 0) ||
       (version.indexOf('dev') !== -1 && isMinimumServerVersion(version, 5, 8, 0)) ||
       (version.match(/^5.8.\d.\d\d\d\d.*$/) !== null && isMinimumServerVersion(version, 5, 8, 0));
}

export function hasNewPermissions(state: GlobalState): boolean {
    const version = state.entities.general.serverVersion;

    // FIXME This must be changed to 4, 9, 0 before we generate the 4.9.0 release
    return isMinimumServerVersion(version, 4, 9, 0) ||
           (version.indexOf('dev') !== -1 && isMinimumServerVersion(version, 4, 8, 0)) ||
           (version.match(/^4.8.\d.\d\d\d\d.*$/) !== null && isMinimumServerVersion(version, 4, 8, 0));
}

export const canUploadFilesOnMobile: (a: GlobalState) => boolean = createSelector(
    getConfig,
    getLicense,
    (config: ClientConfig, license: any): boolean => {
        // Defaults to true if either setting doesn't exist
        return config.EnableFileAttachments !== 'false' &&
        (license.IsLicensed === 'false' || license.Compliance === 'false' || config.EnableMobileFileUpload !== 'false');
    },
);

export const canDownloadFilesOnMobile: (a: GlobalState) => boolean = createSelector(
    getConfig,
    getLicense,
    (config: ClientConfig, license: any): boolean => {
        // Defaults to true if the setting doesn't exist
        return license.IsLicensed === 'false' || license.Compliance === 'false' || config.EnableMobileFileDownload !== 'false';
    },
);

export const getAutolinkedUrlSchemes: (a: GlobalState) => string[] = createSelector(
    getConfig,
    (config: ClientConfig): string[] => {
        if (!config.CustomUrlSchemes) {
            return General.DEFAULT_AUTOLINKED_URL_SCHEMES;
        }

        return [
            ...General.DEFAULT_AUTOLINKED_URL_SCHEMES,
            ...config.CustomUrlSchemes.split(','),
        ];
    },
);

export const getManagedResourcePaths: (state: GlobalState) => string[] = createSelector(
    getConfig,
    (config) => {
        if (!config.ManagedResourcePaths) {
            return [];
        }

        return config.ManagedResourcePaths.split(',').map((path) => path.trim());
    },
);

export const getServerVersion = (state: GlobalState): string => {
    return state.entities.general.serverVersion;
};
