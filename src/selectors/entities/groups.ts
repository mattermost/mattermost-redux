// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import {Permissions} from '../../constants';
import {Group} from 'types/groups';
import {filterGroupsMatchingTerm} from 'utils/group_utils';
import {getChannel} from 'selectors/entities/channels';
import {haveIChannelPermission} from 'selectors/entities/roles';
import {getTeam} from 'selectors/entities/teams';
import {UserMentionKey} from 'selectors/entities/users';

import {createSelector} from 'reselect';

import {GlobalState} from 'types/store';

const emptyList: any[] = [];
const emptySyncables = {
    teams: [],
    channels: [],
};

export function getAllGroups(state: GlobalState) {
    return state.entities.groups.groups;
}

export function getGroup(state: GlobalState, id: string) {
    return getAllGroups(state)[id];
}

export function getGroupMemberCount(state: GlobalState, id: string) {
    const memberData = state.entities.groups.members;
    const groupMemberData = memberData[id];
    if (!groupMemberData) {
        return 0;
    }
    return memberData[id].totalMemberCount;
}

function getGroupSyncables(state: GlobalState, id: string) {
    return state.entities.groups.syncables[id] || emptySyncables;
}

export function getGroupTeams(state: GlobalState, id: string) {
    return getGroupSyncables(state, id).teams;
}

export function getGroupChannels(state: GlobalState, id: string) {
    return getGroupSyncables(state, id).channels;
}

export function getGroupMembers(state: GlobalState, id: string) {
    const groupMemberData = state.entities.groups.members[id];
    if (!groupMemberData) {
        return emptyList;
    }
    return groupMemberData.members;
}

export function searchAssociatedGroupsForReferenceLocal(state: GlobalState, term: string, teamId: string, channelId: string): Array<Group> {
    if (!haveIChannelPermission(state, {
        permission: Permissions.USE_GROUP_MENTIONS,
        channel: channelId,
        team: teamId,
    })) {
        return emptyList;
    }

    const groups = getAssociatedGroupsForReference(state, teamId, channelId);
    if (!groups) {
        return emptyList;
    }
    const filteredGroups = filterGroupsMatchingTerm(groups, term);
    return filteredGroups;
}

export function getAssociatedGroupsForReference(state: GlobalState, teamId: string, channelId: string): Array<Group> {
    const team = getTeam(state, teamId);
    const channel = getChannel(state, channelId);

    if (!haveIChannelPermission(state, {
        permission: Permissions.USE_GROUP_MENTIONS,
        channel: channelId,
        team: teamId,
    })) {
        return emptyList;
    }

    let groupsForReference = [];
    if (team && team.group_constrained && channel && channel.group_constrained) {
        const groupsFromChannel = getGroupsAssociatedToChannelForReference(state, channelId);
        const groupsFromTeam = getGroupsAssociatedToTeamForReference(state, teamId);
        groupsForReference = groupsFromChannel.concat(groupsFromTeam.filter((item) => groupsFromChannel.indexOf(item) < 0));
    } else if (team && team.group_constrained) {
        groupsForReference = getGroupsAssociatedToTeamForReference(state, teamId);
    } else if (channel && channel.group_constrained) {
        groupsForReference = getGroupsAssociatedToChannelForReference(state, channelId);
    } else {
        groupsForReference = getAllAssociatedGroupsForReference(state);
    }
    return groupsForReference;
}

const teamGroupIDs = (state: GlobalState, teamID: string) => (state.entities.teams.groupsAssociatedToTeam[teamID] == null ? undefined : state.entities.teams.groupsAssociatedToTeam[teamID].ids == null ? undefined : state.entities.teams.groupsAssociatedToTeam[teamID].ids) || [];

const channelGroupIDs = (state: GlobalState, channelID: string) => (state.entities.channels.groupsAssociatedToChannel[channelID] == null ? undefined : state.entities.channels.groupsAssociatedToChannel[channelID].ids == null ? undefined : state.entities.channels.groupsAssociatedToChannel[channelID].ids) || [];

const getTeamGroupIDSet = createSelector(
    teamGroupIDs,
    (teamIDs) => new Set(teamIDs),
);

const getChannelGroupIDSet = createSelector(
    channelGroupIDs,
    (channelIDs) => new Set(channelIDs),
);

export const getGroupsNotAssociatedToTeam: (state: GlobalState, teamID: string) => Group[] = createSelector(
    getAllGroups,
    (state: GlobalState, teamID: string) => getTeamGroupIDSet(state, teamID),
    (allGroups, teamGroupIDSet) => {
        return Object.entries(allGroups).filter(([groupID]) => !teamGroupIDSet.has(groupID)).map((entry) => entry[1]);
    },
);

export const getGroupsAssociatedToTeam: (state: GlobalState, teamID: string) => Group[] = createSelector(
    getAllGroups,
    (state: GlobalState, teamID: string) => getTeamGroupIDSet(state, teamID),
    (allGroups, teamGroupIDSet) => {
        return Object.entries(allGroups).filter(([groupID]) => teamGroupIDSet.has(groupID)).map((entry) => entry[1]);
    },
);

export const getGroupsNotAssociatedToChannel: (state: GlobalState, channelID: string) => Group[] = createSelector(
    getAllGroups,
    (state: GlobalState, channelID: string) => getChannelGroupIDSet(state, channelID),
    (allGroups, channelGroupIDSet) => {
        return Object.entries(allGroups).filter(([groupID]) => !channelGroupIDSet.has(groupID)).map((entry) => entry[1]);
    },
);

export const getGroupsAssociatedToChannel: (state: GlobalState, channelID: string) => Group[] = createSelector(
    getAllGroups,
    (state: GlobalState, channelID: string) => getChannelGroupIDSet(state, channelID),
    (allGroups, channelGroupIDSet) => {
        return Object.entries(allGroups).filter(([groupID]) => channelGroupIDSet.has(groupID)).map((entry) => entry[1]);
    },
);

export const getGroupsAssociatedToTeamForReference: (state: GlobalState, teamID: string) => Group[] = createSelector(
    getAllGroups,
    (state: GlobalState, teamID: string) => getTeamGroupIDSet(state, teamID),
    (allGroups, teamGroupIDSet) => {
        return Object.entries(allGroups).filter(([groupID]) => teamGroupIDSet.has(groupID)).filter((entry) => (entry[1].allow_reference && entry[1].delete_at === 0)).map((entry) => entry[1]);
    },
);

export const getGroupsAssociatedToChannelForReference: (state: GlobalState, channelID: string) => Group[] = createSelector(
    getAllGroups,
    (state: GlobalState, channelID: string) => getChannelGroupIDSet(state, channelID),
    (allGroups, channelGroupIDSet) => {
        return Object.entries(allGroups).filter(([groupID]) => channelGroupIDSet.has(groupID)).filter((entry) => (entry[1].allow_reference && entry[1].delete_at === 0)).map((entry) => entry[1]);
    },
);

export const getAllAssociatedGroupsForReference: (state: GlobalState) => Group[] = createSelector(
    getAllGroups,
    (allGroups) => {
        return Object.entries(allGroups).filter((entry) => (entry[1].allow_reference && entry[1].delete_at === 0)).map((entry) => entry[1]);
    },
);

export const getCurrentUserGroupMentionKeys: (state: GlobalState) => UserMentionKey[] = createSelector(
    getAllAssociatedGroupsForReference,
    (groups: Array<Group>) => {
        const keys: UserMentionKey[] = [];
        groups.forEach((group) => keys.push({key: `@${group.name}`}));
        return keys;
    },
);
