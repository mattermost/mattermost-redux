// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {ErrorTypes} from 'action_types';
import serializeError from 'serialize-error';
import {Client4} from 'client';
import EventEmitter from 'utils/event_emitter';

export function dismissErrorObject(index) {
    return {
        type: ErrorTypes.DISMISS_ERROR,
        index,
    };
}

export function dismissError(index) {
    return async (dispatch) => {
        dispatch(dismissErrorObject(index));

        return {data: true};
    };
}

export function getLogErrorAction(error, displayable = false) {
    return {
        type: ErrorTypes.LOG_ERROR,
        displayable,
        error,
    };
}

export function logError(error, displayable = false) {
    return async (dispatch) => {
        if (error.server_error_id === 'api.context.session_expired.app_error') {
            return {data: true};
        }

        const serializedError = serializeError(error);

        let sendToServer = true;
        if (error.stack && error.stack.includes('TypeError: Failed to fetch')) {
            sendToServer = false;
        }
        if (error.server_error_id) {
            sendToServer = false;
        }

        if (sendToServer) {
            try {
                const stringifiedSerializedError = JSON.stringify(serializedError).toString();
                await Client4.logClientError(stringifiedSerializedError);
            } catch (err) {
                // avoid crashing the app if an error sending
                // the error occurs.
            }
        }

        EventEmitter.emit(ErrorTypes.LOG_ERROR, error);
        dispatch(getLogErrorAction(serializedError, displayable));

        return {data: true};
    };
}

export function clearErrors() {
    return async (dispatch) => {
        dispatch({type: ErrorTypes.CLEAR_ERRORS});

        return {data: true};
    };
}
