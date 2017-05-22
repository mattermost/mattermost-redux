// Copyright (c) 2016-present Mattermost, Inc. All Rights Reserved.
// See License.txt for license information.

import {createSelector} from 'reselect';
import {getMyPreferences} from 'selectors/entities/preferences';
import {getCurrentTeamId, getCurrentTeamMembership} from 'selectors/entities/teams';
import {getCurrentUser, getCurrentUserId, getUsers} from 'selectors/entities/users';
import {buildDisplayableChannelList, completeDirectChannelInfo, sortChannelsByDisplayName} from 'utils/channel_utils';
import {General} from 'constants';

export function getAllChannels(state) {
    return state.entities.channels.channels;
}

export function getAllChannelStats(state) {
    return state.entities.channels.stats;
}

export function getChannelsInTeam(state) {
    return state.entities.channels.channelsInTeam;
}

export function getDirectChannelsSet(state) {
    return state.entities.channels.channelsInTeam[''] || new Set();
}

export function getCurrentChannelId(state) {
    return state.entities.channels.currentChannelId;
}

export function getMyChannelMemberships(state) {
    return state.entities.channels.myMembers;
}

export function getChannelMembersInChannels(state) {
    return state.entities.channels.membersInChannel;
}

export const getChannel = createSelector(
    getAllChannels,
    (state, id) => id,
    (state) => state.entities.users,
    (state) => state.entities.preferences.myPreferences,
    (allChannels, channelId, users, myPreferences) => {
        const channel = allChannels[channelId];
        if (channel) {
            return completeDirectChannelInfo(users, myPreferences, channel);
        }
        return channel;
    }
);

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

export const getMyChannelMember = createSelector(
    getMyChannelMemberships,
    (state, channelId) => channelId,
    (channelMemberships, channelId) => {
        return channelMemberships[channelId] || {};
    }
);

export const getMyCurrentChannelMembership = createSelector(
    getCurrentChannelId,
    getMyChannelMemberships,
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

export const getChannelSetInCurrentTeam = createSelector(
    getCurrentTeamId,
    getChannelsInTeam,
    (currentTeamId, channelsInTeam) => {
        return channelsInTeam[currentTeamId];
    }
);

function sortAndInjectChannels(channels, channelSet, locale) {
    const currentChannels = [];
    if (typeof channelSet === 'undefined') {
        return currentChannels;
    }

    channelSet.forEach((c) => {
        currentChannels.push(channels[c]);
    });

    return currentChannels.sort(sortChannelsByDisplayName.bind(null, locale));
}

export const getChannelsInCurrentTeam = createSelector(
    getAllChannels,
    getChannelSetInCurrentTeam,
    getCurrentUser,
    (channels, currentTeamChannelSet, currentUser) => {
        let locale = 'en';
        if (currentUser) {
            locale = currentUser.locale;
        }
        return sortAndInjectChannels(channels, currentTeamChannelSet, locale);
    }
);

export const getChannelsNameMapInCurrentTeam = createSelector(
    getAllChannels,
    getChannelSetInCurrentTeam,
    (channels, currentTeamChannelSet) => {
        const channelMap = {};
        currentTeamChannelSet.forEach((id) => {
            const channel = channels[id];
            channelMap[channel.name] = channel;
        });
        return channelMap;
    }
);

export const getDirectChannels = createSelector(
    getAllChannels,
    getDirectChannelsSet,
    (channels, channelSet) => {
        const dmChannels = [];
        channelSet.forEach((c) => {
            dmChannels.push(channels[c]);
        });
        return dmChannels;
    }
);

export const getMyChannels = createSelector(
    getChannelsInCurrentTeam,
    getDirectChannels,
    getMyChannelMemberships,
    (channels, directChannels, myMembers) => {
        return [...channels, ...directChannels].filter((c) => myMembers.hasOwnProperty(c.id));
    }
);

export const getOtherChannels = createSelector(
    getChannelsInCurrentTeam,
    getMyChannelMemberships,
    (channels, myMembers) => {
        return channels.filter((c) => !myMembers.hasOwnProperty(c.id) && c.type === General.OPEN_CHANNEL);
    }
);

export const getChannelsByCategory = createSelector(
    getCurrentChannelId,
    getMyChannels,
    getMyPreferences,
    (state) => state.entities.users,
    (currentChannelId, channels, myPreferences, usersState) => {
        const allChannels = channels.map((c) => {
            const channel = {...c};
            channel.isCurrent = c.id === currentChannelId;
            return channel;
        });

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

export const getMembersInCurrentChannel = createSelector(
    getCurrentChannelId,
    getChannelMembersInChannels,
    (currentChannelId, members) => {
        return members[currentChannelId];
    }
);

export const getUnreads = createSelector(
    getCurrentChannelId,
    getAllChannels,
    getMyChannelMemberships,
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

export const getUnreadsInCurrentTeam = createSelector(
    getCurrentChannelId,
    getMyChannels,
    getMyChannelMemberships,
    (currentChannelId, channels, myMembers) => {
        let messageCount = 0;
        let mentionCount = 0;

        channels.forEach((channel) => {
            const m = myMembers[channel.id];
            if (m && channel.id !== currentChannelId) {
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
    getMyCurrentChannelMembership,
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
