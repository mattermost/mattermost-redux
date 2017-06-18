// Copyright (c) 2016-present Mattermost, Inc. All Rights Reserved.
// See License.txt for license information.

import {General, Preferences} from 'constants';
import {displayUsername} from './user_utils';
import {getPreferencesByCategory} from './preference_utils';

const defaultPrefix = 'D'; // fallback for future types
const typeToPrefixMap = {[General.OPEN_CHANNEL]: 'A', [General.PRIVATE_CHANNEL]: 'B', [General.DM_CHANNEL]: 'C', [General.GM_CHANNEL]: 'C'};

/**
 * Returns list of sorted channels grouped by type. Favorites here is considered as separated type.
 *
 * Example: {
 *  publicChannels: [...],
 *  privateChannels: [...],
 *  directAndGroupChannels: [...],
 *  favoriteChannels: [...]
 * }
 */
export function buildDisplayableChannelList(usersState, allChannels, myPreferences) {
    const missingDirectChannels = createMissingDirectChannels(usersState.currentUserId, allChannels, myPreferences);

    const {currentUserId, profiles} = usersState;
    const locale = profiles && profiles[currentUserId] ? profiles[currentUserId].locale : 'en';

    const channels = buildChannels(usersState, allChannels, missingDirectChannels, myPreferences, locale);
    const favoriteChannels = buildFavoriteChannels(channels, myPreferences, locale);
    const notFavoriteChannels = buildNotFavoriteChannels(channels, myPreferences);
    const directAndGroupChannels = buildDirectAndGroupChannels(notFavoriteChannels, myPreferences, currentUserId);

    return {
        favoriteChannels,
        publicChannels: notFavoriteChannels.filter(isOpenChannel),
        privateChannels: notFavoriteChannels.filter(isPrivateChannel),
        directAndGroupChannels
    };
}

export function buildDisplayableChannelListWithUnreadSection(usersState, myChannels, myMembers, myPreferences) {
    const {currentUserId, profiles} = usersState;
    const locale = profiles && profiles[currentUserId] ? profiles[currentUserId].locale : 'en';

    const missingDirectChannels = createMissingDirectChannels(currentUserId, myChannels, myPreferences);
    const channels = buildChannels(usersState, myChannels, missingDirectChannels, myPreferences, locale);
    const unreadChannels = [...buildChannelsWithMentions(channels, myMembers, locale), ...buildUnreadChannels(channels, myMembers, locale)];
    const notUnreadChannels = channels.filter(not(isUnreadChannel.bind(null, myMembers)));
    const favoriteChannels = buildFavoriteChannels(notUnreadChannels, myPreferences, locale);
    const notFavoriteChannels = buildNotFavoriteChannels(notUnreadChannels, myPreferences);
    const directAndGroupChannels = buildDirectAndGroupChannels(notFavoriteChannels, myPreferences, currentUserId);

    return {
        unreadChannels,
        favoriteChannels,
        publicChannels: notFavoriteChannels.filter(isOpenChannel),
        privateChannels: notFavoriteChannels.filter(isPrivateChannel),
        directAndGroupChannels
    };
}

export function completeDirectChannelInfo(usersState, myPreferences, channel) {
    if (isDirectChannel(channel)) {
        const dmChannelClone = {...channel};
        const teammateId = getUserIdFromChannelName(usersState.currentUserId, channel.name);

        return Object.assign(dmChannelClone, {
            display_name: displayUsername(usersState.profiles[teammateId], myPreferences),
            teammate_id: teammateId,
            status: usersState.statuses[teammateId] || 'offline'
        });
    } else if (isGroupChannel(channel)) {
        return completeDirectGroupInfo(usersState, myPreferences, channel);
    }

    return channel;
}

export function cleanUpUrlable(input) {
    let cleaned = input.trim().replace(/-/g, ' ').replace(/[^\w\s]/gi, '').toLowerCase().replace(/\s/g, '-');
    cleaned = cleaned.replace(/-{2,}/, '-');
    cleaned = cleaned.replace(/^-+/, '');
    cleaned = cleaned.replace(/-+$/, '');
    return cleaned;
}

