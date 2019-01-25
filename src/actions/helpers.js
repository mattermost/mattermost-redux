// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
// @flow

import {batchActions} from 'redux-batched-actions';
import {Client4} from 'client';
import {UserTypes} from 'action_types';
import {logError} from './errors';

import type {Client4Error} from 'types/client4';
import type {ActionFunc, GenericAction, DispatchFunc, GetStateFunc} from 'types/actions';
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

/**
 * Returns an ActionFunc which calls a specfied (client) function and
 * dispatches the specifed actions on request, success or failure.
 *
 * @export
 * @param {Object} obj                                       an object for destructirung required properties
 * @param {() => Promise<mixed>} obj.clientFunc              clientFunc to execute
 * @param {ActionType} obj.onRequest                         ActionType to dispatch on request
 * @param {(ActionType | Array<ActionType>)} obj.onSuccess   ActionType to dispatch on success
 * @param {ActionType} obj.onFailure                         ActionType to dispatch on failure
 * @param {...Array<any>} obj.params
 * @returns {ActionFunc} ActionFunc
 */
export function bindClientFunc({
    clientFunc,
    onRequest,
    onSuccess,
    onFailure,
    params = [],
}: {|
  clientFunc: () => Promise<mixed>,
  onRequest?: ActionType,
  onSuccess?: ActionType | Array<ActionType>,
  onFailure?: ActionType,
  params?: Array<any>,
|}): ActionFunc {
    return async (dispatch, getState) => {
        if (onRequest) {
            dispatch(requestData(onRequest), getState);
        }

        let data = null;
        try {
            data = await clientFunc(...params);
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch, getState);
            const actions = [logError(error)];
            if (onFailure) {
                actions.push(requestFailure(onFailure, error));
            }
            dispatch(batchActions(actions));
            return {error};
        }

        if (Array.isArray(onSuccess)) {
            onSuccess.forEach((s) => {
                dispatcher(s, data, dispatch, getState);
            });
        } else if (onSuccess) {
            dispatcher(onSuccess, data, dispatch, getState);
        }

        return {data};
    };
}

// Debounce function based on underscores modified to use es6 and a cb
export function debounce(func: (...args: any) => mixed, wait: number, immediate: boolean, cb: () => mixed) {
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
