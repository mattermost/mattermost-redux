// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {combineReducers} from 'redux';
import {CloudTypes} from 'action_types';

import {GenericAction} from 'types/actions';
import {Subscription} from 'types/cloud';

function subscription(state: Subscription | null = null, action: GenericAction) {
    switch (action.type) {
    case CloudTypes.RECEIVED_CLOUD_SUBSCRIPTION: {
        return action.data;
    }
    default:
        return state;
    }
}

export default combineReducers({

    // represents the current cloud subscription
    subscription,
});
