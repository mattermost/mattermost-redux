// Copyright (c) 2017-present Mattermost, Inc. All Rights Reserved.
// See License.txt for license information.

import {createSelector} from 'reselect';
import {getCurrentTeamId} from './teams';

export function getIncomingHooks(state) {
    return state.entities.integrations.incomingHooks;
}

export function getOutgoingHooks(state) {
    return state.entities.integrations.outgoingHooks;
}

export function getCommands(state) {
    return state.entities.integrations.commands;
}

export function getOAuthApps(state) {
    return state.entities.integrations.oauthApps;
}

/**
 * get outgoing hooks in current team
 */
export const getOutgoingHooksInCurrentTeam = createSelector(
    getCurrentTeamId,
    getOutgoingHooks,
    (teamId, hooks) => {
        return Object.values(hooks).filter((o) => o.teamId === teamId);
    }
);
