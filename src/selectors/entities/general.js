// Copyright (c) 2017-present Mattermost, Inc. All Rights Reserved.
// See License.txt for license information.

import {createSelector} from 'reselect';

export function getConfig(state) {
    return state.entities.general.config;
}

export function getLicense(state) {
    return state.entities.general.license;
}

export function getCurrentUrl(state) {
    return state.entities.general.credentials.url;
}

export const canUploadFilesOnMobile = createSelector(
    getConfig,
    (config) => {
        // Defaults to true if either setting doesn't exist
        return config.EnableMobileFileUpload !== 'false' && config.EnableFileAttachments !== 'false';
    }
);

export const canDownloadFilesOnMobile = createSelector(
    getConfig,
    (config) => {
        // Defaults to true if either setting doesn't exist
        return config.EnableMobileFileDownload !== 'false' && config.EnableFileAttachments !== 'false';
    }
);
