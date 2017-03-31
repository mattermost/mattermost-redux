// Copyright (c) 2016 Mattermost, Inc. All Rights Reserved.
// See License.txt for license information.

import {General, Preferences} from '../constants';
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

    const channels = allChannels.
    concat(missingDirectChannels).
    map(completeDirectChannelInfo.bind(null, usersState, myPreferences)).
    filter(isNotDeletedChannel).
    sort(sortChannelsByDisplayName.bind(null, locale));

    const favoriteChannels = channels.filter(isFavoriteChannel.bind(null, myPreferences)).sort(sortFavorites.bind(null, locale));
    const notFavoriteChannels = channels.filter(not(isFavoriteChannel.bind(null, myPreferences)));
    const directAndGroupChannels = notFavoriteChannels.filter(orX(andX(
        isGroupChannel,
        isGroupChannelVisible.bind(null, myPreferences)
    ), andX(
        isDirectChannel,
        isDirectChannelVisible.bind(null, currentUserId, myPreferences)
    )));

    return {
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

export function getNotMemberChannels(allChannels, myMembers) {
    return allChannels.filter(not(isNotMemberOf.bind(this, myMembers)));
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
    const directChannelsDisplayPreferences = getPreferencesByCategory(myPreferences, General.CATEGORY_DIRECT_CHANNEL_SHOW);

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
    const fav = myPreferences[`${General.CATEGORY_FAVORITE_CHANNEL}--${channel.id}`];
    channel.isFavorite = fav && fav.value === 'true';
    return channel.isFavorite;
}

function isNotDeletedChannel(channel) {
    return channel.delete_at === 0;
}

function isNotMemberOf(myMembers, channel) {
    return myMembers[channel.id];
}

function isOpenChannel(channel) {
    return channel.type === General.OPEN_CHANNEL;
}

function isPrivateChannel(channel) {
    return channel.type === General.PRIVATE_CHANNEL;
}

function sortChannelsByDisplayName(locale, a, b) {
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
