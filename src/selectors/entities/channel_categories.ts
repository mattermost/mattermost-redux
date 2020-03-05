// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {createSelector} from 'reselect';

import {General, Preferences} from '../../constants';
import {CategoryTypes} from '../../constants/channel_categories';

import {getCurrentChannelId} from 'selectors/entities/channels';
import {getCurrentUserLocale} from 'selectors/entities/i18n';
import {getTeammateNameDisplaySetting, shouldAutocloseDMs} from 'selectors/entities/preferences';
import {getCurrentUserId} from 'selectors/entities/users';

import {Channel} from 'types/channels';
import {ChannelCategory} from 'types/channel_categories';
import {GlobalState} from 'types/store';
import {UserProfile} from 'types/users';
import {IDMappedObjects, RelationOneToOne} from 'types/utilities';

import {getUserIdFromChannelName, isFavoriteChannel} from 'utils/channel_utils';
import {getPreferenceKey} from 'utils/preference_utils';
import {displayUsername} from 'utils/user_utils';

export function getCategoryIdsForTeam(state: GlobalState, teamId: string): string[] | undefined {
    return state.entities.channelCategories.orderByTeam[teamId];
}

export function makeGetCategoriesForTeam() {
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

export function makeGetChannelsForAllCategories() {
    return createSelector(
        (state: GlobalState) => state.entities.channels.channels,
        (state: GlobalState, teamId: string) => teamId,
        (allChannels: IDMappedObjects<Channel>, teamId: string) => {
            return Object.values(allChannels).filter((channel) => channel.team_id === teamId || channel.team_id === '');
        }
    );
}

export function makeFilterChannelsByFavorites() {
    return createSelector(
        (state: GlobalState, channels: Channel[]) => channels,
        (state: GlobalState, channels: Channel[], categoryType: string) => categoryType,
        (state: GlobalState) => state.entities.preferences.myPreferences,
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

export function makeFilterChannelsByType() {
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

export function makeFilterAutoclosedDMs() {
    return createSelector(
        (state: GlobalState, channels: Channel[]) => channels,
        (state: GlobalState, channels: Channel[], categoryType: string) => categoryType,
        (state: GlobalState) => state.entities.preferences.myPreferences,
        shouldAutocloseDMs,
        getCurrentChannelId,
        (channels, categoryType, myPreferences, autocloseDMs, currentChannelId) => {
            if (categoryType !== CategoryTypes.DIRECT_MESSAGES) {
                // Only autoclose DMs that haven't been assigned to a category
                return channels;
            }

            // TODO check if Preferences.CATEGORY_CHANNEL_APPROXIMATE_VIEW_TIME > now - 7 days to keep open
            // TODO check if Preferences.CATEGORY_CHANNEL_OPEN_TIME > now - 7 days to keep open
            // TODO check if teammate.delete_at > Preferences.CATEGORY_CHANNEL_OPEN_TIME to auto close if not current channel
            // TODO check if lastPost.create_at > now - 7 days to keep open
            // TODO check if channel.last_post_at > now - 7 days to keep open
            // TODO don't autoclose favorited channel, except if teammate was deleted since last opened and not current channel
            // TODO don't autoclose if autocloseDMs is false, except if teammate was deleted since last opened and not current channel

            return channels;
        }
    );
}

export function makeFilterManuallyClosedDMs() {
    return createSelector(
        (state: GlobalState, channels: Channel[]) => channels,
        (state: GlobalState) => state.entities.preferences.myPreferences,
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
