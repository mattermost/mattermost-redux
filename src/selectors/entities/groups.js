// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

const emptyList = [];
const emptySyncables = {
    teams: [],
    channels: [],
};

export function getAllGroups(state) {
    return state.entities.groups.groups;
}

export function getGroup(state, id) {
    return getAllGroups(state)[id];
}

export function getGroupMemberCount(state, id) {
    const memberData = state.entities.groups.members;
    const groupMemberData = memberData[id];
    if (!groupMemberData) {
        return 0;
    }
    return memberData[id].totalMemberCount;
}

function getGroupSyncables(state, id) {
    return state.entities.groups.syncables[id] || emptySyncables;
}

export function getGroupTeams(state, id) {
    return getGroupSyncables(state, id).teams;
}

export function getGroupChannels(state, id) {
    return getGroupSyncables(state, id).channels;
}

export function getGroupMembers(state, id) {
    const groupMemberData = state.entities.groups.members[id];
    if (!groupMemberData) {
        return emptyList;
    }
    return groupMemberData.members;
}
