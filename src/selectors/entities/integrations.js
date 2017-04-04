// Copyright (c) 2017 Mattermost, Inc. All Rights Reserved.
// See License.txt for license information.

export function getIncomingHooks(state) {
    return state.entities.integrations.incomingHooks;
}

export function getOutgoingHooks(state) {
    return state.entities.integrations.outgoingHooks;
}