export function getChannelByName(channels, name) {
    const channelIds = Object.keys(channels);
    for (let i = 0; i < channelIds.length; i++) {
        const id = channelIds[i];
        if (channels[id].name === name) {
            return channels[id];
        }
    }
    return null;
}

export function getDirectChannelName(id, otherId) {
    let handle;

    if (otherId > id) {
        handle = id + '__' + otherId;
    } else {
        handle = otherId + '__' + id;
    }

    return handle;
}

export function getUserIdFromChannelName(userId, channelName) {
    const ids = channelName.split('__');
    let otherUserId = '';
    if (ids[0] === userId) {
        otherUserId = ids[1];
    } else {
        otherUserId = ids[0];
    }

    return otherUserId;
}

export function isDirectChannel(channel) {
    return channel.type === General.DM_CHANNEL;
}

export function isDirectChannelVisible(userId, myPreferences, channel) {
    const channelId = getUserIdFromChannelName(userId, channel.name);
    const dm = myPreferences[`${Preferences.CATEGORY_DIRECT_CHANNEL_SHOW}--${channelId}`];
    return dm && dm.value === 'true';
}

export function isGroupChannel(channel) {
    return channel.type === General.GM_CHANNEL;
}

export function isGroupChannelVisible(myPreferences, channel) {
    const gm = myPreferences[`${Preferences.CATEGORY_GROUP_CHANNEL_SHOW}--${channel.id}`];
    return gm && gm.value === 'true';
}

export function showCreateOption(config, license, channelType, isAdmin, isSystemAdmin) {
    if (license.IsLicensed !== 'true') {
        return true;
    }

    if (channelType === General.OPEN_CHANNEL) {
        if (config.RestrictPublicChannelCreation === General.SYSTEM_ADMIN_ROLE && !isSystemAdmin) {
            return false;
        } else if (config.RestrictPublicChannelCreation === General.TEAM_ADMIN_ROLE && !isAdmin) {
            return false;
        }
    } else if (channelType === General.PRIVATE_CHANNEL) {
        if (config.RestrictPrivateChannelCreation === General.SYSTEM_ADMIN_ROLE && !isSystemAdmin) {
            return false;
        } else if (config.RestrictPrivateChannelCreation === General.TEAM_ADMIN_ROLE && !isAdmin) {
            return false;
        }
    }

    return true;
}

export function showManagementOptions(config, license, channel, isAdmin, isSystemAdmin, isChannelAdmin) {
    if (license.IsLicensed !== 'true') {
        return true;
    }

    if (channel.type === General.OPEN_CHANNEL) {
        if (config.RestrictPublicChannelManagement === General.SYSTEM_ADMIN_ROLE && !isSystemAdmin) {
            return false;
        }
        if (config.RestrictPublicChannelManagement === General.TEAM_ADMIN_ROLE && !isAdmin) {
            return false;
        }
        if (config.RestrictPublicChannelManagement === General.CHANNEL_ADMIN_ROLE && !isChannelAdmin && !isAdmin) {
            return false;
        }
    } else if (channel.type === General.PRIVATE_CHANNEL) {
        if (config.RestrictPrivateChannelManagement === General.SYSTEM_ADMIN_ROLE && !isSystemAdmin) {
            return false;
        }
        if (config.RestrictPrivateChannelManagement === General.TEAM_ADMIN_ROLE && !isAdmin) {
            return false;
        }
        if (config.RestrictPrivateChannelManagement === General.CHANNEL_ADMIN_ROLE && !isChannelAdmin && !isAdmin) {
            return false;
        }
    }

    return true;
}

