// Copyright (c) 2017 Mattermost, Inc. All Rights Reserved.
// See License.txt for license information.

import {combineReducers} from 'redux';
import {IntegrationTypes} from 'action_types';

function incomingHooks(state = {}, action) {
    const nextState = {...state};

    switch (action.type) {
    case IntegrationTypes.RECEIVED_INCOMING_HOOK: {
        nextState[action.data.id] = action.data;
        return nextState;
    }
    case IntegrationTypes.RECEIVED_INCOMING_HOOKS: {
        for (const hook of action.data) {
            nextState[hook.id] = hook;
        }
        return nextState;
    }
    case IntegrationTypes.DELETED_INCOMING_HOOK: {
        Reflect.deleteProperty(nextState, action.data.id);
        return nextState;
    }
    case IntegrationTypes.LOGOUT_SUCCESS:
        return {};

    default:
        return state;
    }
}

function outgoingHooks(state = {}, action) {
    const nextState = {...state};

    switch (action.type) {
    case IntegrationTypes.RECEIVED_OUTGOING_HOOK: {
        nextState[action.data.id] = action.data;
        return nextState;
    }
    case IntegrationTypes.RECEIVED_OUTGOING_HOOKS: {
        for (const hook of action.data) {
            nextState[hook.id] = hook;
        }
        return nextState;
    }
    case IntegrationTypes.DELETED_OUTGOING_HOOK: {
        Reflect.deleteProperty(nextState, action.data.id);
        return nextState;
    }
    case IntegrationTypes.LOGOUT_SUCCESS:
        return {};

    default:
        return state;
    }
}

export default combineReducers({

    // object where every key is the hook id and has an object with the incoming hook details
    incomingHooks,

    // object where every key is the hook id and has an object with the outgoing hook details
    outgoingHooks

});
