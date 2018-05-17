// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
// @flow

let localizeFunction = null;

export function setLocalizeFunction(func: Function) {
    localizeFunction = func;
}

export function localizeMessage(id: string, defaultMessage: string): string {
    if (!localizeFunction) {
        return defaultMessage;
    }

    return localizeFunction(id, defaultMessage);
}
