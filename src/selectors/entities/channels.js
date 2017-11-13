// Copyright (c) 2016-present Mattermost, Inc. All Rights Reserved.
// See License.txt for license information.

import {createSelector} from 'reselect';

import {getConfig, getLicense} from 'selectors/entities/general';
import {
    getFavoritesPreferences,
    getMyPreferences,
    getTeammateNameDisplaySetting,
    getVisibleTeammate,
    getVisibleGroupIds
} from 'selectors/entities/preferences';
import {getLastPostPerChannel} from 'selectors/entities/posts';
import {getCurrentTeamId, getCurrentTeamMembership} from 'selectors/entities/teams';
import {getCurrentUser, getUsers} from 'selectors/entities/users';
import {
    buildDisplayableChannelList,
    buildDisplayableChannelListWithUnreadSection,
    canManageMembers,
    completeDirectChannelInfo,
    completeDirectChannelDisplayName,
    sortChannelsByDisplayName,
    getDirectChannelName,
    isAutoClosed
} from 'utils/channel_utils';
import {createIdsSelector} from 'utils/helpers';

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

export function makeGetChannel() {
    return createSelector(
        getAllChannels,
        (state, props) => props.id,
        (state) => state.entities.users,
        getTeammateNameDisplaySetting,
        (allChannels, channelId, users, teammateNameDisplay) => {
            const channel = allChannels[channelId];
            if (channel) {
                return completeDirectChannelInfo(users, teammateNameDisplay, channel);
            }
            return channel;
        }
    );
}

export const getChannel = createSelector(
    getAllChannels,
    (state, id) => id,
    (state) => state.entities.users,
    getTeammateNameDisplaySetting,
    (allChannels, channelId, users, teammateNameDisplay) => {
        const channel = allChannels[channelId];
        if (channel) {
            return completeDirectChannelInfo(users, teammateNameDisplay, channel);
        }
        return channel;
    }
);