export function showDeleteOption(config, license, channel, isAdmin, isSystemAdmin, isChannelAdmin) {
    if (license.IsLicensed !== 'true') {
        return true;
    }

    if (channel.type === General.OPEN_CHANNEL) {
        if (config.RestrictPublicChannelDeletion === General.SYSTEM_ADMIN_ROLE && !isSystemAdmin) {
            return false;
        }
        if (config.RestrictPublicChannelDeletion === General.TEAM_ADMIN_ROLE && !isAdmin) {
            return false;
        }
        if (config.RestrictPublicChannelDeletion === General.CHANNEL_ADMIN_ROLE && !isChannelAdmin && !isAdmin) {
            return false;
        }
    } else if (channel.type === General.PRIVATE_CHANNEL) {
        if (config.RestrictPrivateChannelDeletion === General.SYSTEM_ADMIN_ROLE && !isSystemAdmin) {
            return false;
        }
        if (config.RestrictPrivateChannelDeletion === General.TEAM_ADMIN_ROLE && !isAdmin) {
            return false;
        }
        if (config.RestrictPrivateChannelDeletion === General.CHANNEL_ADMIN_ROLE && !isChannelAdmin && !isAdmin) {
            return false;
        }
    }

    return true;
}

export function canManageMembers(channel, user, teamMember, channelMember, config, license) {
    if (channel.type === General.DM_CHANNEL ||
        channel.type === General.GM_CHANNEL ||
        channel.name === General.DEFAULT_CHANNEL) {
        return false;
    }

    if (license.IsLicensed !== 'true') {
        return true;
    }

    if (channel.type === General.PRIVATE_CHANNEL) {
        const isSystemAdmin = user.roles.includes(General.SYSTEM_ADMIN_ROLE);
        if (config.RestrictPrivateChannelManageMembers === General.PERMISSIONS_SYSTEM_ADMIN && !isSystemAdmin) {
            return false;
        }

        const isTeamAdmin = teamMember.roles.includes(General.TEAM_ADMIN_ROLE);
        if (config.RestrictPrivateChannelManageMembers === General.PERMISSIONS_TEAM_ADMIN && !isTeamAdmin && !isSystemAdmin) {
            return false;
        }

        const isChannelAdmin = channelMember.roles.includes(General.CHANNEL_ADMIN_ROLE);
        if (config.RestrictPrivateChannelManageMembers === General.PERMISSIONS_CHANNEL_ADMIN && !isChannelAdmin && !isTeamAdmin && !isSystemAdmin) {
            return false;
        }
    }

    return true;
}

export function getChannelsIdForTeam(state, teamId) {
    const {channels} = state.entities.channels;

    return Object.values(channels).reduce((res, channel) => {
        if (channel.team_id === teamId) {
            res.push(channel.id);
        }
        return res;
    }, []);
}

//====================================================

function createFakeChannel(userId, otherUserId) {
    return {
        name: getDirectChannelName(userId, otherUserId),
        last_post_at: 0,
        total_msg_count: 0,
        type: General.DM_CHANNEL,
        fake: true
    };
}

function createFakeChannelCurried(userId) {
    return (otherUserId) => createFakeChannel(userId, otherUserId);
}

function createMissingDirectChannels(currentUserId, allChannels, myPreferences) {
    const directChannelsDisplayPreferences = getPreferencesByCategory(myPreferences, Preferences.CATEGORY_DIRECT_CHANNEL_SHOW);

    return Array.
    from(directChannelsDisplayPreferences).
    filter((entry) => entry[1] === 'true').
    map((entry) => entry[0]).
    filter((teammateId) => !allChannels.some(isDirectChannelForUser.bind(null, currentUserId, teammateId))).
    map(createFakeChannelCurried(currentUserId));
}

function completeDirectGroupInfo(usersState, myPreferences, channel) {
    const {currentUserId, profiles, profilesInChannel} = usersState;
    const profilesIds = profilesInChannel[channel.id];
    if (profilesIds) {
        function sortUsernames(a, b) {
            const locale = profiles[currentUserId].locale;
            return a.localeCompare(b, locale, {numeric: true});
        }

        const displayName = [];
        profilesIds.forEach((teammateId) => {
            if (teammateId !== currentUserId) {
                displayName.push(displayUsername(usersState.profiles[teammateId], myPreferences));
            }
        });

        const gm = {...channel};
        return Object.assign(gm, {
            display_name: displayName.sort(sortUsernames).join(', ')
        });
    }
    return channel;
}

