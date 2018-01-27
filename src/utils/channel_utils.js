// Copyright (c) 2016-present Mattermost, Inc. All Rights Reserved.
// See License.txt for license information.

import {General, Preferences, Permissions} from 'constants';
import {displayUsername} from './user_utils';
import {getPreferencesByCategory} from './preference_utils';
import {hasNewPermissions} from 'selectors/entities/general';
import {haveITeamPerm} from 'selectors/entities/roles';

const channelTypeOrder = {
    [General.OPEN_CHANNEL]: 0,
    [General.PRIVATE_CHANNEL]: 1,
    [General.DM_CHANNEL]: 2,
    [General.GM_CHANNEL]: 2
};

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
export function buildDisplayableChannelList(usersState, allChannels, myMembers, config, myPreferences, teammateNameDisplay, lastPosts) {
    const missingDirectChannels = createMissingDirectChannels(usersState.currentUserId, allChannels, myPreferences);

    const {currentUserId, profiles} = usersState;
    const locale = getUserLocale(currentUserId, profiles);

    const channels = buildChannels(usersState, allChannels, missingDirectChannels, teammateNameDisplay, locale);
    const favoriteChannels = buildFavoriteChannels(channels, myPreferences, locale);
    const notFavoriteChannels = buildNotFavoriteChannels(channels, myPreferences);
    const directAndGroupChannels = buildDirectAndGroupChannels(notFavoriteChannels, myMembers, config, myPreferences, currentUserId, profiles, lastPosts);

    return {
        favoriteChannels,
        publicChannels: notFavoriteChannels.filter(isOpenChannel),
        privateChannels: notFavoriteChannels.filter(isPrivateChannel),
        directAndGroupChannels
    };
}

export function buildDisplayableChannelListWithUnreadSection(usersState, myChannels, myMembers, config, myPreferences, teammateNameDisplay, lastPosts) {
    const {currentUserId, profiles} = usersState;
    const locale = getUserLocale(currentUserId, profiles);

    const missingDirectChannels = createMissingDirectChannels(currentUserId, myChannels, myPreferences);
    const channels = buildChannels(usersState, myChannels, missingDirectChannels, teammateNameDisplay, locale);
    const unreadChannels = [...buildChannelsWithMentions(channels, myMembers, locale), ...buildUnreadChannels(channels, myMembers, locale)];
    const notUnreadChannels = channels.filter(not(isUnreadChannel.bind(null, myMembers)));
    const favoriteChannels = buildFavoriteChannels(notUnreadChannels, myPreferences, locale);
    const notFavoriteChannels = buildNotFavoriteChannels(notUnreadChannels, myPreferences);
    const directAndGroupChannels = buildDirectAndGroupChannels(notFavoriteChannels, myMembers, config, myPreferences, currentUserId, profiles, lastPosts);

    return {
        unreadChannels,
        favoriteChannels,
        publicChannels: notFavoriteChannels.filter(isOpenChannel),
        privateChannels: notFavoriteChannels.filter(isPrivateChannel),
        directAndGroupChannels
    };
}

export function completeDirectChannelInfo(usersState, teammateNameDisplay, channel) {
    if (isDirectChannel(channel)) {
        const dmChannelClone = {...channel};
        const teammateId = getUserIdFromChannelName(usersState.currentUserId, channel.name);

        return Object.assign(dmChannelClone, {
            display_name: displayUsername(usersState.profiles[teammateId], teammateNameDisplay),
            teammate_id: teammateId,
            status: usersState.statuses[teammateId] || 'offline'
        });
    } else if (isGroupChannel(channel)) {
        return completeDirectGroupInfo(usersState, teammateNameDisplay, channel);
    }

    return channel;
}

