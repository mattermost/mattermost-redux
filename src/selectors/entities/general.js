// Copyright (c) 2017-present Mattermost, Inc. All Rights Reserved.
// See License.txt for license information.

export function getConfig(state) {
    return state.entities.general.config;
}

export function getCurrentUrl(state) {
    return state.entities.general.credentials.url;
}
