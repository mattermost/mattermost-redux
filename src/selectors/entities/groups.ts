// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import {Group} from 'types/groups';
import {filterGroupsMatchingTerm} from 'utils/group_utils';

import {getCurrentChannelId} from 'selectors/entities/common';
import {getCurrentChannel} from 'selectors/entities/channels';
import {getTeam, getCurrentTeam, getCurrentTeamId} from 'selectors/entities/teams';
import {UserMentionKey} from 'selectors/entities/users';

import {createSelector} from 'reselect';

import {GlobalState} from 'types/store';

import {Dictionary, NameMappedObjects} from 'types/utilities';

const emptySyncables = {
    teams: [],
    channels: [],
};

export function getAllGroups(state: GlobalState) {
    return state.entities.groups.groups;
}

export function getMyGroups(state: GlobalState) {
    return state.entities.groups.myGroups;
}

export function getAllGroupStats(state: GlobalState) {
    return state.entities.groups.stats;
}

export function getGroupStats(state: GlobalState, id: string) {
    return getAllGroupStats(state)[id] || {};
}

export function getGroup(state: GlobalState, id: string) {
    return getAllGroups(state)[id];
}

export function getGroupMemberCount(state: GlobalState, id: string) {
    return getGroupStats(state, id).total_member_count;
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

const teamGroupIDs = (state: GlobalState, teamID: string) => state.entities.teams.groupsAssociatedToTeam[teamID]?.ids || [];
const getTeamGroupIDSet = createSelector(
    teamGroupIDs,
    (teamIDs) => new Set(teamIDs),
);

const channelGroupIDs = (state: GlobalState, channelID: string) => state.entities.channels.groupsAssociatedToChannel[channelID]?.ids || [];
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

export const getGroupsNotAssociatedToChannel: (state: GlobalState, channelID: string, teamID: string) => Group[] = createSelector(
    getAllGroups,
    (state: GlobalState, channelID: string) => getChannelGroupIDSet(state, channelID),
    (state: GlobalState, _: string, teamID: string) => getTeam(state, teamID),
    (state: GlobalState, _: string, teamID: string) => getGroupsAssociatedToTeam(state, teamID),
    (allGroups, channelGroupIDSet, team, teamGroups) => {
        let result = Object.values(allGroups).filter((group) => !channelGroupIDSet.has(group.id));
        if (team.group_constrained) {
            const gids = teamGroups.map((group) => group.id);
            result = result.filter((group) => gids?.includes(group.id));
        }
        return result;
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

export const getGroupsAssociatedToCurrentTeamForReference: (state: GlobalState) => Group[] = createSelector(
    getAllGroups,
    (state: GlobalState) => getTeamGroupIDSet(state, getCurrentTeamId(state)),
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

export const getGroupsAssociatedToCurrentChannelForReference: (state: GlobalState) => Group[] = createSelector(
    getAllGroups,
    (state: GlobalState) => getChannelGroupIDSet(state, getCurrentChannelId(state)),
    (allGroups, channelGroupIDSet) => {
        return Object.entries(allGroups).filter(([groupID]) => channelGroupIDSet.has(groupID)).filter((entry) => (entry[1].allow_reference && entry[1].delete_at === 0)).map((entry) => entry[1]);
    },
);

export const getAllGroupsForReference: (state: GlobalState) => Group[] = createSelector(
    getAllGroups,
    (allGroups) => {
        return Object.entries(allGroups).filter((entry) => (entry[1].allow_reference && entry[1].delete_at === 0)).map((entry) => entry[1]);
    },
);

export const getMyAllowReferencedGroups: (state: GlobalState) => Group[] = createSelector(
    getMyGroups,
    (myGroups) => {
        return Object.values(myGroups).filter((group) => group.allow_reference && group.delete_at === 0);
    },
);

export const getMyGroupMentionKeys: (state: GlobalState) => UserMentionKey[] = createSelector(
    getMyAllowReferencedGroups,
    (groups: Array<Group>) => {
        const keys: UserMentionKey[] = [];
        groups.forEach((group) => keys.push({key: `@${group.name}`}));
        return keys;
    },
);

export const getGroupsForReferenceInCurrentChannel: (state: GlobalState) => Group[] = createSelector(
    getCurrentTeam,
    getCurrentChannel,
    getGroupsAssociatedToCurrentTeamForReference,
    getGroupsAssociatedToCurrentChannelForReference,
    getAllGroupsForReference,
    (team, channel, groupsFromTeam, groupsFromChannel, allGroups) => {
        let groupsForReference = [];
        if (team && team.group_constrained && channel && channel.group_constrained) {
            groupsForReference = groupsFromChannel.concat(groupsFromTeam.filter((item) => groupsFromChannel.indexOf(item) < 0));
        } else if (team && team.group_constrained) {
            groupsForReference = groupsFromTeam;
        } else if (channel && channel.group_constrained) {
            groupsForReference = groupsFromChannel;
        } else {
            groupsForReference = allGroups;
        }
        return groupsForReference;
    },
);

export const searchGroupsForReferenceInCurrentChannel: (state: GlobalState, term: string) => Group[] = createSelector(
    getGroupsForReferenceInCurrentChannel,
    (groups: Group[], term: string) => term,
    (groups: Group[], term: string) => {
        return filterGroupsMatchingTerm(groups, term);
    },
);

export const getGroupsForReferenceInCurrentChannelByMentionKey: (state: GlobalState) => Map<string, Group> = createSelector(
    getGroupsForReferenceInCurrentChannel,
    (groupsForReference: Group[]) => {
        return new Map(groupsForReference.map((group: Group) => [`@${group.name}`, group]));
    },
);

export const getGroupsForReferenceInCurrentChannelByName: (state: GlobalState) => NameMappedObjects<Group> = createSelector(
    getGroupsForReferenceInCurrentChannel,
    (groupsForReference) => {
        const groupsByName: Dictionary<Group> = {};
        groupsForReference.forEach((group) => {
            groupsByName[group.name] = group;
        });
        return groupsByName;
    },
);

export const getMyGroupsForReferenceInCurrentChannel: (state: GlobalState) => Group[] = createSelector(
    getMyGroups,
    getGroupsForReferenceInCurrentChannelByName,
    (myGroups, groups) => {
        return Object.values(myGroups).filter((group) => group.allow_reference && group.delete_at === 0 && groups[group.name]);
    },
);

export const getMyGroupMentionKeysInCurrentChannel: (state: GlobalState) => UserMentionKey[] = createSelector(
    getMyGroupsForReferenceInCurrentChannel,
    (groups: Array<Group>) => {
        const keys: UserMentionKey[] = [];
        groups.forEach((group) => keys.push({key: `@${group.name}`}));
        return keys;
    },
);
