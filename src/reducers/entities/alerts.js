// Copyright (c) 2017-present Mattermost, Inc. All Rights Reserved.
// See License.txt for license information.

import {combineReducers} from 'redux';
import {AlertTypes, UserTypes} from 'action_types';

function alertStack(state = [], action) {
    const nextState = [...state];

    switch (action.type) {
    case AlertTypes.PUSH_ALERT: {
        nextState.unshift(action.data);
        return nextState;
    }
    case AlertTypes.CLEAR_ALERT: {
        nextState.shift();
        return nextState;
    }
    case UserTypes.LOGOUT_SUCCESS:
        return [];

    default:
        return state;
    }
}

export default combineReducers({

    // array acting as a stack where every object is an alert
    alertStack

});

