// Copyright (c) 2017-present Mattermost, Inc. All Rights Reserved.
// See License.txt for license information.

import {createSelector} from 'reselect';
import {isMinimumServerVersion} from 'utils/helpers';

export function getConfig(state) {
    return state.entities.general.config;
}

export function getLicense(state) {
    return state.entities.general.license;
}

export function getCurrentUrl(state) {
    return state.entities.general.credentials.url;
}

export function hasNewPermissions(state) {
    const version = state.entities.general.serverVersion;
    return isMinimumServerVersion(version, 4, 8, 0);
}

export const canUploadFilesOnMobile = createSelector(
    getConfig,
    getLicense,
    (config, license) => {
        // Defaults to true if either setting doesn't exist
        return config.EnableFileAttachments !== 'false' &&
           (license.IsLicensed === 'false' || license.Compliance === 'false' || config.EnableMobileFileUpload !== 'false');
    }
);

export const canDownloadFilesOnMobile = createSelector(
    getConfig,
    getLicense,
    (config, license) => {
        // Defaults to true if the setting doesn't exist
        return license.IsLicensed === 'false' || license.Compliance === 'false' || config.EnableMobileFileDownload !== 'false';
    }
);
