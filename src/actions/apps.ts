// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import {AppsTypes} from 'action_types';
import {Client4} from 'client';

import {ActionFunc} from 'types/actions';

import {bindClientFunc} from './helpers';

// This file's contents belong to the Apps Framework feature.
// Apps Framework feature is experimental, and the contents of this file are
// susceptible to breaking changes without pushing the major version of this package.

export function fetchAppBindings(userID: string, channelID: string): ActionFunc {
    return bindClientFunc({
        clientFunc: () => Client4.getAppsBindings(userID, channelID),
        onSuccess: AppsTypes.RECEIVED_APP_BINDINGS,
    });
}
