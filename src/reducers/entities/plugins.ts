// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import {combineReducers} from 'redux';

import {PluginTypes} from 'action_types';
import {PluginLocation, PluginsState} from 'types/plugins';
import {GenericAction} from 'types/actions';

function locations(state: PluginLocation[] = [], action: GenericAction): PluginLocation[] {
    switch (action.type) {
    case PluginTypes.RECEIVED_PLUGIN_LOCATIONS: {
        return action.data;
    }
    default:
        return state;
    }
}

export default (combineReducers({
    locations,
}) as (b: PluginsState, a: GenericAction) => PluginsState);
