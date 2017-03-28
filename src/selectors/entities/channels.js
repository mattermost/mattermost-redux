// Copyright (c) 2016 Mattermost, Inc. All Rights Reserved.
// See License.txt for license information.

import {createSelector} from 'reselect';
import {getCurrentTeamId, getCurrentTeamMembership} from 'selectors/entities/teams';
import {getCurrentUserId, getUsers} from 'selectors/entities/users';
import {buildDisplayableChannelList, getNotMemberChannels, completeDirectChannelInfo} from 'utils/channel_utils';
import {General} from 'constants';

function getAllChannels(state) {
    return state.entities.channels.channels;
}

function getAllChannelStats(state) {
    return state.entities.channels.stats;
}

export function getCurrentChannelId(state) {
    return state.entities.channels.currentChannelId;
}

export function getChannelMemberships(state) {
    return state.entities.channels.myMembers;
}

export const getCurrentChannel = createSelector(
    getAllChannels,
    getCurrentChannelId,
    (state) => state.entities.users,
    (state) => state.entities.preferences.myPreferences,
    (allChannels, currentChannelId, users, myPreferences) => {
        const channel = allChannels[currentChannelId];
        if (channel) {
            return completeDirectChannelInfo(users, myPreferences, channel);
        }
        return channel;
    }
);

export const getCurrentChannelMembership = createSelector(
    getCurrentChannelId,
    getChannelMemberships,
    (currentChannelId, channelMemberships) => {
        return channelMemberships[currentChannelId] || {};
    }
);

export const getCurrentChannelStats = createSelector(
    getAllChannelStats,
    getCurrentChannelId,
    (allChannelStats, currentChannelId) => {
        return allChannelStats[currentChannelId];
    }
);

export const getChannelsOnCurrentTeam = createSelector(
    getAllChannels,
    getCurrentTeamId,
    (allChannels, currentTeamId) => {
        const channels = [];

        for (const channel of Object.values(allChannels)) {
            if (channel.team_id === currentTeamId || channel.team_id === '') {
                channels.push(channel);
            }
        }

        return channels;
    }
);

export const getChannelsByCategory = createSelector(
    getCurrentChannelId,
    getChannelsOnCurrentTeam,
    (state) => state.entities.channels.myMembers,
    (state) => state.entities.users,
    (state) => state.entities.preferences.myPreferences,
    (currentChannelId, channels, myMembers, usersState, myPreferences) => {
        const allChannels = channels.map((c) => {
            const channel = {...c};
            channel.isCurrent = c.id === currentChannelId;
            return channel;
        }).filter((c) => myMembers.hasOwnProperty(c.id));

        return buildDisplayableChannelList(usersState, allChannels, myPreferences);
    }
);

export const getDefaultChannel = createSelector(
    getAllChannels,
    getCurrentTeamId,
    (channels, teamId) => {
        return Object.values(channels).find((c) => c.team_id === teamId && c.name === General.DEFAULT_CHANNEL);
    }
);

export const getMoreChannels = createSelector(
    getAllChannels,
    getChannelMemberships,
    (allChannels, myMembers) => {
        return getNotMemberChannels(Object.values(allChannels), myMembers);
    }
);

export const getUnreads = createSelector(
    getCurrentChannelId,
    getAllChannels,
    getChannelMemberships,
    (currentChannelId, channels, myMembers) => {
        let messageCount = 0;
        let mentionCount = 0;
        Object.keys(myMembers).forEach((channelId) => {
            const channel = channels[channelId];
            const m = myMembers[channelId];
            if (channel && m && channel.id !== currentChannelId) {
                if (channel.type === 'D') {
                    mentionCount += channel.total_msg_count - m.msg_count;
                } else if (m.mention_count > 0) {
                    mentionCount += m.mention_count;
                }
                if (m.notify_props && m.notify_props.mark_unread !== 'mention' && channel.total_msg_count - m.msg_count > 0) {
                    messageCount += 1;
                }
            }
        });

        return {messageCount, mentionCount};
    }
);

export const canManageChannelMembers = createSelector(
    getCurrentChannel,
    getCurrentChannelMembership,
    getCurrentTeamMembership,
    getUsers,
    getCurrentUserId,
    (channel, channelMembership, teamMembership, allUsers, currentUserId) => {
        const user = allUsers[currentUserId];
        const roles = `${channelMembership.roles} ${teamMembership.roles} ${user.roles}`;
        if (channel.type === General.DM_CHANNEL ||
            channel.type === General.GM_CHANNEL ||
            channel.name === General.DEFAULT_CHANNEL) {
            return false;
        }
        if (channel.type === General.OPEN_CHANNEL) {
            return true;
        }
        return roles.includes('_admin');
    }
);
