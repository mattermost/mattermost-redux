// Copyright (c) 2017 Mattermost, Inc. All Rights Reserved.
// See License.txt for license information.

import {WebsocketEvents} from 'constants';

export default function typing(state = {}, action) {
    const {data, type} = action;
    switch (type) {
    case WebsocketEvents.TYPING: {
        const {id, userId} = data;

        if (id && userId) {
            return {
                ...state,
                [id]: {
                    ...state[id],
                    [userId]: true
                }
            };
        }
        return state;
    }
    case WebsocketEvents.STOP_TYPING: {
        const nextState = {...state};
        const {id, userId} = data;
        const users = {...nextState[id]};
        if (users) {
            Reflect.deleteProperty(users, userId);
        }

        nextState[id] = users;
        if (!Object.keys(nextState[id]).length) {
            Reflect.deleteProperty(nextState, id);
        }

        return nextState;
    }
    default:
        return state;
    }
}
