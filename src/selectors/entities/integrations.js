// Copyright (c) 2017-present Mattermost, Inc. All Rights Reserved.
// See License.txt for license information.

export function getIncomingHooks(state) {
    return state.entities.integrations.incomingHooks;
}

export function getOutgoingHooks(state) {
    return state.entities.integrations.outgoingHooks;
}

export function getCommands(state) {
    return state.entities.integrations.commands;
}
