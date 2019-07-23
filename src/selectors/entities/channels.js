// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
// @flow

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
import {getLastPostPerChannel, getAllPosts} from 'selectors/entities/posts';
import {getCurrentTeamId, getCurrentTeamMembership, getMyTeams, getTeamMemberships} from 'selectors/entities/teams';
import {haveICurrentChannelPermission, haveIChannelPermission, haveITeamPermission} from 'selectors/entities/roles';
import {isCurrentUserSystemAdmin, getCurrentUserId} from 'selectors/entities/users';

import {
    buildDisplayableChannelList,
    buildDisplayableChannelListWithUnreadSection,
    canManageMembersOldPermissions,
    completeDirectChannelInfo,
    completeDirectChannelDisplayName,
    getUserIdFromChannelName,
    getChannelByName as getChannelByNameHelper,
    isChannelMuted,
    getDirectChannelName,
    isAutoClosed,
    isDirectChannelVisible,
    isGroupChannelVisible,
    isGroupOrDirectChannelVisible,
    sortChannelsByDisplayName,
    isFavoriteChannel,
    isDefault,
    sortChannelsByRecency,
} from 'utils/channel_utils';
import {createIdsSelector} from 'utils/helpers';
import {getUserIdsInChannels} from './users';

export {
    getCurrentChannelId,
    getMyChannelMemberships,
    getMyCurrentChannelMembership,
};

import type {GlobalState} from 'types/store';
import type {Channel, ChannelStats, ChannelMembership} from 'types/channels';
import type {UsersState, UserProfile} from 'types/users';
import type {PreferenceType} from 'types/preferences';
import type {Post} from 'types/posts';
import type {TeamMembership, Team} from 'types/teams';
import type {NameMappedObjects, UserIDMappedObjects, IDMappedObjects, RelationOneToOne, RelationOneToMany} from 'types/utilities';

type SortingType = 'recent' | 'alpha';

export function getAllChannels(state: GlobalState): IDMappedObjects<Channel> {
    return state.entities.channels.channels;
}

export function getAllChannelStats(state: GlobalState): RelationOneToOne<Channel, ChannelStats> {
    return state.entities.channels.stats;
}

export function getChannelsInTeam(state: GlobalState): RelationOneToMany<Team, Channel> {
    return state.entities.channels.channelsInTeam;
}

export const getDirectChannelsSet: (GlobalState) => Set<string> = createSelector(
    getChannelsInTeam,
    (channelsInTeam: RelationOneToMany<Team, Channel>): Set<string> => {
        return new Set(channelsInTeam['']) || new Set();
    }
);

export function getChannelMembersInChannels(state: GlobalState): RelationOneToOne<Channel, UserIDMappedObjects<ChannelMembership>> {
    return state.entities.channels.membersInChannel;
}

function sortChannelsByRecencyOrAlpha(locale, lastPosts, sorting: SortingType, a, b) {
    if (sorting === 'recent') {
        return sortChannelsByRecency(lastPosts, a, b);
    }

    return sortChannelsByDisplayName(locale, a, b);
}

// mapAndSortChannelIds sorts channels, primarily by:
//   For all sections except unreads:
//     a. All other unread channels
//     b. Muted channels
//   For unreads section:
//     a. Non-muted channels with mentions
//     b. Muted channels with mentions
//     c. Remaining unread channels
//   And then secondary by alphabetical ("alpha") or chronological ("recency") order
export const mapAndSortChannelIds = (channels: Array<Channel>, currentUser: UserProfile, myMembers: RelationOneToOne<Channel, ChannelMembership>, lastPosts: RelationOneToOne<Channel, Post>, sorting: SortingType, sortMentionsFirst: boolean = false): Array<string> => {
    const locale = currentUser.locale || General.DEFAULT_LOCALE;

    const mutedChannelIds = channels.
        filter((channel) => isChannelMuted(myMembers[channel.id])).
        sort(sortChannelsByRecencyOrAlpha.bind(null, locale, lastPosts, sorting)).
        map((channel) => channel.id);

    let hasMentionedChannelIds = [];
    if (sortMentionsFirst) {
        hasMentionedChannelIds = channels.
            filter((channel) => {
                const member = myMembers[channel.id];
                return member && member.mention_count > 0 && !isChannelMuted(member);
            }).
            sort(sortChannelsByRecencyOrAlpha.bind(null, locale, lastPosts, sorting)).
            map((channel) => channel.id);
    }

    const otherChannelIds = channels.
        filter((channel) => {
            return !mutedChannelIds.includes(channel.id) && !hasMentionedChannelIds.includes(channel.id);
        }).
        sort(sortChannelsByRecencyOrAlpha.bind(null, locale, lastPosts, sorting)).
        map((channel) => channel.id);

    return sortMentionsFirst ? hasMentionedChannelIds.concat(mutedChannelIds, otherChannelIds) : otherChannelIds.concat(mutedChannelIds);
};