function isDirectChannelForUser(userId, otherUserId, channel) {
    return channel.type === General.DM_CHANNEL && getUserIdFromChannelName(userId, channel.name) === otherUserId;
}

function isFavoriteChannel(myPreferences, channel) {
    const fav = myPreferences[`${Preferences.CATEGORY_FAVORITE_CHANNEL}--${channel.id}`];
    channel.isFavorite = fav && fav.value === 'true';
    return channel.isFavorite;
}

function channelHasMentions(members, channel) {
    const member = members[channel.id];
    if (member) {
        return member.mention_count > 0;
    }
    return false;
}

function channelHasUnreadMessages(members, channel) {
    const member = members[channel.id];
    if (member) {
        const msgCount = channel.total_msg_count - member.msg_count;
        const onlyMentions = member.notify_props && member.notify_props.mark_unread === General.MENTION;
        return (msgCount && !onlyMentions && member.mention_count === 0);
    }

    return false;
}

function isUnreadChannel(members, channel) {
    const member = members[channel.id];
    if (member) {
        const msgCount = channel.total_msg_count - member.msg_count;
        const onlyMentions = member.notify_props && member.notify_props.mark_unread === General.MENTION;
        return (member.mention_count > 0 || (msgCount && !onlyMentions));
    }

    return false;
}

function isNotDeletedChannel(channel) {
    return channel.delete_at === 0;
}

function isOpenChannel(channel) {
    return channel.type === General.OPEN_CHANNEL;
}

function isPrivateChannel(channel) {
    return channel.type === General.PRIVATE_CHANNEL;
}

export function sortChannelsByDisplayName(locale, a, b) {
    if (a.type !== b.type && typeToPrefixMap[a.type] !== typeToPrefixMap[b.type]) {
        return (typeToPrefixMap[a.type] || defaultPrefix).localeCompare((typeToPrefixMap[b.type] || defaultPrefix), locale);
    }

    if (a.display_name !== b.display_name) {
        return a.display_name.toLowerCase().localeCompare(b.display_name.toLowerCase(), locale, {numeric: true});
    }

    return a.name.toLowerCase().localeCompare(b.name.toLowerCase(), locale, {numeric: true});
}

function sortFavorites(locale, a, b) {
    if (a.display_name !== b.display_name) {
        return a.display_name.toLowerCase().localeCompare(b.display_name.toLowerCase(), locale, {numeric: true});
    }

    return a.name.toLowerCase().localeCompare(b.name.toLowerCase(), locale, {numeric: true});
}

function not(f) {
    return (...args) => !f(...args);
}

function andX(...fns) {
    return (...args) => fns.every((f) => f(...args));
}

function orX(...fns) {
    return (...args) => fns.some((f) => f(...args));
}

function buildChannels(usersState, channels, missingDirectChannels, myPreferences, locale) {
    return channels.
    concat(missingDirectChannels).
    map(completeDirectChannelInfo.bind(null, usersState, myPreferences)).
    filter(isNotDeletedChannel).
    sort(sortChannelsByDisplayName.bind(null, locale));
}

function buildFavoriteChannels(channels, myPreferences, locale) {
    return channels.filter(isFavoriteChannel.bind(null, myPreferences)).sort(sortFavorites.bind(null, locale));
}

function buildNotFavoriteChannels(channels, myPreferences) {
    return channels.filter(not(isFavoriteChannel.bind(null, myPreferences)));
}

function buildDirectAndGroupChannels(channels, myPreferences, currentUserId) {
    return channels.filter(orX(andX(
        isGroupChannel,
        isGroupChannelVisible.bind(null, myPreferences)
    ), andX(
        isDirectChannel,
        isDirectChannelVisible.bind(null, currentUserId, myPreferences)
    )));
}

function buildChannelsWithMentions(channels, members, locale) {
    return channels.filter(channelHasMentions.bind(null, members)).
    sort(sortFavorites.bind(null, locale));
}

function buildUnreadChannels(channels, members, locale) {
    return channels.filter(channelHasUnreadMessages.bind(null, members)).
        sort(sortFavorites.bind(null, locale));
}
