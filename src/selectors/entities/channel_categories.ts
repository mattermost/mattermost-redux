// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {createSelector} from 'reselect';

import {General, Preferences} from '../../constants';
import {CategoryTypes} from '../../constants/channel_categories';

import {getCurrentChannelId, getMyChannelMemberships} from 'selectors/entities/channels';
import {getCurrentUserLocale} from 'selectors/entities/i18n';
import {getLastPostPerChannel} from 'selectors/entities/posts';
import {getMyPreferences, getTeammateNameDisplaySetting, shouldAutocloseDMs} from 'selectors/entities/preferences';
import {getCurrentUserId} from 'selectors/entities/users';

import {Channel} from 'types/channels';
import {ChannelCategory} from 'types/channel_categories';
import {GlobalState} from 'types/store';
import {UserProfile} from 'types/users';
import {IDMappedObjects, RelationOneToOne} from 'types/utilities';

import {getUserIdFromChannelName, isFavoriteChannel, isUnreadChannel} from 'utils/channel_utils';
import {getPreferenceKey} from 'utils/preference_utils';
import {displayUsername} from 'utils/user_utils';

export function getCategoryIdsForTeam(state: GlobalState, teamId: string): string[] | undefined {
    return state.entities.channelCategories.orderByTeam[teamId];
}

export function makeGetCategoriesForTeam(): (state: GlobalState, teamId: string) => ChannelCategory[] {
    return createSelector(
        getCategoryIdsForTeam,
        (state: GlobalState) => state.entities.channelCategories.byId,
        (categoryIds, categoriesById) => {
            if (!categoryIds) {
                return [];
            }

            return categoryIds.map((id) => categoriesById[id]);
        }
    );
}

export function makeGetChannelsForAllCategories(): (state: GlobalState, teamId: string) => Channel[] {
    return createSelector(
        (state: GlobalState) => state.entities.channels.channels,
        (state: GlobalState, teamId: string) => teamId,
        (allChannels: IDMappedObjects<Channel>, teamId: string) => {
            return Object.values(allChannels).filter((channel) => channel.team_id === teamId || channel.team_id === '');
        }
    );
}

export function makeFilterChannelsByFavorites(): (state: GlobalState, channels: Channel[], categoryType: string) => Channel[] {
    return createSelector(
        (state: GlobalState, channels: Channel[]) => channels,
        (state: GlobalState, channels: Channel[], categoryType: string) => categoryType,
        getMyPreferences,
        (channels, categoryType, myPreferences) => {
            const filtered = channels.filter((channel) => {
                if (categoryType === CategoryTypes.FAVORITES) {
                    return isFavoriteChannel(myPreferences, channel.id);
                }

                return !isFavoriteChannel(myPreferences, channel.id);
            });

            return filtered.length === channels.length ? channels : filtered;
        }
    );
}

export function makeFilterChannelsByType(): (state: GlobalState, channels: Channel[], categoryType: string) => Channel[] {
    // This doesn't need to be a selector, but make it as one to keep it consistent
    return createSelector(
        (state: GlobalState, channels: Channel[]) => channels,
        (state: GlobalState, channels: Channel[], categoryType: string) => categoryType,
        (channels, categoryType) => {
            const filtered = channels.filter((channel) => {
                if (categoryType === CategoryTypes.PUBLIC) {
                    return channel.type === General.OPEN_CHANNEL;
                } else if (categoryType === CategoryTypes.PRIVATE) {
                    return channel.type === General.PRIVATE_CHANNEL;
                } else if (categoryType === CategoryTypes.DIRECT_MESSAGES) {
                    return channel.type === General.DM_CHANNEL || channel.type === General.GM_CHANNEL;
                }

                return true;
            });

            return filtered.length === channels.length ? channels : filtered;
        }
    );
}

function getDefaultAutocloseCutoff() {
    return Date.now() - 7 * 24 * 60 * 60 * 1000;
}

