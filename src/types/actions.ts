// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import {GlobalState} from './store';

export type GetStateFunc = () => GlobalState;
export type GenericAction = {
    type: string;
    data?: any;
    meta?: any;
    error?: any;
    index?: number;
    displayable?: boolean;
    postId?: string;
    sessionId?: string;
    currentUserId?: string;
    remove?: Function|string[];
    timestamp?: number;
    [extraProps: string]: any;
};
type Thunk = (b: DispatchFunc, a: GetStateFunc) => Promise<ActionResult> | ActionResult;

type BatchAction = {
    type: 'BATCHING_REDUCER.BATCH';
    payload: Array<GenericAction>;
    meta: {
        batch: true;
    };
};
export type Action = GenericAction | Thunk | BatchAction | ActionFunc;

export type ActionResult = {
    data: any;
} | {
    error: any;
};

export type DispatchFunc = (action: Action, getState?: GetStateFunc | null) => Promise<ActionResult>;
export type ActionFunc = (dispatch: DispatchFunc, getState: GetStateFunc) => Promise<ActionResult|ActionResult[]>;
export type PlatformType = 'web' | 'ios' | 'android';

export const BATCH = 'BATCHING_REDUCER.BATCH';

export function batchActions(actions: Action[], type = BATCH) {
    return {type, meta: {batch: true}, payload: actions};
}

export function enableBatching(reduce) {
    return function batchingReducer(state, action) {
        if (action && action.meta && action.meta.batch) {
            return action.payload.reduce(batchingReducer, state);
        }
        return reduce(state, action);
    };
}

export function batchDispatchMiddleware(store_) {
    function dispatchChildActions(store, action) {
        if (action.meta && action.meta.batch) {
            action.payload.forEach((childAction) => {
                dispatchChildActions(store, childAction);
            });
        } else {
            store.dispatch(action);
        }
    }

    return (next) => {
        return (action) => {
            if (action && action.meta && action.meta.batch) {
                dispatchChildActions(store_, action);
            }
            return next(action);
        };
    };
}
