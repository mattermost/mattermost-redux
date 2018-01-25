// Copyright (c) 2017-present Mattermost, Inc. All Rights Reserved.
// See License.txt for license information.
// @flow

import {createSelector} from 'reselect';

import type {GlobalState} from '../../types/store';

export function getConfig(state: GlobalState): Object {
    return state.entities.general.config;
}

export function getLicense(state: GlobalState): Object {
    return state.entities.general.license;
}

export function getSupportedTimezones(state: GlobalState): Array<string> {
    return state.entities.general.timezones;
}

export function getCurrentUrl(state: GlobalState): string {
    return state.entities.general.credentials.url;
}

export const canUploadFilesOnMobile = createSelector(
    getConfig,
    getLicense,
    (config: Object, license: Object): boolean => {
        // Defaults to true if either setting doesn't exist
        return config.EnableFileAttachments !== 'false' &&
           (license.IsLicensed === 'false' || license.Compliance === 'false' || config.EnableMobileFileUpload !== 'false');
    }
);

export const canDownloadFilesOnMobile = createSelector(
    getConfig,
    getLicense,
    (config: Object, license: Object): boolean => {
        // Defaults to true if the setting doesn't exist
        return license.IsLicensed === 'false' || license.Compliance === 'false' || config.EnableMobileFileDownload !== 'false';
    }
);
