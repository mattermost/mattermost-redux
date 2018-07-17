// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {createSelector} from 'reselect';

import {General, Permissions} from 'constants';

import {
    getCurrentChannelId,
    getCurrentUser,
    getUsers,
    getMyChannelMemberships,
    getMyCurrentChannelMembership,
} from 'selectors/entities/common';
import {getConfig, getLicense, hasNewPermissions} from 'selectors/entities/general';
import {
    getFavoritesPreferences,
    getMyPreferences,
    getTeammateNameDisplaySetting,
    getVisibleTeammate,
    getVisibleGroupIds,
} from 'selectors/entities/preferences';
import {getLastPostPerChannel} from 'selectors/entities/posts';
import {getCurrentTeamId, getCurrentTeamMembership} from 'selectors/entities/teams';
import {haveICurrentChannelPermission} from 'selectors/entities/roles';
import {isCurrentUserSystemAdmin} from 'selectors/entities/users';

import {
    buildDisplayableChannelList,
    buildDisplayableChannelListWithUnreadSection,
    canManageMembersOldPermissions,
    completeDirectChannelInfo,
    completeDirectChannelDisplayName,
    getUserIdFromChannelName,
    isChannelMuted,
    getDirectChannelName,
    isAutoClosed,
    isDirectChannelVisible,
    isGroupChannelVisible,
    isGroupOrDirectChannelVisible,
    sortChannelsByDisplayName,
    sortChannelsByDisplayNameAndMuted,
    sortChannelsByRecency,
} from 'utils/channel_utils';
import {createIdsSelector} from 'utils/helpers';

export {
    getCurrentChannelId,
    getMyChannelMemberships,
    getMyCurrentChannelMembership,
};

export function getAllChannels(state) {
    return state.entities.channels.channels;
}

export function getAllChannelStats(state) {
    return state.entities.channels.stats;
}

export function getChannelsInTeam(state) {
    return state.entities.channels.channelsInTeam;
}

export const getDirectChannelsSet = createSelector(
    getChannelsInTeam,
    (channelsInTeam) => {
        return channelsInTeam[''] || new Set();
    }
);

export function getChannelMembersInChannels(state) {
    return state.entities.channels.membersInChannel;
}

export const mapAndSortChannelIds = (channels, currentUser, myMembers, lastPosts, sorting) => {
    const locale = currentUser.locale || General.DEFAULT_LOCALE;

    if (sorting === 'recent') {
        channels.sort((a, b) => {
            return sortChannelsByRecency(lastPosts, a, b);
        });
    } else {
        channels.sort(sortChannelsByDisplayNameAndMuted.bind(null, locale, myMembers));
    }

    return channels.map((c) => c.id);
};

export const mapAndSortUnreadChannelIds = (channels, currentUser, myMembers, lastPosts, lastUnreadChannel, sorting) => {
    const locale = currentUser.locale || General.DEFAULT_LOCALE;

    channels.sort((a, b) => {
        const aMember = myMembers[a.id];
        const bMember = myMembers[b.id];
        const aIsMention = a.type === General.DM_CHANNEL || (aMember && aMember.mention_count > 0);
        let bIsMention = b.type === General.DM_CHANNEL || (bMember && bMember.mention_count > 0);

        if (lastUnreadChannel && b.id === lastUnreadChannel.id && lastUnreadChannel.hadMentions) {
            bIsMention = true;
        }

        if (aIsMention === bIsMention && isChannelMuted(bMember) === isChannelMuted(aMember)) {
            if (sorting === 'recent') {
                return sortChannelsByRecency(lastPosts, a, b);
            }
            return sortChannelsByDisplayName(locale, a, b);
        } else if (aIsMention || (isChannelMuted(bMember) && !isChannelMuted(aMember))) {
            return -1;
        }

        return 1;
    });

    return channels.map((c) => c.id);
};