export const getCurrentChannel = createSelector(
    getAllChannels,
    getCurrentChannelId,
    (state) => state.entities.users,
    getTeammateNameDisplaySetting,
    (allChannels, currentChannelId, users, teammateNameDisplay) => {
        const channel = allChannels[currentChannelId];
        if (channel) {
            return completeDirectChannelInfo(users, teammateNameDisplay, channel);
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
        return channelsInTeam[currentTeamId] || [];
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
        if (currentUser && currentUser.locale) {
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

// Returns both DMs and GMs
export const getDirectChannels = createSelector(
    getAllChannels,
    getDirectChannelsSet,
    (state) => state.entities.users,
    getTeammateNameDisplaySetting,
    (channels, channelSet, users, teammateNameDisplay) => {
        const dmChannels = [];
        channelSet.forEach((c) => {
            dmChannels.push(completeDirectChannelInfo(users, teammateNameDisplay, channels[c]));
        });
        return dmChannels;
    }
);

// Returns only GMs
export const getGroupChannels = createSelector(
    getAllChannels,
    getDirectChannelsSet,
    (state) => state.entities.users,
    getTeammateNameDisplaySetting,
    (channels, channelSet, users, teammateNameDisplay) => {
        const gmChannels = [];
        channelSet.forEach((id) => {
            const channel = channels[id];
            if (channel.type === General.GM_CHANNEL) {
                gmChannels.push(completeDirectChannelInfo(users, teammateNameDisplay, channel));
            }
        });
        return gmChannels;
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
    getConfig,
    getMyPreferences,
    getTeammateNameDisplaySetting,
    (state) => state.entities.users,
    getLastPostPerChannel,
    (currentChannelId, channels, config, myPreferences, teammateNameDisplay, usersState, lastPosts) => {
        const allChannels = channels.map((c) => {
            const channel = {...c};
            channel.isCurrent = c.id === currentChannelId;
            return channel;
        });

        return buildDisplayableChannelList(usersState, allChannels, config, myPreferences, teammateNameDisplay, lastPosts);
    }
);

export const getChannelsWithUnreadSection = createSelector(
    getCurrentChannelId,
    getMyChannels,
    getMyChannelMemberships,
    getConfig,
    getMyPreferences,
    getTeammateNameDisplaySetting,
    (state) => state.entities.users,
    getLastPostPerChannel,
    (currentChannelId, channels, myMembers, config, myPreferences, teammateNameDisplay, usersState, lastPosts) => {
        const allChannels = channels.map((c) => {
            const channel = {...c};
            channel.isCurrent = c.id === currentChannelId;
            return channel;
        });

        return buildDisplayableChannelListWithUnreadSection(usersState, allChannels, myMembers, config, myPreferences, teammateNameDisplay, lastPosts);
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
    getCurrentUser,
    getCurrentTeamMembership,
    getMyCurrentChannelMembership,
    getConfig,
    getLicense,
    canManageMembers
);

export const getDirectChannelIds = createIdsSelector(
    getDirectChannelsSet,
    (directIds) => {
        return Array.from(directIds);
    }
);

export const getChannelIdsInCurrentTeam = createIdsSelector(
    getCurrentTeamId,
    getChannelsInTeam,
    (currentTeamId, channelsInTeam) => {
        return Array.from(channelsInTeam[currentTeamId] || []);
    }
);

export const getChannelIdsForCurrentTeam = createIdsSelector(
    getChannelIdsInCurrentTeam,
    getDirectChannelIds,
    (channels, direct) => {
        return [...channels, ...direct];
    }
);

export const getUnreadChannelIds = createIdsSelector(
    getAllChannels,
    getMyChannelMemberships,
    getChannelIdsForCurrentTeam,
    (channels, members, teamChannelIds) => {
        return teamChannelIds.filter((id) => {
            const c = channels[id];
            const m = members[id];

            if (c && m) {
                if (m.notify_props && m.notify_props.mark_unread !== 'mention' && c.total_msg_count - m.msg_count > 0) {
                    return true;
                }
            }
            return false;
        });
    }
);

export const getSortedUnreadChannelIds = createIdsSelector(
    getCurrentUser,
    getUsers,
    getAllChannels,
    getMyChannelMemberships,
    getUnreadChannelIds,
    getTeammateNameDisplaySetting,
    (currentUser, profiles, channels, members, unreadIds, settings) => {
        // If we receive an unread for a channel and then a mention the channel
        // won't be sorted correctly until we receive a message in another channel
        if (!currentUser) {
            return [];
        }

        const locale = currentUser.locale || 'en';
        const allUnreadChannels = unreadIds.map((id) => {
            const c = channels[id];
            if (c.type === General.DM_CHANNEL || c.type === General.GM_CHANNEL) {
                return completeDirectChannelDisplayName(currentUser.id, profiles, settings, c);
            }

            return c;
        }).sort((a, b) => {
            const aMember = members[a.id];
            const bMember = members[b.id];

            const aIsMention = a.type === General.DM_CHANNEL || (aMember && aMember.mention_count > 0);
            const bIsMention = b.type === General.DM_CHANNEL || (bMember && bMember.mention_count > 0);

            if (aIsMention === bIsMention) {
                return sortChannelsByDisplayName(locale, a, b);
            } else if (aIsMention) {
                return -1;
            }

            return 1;
        });

        return allUnreadChannels.map((c) => c.id);
    }
);

export const getSortedFavoriteChannelIds = createIdsSelector(
    getCurrentUser,
    getUsers,
    getAllChannels,
    getMyChannelMemberships,
    getFavoritesPreferences,
    getChannelIdsForCurrentTeam,
    getUnreadChannelIds,
    getTeammateNameDisplaySetting,
    (currentUser, profiles, channels, myMembers, favoriteIds, teamChannelIds, unreadIds, settings) => {
        if (!currentUser) {
            return [];
        }

        const locale = currentUser.locale || 'en';
        const favoriteChannel = favoriteIds.filter((id) => {
            if (!myMembers[id]) {
                return false;
            }

            return !unreadIds.includes(id) && teamChannelIds.includes(id);
        }).map((id) => {
            const c = channels[id];
            if (c.type === General.DM_CHANNEL || c.type === General.GM_CHANNEL) {
                return completeDirectChannelDisplayName(currentUser.id, profiles, settings, c);
            }

            return c;
        }).sort(sortChannelsByDisplayName.bind(null, locale));
        return favoriteChannel.map((f) => f.id);
    }
);

export const getSortedPublicChannelIds = createIdsSelector(
    getCurrentUser,
    getAllChannels,
    getMyChannelMemberships,
    getChannelIdsForCurrentTeam,
    getUnreadChannelIds,
    getSortedFavoriteChannelIds,
    (currentUser, channels, myMembers, teamChannelIds, unreadIds, favoriteIds) => {
        if (!currentUser) {
            return [];
        }

        const locale = currentUser.locale || 'en';
        const publicChannels = teamChannelIds.filter((id) => {
            if (!myMembers[id]) {
                return false;
            }
            const channel = channels[id];
            return !unreadIds.includes(id) && !favoriteIds.includes(id) &&
                teamChannelIds.includes(id) && channel.type === General.OPEN_CHANNEL;
        }).map((id) => channels[id]).sort(sortChannelsByDisplayName.bind(null, locale));
        return publicChannels.map((c) => c.id);
    }
);

export const getSortedPrivateChannelIds = createIdsSelector(
    getCurrentUser,
    getAllChannels,
    getMyChannelMemberships,
    getChannelIdsForCurrentTeam,
    getUnreadChannelIds,
    getSortedFavoriteChannelIds,
    (currentUser, channels, myMembers, teamChannelIds, unreadIds, favoriteIds) => {
        if (!currentUser) {
            return [];
        }

        const locale = currentUser.locale || 'en';
        const publicChannels = teamChannelIds.filter((id) => {
            if (!myMembers[id]) {
                return false;
            }
            const channel = channels[id];
            return !unreadIds.includes(id) && !favoriteIds.includes(id) &&
                teamChannelIds.includes(id) && channel.type === General.PRIVATE_CHANNEL;
        }).map((id) => channels[id]).sort(sortChannelsByDisplayName.bind(null, locale));
        return publicChannels.map((c) => c.id);
    }
);

export const getSortedDirectChannelIds = createIdsSelector(
    getCurrentUser,
    getUsers,
    getAllChannels,
    getVisibleTeammate,
    getVisibleGroupIds,
    getUnreadChannelIds,
    getSortedFavoriteChannelIds,
    getTeammateNameDisplaySetting,
    getConfig,
    getMyPreferences,
    getLastPostPerChannel,
    (currentUser, profiles, channels, teammates, groupIds, unreadIds, favoriteIds, settings, config, preferences, lastPosts) => {
        if (!currentUser) {
            return [];
        }

        const locale = currentUser.locale || 'en';
        const channelValues = Object.values(channels);
        const directChannelsIds = [];
        teammates.reduce((result, teammateId) => {
            const name = getDirectChannelName(currentUser.id, teammateId);
            const channel = channelValues.find((c) => c.name === name); //eslint-disable-line max-nested-callbacks
            if (channel) {
                const lastPost = lastPosts[channel.id];
                if (!unreadIds.includes(channel.id) && !favoriteIds.includes(channel.id) && !isAutoClosed(config, preferences, channel, lastPost ? lastPost.create_at : 0)) {
                    result.push(channel.id);
                }
            }
            return result;
        }, directChannelsIds);
        const directChannels = groupIds.filter((id) => {
            const channel = channels[id];
            if (channel) {
                const lastPost = lastPosts[channel.id];
                return !unreadIds.includes(id) && !favoriteIds.includes(id) && !isAutoClosed(config, preferences, channels[id], lastPost ? lastPost.create_at : 0);
            }

            return false;
        }).concat(directChannelsIds).map((id) => {
            const channel = channels[id];
            return completeDirectChannelDisplayName(currentUser.id, profiles, settings, channel);
        }).sort(sortChannelsByDisplayName.bind(null, locale));
        return directChannels.map((c) => c.id);
    }
);
