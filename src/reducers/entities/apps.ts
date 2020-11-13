// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import {combineReducers} from 'redux';

import {AppsTypes} from 'action_types';
import {AppBinding, AppsState} from 'types/apps';
import {GenericAction} from 'types/actions';

function bindings(state: AppBinding[] = [], action: GenericAction): AppBinding[] {
    switch (action.type) {
    case AppsTypes.RECEIVED_APP_BINDINGS: {
        if (action.data) {
            return action.data;
        }
        return [];
    }
    default:
        return state;
    }
}

export default (combineReducers({
    bindings,
}) as (b: AppsState, a: GenericAction) => AppsState);
