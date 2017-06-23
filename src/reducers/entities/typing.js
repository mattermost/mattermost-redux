// Copyright (c) 2017-present Mattermost, Inc. All Rights Reserved.
// See License.txt for license information.

import {WebsocketEvents} from 'constants';

export default function typing(state = {}, action) {
    const {
        data,
        type
    } = action;

    switch (type) {
    case WebsocketEvents.TYPING: {
        const {
            id,
            userId,
            now
        } = data;

        if (id && userId) {
            return {
                ...state,
                [id]: {
                    ...(state[id] || {}),
                    [userId]: now
                }
            };
        }

        return state;
    }
    case WebsocketEvents.STOP_TYPING: {
        const {
            id,
            userId,
            now
        } = data;

        if (state[id] && state[id][userId] <= now) {
            const nextState = {
                ...state,
                [id]: {...state[id]}
            };

            Reflect.deleteProperty(nextState[id], userId);

            if (Object.keys(nextState[id]).length === 0) {
                Reflect.deleteProperty(nextState, id);
            }

            return nextState;
        }

        return state;
    }

    default:
        return state;
    }
}
