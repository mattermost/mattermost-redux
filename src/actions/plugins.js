// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {Client4} from 'client';
import {bindClientFunc} from './helpers';

import {PluginTypes} from 'action_types';

export function getMarketplacePlugins(filter) {
    return bindClientFunc({
        clientFunc: Client4.getMarketplacePlugins,
        onSuccess: PluginTypes.RECEIVED_MARKETPLACE_PLUGINS,
        onFailure: PluginTypes.GET_MARKETPLACE_PLUGINS_FAILURE,
        params: [
            filter,
        ],
    });
}

