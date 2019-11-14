// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {combineReducers} from 'redux';
import {PluginTypes} from 'action_types';
import {GenericAction} from 'types/actions';

function marketplacePlugins(state = [], action: GenericAction) {
    switch (action.type) {
    case PluginTypes.RECEIVED_MARKETPLACE_PLUGINS: {
        return action.data ? action.data : [];
    }
    default:
        return state;
    }
}

export default combineReducers({
    marketplacePlugins,
});
