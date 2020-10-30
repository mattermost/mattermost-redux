// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import {combineReducers} from 'redux';

import {AppsTypes} from 'action_types';
import {Binding, AppsState} from 'types/apps';
import {GenericAction} from 'types/actions';

function bindings(state: Binding[] = [], action: GenericAction): Binding[] {
    switch (action.type) {
    case AppsTypes.RECEIVED_APP_BINDINGS: {
        return action.data;
    }
    default:
        return state;
    }
}

export default (combineReducers({
    bindings,
}) as (b: AppsState, a: GenericAction) => AppsState);
