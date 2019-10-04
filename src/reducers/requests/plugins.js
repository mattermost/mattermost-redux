// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
// @flow

import {combineReducers} from 'redux';
import {PluginTypes} from 'action_types';

import {handleRequest, initialRequestState} from './helpers';

import type {GenericAction} from '../../types/actions';
import type {RequestStatusType, PluginsRequestsStatuses} from '../../types/requests';

function installMarketplacePlugin(state: RequestStatusType = initialRequestState(), action: GenericAction): RequestStatusType {
    return handleRequest(
        PluginTypes.INSTALL_MARKETPLACE_PLUGIN_REQUEST,
        PluginTypes.INSTALL_MARKETPLACE_PLUGIN_SUCCESS,
        PluginTypes.INSTALL_MARKETPLACE_PLUGIN_FAILURE,
        state,
        action
    );
}

export default (combineReducers({
    installMarketplacePlugin,
}): (PluginsRequestsStatuses, GenericAction) => PluginsRequestsStatuses);

