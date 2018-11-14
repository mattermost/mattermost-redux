// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {createSelector} from 'reselect';

export function getAllGroups(state) {
    return state.entities.groups.groups;
}

export const getGroup = createSelector(
    getAllGroups,
    (state, id) => id,
    (allGroups, groupID) => {
        return allGroups[groupID];
    }
);

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
        var groupMemberData = memberData[groupID];
        if (!groupMemberData) {
            return [];
        }
        return groupMemberData.members;
    }
);

export const getGroupMemberCount = createSelector(
    (state) => state.entities.groups.members,
    (state, id) => id,
    (memberData, groupID) => {
        var groupMemberData = memberData[groupID];
        if (!groupMemberData) {
            return 0;
        }
        return memberData[groupID].totalMemberCount;
    }
);