// Copyright (c) 2016-present Mattermost, Inc. All Rights Reserved.
// See License.txt for license information.

import {combineReducers} from 'redux';
import {ChannelTypes, InternalTypes, UserTypes} from 'action_types';

function channelsLastFetch(state = {}, action) {
    const nextState = {...state};

    switch (action.type) {
    case InternalTypes.CHANNEL_LAST_FETCH_TIME: {
        const {data} = action;
        return {
            ...state,
            [data.id]: data.timestamp
        };
    }
    case ChannelTypes.LEAVE_CHANNEL: {
        if (action.data) {
            Reflect.deleteProperty(nextState, action.data.id);
            return nextState;
        }
        return state;
    }
    case UserTypes.LOGOUT_SUCCESS:
        return {};

    default:
        return state;
    }
}

export default combineReducers({

    // object where every key is the channel id and the value is the timestamp when it app last fetch the posts
    channelsLastFetch
});
