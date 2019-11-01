// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import * as reselect from 'reselect';
import {GlobalState} from 'types/store';
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

const teamGroupIDs = (state: GlobalState, teamID) => (state.entities.teams.groupsAssociatedToTeam[teamID] == null ? undefined : state.entities.teams.groupsAssociatedToTeam[teamID].ids == null ? undefined : state.entities.teams.groupsAssociatedToTeam[teamID].ids) || [];

const channelGroupIDs = (state: GlobalState, channelID) => (state.entities.channels.groupsAssociatedToChannel[channelID] == null ? undefined : state.entities.channels.groupsAssociatedToChannel[channelID].ids == null ? undefined : state.entities.channels.groupsAssociatedToChannel[channelID].ids) || [];

const getTeamGroupIDSet = reselect.createSelector(
    teamGroupIDs,
    (teamIDs) => new Set(teamIDs),
);

const getChannelGroupIDSet = reselect.createSelector(
    channelGroupIDs,
    (channelIDs) => new Set(channelIDs),
);

export const getGroupsNotAssociatedToTeam = reselect.createSelector(
    getAllGroups,
    (state, teamID) => getTeamGroupIDSet(state, teamID),
    (allGroups, teamGroupIDSet) => {
        return Object.entries(allGroups).filter(([groupID]) => !teamGroupIDSet.has(groupID)).map((entry) => entry[1]);
    }
);

export const getGroupsAssociatedToTeam = reselect.createSelector(
    getAllGroups,
    (state, teamID) => getTeamGroupIDSet(state, teamID),
    (allGroups, teamGroupIDSet) => {
        return Object.entries(allGroups).filter(([groupID]) => teamGroupIDSet.has(groupID)).map((entry) => entry[1]);
    }
);

export const getGroupsNotAssociatedToChannel = reselect.createSelector(
    getAllGroups,
    (state, channelID) => getChannelGroupIDSet(state, channelID),
    (allGroups, channelGroupIDSet) => {
        return Object.entries(allGroups).filter(([groupID]) => !channelGroupIDSet.has(groupID)).map((entry) => entry[1]);
    }
);

export const getGroupsAssociatedToChannel = reselect.createSelector(
    getAllGroups,
    (state, channelID) => getChannelGroupIDSet(state, channelID),
    (allGroups, channelGroupIDSet) => {
        return Object.entries(allGroups).filter(([groupID]) => channelGroupIDSet.has(groupID)).map((entry) => entry[1]);
    }
);
