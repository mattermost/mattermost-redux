// Copyright (c) 2016-present Mattermost, Inc. All Rights Reserved.
// See License.txt for license information.

import {batchActions} from 'redux-batched-actions';
import {Client4} from 'client';
import {UserTypes} from 'action_types';
import {logError} from './errors';
const HTTP_UNAUTHORIZED = 401;

export function forceLogoutIfNecessary(err, dispatch, getState) {
    const {currentUserId} = getState().entities.users;
    if (err.status_code === HTTP_UNAUTHORIZED && err.url.indexOf('/login') === -1 && currentUserId) {
        Client4.setToken('');
        dispatch({type: UserTypes.LOGOUT_SUCCESS});
    }
}

function dispatcher(type, data, dispatch, getState) {
    if (type.indexOf('SUCCESS') === -1) { // we don't want to pass the data for the request types
        dispatch(requestSuccess(type, data), getState);
    } else {
        dispatch(requestData(type), getState);
    }
}

export function requestData(type) {
    return {
        type
    };
}

export function requestSuccess(type, data) {
    return {
        type,
        data
    };
}

export function requestFailure(type, error) {
    return {
        type,
        error
    };
}

export function bindClientFunc(clientFunc, request, success, failure, ...args) {
    return async (dispatch, getState) => {
        dispatch(requestData(request), getState);

        let data = null;
        try {
            data = await clientFunc(...args);
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch, getState);
            dispatch(batchActions([
                requestFailure(failure, error),
                logError(error)(dispatch)
            ]), getState);
            return {data: null, error};
        }

        if (Array.isArray(success)) {
            success.forEach((s) => {
                dispatcher(s, data, dispatch, getState);
            });
        } else {
            dispatcher(success, data, dispatch, getState);
        }

        return {data, error: null};
    };
}

// Debounce function based on underscores modified to use es6 and a cb
export function debounce(func, wait, immediate, cb) {
    let timeout;
    return function fx(...args) {
        const runLater = () => {
            timeout = null;
            if (!immediate) {
                Reflect.apply(func, this, args);
                if (cb) {
                    cb();
                }
            }
        };
        const callNow = immediate && !timeout;
        clearTimeout(timeout);
        timeout = setTimeout(runLater, wait);
        if (callNow) {
            Reflect.apply(func, this, args);
            if (cb) {
                cb();
            }
        }
    };
}

export class FormattedError extends Error {
    constructor(id, defaultMessage, values = {}) {
        super(defaultMessage);
        this.intl = {
            id,
            defaultMessage,
            values
        };
    }
}