export function makeFilterAutoclosedDMs(getAutocloseCutoff = getDefaultAutocloseCutoff): (state: GlobalState, channels: Channel[], categoryType: string) => Channel[] {
    return createSelector(
        (state: GlobalState, channels: Channel[]) => channels,
        (state: GlobalState, channels: Channel[], categoryType: string) => categoryType,
        getMyPreferences,
        shouldAutocloseDMs,
        getCurrentChannelId,
        (state: GlobalState) => state.entities.users.profiles,
        getCurrentUserId,
        getMyChannelMemberships,
        getLastPostPerChannel,
        (channels, categoryType, myPreferences, autocloseDMs, currentChannelId, profiles, currentUserId, myChannelMembers, lastPosts) => {
            if (categoryType !== CategoryTypes.DIRECT_MESSAGES) {
                // Only autoclose DMs that haven't been assigned to a category
                return channels;
            }

            // Ideally, this would come from a selector, but that would cause the filter to recompute too often
            const cutoff = getAutocloseCutoff();

            const filtered = channels.filter((channel) => {
                if (channel.type !== General.DM_CHANNEL && channel.type !== General.GM_CHANNEL) {
                    return true;
                }

                // Unread channels will never be hidden
                if (isUnreadChannel(myChannelMembers, channel)) {
                    return true;
                }

                // viewTime is the time the channel was last viewed by the user
                const viewTimePref = myPreferences[getPreferenceKey(Preferences.CATEGORY_CHANNEL_APPROXIMATE_VIEW_TIME, channel.id)];
                const viewTime = parseInt(viewTimePref ? viewTimePref.value! : '0', 10);

                // Recently viewed channels will never be hidden. Note that viewTime is not set correctly at the time of writing.
                if (viewTime > cutoff) {
                    return true;
                }

                // openTime is the time the channel was last opened (like from the More DMs list) after having been closed
                const openTimePref = myPreferences[getPreferenceKey(Preferences.CATEGORY_CHANNEL_OPEN_TIME, channel.id)];
                const openTime = parseInt(openTimePref ? openTimePref.value! : '0', 10);

                // DMs with deactivated users will be visible if you're currently viewing them and they were opened
                // since the user was deactivated
                if (channel.type === General.DM_CHANNEL && channel.id !== currentChannelId) {
                    const teammateId = getUserIdFromChannelName(currentUserId, channel.name);
                    const teammate = profiles[teammateId];

                    if (!teammate || teammate.delete_at > openTime) {
                        return false;
                    }
                }

                // Skip the rest of the checks if autoclosing inactive DMs is disabled
                if (!autocloseDMs) {
                    return true;
                }

                // Keep the channel open if it had a recent post. If we have posts loaded for the channel, use the create_at
                // of the last post in the channel since channel.last_post_at isn't kept up to date on the client. If we don't
                // have posts loaded, then fall back to the last_post_at.
                const lastPost = lastPosts[channel.id];

                if (lastPost && lastPost.create_at > cutoff) {
                    return true;
                }

                if (openTime > cutoff) {
                    return true;
                }

                if (channel.last_post_at && channel.last_post_at > cutoff) {
                    return true;
                }

                return false;
            });

            return filtered.length === channels.length ? channels : filtered;
        }
    );
}

export function makeFilterManuallyClosedDMs(): (state: GlobalState, channels: Channel[]) => Channel[] {
    return createSelector(
        (state: GlobalState, channels: Channel[]) => channels,
        getMyPreferences,
        getCurrentUserId,
        (channels, myPreferences, currentUserId) => {
            const filtered = channels.filter((channel) => {
                let preference;

                if (channel.type !== General.DM_CHANNEL && channel.type !== General.GM_CHANNEL) {
                    return true;
                }

                if (channel.type === General.DM_CHANNEL) {
                    const teammateId = getUserIdFromChannelName(currentUserId, channel.name);

                    preference = myPreferences[getPreferenceKey(Preferences.CATEGORY_DIRECT_CHANNEL_SHOW, teammateId)];
                } else {
                    preference = myPreferences[getPreferenceKey(Preferences.CATEGORY_GROUP_CHANNEL_SHOW, channel.id)];
                }

                return preference && preference.value !== 'false';
            });

            // Only return a new array if anything was removed
            return filtered.length === channels.length ? channels : filtered;
        }
    );
}

