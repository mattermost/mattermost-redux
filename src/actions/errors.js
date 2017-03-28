// Copyright (c) 2017 Mattermost, Inc. All Rights Reserved.
// See License.txt for license information.

import {ErrorTypes} from 'action_types';
import serializeError from 'serialize-error';
import Client from 'client';

export function dismissErrorObject(index) {
    return {
        type: ErrorTypes.DISMISS_ERROR,
        index
    };
}

export function dismissError(index) {
    return async (dispatch) => {
        dispatch(dismissErrorObject(index));
    };
}

export function getLogErrorAction(error, displayable = true) {
    return {
        type: ErrorTypes.LOG_ERROR,
        displayable,
        error
    };
}

export function logError(error) {
    return async () => {
        try {
            const serializedError = serializeError(error);
            const stringifiedSerializedError = JSON.stringify(serializedError).toString();
            await Client.logClientError(stringifiedSerializedError);
        } catch (err) {
          // avoid crashing the app if an error sending
          // the error occurs.
        }
    };
}

export function clearErrors() {
    return async (dispatch) => {
        dispatch({type: ErrorTypes.CLEAR_ERRORS});
    };
}