export function filterChannels(unreadIds, favoriteIds, channelIds, unreadsAtTop, favoritesAtTop) {
    let channels = channelIds;

    if (unreadsAtTop) {
        channels = channels.filter((id) => {
            return !unreadIds.includes(id);
        });
    }

    if (favoritesAtTop) {
        channels = channels.filter((id) => {
            return !favoriteIds.includes(id);
        });
    }

    return channels;
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

export const getCurrentChannelStats = createSelector(
    getAllChannelStats,
    getCurrentChannelId,
    (allChannelStats, currentChannelId) => {
        return allChannelStats[currentChannelId];
    }
);

export function isCurrentChannelReadOnly(state) {
    return isChannelReadOnly(state, getCurrentChannel(state));
}

export function isChannelReadOnlyById(state, channelId) {
    return isChannelReadOnly(state, getChannel(state, channelId));
}

export function isChannelReadOnly(state, channel) {
    return channel && channel.name === General.DEFAULT_CHANNEL &&
        !isCurrentUserSystemAdmin(state) && getConfig(state).ExperimentalTownSquareIsReadOnly === 'true';
}

export function shouldHideDefaultChannel(state, channel) {
    return channel && channel.name === General.DEFAULT_CHANNEL &&
        !isCurrentUserSystemAdmin(state) && getConfig(state).ExperimentalHideTownSquareinLHS === 'true';
}

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
        let locale = General.DEFAULT_LOCALE;
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
export const getAllDirectChannels = createSelector(
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
    getAllDirectChannels,
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

        return buildDisplayableChannelList(usersState, allChannels, myMembers, config, myPreferences, teammateNameDisplay, lastPosts);
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
    getAllChannels,
    getMyChannelMemberships,
    (channels, myMembers) => {
        let messageCount = 0;
        let mentionCount = 0;
        Object.keys(myMembers).forEach((channelId) => {
            const channel = channels[channelId];
            const m = myMembers[channelId];
            if (channel && m) {
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
    hasNewPermissions,
    (state) => haveICurrentChannelPermission(state, {permission: Permissions.MANAGE_PRIVATE_CHANNEL_MEMBERS}),
    (state) => haveICurrentChannelPermission(state, {permission: Permissions.MANAGE_PUBLIC_CHANNEL_MEMBERS}),
    (channel, user, teamMembership, channelMembership, config, license, newPermissions, managePrivateMembers, managePublicMembers) => {
        if (!channel) {
            return false;
        }

        if (channel.type === General.DM_CHANNEL ||
            channel.type === General.GM_CHANNEL ||
            channel.name === General.DEFAULT_CHANNEL) {
            return false;
        }

        if (newPermissions) {
            if (channel.type === General.OPEN_CHANNEL) {
                return managePublicMembers;
            } else if (channel.type === General.PRIVATE_CHANNEL) {
                return managePrivateMembers;
            }
            return true;
        }
        return canManageMembersOldPermissions(channel, user, teamMembership, channelMembership, config, license);
    }
);

export const getAllDirectChannelIds = createIdsSelector(
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
    getAllDirectChannelIds,
    (channels, direct) => {
        return [...channels, ...direct];
    }
);

export const getUnreadChannelIds = createIdsSelector(
    getAllChannels,
    getMyChannelMemberships,
    getChannelIdsForCurrentTeam,
    (state, lastUnreadChannel = null) => lastUnreadChannel,
    (channels, members, teamChannelIds, lastUnreadChannel) => {
        const unreadIds = teamChannelIds.filter((id) => {
            const c = channels[id];
            const m = members[id];

            if (c && m) {
                const chHasUnread = (c.total_msg_count - m.msg_count) > 0;
                const chHasMention = m.mention_count > 0;
                if ((m.notify_props && m.notify_props.mark_unread !== 'mention' && chHasUnread) || chHasMention) {
                    return true;
                }
            }
            return false;
        });

        if (lastUnreadChannel && !unreadIds.includes(lastUnreadChannel.id)) {
            unreadIds.push(lastUnreadChannel.id);
        }

        return unreadIds;
    }
);

export const getUnreadChannels = createIdsSelector(
    getCurrentUser,
    getUsers,
    getAllChannels,
    getMyChannelMemberships,
    getUnreadChannelIds,
    getTeammateNameDisplaySetting,
    (currentUser, profiles, channels, myMembers, unreadIds, settings) => {
        // If we receive an unread for a channel and then a mention the channel
        // won't be sorted correctly until we receive a message in another channel
        if (!currentUser) {
            return [];
        }

        const allUnreadChannels = unreadIds.filter((u) => u).map((id) => {
            const c = channels[id];

            if (c.type === General.DM_CHANNEL || c.type === General.GM_CHANNEL) {
                return completeDirectChannelDisplayName(currentUser.id, profiles, settings, c);
            }

            return c;
        });

        return allUnreadChannels;
    }
);

export const getMapAndSortedUnreadChannelIds = createIdsSelector(
    getUnreadChannels,
    getCurrentUser,
    getMyChannelMemberships,
    getLastPostPerChannel,
    (state, lastUnreadChannel = null) => lastUnreadChannel,
    (state, lastUnreadChannel, unreadsAtTop, favoritesAtTop, sorting = 'alpha') => sorting,
    mapAndSortUnreadChannelIds,
);

export const getSortedUnreadChannelIds = createIdsSelector(
    getUnreadChannelIds,
    getFavoritesPreferences,
    getMapAndSortedUnreadChannelIds,
    () => false,
    () => false,
    filterChannels,
);

// Favorites
export const getFavoriteChannels = createIdsSelector(
    getCurrentUser,
    getUsers,
    getAllChannels,
    getMyChannelMemberships,
    getFavoritesPreferences,
    getChannelIdsForCurrentTeam,
    getTeammateNameDisplaySetting,
    getConfig,
    getMyPreferences,
    getCurrentChannelId,
    (currentUser, profiles, channels, myMembers, favoriteIds, teamChannelIds, settings, config, prefs, currentChannelId) => {
        if (!currentUser) {
            return [];
        }

        const favoriteChannel = favoriteIds.filter((id) => {
            if (!myMembers[id] || !channels[id]) {
                return false;
            }

            const channel = channels[id];
            const otherUserId = getUserIdFromChannelName(currentUser.id, channel.name);
            if (channel.type === General.DM_CHANNEL && !isDirectChannelVisible(profiles[otherUserId] || otherUserId, config, prefs, channel, null, null, currentChannelId)) {
                return false;
            } else if (channel.type === General.GM_CHANNEL && !isGroupChannelVisible(config, prefs, channel)) {
                return false;
            }

            return teamChannelIds.includes(id);
        }).map((id) => {
            const c = channels[id];
            if (c.type === General.DM_CHANNEL || c.type === General.GM_CHANNEL) {
                return completeDirectChannelDisplayName(currentUser.id, profiles, settings, c);
            }

            return c;
        });

        return favoriteChannel;
    }
);

export const getFavoriteChannelIds = createIdsSelector(
    getFavoriteChannels,
    getCurrentUser,
    getMyChannelMemberships,
    getLastPostPerChannel,
    (state, lastUnreadChannel, unreadsAtTop, favoritesAtTop, sorting = 'alpha') => sorting,
    mapAndSortChannelIds,
);

export const getSortedFavoriteChannelIds = createIdsSelector(
    getUnreadChannelIds,
    getFavoritesPreferences,
    getFavoriteChannelIds,
    (state, lastUnreadChannel, unreadsAtTop = true) => unreadsAtTop,
    () => false,
    filterChannels,
);

// Public Channels
export const getPublicChannels = createSelector(
    getCurrentUser,
    getAllChannels,
    getMyChannelMemberships,
    getChannelIdsForCurrentTeam,
    (currentUser, channels, myMembers, teamChannelIds) => {
        if (!currentUser) {
            return [];
        }

        const publicChannels = teamChannelIds.filter((id) => {
            if (!myMembers[id]) {
                return false;
            }
            const channel = channels[id];
            return teamChannelIds.includes(id) && channel.type === General.OPEN_CHANNEL;
        }).map((id) => channels[id]);

        return publicChannels;
    },
);

export const getPublicChannelIds = createIdsSelector(
    getPublicChannels,
    getCurrentUser,
    getMyChannelMemberships,
    getLastPostPerChannel,
    (state, lastUnreadChannel, unreadsAtTop, favoritesAtTop, sorting = 'alpha') => sorting,
    mapAndSortChannelIds,
);

export const getSortedPublicChannelIds = createIdsSelector(
    getUnreadChannelIds,
    getFavoritesPreferences,
    getPublicChannelIds,
    (state, lastUnreadChannel, unreadsAtTop = true) => unreadsAtTop,
    (state, lastUnreadChannel, unreadsAtTop, favoritesAtTop = true) => favoritesAtTop,
    filterChannels,
);

// Private Channels
export const getPrivateChannels = createSelector(
    getCurrentUser,
    getAllChannels,
    getMyChannelMemberships,
    getChannelIdsForCurrentTeam,
    (currentUser, channels, myMembers, teamChannelIds) => {
        if (!currentUser) {
            return [];
        }

        const privateChannels = teamChannelIds.filter((id) => {
            if (!myMembers[id]) {
                return false;
            }
            const channel = channels[id];
            return teamChannelIds.includes(id) &&
                channel.type === General.PRIVATE_CHANNEL;
        }).map((id) => channels[id]);

        return privateChannels;
    }
);

export const getPrivateChannelIds = createIdsSelector(
    getPrivateChannels,
    getCurrentUser,
    getMyChannelMemberships,
    getLastPostPerChannel,
    (state, lastUnreadChannel, unreadsAtTop, favoritesAtTop, sorting = 'alpha') => sorting,
    mapAndSortChannelIds,
);

export const getSortedPrivateChannelIds = createIdsSelector(
    getUnreadChannelIds,
    getFavoritesPreferences,
    getPrivateChannelIds,
    (state, lastUnreadChannel, unreadsAtTop = true) => unreadsAtTop,
    (state, lastUnreadChannel, unreadsAtTop, favoritesAtTop = true) => favoritesAtTop,
    filterChannels,
);

// Direct Messages
export const getDirectChannels = createSelector(
    getCurrentUser,
    getUsers,
    getAllChannels,
    getMyChannelMemberships,
    getVisibleTeammate,
    getVisibleGroupIds,
    getTeammateNameDisplaySetting,
    getConfig,
    getMyPreferences,
    getLastPostPerChannel,
    getCurrentChannelId,
    (currentUser, profiles, channels, myMembers, teammates, groupIds, settings, config, preferences, lastPosts, currentChannelId) => {
        if (!currentUser) {
            return [];
        }

        const channelValues = Object.values(channels);
        const directChannelsIds = [];
        teammates.reduce((result, teammateId) => {
            const name = getDirectChannelName(currentUser.id, teammateId);
            const channel = channelValues.find((c) => c.name === name); //eslint-disable-line max-nested-callbacks
            if (channel) {
                const lastPost = lastPosts[channel.id];
                const otherUser = profiles[getUserIdFromChannelName(currentUser.id, channel.name)];
                if (!isAutoClosed(config, preferences, channel, lastPost ? lastPost.create_at : 0, otherUser ? otherUser.delete_at : 0, currentChannelId)) {
                    result.push(channel.id);
                }
            }
            return result;
        }, directChannelsIds);
        const directChannels = groupIds.filter((id) => {
            const channel = channels[id];
            if (channel) {
                const lastPost = lastPosts[channel.id];
                return !isAutoClosed(config, preferences, channels[id], lastPost ? lastPost.create_at : 0, currentChannelId);
            }

            return false;
        }).concat(directChannelsIds).map((id) => {
            const channel = channels[id];
            return completeDirectChannelDisplayName(currentUser.id, profiles, settings, channel);
        });

        return directChannels;
    }
);

export const getDirectChannelIds = createIdsSelector(
    getDirectChannels,
    getCurrentUser,
    getMyChannelMemberships,
    getLastPostPerChannel,
    (state, lastUnreadChannel, unreadsAtTop, favoritesAtTop, sorting = 'alpha') => sorting,
    mapAndSortChannelIds,
);

export const getSortedDirectChannelIds = createIdsSelector(
    getUnreadChannelIds,
    getFavoritesPreferences,
    getDirectChannelIds,
    (state, lastUnreadChannel, unreadsAtTop = true) => unreadsAtTop,
    (state, lastUnreadChannel, unreadsAtTop, favoritesAtTop = true) => favoritesAtTop,
    filterChannels,
);

export function getGroupOrDirectChannelVisibility(state, channelId) {
    return isGroupOrDirectChannelVisible(
        getChannel(state, channelId),
        getMyChannelMemberships(state),
        getConfig(state),
        getMyPreferences(state),
        getCurrentUser(state).id,
        getUsers(state),
        getLastPostPerChannel(state)
    );
}

const getAllActiveChannels = createSelector(
    getPublicChannels,
    getPrivateChannels,
    getDirectChannels,
    (
        publicChannels,
        privateChannels,
        directChannels,
    ) => {
        const allChannels = [
            ...publicChannels,
            ...privateChannels,
            ...directChannels,
        ];

        return allChannels;
    }
);

export const getAllChannelIds = createIdsSelector(
    getAllActiveChannels,
    getCurrentUser,
    getMyChannelMemberships,
    getLastPostPerChannel,
    (state, lastUnreadChannel, sorting = 'alpha') => sorting,
    mapAndSortChannelIds,
);

export const getOrderedChannelIds = (state, lastUnreadChannel, grouping, sorting, unreadsAtTop, favoritesAtTop) => {
    if (grouping === 'by_type') {
        const channels = [];

        channels.push({
            type: 'public',
            name: 'PUBLIC CHANNELS',
            items: getSortedPublicChannelIds(
                state,
                lastUnreadChannel,
                unreadsAtTop,
                favoritesAtTop,
                sorting,
            ),
        });

        channels.push({
            type: 'private',
            name: 'PRIVATE CHANNELS',
            items: getSortedPrivateChannelIds(
                state,
                lastUnreadChannel,
                unreadsAtTop,
                favoritesAtTop,
                sorting,
            ),
        });

        channels.push({
            type: 'direct',
            name: 'DIRECT MESSAGES',
            items: getSortedDirectChannelIds(
                state,
                lastUnreadChannel,
                unreadsAtTop,
                favoritesAtTop,
                sorting,
            ),
        });

        if (favoritesAtTop) {
            channels.unshift({
                type: 'favorite',
                name: 'FAVORITE CHANNELS',
                items: getSortedFavoriteChannelIds(
                    state,
                    lastUnreadChannel,
                    unreadsAtTop,
                    favoritesAtTop,
                    sorting,
                ),
            });
        }

        if (unreadsAtTop) {
            channels.unshift({
                type: 'unreads',
                name: 'UNREADS',
                items: getSortedUnreadChannelIds(
                    state,
                    lastUnreadChannel,
                    unreadsAtTop,
                    favoritesAtTop,
                    sorting,
                ),
            });
        }

        return channels;
    }

    // Combine all channel types
    let type = 'alpha';
    let name = 'CHANNELS';
    if (sorting === 'recent') {
        type = 'recent';
        name = 'RECENT ACTIVITY';
    }

    return [{
        type,
        name,
        items: getAllChannelIds(state, lastUnreadChannel, sorting),
    }];
};

// Added for backwards compatibility
// Can be removed once webapp includes new sidebar preferences

export const getSortedPublicChannelWithUnreadsIds = createIdsSelector(
    getUnreadChannelIds,
    getFavoritesPreferences,
    getPublicChannelIds,
    () => false, // keepUnreadIds
    (state, lastUnreadChannel, unreadsAtTop, favoritesAtTop = true) => favoritesAtTop,
    filterChannels,
);

export const getSortedPrivateChannelWithUnreadsIds = createIdsSelector(
    getUnreadChannelIds,
    getFavoritesPreferences,
    getPrivateChannelIds,
    () => false, // keepUnreadIds
    (state, lastUnreadChannel, unreadsAtTop, favoritesAtTop = true) => favoritesAtTop,
    filterChannels,
);

export const getSortedFavoriteChannelWithUnreadsIds = createIdsSelector(
    getUnreadChannelIds,
    getFavoritesPreferences,
    getFavoriteChannelIds,
    () => false, // keepUnreadIds
    () => false,
    filterChannels,
);

export const getSortedDirectChannelWithUnreadsIds = createIdsSelector(
    getUnreadChannelIds,
    getFavoritesPreferences,
    getDirectChannelIds,
    () => false, // keepUnreadIds
    (state, lastUnreadChannel, unreadsAtTop, favoritesAtTop = true) => favoritesAtTop,
    filterChannels,
);

