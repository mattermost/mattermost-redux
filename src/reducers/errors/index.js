// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
// @flow

import {ErrorTypes} from 'action_types';

import type {GenericAction} from '../../types/actions';

export default (state: Array<Object> = [], action: GenericAction): Array<Object> => {
    switch (action.type) {
    case ErrorTypes.DISMISS_ERROR: {
        const nextState = [...state];
        nextState.splice(action.index || 0, 1);

        return nextState;
    }
    case ErrorTypes.LOG_ERROR: {
        const nextState = [...state];
        const {displayable, error} = action;
        nextState.push({
            displayable,
            error,
            date: new Date(Date.now()).toUTCString(),
        });

        return nextState;
    }
    case ErrorTypes.RESTORE_ERRORS:
        return action.data;
    case ErrorTypes.CLEAR_ERRORS: {
        return [];
    }
    default:
        return state;
    }
};