export function completeDirectChannelDisplayName(currentUserId, profiles, teammateNameDisplay, channel) {
    if (isDirectChannel(channel)) {
        const dmChannelClone = {...channel};
        const teammateId = getUserIdFromChannelName(currentUserId, channel.name);

        return Object.assign(dmChannelClone, {display_name: displayUsername(profiles[teammateId], teammateNameDisplay)});
    } else if (isGroupChannel(channel)) {
        const usernames = channel.display_name.split(', ');
        const users = Object.values(profiles);
        const userIds = [];
        usernames.forEach((username) => {
            const u = users.find((p) => p.username === username);
            if (u) {
                userIds.push(u.id);
            }
        });
        if (usernames.length === userIds.length) {
            return Object.assign({}, channel, {
                display_name: getGroupDisplayNameFromUserIds(userIds, profiles, currentUserId, teammateNameDisplay)
            });
        }
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

export function isAutoClosed(config, myPreferences, channel, channelActivity, channelArchiveTime) {
    const cutoff = new Date().getTime() - (7 * 24 * 60 * 60 * 1000);

    const viewTimePref = myPreferences[`${Preferences.CATEGORY_CHANNEL_APPROXIMATE_VIEW_TIME}--${channel.id}`];
    const viewTime = viewTimePref ? parseInt(viewTimePref.value, 10) : 0;
    if (viewTime > cutoff) {
        return false;
    }

    const openTimePref = myPreferences[`${Preferences.CATEGORY_CHANNEL_OPEN_TIME}--${channel.id}`];
    const openTime = openTimePref ? parseInt(openTimePref.value, 10) : 0;
    if (channelArchiveTime && channelArchiveTime > openTime) {
        return true;
    }

    if (config.CloseUnusedDirectMessages !== 'true' || isFavoriteChannel(myPreferences, channel.id)) {
        return false;
    }
    const autoClose = myPreferences[`${Preferences.CATEGORY_SIDEBAR_SETTINGS}--close_unused_direct_messages`];
    if (!autoClose || autoClose.value === 'after_seven_days') {
        if (channelActivity && channelActivity > cutoff) {
            return false;
        }
        if (openTime > cutoff) {
            return false;
        }
        const lastActivity = channel.last_post_at;
        return !lastActivity || lastActivity < cutoff;
    }
    return false;
}

export function isDirectChannel(channel) {
    return channel.type === General.DM_CHANNEL;
}

export function isDirectChannelVisible(otherUserOrOtherUserId, config, myPreferences, channel, lastPost, isUnread) {
    const otherUser = typeof otherUserOrOtherUserId === 'object' ? otherUserOrOtherUserId : null;
    const otherUserId = typeof otherUserOrOtherUserId === 'object' ? otherUserOrOtherUserId.id : otherUserOrOtherUserId;
    const dm = myPreferences[`${Preferences.CATEGORY_DIRECT_CHANNEL_SHOW}--${otherUserId}`];
    if (!dm || dm.value !== 'true') {
        return false;
    }
    return isUnread || !isAutoClosed(config, myPreferences, channel, lastPost ? lastPost.create_at : 0, otherUser ? otherUser.delete_at : 0);
}

export function isGroupChannel(channel) {
    return channel.type === General.GM_CHANNEL;
}

export function isGroupChannelVisible(config, myPreferences, channel, lastPost, isUnread) {
    const gm = myPreferences[`${Preferences.CATEGORY_GROUP_CHANNEL_SHOW}--${channel.id}`];
    if (!gm || gm.value !== 'true') {
        return false;
    }
    return isUnread || !isAutoClosed(config, myPreferences, channel, lastPost ? lastPost.create_at : 0);
}

export function isGroupOrDirectChannelVisible(channel, memberships, config, myPreferences, currentUserId, users, lastPosts) {
    const lastPost = lastPosts[channel.id];
    if (isGroupChannel(channel) && isGroupChannelVisible(config, myPreferences, channel, lastPost, isUnreadChannel(memberships, channel))) {
        return true;
    }
    if (!isDirectChannel(channel)) {
        return false;
    }
    const otherUserId = getUserIdFromChannelName(currentUserId, channel.name);
    return isDirectChannelVisible(users[otherUserId] || otherUserId, config, myPreferences, channel, lastPost, isUnreadChannel(memberships, channel));
}

export function showCreateOption(state, config, license, teamId, channelType, isAdmin, isSystemAdmin) {
    if (hasNewPermissions(state)) {
        if (channelType === General.OPEN_CHANNEL) {
            return haveITeamPerm(state, {team: teamId, perm: Permissions.CREATE_PUBLIC_CHANNEL});
        } else if (channelType === General.PRIVATE_CHANNEL) {
            return haveITeamPerm(state, {team: teamId, perm: Permissions.CREATE_PRIVATE_CHANNEL});
        }
        return true;
    }

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

export function showManagementOptions(state, config, license, channel, isAdmin, isSystemAdmin, isChannelAdmin) {
    if (hasNewPermissions(state)) {
        if (channel.type === General.OPEN_CHANNEL) {
            return haveITeamPerm(state, {team: channel.team_idteamId, perm: Permissions.MANAGE_PUBLIC_CHANNEL_PROPERTIES});
        } else if (channel.type === General.PRIVATE_CHANNEL) {
            return haveITeamPerm(state, {team: channel.team_id, perm: Permissions.MANAGE_PRIVATE_CHANNEL_PROPERTIES});
        }
        return true;
    }

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

export function showDeleteOption(state, config, license, channel, isAdmin, isSystemAdmin, isChannelAdmin) {
    if (hasNewPermissions(state)) {
        if (channel.type === General.OPEN_CHANNEL) {
            return haveITeamPerm(state, {team: channel.team_idteamId, perm: Permissions.DELETE_PUBLIC_CHANNEL});
        } else if (channel.type === General.PRIVATE_CHANNEL) {
            return haveITeamPerm(state, {team: channel.team_id, perm: Permissions.DELETE_PRIVATE_CHANNEL});
        }
        return true;
    }

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

export function getGroupDisplayNameFromUserIds(userIds, profiles, currentUserId, teammateNameDisplay) {
    const names = [];
    userIds.forEach((id) => {
        if (id !== currentUserId) {
            names.push(displayUsername(profiles[id], teammateNameDisplay));
        }
    });

    function sortUsernames(a, b) {
        const locale = getUserLocale(currentUserId, profiles);
        return a.localeCompare(b, locale, {numeric: true});
    }

    return names.sort(sortUsernames).join(', ');
}

export function isFavoriteChannel(myPreferences, id) {
    const fav = myPreferences[`${Preferences.CATEGORY_FAVORITE_CHANNEL}--${id}`];
    return fav && fav.value === 'true';
}

export function isDefault(channel) {
    return channel.name === General.DEFAULT_CHANNEL;
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

function completeDirectGroupInfo(usersState, teammateNameDisplay, channel) {
    const {currentUserId, profiles, profilesInChannel} = usersState;
    const profilesIds = profilesInChannel[channel.id];
    const gm = {...channel};

    if (profilesIds) {
        return Object.assign(gm, {
            display_name: getGroupDisplayNameFromUserIds(profilesIds, profiles, currentUserId, teammateNameDisplay)
        });
    }

    const usernames = gm.display_name.split(', ');
    const users = Object.values(profiles);
    const userIds = [];
    usernames.forEach((username) => {
        const u = users.find((p) => p.username === username);
        if (u) {
            userIds.push(u.id);
        }
    });
    if (usernames.length === userIds.length) {
        return Object.assign(gm, {
            display_name: getGroupDisplayNameFromUserIds(userIds, profiles, currentUserId, teammateNameDisplay)
        });
    }

    return channel;
}

function isDirectChannelForUser(userId, otherUserId, channel) {
    return channel.type === General.DM_CHANNEL && getUserIdFromChannelName(userId, channel.name) === otherUserId;
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

export function isOpenChannel(channel) {
    return channel.type === General.OPEN_CHANNEL;
}

export function isPrivateChannel(channel) {
    return channel.type === General.PRIVATE_CHANNEL;
}

export function sortChannelsByTypeAndDisplayName(locale, a, b) {
    if (channelTypeOrder[a.type] !== channelTypeOrder[b.type]) {
        if (channelTypeOrder[a.type] < channelTypeOrder[b.type]) {
            return -1;
        }

        return 1;
    }

    const aDisplayName = filterName(a.display_name);
    const bDisplayName = filterName(b.display_name);

    if (aDisplayName !== bDisplayName) {
        return aDisplayName.toLowerCase().localeCompare(bDisplayName.toLowerCase(), locale, {numeric: true});
    }

    return a.name.toLowerCase().localeCompare(b.name.toLowerCase(), locale, {numeric: true});
}

function filterName(name) {
    return name.replace(/[.,'"\/#!$%\^&\*;:{}=\-_`~()]/g, ''); // eslint-disable-line no-useless-escape
}

export function sortChannelsByDisplayName(locale, a, b) {
    if (a.display_name !== b.display_name) {
        return a.display_name.toLowerCase().localeCompare(b.display_name.toLowerCase(), locale, {numeric: true});
    }

    return a.name.toLowerCase().localeCompare(b.name.toLowerCase(), locale, {numeric: true});
}

function not(f) {
    return (...args) => !f(...args);
}

function buildChannels(usersState, channels, missingDirectChannels, teammateNameDisplay, locale) {
    return channels.
    concat(missingDirectChannels).
    map(completeDirectChannelInfo.bind(null, usersState, teammateNameDisplay)).
    filter(isNotDeletedChannel).
    sort(sortChannelsByTypeAndDisplayName.bind(null, locale));
}

function buildFavoriteChannels(channels, myPreferences, locale) {
    return channels.filter((channel) => isFavoriteChannel(myPreferences, channel.id)).sort(sortChannelsByDisplayName.bind(null, locale));
}

function buildNotFavoriteChannels(channels, myPreferences) {
    return channels.filter((channel) => !isFavoriteChannel(myPreferences, channel.id));
}

function buildDirectAndGroupChannels(channels, memberships, config, myPreferences, currentUserId, users, lastPosts) {
    return channels.filter((channel) => {
        return isGroupOrDirectChannelVisible(channel, memberships, config, myPreferences, currentUserId, users, lastPosts);
    });
}

function buildChannelsWithMentions(channels, members, locale) {
    return channels.filter(channelHasMentions.bind(null, members)).
    sort(sortChannelsByDisplayName.bind(null, locale));
}

function buildUnreadChannels(channels, members, locale) {
    return channels.filter(channelHasUnreadMessages.bind(null, members)).
        sort(sortChannelsByDisplayName.bind(null, locale));
}

function getUserLocale(userId, profiles) {
    let locale = 'en';
    if (profiles && profiles[userId] && profiles[userId].locale) {
        locale = profiles[userId].locale;
    }

    return locale;
}
