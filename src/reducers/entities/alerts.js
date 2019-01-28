// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
// @flow

import {combineReducers} from 'redux';
import {AlertTypes, UserTypes} from 'action_types';

import type {AlertType} from 'types/alerts';
import type {GenericAction} from 'types/actions';

function alertStack(state: Array<AlertType> = [], action: GenericAction) {
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

export default (combineReducers({

    // array acting as a stack where every object is an alert
    alertStack,

}): ({| alertStack: Array<AlertType> |}, GenericAction) => {| alertStack: Array<AlertType> |});

