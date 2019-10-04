// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
// @flow

import {combineReducers} from 'redux';
import {GeneralTypes} from 'action_types';

import {handleRequest, initialRequestState} from './helpers';

import type {GenericAction} from 'types/actions';
import type {GeneralRequestsStatuses, RequestStatusType} from 'types/requests';

function websocket(state: RequestStatusType = initialRequestState(), action: GenericAction): RequestStatusType {
    if (action.type === GeneralTypes.WEBSOCKET_CLOSED) {
        return initialRequestState();
    }

    return handleRequest(
        GeneralTypes.WEBSOCKET_REQUEST,
        GeneralTypes.WEBSOCKET_SUCCESS,
        GeneralTypes.WEBSOCKET_FAILURE,
        state,
        action
    );
}

export default (combineReducers({
    websocket,
}): (GeneralRequestsStatuses, GenericAction) => GeneralRequestsStatuses);
