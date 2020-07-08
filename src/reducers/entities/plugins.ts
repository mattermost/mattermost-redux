// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import {combineReducers} from 'redux';
import {PluginTypes} from '../../action_types';
import {PluginIntegration, PluginsState} from '../../types/plugins';
import {GenericAction} from '../../types/actions';

function mobilePluginIntegrations(state: PluginIntegration[] = [], action: GenericAction): PluginIntegration[] {
    switch (action.type) {
    case PluginTypes.RECEIVED_PLUGIN_INTEGRATIONS: {
        return action.data;
    }
    default:
        return state;
    }
}

export default (combineReducers({
    mobilePluginIntegrations,
}) as (b: PluginsState, a: GenericAction) => PluginsState);
