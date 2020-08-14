// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {UserTypes} from 'action_types';

import {getCurrentUserId, getUsers} from 'selectors/entities/users';

import {ActionFunc, DispatchFunc, GetStateFunc, batchActions} from 'types/actions';

import {getKnownUsers} from './users';
import {Dictionary} from 'types/utilities';

export type WebsocketBroadcast = {
    omit_users: Dictionary<boolean>;
    user_id: string;
    channel_id: string;
    team_id: string;
}

export type WebSocketMessage = {
    event: string;
    data: any;
    broadcast: WebsocketBroadcast;
    seq: number;
}

export function removeNotVisibleUsers(): ActionFunc {
    return async (dispatch: DispatchFunc, getState: GetStateFunc) => {
        const state = getState();
        let knownUsers: Set<string>;
        try {
            const fetchResult = await dispatch(getKnownUsers());
            knownUsers = new Set((fetchResult as any).data);
        } catch (err) {
            return {error: err};
        }
        knownUsers.add(getCurrentUserId(state));

        const allUsers = Object.keys(getUsers(state));
        const usersToRemove = new Set(allUsers.filter((x) => !knownUsers.has(x)));

        const actions = [];
        for (const userToRemove of usersToRemove.values()) {
            actions.push({type: UserTypes.PROFILE_NO_LONGER_VISIBLE, data: {user_id: userToRemove}});
        }
        if (actions.length > 0) {
            dispatch(batchActions(actions));
        }

        return {data: true};
    };
}
