// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {createSelector} from 'reselect';

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

const teamGroupIDs = (state, teamID) => state.entities.teams.groupsAssociatedToTeam[teamID] || [];

const channelGroupIDs = (state, channelID) => state.entities.channels.groupsAssociatedToChannel[channelID] || [];

const getTeamGroupIDSet = createSelector(
    teamGroupIDs,
    (teamIDs) => new Set(teamIDs),
);

const getChannelGroupIDSet = createSelector(
    channelGroupIDs,
    (channelIDs) => new Set(channelIDs),
);

export const getGroupsNotAssociatedToTeam = createSelector(
    getAllGroups,
    (state, teamID) => getTeamGroupIDSet(state, teamID),
    (allGroups, teamGroupIDSet) => {
        return Object.entries(allGroups).filter(([groupID]) => !teamGroupIDSet.has(groupID)).map((entry) => entry[1]);
    }
);

export const getGroupsAssociatedToTeam = createSelector(
    getAllGroups,
    (state, teamID) => getTeamGroupIDSet(state, teamID),
    (allGroups, teamGroupIDSet) => {
        return Object.entries(allGroups).filter(([groupID]) => teamGroupIDSet.has(groupID)).map((entry) => entry[1]);
    }
);

export const getGroupsNotAssociatedToChannel = createSelector(
    getAllGroups,
    (state, channelID) => getChannelGroupIDSet(state, channelID),
    (allGroups, channelGroupIDSet) => {
        return Object.entries(allGroups).filter(([groupID]) => !channelGroupIDSet.has(groupID)).map((entry) => entry[1]);
    }
);

export const getGroupsAssociatedToChannel = createSelector(
    getAllGroups,
    (state, channelID) => getChannelGroupIDSet(state, channelID),
    (allGroups, channelGroupIDSet) => {
        return Object.entries(allGroups).filter(([groupID]) => channelGroupIDSet.has(groupID)).map((entry) => entry[1]);
    }
);
