// Copyright (c) 2018-present Mattermost, Inc. All Rights Reserved.
// See License.txt for license information.
// @flow

let localizeFunction = null;

export function setLocalizeFunction(func: func) {
    localizeFunction = func;
}

export function localizeMessage(id: string, defaultMessage: string): string {
    if (!localizeFunction) {
        return defaultMessage;
    }

    return localizeFunction(id, defaultMessage);
}