export function makeSortChannelsByName(): (state: GlobalState, channels: Channel[]) => Channel[] {
    return createSelector(
        (state: GlobalState, channels: Channel[]) => channels,
        getCurrentUserLocale,
        (channels: Channel[], locale: string) => {
            const sorted = [...channels];
            sorted.sort((a, b) => a.display_name.localeCompare(b.display_name, locale, {numeric: true}));
            return sorted;
        }
    );
}

export function makeSortChannelsByNameWithDMs(): (state: GlobalState, channels: Channel[]) => Channel[] {
    return createSelector(
        (state: GlobalState, channels: Channel[]) => channels,
        getCurrentUserId,
        (state: GlobalState) => state.entities.users.profiles,
        getTeammateNameDisplaySetting,
        getCurrentUserLocale,
        (channels: Channel[], currentUserId: string, profiles: IDMappedObjects<UserProfile>, teammateNameDisplay: string, locale: string) => {
            const cachedNames: RelationOneToOne<Channel, string> = {};

            const getDisplayName = (channel: Channel): string => {
                if (cachedNames[channel.id]) {
                    return cachedNames[channel.id];
                }

                let displayName;

                // TODO it might be easier to do this by using channel members to find the users
                if (channel.type === General.DM_CHANNEL) {
                    const teammateId = getUserIdFromChannelName(currentUserId, channel.name);
                    const teammate = profiles[teammateId];

                    displayName = displayUsername(teammate, teammateNameDisplay, false);
                } else if (channel.type === General.GM_CHANNEL) {
                    const usernames = channel.display_name.split(', ');

                    const userDisplayNames = [];
                    for (const username of usernames) {
                        const user = Object.values(profiles).find((profile) => profile.username === username);

                        if (!user) {
                            continue;
                        }

                        if (user.id === currentUserId) {
                            continue;
                        }

                        userDisplayNames.push(displayUsername(user, teammateNameDisplay, false));
                    }

                    displayName = userDisplayNames.sort((a, b) => a.localeCompare(b, locale, {numeric: true})).join(', ');
                } else {
                    displayName = channel.display_name;
                }

                cachedNames[channel.id] = displayName;

                return displayName;
            };

            const sorted = [...channels];
            sorted.sort((a, b) => getDisplayName(a).localeCompare(getDisplayName(b), locale, {numeric: true}));
            return sorted;
        }
    );
}

export function makeGetChannelsForCategory() {
    const getChannelsForAllCategories = makeGetChannelsForAllCategories();
    const filterChannelsByFavorites = makeFilterChannelsByFavorites();

    const filterChannelsByType = makeFilterChannelsByType();
    const filterAutoclosedDMs = makeFilterAutoclosedDMs();
    const filterManuallyClosedDMs = makeFilterManuallyClosedDMs();

    const sortChannelsByName = makeSortChannelsByName();
    const sortChannelsByNameWithDMs = makeSortChannelsByNameWithDMs();

    return (state: GlobalState, category: ChannelCategory) => {
        let channels = getChannelsForAllCategories(state, category.team_id);

        channels = filterChannelsByFavorites(state, channels, category.type);

        channels = filterChannelsByType(state, channels, category.type);

        channels = filterAutoclosedDMs(state, channels, category.type);

        channels = filterManuallyClosedDMs(state, channels);

        if (channels.some((channel) => channel.type === General.DM_CHANNEL || channel.type === General.GM_CHANNEL)) {
            channels = sortChannelsByNameWithDMs(state, channels);
        } else {
            channels = sortChannelsByName(state, channels);
        }

        return channels;
    };
}
