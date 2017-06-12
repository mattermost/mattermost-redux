// Copyright (c) 2017-present Mattermost, Inc. All Rights Reserved.
// See License.txt for license information.

import {createSelector} from 'reselect';

export function getIncomingHooks(state) {
    return state.entities.integrations.incomingHooks;
}

export function getOutgoingHooks(state) {
    return state.entities.integrations.outgoingHooks;
}

export function getCommands(state) {
    return state.entities.integrations.commands;
}

export const getCommandsAsArray = createSelector(
        getCommands,
        (commandsState) => {
            const commands = [];
            for (const id in commandsState) {
                if (commandsState.hasOwnProperty(id)) {
                    const command = commandsState[id];
                    commands.push(command);
                }
            }
            return commands;
        }
);
