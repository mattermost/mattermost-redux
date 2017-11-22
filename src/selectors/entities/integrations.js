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

export function getExecutableCommands(state) {
    return state.entities.integrations.executableCommands;
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

export const getAllCommands = createSelector(
    getCommands,
    getExecutableCommands,
    (commands, executableCommands) => {
        return {
            ...commands,
            ...executableCommands
        };
    }
);

export const getAutocompleteCommandsList = createSelector(
    getAllCommands,
    getCurrentTeamId,
    (commands, currentTeamId) => {
        return Object.values(commands).filter((command) => {
            return command && (!command.team_id || command.team_id === currentTeamId) && command.auto_complete;
        }).sort((a, b) => a.display_name.localeCompare(b.display_name));
    }
);