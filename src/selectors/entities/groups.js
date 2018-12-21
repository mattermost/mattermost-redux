// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {createSelector} from 'reselect';

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

const getGroupSyncables = createSelector(
    (state) => state.entities.groups.syncables,
    (state, id) => id,
    (allSyncables, groupID) => {
        return allSyncables[groupID] || {
            teams: [],
            channels: [],
        };
    }
);

export const getGroupTeams = createSelector(
    getGroupSyncables,
    (groupSyncables) => {
        return groupSyncables.teams;
    }
);

export const getGroupChannels = createSelector(
    getGroupSyncables,
    (groupSyncables) => {
        return groupSyncables.channels;
    }
);

export const getGroupMembers = createSelector(
    (state) => state.entities.groups.members,
    (state, id) => id,
    (memberData, groupID) => {
        const groupMemberData = memberData[groupID];
        if (!groupMemberData) {
            return [];
        }
        return groupMemberData.members;
    }
);
