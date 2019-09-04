// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {combineReducers} from 'redux';
import {PluginTypes} from 'action_types';

function getInitialState() {
    return {
        data: [],
        serverError: null,
    };
}

function marketplacePlugins(state = getInitialState(), action) {
    switch (action.type) {
    case PluginTypes.RECEIVED_MARKETPLACE_PLUGINS: {
        return {
            ...state,
            data: action.data,
            serverError: null,
        };
    }
    case PluginTypes.GET_MARKETPLACE_PLUGINS_FAILURE: {
        return {
            ...state,
            data: [],
            serverError: action.error,
        };
    }
    default:
        return state;
    }
}

export default combineReducers({
    marketplacePlugins,
});
