// @flow

import type {GlobalState} from './store';

export type GenericAction = {
    type: string,
    data: any,
    error?: any
};

export type ActionResult = {data: any} | {error: any};
export type GetStateFunc = () => GlobalState;
export type DispatchFunc = (GenericAction, ?GetStateFunc) => void;
export type ActionFunc = (DispatchFunc, GetStateFunc) => Promise<ActionResult>;