export function filterChannels(unreadIds: Array<string>, favoriteIds: Array<string>, channelIds: Array<string>, unreadsAtTop: boolean, favoritesAtTop: boolean): Array<string> {
    let channels: Array<string> = channelIds;

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

export function makeGetChannel(): (GlobalState, {id: string}) => Channel {
    return createSelector(
        getAllChannels,
        (state: GlobalState, props) => props.id,
        (state: GlobalState) => state.entities.users,
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

export const getChannel: (GlobalState, string) => Channel = createSelector(
    getAllChannels,
    (state: GlobalState, id: string): string => id,
    (state: GlobalState): UsersState => state.entities.users,
    getTeammateNameDisplaySetting,
    (allChannels: IDMappedObjects<Channel>, channelId: string, users: UsersState, teammateNameDisplay: string): Channel => {
        const channel = allChannels[channelId];
        if (channel) {
            return completeDirectChannelInfo(users, teammateNameDisplay, channel);
        }
        return channel;
    }
);

export const getCurrentChannel: (GlobalState) => Channel = createSelector(
    getAllChannels,
    getCurrentChannelId,
    (state: GlobalState): UsersState => state.entities.users,
    getTeammateNameDisplaySetting,
    (allChannels: IDMappedObjects<Channel>, currentChannelId: string, users: UsersState, teammateNameDisplay: string): Channel => {
        const channel = allChannels[currentChannelId];
        if (channel) {
            return completeDirectChannelInfo(users, teammateNameDisplay, channel);
        }
        return channel;
    }
);

export const getMyChannelMember: (GlobalState, string) => ?ChannelMembership = createSelector(
    getMyChannelMemberships,
    (state: GlobalState, channelId: string): string => channelId,
    (channelMemberships: RelationOneToOne<Channel, ChannelMembership>, channelId: string): ?ChannelMembership => {
        return channelMemberships[channelId] || null;
    }
);

export const getCurrentChannelStats: (GlobalState) => ChannelStats = createSelector(
    getAllChannelStats,
    getCurrentChannelId,
    (allChannelStats: RelationOneToOne<Channel, ChannelStats>, currentChannelId: string): ChannelStats => {
        return allChannelStats[currentChannelId];
    }
);

export const isCurrentChannelFavorite: (GlobalState) => boolean = createSelector(
    getMyPreferences,
    getCurrentChannelId,
    (preferences: {[string]: PreferenceType}, channelId: string): boolean => isFavoriteChannel(preferences, channelId),
);

export const isCurrentChannelMuted: (GlobalState) => boolean = createSelector(
    getMyCurrentChannelMembership,
    (membership: ?ChannelMembership): boolean => {
        if (!membership) {
            return false;
        }
        return isChannelMuted(membership);
    }
);

export const isCurrentChannelArchived: (GlobalState) => boolean = createSelector(
    getCurrentChannel,
    (channel: Channel): boolean => channel.delete_at !== 0,
);

export const isCurrentChannelDefault: (GlobalState) => boolean = createSelector(
    getCurrentChannel,
    (channel: Channel): boolean => isDefault(channel),
);

export function isCurrentChannelReadOnly(state: GlobalState): boolean {
    return isChannelReadOnly(state, getCurrentChannel(state));
}

export function isChannelReadOnlyById(state: GlobalState, channelId: string): boolean {
    return isChannelReadOnly(state, getChannel(state, channelId));
}

export function isChannelReadOnly(state: GlobalState, channel: Channel): boolean {
    return channel && channel.name === General.DEFAULT_CHANNEL &&
        !isCurrentUserSystemAdmin(state) && getConfig(state).ExperimentalTownSquareIsReadOnly === 'true';
}

export function shouldHideDefaultChannel(state: GlobalState, channel: Channel): boolean {
    return channel && channel.name === General.DEFAULT_CHANNEL &&
        !isCurrentUserSystemAdmin(state) && getConfig(state).ExperimentalHideTownSquareinLHS === 'true';
}

export function getChannelByName(state: GlobalState, channelName: string): ?Channel {
    return getChannelByNameHelper(getAllChannels(state), channelName);
}

export const getChannelSetInCurrentTeam: (GlobalState) => Array<string> = createSelector(
    getCurrentTeamId,
    getChannelsInTeam,
    (currentTeamId: string, channelsInTeam: RelationOneToMany<Team, Channel>): Array<string> => {
        return channelsInTeam[currentTeamId] || [];
    }
);

function sortAndInjectChannels(channels: IDMappedObjects<Channel>, channelSet: Array<string>, locale: string): Array<Channel> {
    const currentChannels = [];
    if (typeof channelSet === 'undefined') {
        return currentChannels;
    }

    channelSet.forEach((c) => {
        currentChannels.push(channels[c]);
    });

    return currentChannels.sort(sortChannelsByDisplayName.bind(null, locale));
}

export const getChannelsInCurrentTeam: (GlobalState) => Array<Channel> = createSelector(
    getAllChannels,
    getChannelSetInCurrentTeam,
    getCurrentUser,
    (channels: IDMappedObjects<Channel>, currentTeamChannelSet: Array<string>, currentUser: UserProfile): Array<Channel> => {
        let locale = General.DEFAULT_LOCALE;
        if (currentUser && currentUser.locale) {
            locale = currentUser.locale;
        }
        return sortAndInjectChannels(channels, currentTeamChannelSet, locale);
    }
);

export const getChannelsNameMapInTeam: (GlobalState, string) => NameMappedObjects<Channel> = createSelector(
    getAllChannels,
    getChannelsInTeam,
    (state: GlobalState, teamId: string): string => teamId,
    (channels: IDMappedObjects<Channel>, channelsInTeams: RelationOneToMany<Team, Channel>, teamId: string): NameMappedObjects<Channel> => {
        const channelsInTeam = channelsInTeams[teamId] || [];
        const channelMap = {};
        channelsInTeam.forEach((id) => {
            const channel = channels[id];
            channelMap[channel.name] = channel;
        });
        return channelMap;
    }
);

export const getChannelsNameMapInCurrentTeam: (GlobalState) => NameMappedObjects<Channel> = createSelector(
    getAllChannels,
    getChannelSetInCurrentTeam,
    (channels: IDMappedObjects<Channel>, currentTeamChannelSet: Array<string>): NameMappedObjects<Channel> => {
        const channelMap = {};
        currentTeamChannelSet.forEach((id) => {
            const channel = channels[id];
            channelMap[channel.name] = channel;
        });
        return channelMap;
    }
);

// Returns both DMs and GMs
export const getAllDirectChannels: (GlobalState) => Array<Channel> = createSelector(
    getAllChannels,
    getDirectChannelsSet,
    (state: GlobalState): UsersState => state.entities.users,
    getTeammateNameDisplaySetting,
    (channels: IDMappedObjects<Channel>, channelSet: Set<string>, users: UsersState, teammateNameDisplay: string): Array<Channel> => {
        const dmChannels = [];
        channelSet.forEach((c) => {
            dmChannels.push(completeDirectChannelInfo(users, teammateNameDisplay, channels[c]));
        });
        return dmChannels;
    }
);

// Returns only GMs
export const getGroupChannels: (GlobalState) => Array<Channel> = createSelector(
    getAllChannels,
    getDirectChannelsSet,
    (state: GlobalState): UsersState => state.entities.users,
    getTeammateNameDisplaySetting,
    (channels: IDMappedObjects<Channel>, channelSet: Set<string>, users: UsersState, teammateNameDisplay: string): Array<Channel> => {
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

export const getMyChannels: (GlobalState) => Array<Channel> = createSelector(
    getChannelsInCurrentTeam,
    getAllDirectChannels,
    getMyChannelMemberships,
    (channels: Array<Channel>, directChannels: Array<Channel>, myMembers: RelationOneToOne<Channel, ChannelMembership>): Array<Channel> => {
        return [...channels, ...directChannels].filter((c) => myMembers.hasOwnProperty(c.id));
    }
);

export const getOtherChannels: (GlobalState, ?boolean) => Array<Channel> = createSelector(
    getChannelsInCurrentTeam,
    getMyChannelMemberships,
    (state: GlobalState, archived: ?boolean = true) => archived,
    (channels: Array<Channel>, myMembers: RelationOneToOne<Channel, ChannelMembership>, archived: ?boolean): Array<Channel> => {
        return channels.filter((c) => !myMembers.hasOwnProperty(c.id) && c.type === General.OPEN_CHANNEL && (archived ? true : c.delete_at === 0));
    }
);

export const getArchivedChannels: (GlobalState) => Array<Channel> = createSelector(
    getChannelsInCurrentTeam,
    getMyChannelMemberships,
    (channels: Array<Channel>, myMembers: RelationOneToOne<Channel, ChannelMembership>): Array<Channel> => {
        return channels.filter((c) => myMembers.hasOwnProperty(c.id) && c.delete_at !== 0);
    }
);

export const getChannelsByCategory: (GlobalState) => {favoriteChannels: Array<Channel>, publicChannels: Array<Channel>, privateChannels: Array<Channel>, directAndGroupChannels: Array<Channel>} = createSelector(
    getCurrentChannelId,
    getMyChannels,
    getMyChannelMemberships,
    getConfig,
    getMyPreferences,
    getTeammateNameDisplaySetting,
    (state: GlobalState): UsersState => state.entities.users,
    getLastPostPerChannel,
    (currentChannelId: string, channels: Array<Channel>, myMembers: RelationOneToOne<Channel, ChannelMembership>, config: Object, myPreferences: {[string]: PreferenceType}, teammateNameDisplay: string, usersState: UsersState, lastPosts: RelationOneToOne<Channel, Post>) => {
        const allChannels = channels.map((c) => {
            const channel = {...c};
            channel.isCurrent = c.id === currentChannelId;
            return channel;
        });

        return buildDisplayableChannelList(usersState, allChannels, myMembers, config, myPreferences, teammateNameDisplay, lastPosts);
    }
);

export const getChannelsWithUnreadSection: (GlobalState) => {unreadChannels: Array<Channel>, favoriteChannels: Array<Channel>, publicChannels: Array<Channel>, privateChannels: Array<Channel>, directAndGroupChannels: Array<Channel>} = createSelector(
    getCurrentChannelId,
    getMyChannels,
    getMyChannelMemberships,
    getConfig,
    getMyPreferences,
    getTeammateNameDisplaySetting,
    (state: GlobalState): UsersState => state.entities.users,
    getLastPostPerChannel,
    (currentChannelId: string, channels: Array<Channel>, myMembers: RelationOneToOne<Channel, ChannelMembership>, config: Object, myPreferences: {[string]: PreferenceType}, teammateNameDisplay: string, usersState: UsersState, lastPosts: RelationOneToOne<Channel, Post>) => {
        const allChannels = channels.map((c) => {
            const channel = {...c};
            channel.isCurrent = c.id === currentChannelId;
            return channel;
        });

        return buildDisplayableChannelListWithUnreadSection(usersState, allChannels, myMembers, config, myPreferences, teammateNameDisplay, lastPosts);
    }
);

export const getDefaultChannel: (GlobalState) => ?Channel = createSelector(
    getAllChannels,
    getCurrentTeamId,
    (channels: IDMappedObjects<Channel>, teamId: string): ?Channel => {
        return Object.keys(channels).map((key) => channels[key]).find((c) => c && c.team_id === teamId && c.name === General.DEFAULT_CHANNEL);
    }
);

export const getMembersInCurrentChannel: (GlobalState) => UserIDMappedObjects<ChannelMembership> = createSelector(
    getCurrentChannelId,
    getChannelMembersInChannels,
    (currentChannelId: string, members: RelationOneToOne<Channel, UserIDMappedObjects<ChannelMembership>>): UserIDMappedObjects<ChannelMembership> => {
        return members[currentChannelId];
    }
);

export const getUnreads: (GlobalState) => {messageCount: number, mentionCount: number} = createSelector(
    getAllChannels,
    getMyChannelMemberships,
    getUsers,
    getCurrentUserId,
    getCurrentTeamId,
    getMyTeams,
    getTeamMemberships,
    (channels: IDMappedObjects<Channel>, myMembers: RelationOneToOne<Channel, ChannelMembership>, users: IDMappedObjects<UserProfile>, currentUserId: string, currentTeamId: string, myTeams: Array<Team>, myTeamMemberships: RelationOneToOne<Team, TeamMembership>): {messageCount: number, mentionCount: number} => {
        let messageCountForCurrentTeam = 0; // Includes message count from channels of current team plus all GM'S and all DM's across teams
        let mentionCountForCurrentTeam = 0; // Includes mention count from channels of current team plus all GM'S and all DM's across teams
        Object.keys(myMembers).forEach((channelId) => {
            const channel = channels[channelId];
            const m = myMembers[channelId];

            if (channel && m && (channel.team_id === currentTeamId || channel.type === General.DM_CHANNEL || channel.type === General.GM_CHANNEL)) {
                let otherUserId = '';
                if (channel.type === 'D') {
                    otherUserId = getUserIdFromChannelName(currentUserId, channel.name);
                    if (users[otherUserId] && users[otherUserId].delete_at === 0) {
                        mentionCountForCurrentTeam += channel.total_msg_count - m.msg_count;
                    }
                } else if (m.mention_count > 0 && channel.delete_at === 0) {
                    mentionCountForCurrentTeam += m.mention_count;
                }

                if (m.notify_props && m.notify_props.mark_unread !== 'mention' && channel.total_msg_count - m.msg_count > 0) {
                    if (channel.type === 'D') {
                        if (users[otherUserId] && users[otherUserId].delete_at === 0) {
                            messageCountForCurrentTeam += 1;
                        }
                    } else if (channel.delete_at === 0) {
                        messageCountForCurrentTeam += 1;
                    }
                }
            }
        });

        // Includes mention count and message count from teams other than the current team
        // This count does not include GM's and DM's
        const otherTeamsUnreadCountForChannels = myTeams.reduce((acc, team) => {
            if (currentTeamId !== team.id) {
                const member = myTeamMemberships[team.id];
                acc.messageCount += member.msg_count;
                acc.mentionCount += member.mention_count;
            }

            return acc;
        }, {messageCount: 0, mentionCount: 0});

        const totalTeamsUnreadCount = {
            messageCount: messageCountForCurrentTeam + otherTeamsUnreadCountForChannels.messageCount,
            mentionCount: mentionCountForCurrentTeam + otherTeamsUnreadCountForChannels.mentionCount,
        };

        return totalTeamsUnreadCount;
    }
);

export const getUnreadsInCurrentTeam: (GlobalState) => {messageCount: number, mentionCount: number} = createSelector(
    getCurrentChannelId,
    getMyChannels,
    getMyChannelMemberships,
    getUsers,
    getCurrentUserId,
    (currentChannelId: string, channels: Array<Channel>, myMembers: RelationOneToOne<Channel, ChannelMembership>, users: IDMappedObjects<UserProfile>, currentUserId: string): {messageCount: number, mentionCount: number} => {
        let messageCount = 0;
        let mentionCount = 0;

        channels.forEach((channel) => {
            const m = myMembers[channel.id];
            if (m && channel.id !== currentChannelId) {
                let otherUserId = '';
                if (channel.type === 'D') {
                    otherUserId = getUserIdFromChannelName(currentUserId, channel.name);
                    if (users[otherUserId] && users[otherUserId].delete_at === 0) {
                        mentionCount += channel.total_msg_count - m.msg_count;
                    }
                } else if (m.mention_count > 0 && channel.delete_at === 0) {
                    mentionCount += m.mention_count;
                }
                if (m.notify_props && m.notify_props.mark_unread !== 'mention' && channel.total_msg_count - m.msg_count > 0) {
                    if (channel.type === 'D') {
                        if (users[otherUserId] && users[otherUserId].delete_at === 0) {
                            messageCount += 1;
                        }
                    } else if (channel.delete_at === 0) {
                        messageCount += 1;
                    }
                }
            }
        });

        return {messageCount, mentionCount};
    }
);

export const canManageChannelMembers: (GlobalState) => boolean = createSelector(
    getCurrentChannel,
    getCurrentUser,
    getCurrentTeamMembership,
    getMyCurrentChannelMembership,
    getConfig,
    getLicense,
    hasNewPermissions,
    (state: GlobalState): boolean => haveICurrentChannelPermission(state, {permission: Permissions.MANAGE_PRIVATE_CHANNEL_MEMBERS}),
    (state: GlobalState): boolean => haveICurrentChannelPermission(state, {permission: Permissions.MANAGE_PUBLIC_CHANNEL_MEMBERS}),
    (channel: Channel, user: UserProfile, teamMembership: TeamMembership, channelMembership: ?ChannelMembership, config: Object, license: Object, newPermissions: boolean, managePrivateMembers: boolean, managePublicMembers: boolean): boolean => {
        if (!channel) {
            return false;
        }

        if (channel.delete_at !== 0) {
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

        if (!channelMembership) {
            return false;
        }

        return canManageMembersOldPermissions(channel, user, teamMembership, channelMembership, config, license);
    }
);

// Determine if the user has permissions to manage members in at least one channel of the current team
export const canManageAnyChannelMembersInCurrentTeam: (GlobalState) => boolean = createSelector(
    getMyChannelMemberships,
    getCurrentTeamId,
    (state: GlobalState): GlobalState => state,
    (members: RelationOneToOne<Channel, ChannelMembership>, currentTeamId: string, state: GlobalState): boolean => {
        for (const channelId of Object.keys(members)) {
            const channel = getChannel(state, channelId);

            if (!channel || channel.team_id !== currentTeamId) {
                continue;
            }

            if (channel.type === General.OPEN_CHANNEL && haveIChannelPermission(state, {permission: Permissions.MANAGE_PUBLIC_CHANNEL_MEMBERS, channel: channelId, team: currentTeamId})) {
                return true;
            } else if (channel.type === General.PRIVATE_CHANNEL && haveIChannelPermission(state, {permission: Permissions.MANAGE_PRIVATE_CHANNEL_MEMBERS, channel: channelId, team: currentTeamId})) {
                return true;
            }
        }
        return false;
    }
);

export const getAllDirectChannelIds: (GlobalState) => Array<string> = createIdsSelector(
    getDirectChannelsSet,
    (directIds: Set<string>): Array<string> => {
        return Array.from(directIds);
    }
);

export const getChannelIdsInCurrentTeam: (GlobalState) => Array<string> = createIdsSelector(
    getCurrentTeamId,
    getChannelsInTeam,
    (currentTeamId: string, channelsInTeam: RelationOneToMany<Team, Channel>): Array<string> => {
        return Array.from(channelsInTeam[currentTeamId] || []);
    }
);

export const getChannelIdsForCurrentTeam: (GlobalState) => Array<string> = createIdsSelector(
    getChannelIdsInCurrentTeam,
    getAllDirectChannelIds,
    (channels, direct) => {
        return [...channels, ...direct];
    }
);

export const getUnreadChannelIds: (GlobalState, ?Channel) => Array<string> = createIdsSelector(
    getAllChannels,
    getMyChannelMemberships,
    getChannelIdsForCurrentTeam,
    (state: GlobalState, lastUnreadChannel: ?Channel = null): ?Channel => lastUnreadChannel,
    (channels: IDMappedObjects<Channel>, members: RelationOneToOne<Channel, ChannelMembership>, teamChannelIds: Array<string>, lastUnreadChannel: ?Channel): Array<string> => {
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

export const getUnreadChannels: (GlobalState, ?Channel) => Array<Channel> = createIdsSelector(
    getCurrentUser,
    getUsers,
    getUserIdsInChannels,
    getAllChannels,
    getUnreadChannelIds,
    getTeammateNameDisplaySetting,
    (currentUser, profiles, userIdsInChannels: Object, channels, unreadIds, settings) => {
        // If we receive an unread for a channel and then a mention the channel
        // won't be sorted correctly until we receive a message in another channel
        if (!currentUser) {
            return [];
        }

        const allUnreadChannels = unreadIds.filter((id) => channels[id] && channels[id].delete_at === 0).map((id) => {
            const c = channels[id];

            if (c.type === General.DM_CHANNEL || c.type === General.GM_CHANNEL) {
                return completeDirectChannelDisplayName(currentUser.id, profiles, userIdsInChannels[id], settings, c);
            }

            return c;
        });

        return allUnreadChannels;
    }
);

export const getMapAndSortedUnreadChannelIds: (GlobalState, Channel, SortingType) => Array<string> = createIdsSelector(
    getUnreadChannels,
    getCurrentUser,
    getMyChannelMemberships,
    getLastPostPerChannel,
    (state, lastUnreadChannel, sorting: SortingType = 'alpha') => sorting,
    (channels, currentUser, myMembers, lastPosts, sorting: SortingType) => {
        return mapAndSortChannelIds(channels, currentUser, myMembers, lastPosts, sorting, true);
    },
);

export const getSortedUnreadChannelIds: (GlobalState, Channel, boolean, boolean, SortingType) => Array<string> = createIdsSelector(
    getUnreadChannelIds,
    (state, lastUnreadChannel, unreadsAtTop, favoritesAtTop, sorting: SortingType = 'alpha') => {
        return getMapAndSortedUnreadChannelIds(state, lastUnreadChannel, sorting);
    },
    (unreadChannelIds, mappedAndSortedUnreadChannelIds) => mappedAndSortedUnreadChannelIds,
);

// Favorites
export const getFavoriteChannels: (GlobalState) => Array<Channel> = createIdsSelector(
    getCurrentUser,
    getUsers,
    getUserIdsInChannels,
    getAllChannels,
    getMyChannelMemberships,
    getFavoritesPreferences,
    getChannelIdsForCurrentTeam,
    getTeammateNameDisplaySetting,
    getConfig,
    getMyPreferences,
    getCurrentChannelId,
    (currentUser: UserProfile, profiles: IDMappedObjects<UserProfile>, userIdsInChannels: Object, channels: IDMappedObjects<Channel>, myMembers: RelationOneToOne<Channel, ChannelMembership>, favoriteIds: Array<string>, teamChannelIds: Array<string>, settings: string, config: Object, prefs: {[string]: PreferenceType}, currentChannelId: string): Array<Channel> => {
        if (!currentUser) {
            return [];
        }

        const favoriteChannel = favoriteIds.filter((id) => {
            if (!myMembers[id] || !channels[id]) {
                return false;
            }

            const channel = channels[id];
            const otherUserId = getUserIdFromChannelName(currentUser.id, channel.name);

            if (channel.delete_at !== 0 && channel.id !== currentChannelId) {
                return false;
            }

            // Deleted users from CLI will not have a profiles entry
            if (channel.type === General.DM_CHANNEL && !profiles[otherUserId]) {
                return false;
            }

            if (channel.type === General.DM_CHANNEL && !isDirectChannelVisible(profiles[otherUserId] || otherUserId, config, prefs, channel, null, false, currentChannelId)) {
                return false;
            } else if (channel.type === General.GM_CHANNEL && !isGroupChannelVisible(config, prefs, channel)) {
                return false;
            }

            return teamChannelIds.includes(id);
        }).map((id) => {
            const c = channels[id];
            if (c.type === General.DM_CHANNEL || c.type === General.GM_CHANNEL) {
                return completeDirectChannelDisplayName(currentUser.id, profiles, userIdsInChannels[id], settings, c);
            }

            return c;
        });

        return favoriteChannel;
    }
);

export const getFavoriteChannelIds: (GlobalState, Channel, boolean, boolean, SortingType) => Array<string> = createIdsSelector(
    getFavoriteChannels,
    getCurrentUser,
    getMyChannelMemberships,
    getLastPostPerChannel,
    (state, lastUnreadChannel, unreadsAtTop, favoritesAtTop, sorting: SortingType = 'alpha') => sorting,
    mapAndSortChannelIds,
);

export const getSortedFavoriteChannelIds: (GlobalState, Channel, boolean, boolean, SortingType) => Array<string> = createIdsSelector(
    getUnreadChannelIds,
    getFavoritesPreferences,
    (state, lastUnreadChannel, unreadsAtTop, favoritesAtTop, sorting: SortingType) => getFavoriteChannelIds(state, lastUnreadChannel, unreadsAtTop, favoritesAtTop, sorting),
    (state, lastUnreadChannel, unreadsAtTop = true) => unreadsAtTop,
    (unreadChannelIds, favoritePreferences, favoriteChannelIds, unreadsAtTop) => {
        return filterChannels(unreadChannelIds, favoritePreferences, favoriteChannelIds, unreadsAtTop, false);
    },
);

// Public Channels
export const getPublicChannels: (GlobalState) => Array<Channel> = createSelector(
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

export const getPublicChannelIds: (GlobalState, Channel, boolean, boolean, SortingType) => Array<string> = createIdsSelector(
    getPublicChannels,
    getCurrentUser,
    getMyChannelMemberships,
    getLastPostPerChannel,
    (state, lastUnreadChannel, unreadsAtTop, favoritesAtTop, sorting: SortingType = 'alpha') => sorting,
    mapAndSortChannelIds,
);

export const getSortedPublicChannelIds: (GlobalState, Channel, boolean, boolean, SortingType) => Array<string> = createIdsSelector(
    getUnreadChannelIds,
    getFavoritesPreferences,
    (state, lastUnreadChannel, unreadsAtTop, favoritesAtTop, sorting: SortingType = 'alpha') => getPublicChannelIds(state, lastUnreadChannel, unreadsAtTop, favoritesAtTop, sorting),
    (state, lastUnreadChannel, unreadsAtTop = true) => unreadsAtTop,
    (state, lastUnreadChannel, unreadsAtTop, favoritesAtTop = true) => favoritesAtTop,
    filterChannels,
);

// Private Channels
export const getPrivateChannels: (GlobalState) => Array<Channel> = createSelector(
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

export const getPrivateChannelIds: (GlobalState, Channel, boolean, boolean, SortingType) => Array<string> = createIdsSelector(
    getPrivateChannels,
    getCurrentUser,
    getMyChannelMemberships,
    getLastPostPerChannel,
    (state, lastUnreadChannel, unreadsAtTop, favoritesAtTop, sorting: SortingType = 'alpha') => sorting,
    mapAndSortChannelIds,
);

export const getSortedPrivateChannelIds: (GlobalState, Channel, boolean, boolean, SortingType) => Array<string> = createIdsSelector(
    getUnreadChannelIds,
    getFavoritesPreferences,
    (state, lastUnreadChannel, unreadsAtTop, favoritesAtTop, sorting: SortingType = 'alpha') => getPrivateChannelIds(state, lastUnreadChannel, unreadsAtTop, favoritesAtTop, sorting),
    (state, lastUnreadChannel, unreadsAtTop = true) => unreadsAtTop,
    (state, lastUnreadChannel, unreadsAtTop, favoritesAtTop = true) => favoritesAtTop,
    filterChannels,
);

// Direct Messages
export const getDirectChannels: (GlobalState) => Array<Channel> = createSelector(
    getCurrentUser,
    getUsers,
    getUserIdsInChannels,
    getAllChannels,
    getVisibleTeammate,
    getVisibleGroupIds,
    getTeammateNameDisplaySetting,
    getConfig,
    getMyPreferences,
    getLastPostPerChannel,
    getCurrentChannelId,
    (currentUser: UserProfile, profiles: IDMappedObjects<UserProfile>, userIdsInChannels: Object, channels: IDMappedObjects<Channel>, teammates: Array<string>, groupIds: Array<string>, settings: Object, config: Object, preferences: {[string]: PreferenceType}, lastPosts: RelationOneToOne<Channel, Post>, currentChannelId: string): Array<Channel> => {
        if (!currentUser) {
            return [];
        }

        const channelValues = Object.keys(channels).map((key) => channels[key]);
        const directChannelsIds = [];
        teammates.reduce((result, teammateId) => {
            const name = getDirectChannelName(currentUser.id, teammateId);
            const channel = channelValues.find((c: Channel) => c.name === name); //eslint-disable-line max-nested-callbacks
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
                return !isAutoClosed(config, preferences, channels[id], lastPost ? lastPost.create_at : 0, 0, currentChannelId);
            }

            return false;
        }).concat(directChannelsIds).map((id) => {
            const channel = channels[id];
            return completeDirectChannelDisplayName(currentUser.id, profiles, userIdsInChannels[id], settings, channel);
        });

        return directChannels;
    }
);

// getDirectAndGroupChannels returns all direct and group channels, even if they have been manually
// or automatically closed.
//
// This is similar to the getDirectChannels above (which actually also returns group channels,
// but suppresses manually closed group channels but not manually closed direct channels.) This
// method does away with all the suppression, since the webapp client downstream uses this for
// the channel switcher and puts such suppressed channels in a separate category.
export const getDirectAndGroupChannels: (GlobalState) => Array<Channel> = createSelector(
    getCurrentUser,
    getUsers,
    getUserIdsInChannels,
    getAllChannels,
    getTeammateNameDisplaySetting,
    (currentUser: UserProfile, profiles: IDMappedObjects<UserProfile>, userIdsInChannels: Object, channels: IDMappedObjects<Channel>, settings): Array<Channel> => {
        if (!currentUser) {
            return [];
        }

        return Object.keys(channels).map((key) => channels[key]).filter((channel: Channel): boolean =>
            Boolean(channel)
        ).filter((channel: Channel): boolean =>
            channel.type === General.DM_CHANNEL || channel.type === General.GM_CHANNEL
        ).map((channel: Channel): Channel =>
            completeDirectChannelDisplayName(currentUser.id, profiles, userIdsInChannels[channel.id], settings, channel)
        );
    }
);

export const getDirectChannelIds: (GlobalState, Channel, boolean, boolean, SortingType) => Array<string> = createIdsSelector(
    getDirectChannels,
    getCurrentUser,
    getMyChannelMemberships,
    getLastPostPerChannel,
    (state, lastUnreadChannel, unreadsAtTop, favoritesAtTop, sorting: SortingType = 'alpha') => sorting,
    mapAndSortChannelIds,
);

export const getSortedDirectChannelIds: (GlobalState, Channel, boolean, boolean, SortingType) => Array<string> = createIdsSelector(
    getUnreadChannelIds,
    getFavoritesPreferences,
    (state, lastUnreadChannel, unreadsAtTop, favoritesAtTop, sorting: SortingType = 'alpha') => getDirectChannelIds(state, lastUnreadChannel, unreadsAtTop, favoritesAtTop, sorting),
    (state, lastUnreadChannel, unreadsAtTop = true) => unreadsAtTop,
    (state, lastUnreadChannel, unreadsAtTop, favoritesAtTop = true) => favoritesAtTop,
    filterChannels,
);

export function getGroupOrDirectChannelVisibility(state: GlobalState, channelId: string): boolean {
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

// Filters post IDs by the given condition.
// The condition function receives as parameters the associated channel object and the post object.
export const filterPostIds = (condition: (Channel, Post) => boolean) => {
    if (typeof condition !== 'function') {
        throw new TypeError(`${condition} is not a function`);
    }
    return (createSelector(
        getAllChannels,
        getAllPosts,
        (state: GlobalState, postIds: Array<string>): Array<string> => postIds,
        (channels: IDMappedObjects<Channel>, posts: IDMappedObjects<Post>, postIds: Array<string>): Array<string> => {
            return postIds.filter((postId) => {
                const post = posts[postId];
                let channel;
                if (post) {
                    channel = channels[post.channel_id];
                }
                return post && channel && condition(channel, post);
            });
        }
    ): (GlobalState, Array<string>) => Array<string>);
};

const getProfiles = (currentUserId: string, usersIdsInChannel: Array<string>, users: IDMappedObjects<UserProfile>): Array<UserProfile> => {
    const profiles = [];
    usersIdsInChannel.forEach((userId) => {
        if (userId !== currentUserId) {
            profiles.push(users[userId]);
        }
    });
    return profiles;
};

export const getChannelsWithUserProfiles: (GlobalState) => Array<{|...Channel, profiles: Array<UserProfile>|}> = createSelector(
    getUserIdsInChannels,
    getUsers,
    getGroupChannels,
    getCurrentUserId,
    (channelUserMap: RelationOneToMany<Channel, UserProfile>, users: IDMappedObjects<UserProfile>, channels: Array<Channel>, currentUserId: string) => {
        return channels.map((channel: Channel): {|...Channel, profiles: Array<UserProfile>|} => {
            const profiles = getProfiles(currentUserId, channelUserMap[channel.id] || [], users);
            return {...channel, profiles};
        });
    }
);

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

export const getAllChannelIds: (GlobalState, Channel, boolean, boolean, SortingType) => Array<string> = createIdsSelector(
    getAllActiveChannels,
    getCurrentUser,
    getMyChannelMemberships,
    getLastPostPerChannel,
    (state, lastUnreadChannel, unreadsAtTop, favoritesAtTop, sorting: SortingType = 'alpha') => sorting,
    mapAndSortChannelIds,
);

export const getAllSortedChannelIds: (GlobalState, Channel, boolean, boolean, SortingType) => Array<string> = createIdsSelector(
    getUnreadChannelIds,
    getFavoritesPreferences,
    (state, lastUnreadChannel, unreadsAtTop, favoritesAtTop, sorting: SortingType = 'alpha') => getAllChannelIds(state, lastUnreadChannel, unreadsAtTop, favoritesAtTop, sorting),
    (state, lastUnreadChannel, unreadsAtTop = true) => unreadsAtTop,
    (state, lastUnreadChannel, unreadsAtTop, favoritesAtTop = true) => favoritesAtTop,
    filterChannels,
);

let lastChannels;
const hasChannelsChanged = (channels) => {
    if (!lastChannels || lastChannels.length !== channels.length) {
        return true;
    }

    for (let i = 0; i < channels.length; i++) {
        if (channels[i].type !== lastChannels[i].type || channels[i].items !== lastChannels[i].items) {
            return true;
        }
    }

    return false;
};

export const getOrderedChannelIds = (state: GlobalState, lastUnreadChannel: Channel, grouping: 'by_type' | 'none', sorting: SortingType, unreadsAtTop: boolean, favoritesAtTop: boolean) => {
    const channels = [];

    if (grouping === 'by_type') {
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
    } else {
        // Combine all channel types
        let type = 'alpha';
        let name = 'CHANNELS';
        if (sorting === 'recent') {
            type = 'recent';
            name = 'RECENT ACTIVITY';
        }

        channels.push({
            type,
            name,
            items: getAllSortedChannelIds(
                state,
                lastUnreadChannel,
                unreadsAtTop,
                favoritesAtTop,
                sorting,
            ),
        });
    }

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

    if (hasChannelsChanged(channels)) {
        lastChannels = channels;
    }

    return lastChannels;
};

// Added for backwards compatibility
// Can be removed once webapp includes new sidebar preferences

export const getSortedPublicChannelWithUnreadsIds: (GlobalState, Channel, boolean, boolean, SortingType) => Array<string> = createIdsSelector(
    getUnreadChannelIds,
    getFavoritesPreferences,
    getPublicChannelIds,
    (state, lastUnreadChannel, unreadsAtTop, favoritesAtTop = true) => favoritesAtTop,
    (unreadChannelIds, favoritePreferences, publicChannelIds, favoritesAtTop) => {
        return filterChannels(unreadChannelIds, favoritePreferences, publicChannelIds, false, favoritesAtTop);
    },
);

export const getSortedPrivateChannelWithUnreadsIds: (GlobalState, Channel, boolean, boolean, SortingType) => Array<string> = createIdsSelector(
    getUnreadChannelIds,
    getFavoritesPreferences,
    getPrivateChannelIds,
    (state, lastUnreadChannel, unreadsAtTop, favoritesAtTop = true) => favoritesAtTop,
    (unreadChannelIds, favoritePreferences, privateChannelId, favoritesAtTop) => {
        return filterChannels(unreadChannelIds, favoritePreferences, privateChannelId, false, favoritesAtTop);
    },
);

export const getSortedFavoriteChannelWithUnreadsIds: (GlobalState, Channel, boolean, boolean, SortingType) => Array<string> = createIdsSelector(
    getUnreadChannelIds,
    getFavoriteChannelIds,
    (unreadChannelIds, favoriteChannelIds) => favoriteChannelIds,
);

export const getSortedDirectChannelWithUnreadsIds: (GlobalState, Channel, boolean, boolean, SortingType) => Array<string> = createIdsSelector(
    getUnreadChannelIds,
    getFavoritesPreferences,
    getDirectChannelIds,
    (state, lastUnreadChannel, unreadsAtTop, favoritesAtTop = true) => favoritesAtTop,
    (unreadChannelIds, favoritePreferences, directChannelIds, favoritesAtTop) => {
        return filterChannels(unreadChannelIds, favoritePreferences, directChannelIds, false, favoritesAtTop);
    },
);

export const getDefaultChannelForTeams: (GlobalState) => RelationOneToOne<Team, Channel> = createSelector(
    getAllChannels,
    (channels: IDMappedObjects<Channel>): RelationOneToOne<Team, Channel> => {
        const result = {};
        for (const channel of Object.keys(channels).map((key) => channels[key])) {
            if (channel && channel.name === General.DEFAULT_CHANNEL) {
                result[channel.team_id] = channel;
            }
        }
        return result;
    }
);

export const getMyFirstChannelForTeams: (GlobalState) => RelationOneToOne<Team, Channel> = createSelector(
    getAllChannels,
    getMyChannelMemberships,
    getMyTeams,
    getCurrentUser,
    (allChannels: IDMappedObjects<Channel>, myChannelMemberships: RelationOneToOne<Channel, ChannelMembership>, myTeams: Array<Team>, currentUser: UserProfile): RelationOneToOne<Team, Channel> => {
        const locale = currentUser.locale || General.DEFAULT_LOCALE;

        const result = {};
        for (const team of myTeams) {
            // Get a sorted array of all channels in the team that the current user is a member of
            // $FlowFixMe
            const teamChannels = Object.values(allChannels).
                filter((channel: Channel) => channel && channel.team_id === team.id && Boolean(myChannelMemberships[channel.id])).
                sort(sortChannelsByDisplayName.bind(null, locale));

            if (teamChannels.length === 0) {
                continue;
            }

            result[team.id] = teamChannels[0];
        }

        return result;
    }
);

export const getRedirectChannelNameForTeam = (state: GlobalState, teamId: string): string => {
    const defaultChannelForTeam = getDefaultChannelForTeams(state)[teamId];
    const myFirstChannelForTeam = getMyFirstChannelForTeams(state)[teamId];
    const canIJoinPublicChannelsInTeam = !hasNewPermissions(state) || haveITeamPermission(state, {team: teamId, permission: Permissions.JOIN_PUBLIC_CHANNELS});
    const myChannelMemberships = getMyChannelMemberships(state);

    const iAmMemberOfTheTeamDefaultChannel = Boolean(defaultChannelForTeam && myChannelMemberships[defaultChannelForTeam.id]);
    if (iAmMemberOfTheTeamDefaultChannel || canIJoinPublicChannelsInTeam) {
        return General.DEFAULT_CHANNEL;
    }
    return (myFirstChannelForTeam && myFirstChannelForTeam.name) || General.DEFAULT_CHANNEL;
};
