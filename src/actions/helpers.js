// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
// @flow

import {batchActions} from 'redux-batched-actions';
import {Client4} from 'client';
import {UserTypes} from 'action_types';
import {logError} from './errors';

import type {Client4Error} from '../types/errors';
import type {GenericAction, ActionResult, DispatchFunc, GetStateFunc} from '../types/actions';
type ActionType = string;

const HTTP_UNAUTHORIZED = 401;

export function forceLogoutIfNecessary(err: Client4Error, dispatch: DispatchFunc, getState: GetStateFunc) {
    const {currentUserId} = getState().entities.users;
    if (err.status_code === HTTP_UNAUTHORIZED && err.url && err.url.indexOf('/login') === -1 && currentUserId) {
        Client4.setToken('');
        dispatch({type: UserTypes.LOGOUT_SUCCESS, data: {}});
    }
}

function dispatcher(type: ActionType, data: any, dispatch: DispatchFunc, getState: GetStateFunc) {
    if (type.indexOf('SUCCESS') === -1) { // we don't want to pass the data for the request types
        dispatch(requestSuccess(type, data), getState);
    } else {
        dispatch(requestData(type), getState);
    }
}

export function requestData(type: ActionType): GenericAction {
    return {
        type,
        data: null,
    };
}

export function requestSuccess(type: ActionType, data: any) {
    return {
        type,
        data,
    };
}

export function requestFailure(type: ActionType, error: Client4Error) {
    return {
        type,
        error,
    };
}

export function bindClientFunc(clientFunc: () => Promise<mixed>, request: ActionType,
    success: ActionType | Array<ActionType>, failure: ActionType, ...args: Array<any>) {
    return async (dispatch: DispatchFunc, getState: GetStateFunc): Promise<ActionResult> => {
        dispatch(requestData(request), getState);

        let data = null;
        try {
            data = await clientFunc(...args);
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch, getState);
            dispatch(batchActions([
                requestFailure(failure, error),
                logError(error)(dispatch),
            ]), getState);
            return {error};
        }

        if (Array.isArray(success)) {
            success.forEach((s) => {
                dispatcher(s, data, dispatch, getState);
            });
        } else {
            dispatcher(success, data, dispatch, getState);
        }

        return {data};
    };
}

// Debounce function based on underscores modified to use es6 and a cb
export function debounce(func: () => mixed, wait: number, immediate: boolean, cb: () => mixed) {
    let timeout;
    return function fx(...args: Array<any>) {
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
        if (timeout) {
            clearTimeout(timeout);
        }
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
    intl: {
      id: string,
      defaultMessage: string,
      values: Object
    }

    constructor(id: string, defaultMessage: string, values: Object = {}) {
        super(defaultMessage);
        this.intl = {
            id,
            defaultMessage,
            values,
        };
    }
}
