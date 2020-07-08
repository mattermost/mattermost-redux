// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import {PluginTypes} from '../action_types';
import {Client4} from '../client';

import {ActionFunc} from '../types/actions';

import {bindClientFunc} from './helpers';
export function fetchMobilePluginIntegrations(): ActionFunc {
    return bindClientFunc({
        clientFunc: Client4.getMobilePluginIntegrations,
        onSuccess: PluginTypes.RECEIVED_PLUGIN_INTEGRATIONS,
    });
}