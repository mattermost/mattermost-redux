// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {ChannelCategoryTypes} from 'action_types';

import {fetchMyChannelsAndMembers, unfavoriteChannel, favoriteChannel} from 'actions/channels';

import {General} from '../constants';
import {CategoryTypes} from 'constants/channel_categories';

import {
    getAllCategoriesByIds,
    getCategory,
    getCategoryIdsForTeam,
    getCategoryInTeamByType,
    getCategoryInTeamWithChannel,
    makeGetCategoriesForTeam,
    makeSortChannelsByNameWithDMs,
    makeSortChannelsByName,
} from 'selectors/entities/channel_categories';
import {getAllChannels, getMyChannelMemberships} from 'selectors/entities/channels';
import {getMyPreferences} from 'selectors/entities/preferences';

import {ActionFunc, DispatchFunc, GetStateFunc} from 'types/actions';
import {CategorySorting} from 'types/channel_categories';
import {Channel} from 'types/channels';

import {isFavoriteChannel} from 'utils/channel_utils';

export function expandCategory(categoryId: string) {
    return {
        type: ChannelCategoryTypes.CATEGORY_EXPANDED,
        data: categoryId,
    };
}

export function collapseCategory(categoryId: string) {
    return {
        type: ChannelCategoryTypes.CATEGORY_COLLAPSED,
        data: categoryId,
    };
}

export function setCategorySorting(categoryId: string, sorting: CategorySorting) {
    return {
        type: ChannelCategoryTypes.RECEIVED_CATEGORY,
        data: {
            id: categoryId,
            sorting,
        },
    };
}

export function fetchMyCategories(teamId: string) {
    return async (dispatch: DispatchFunc, getState: GetStateFunc) => {
        // TODO Actually fetch categories from the server and remove everything below this

        // Wait to load channels needed for this initial state since it's not coming from the server. Note that
        // DMs/GMs aren't loaded yet so they're not sorted correctly
        await dispatch(fetchMyChannelsAndMembers(teamId));

        const state = getState();

        const categories = makeGetCategoriesForTeam()(state, teamId);

        if (categories.some((category) => category.channel_ids.length > 0)) {
            // Only attempt to generate channels for categories once to avoid messing up the clientside state during
            // early testing.
            return {data: true};
        }

        const allChannels = getAllChannels(state);
        const myMembers = getMyChannelMemberships(state);
        const myPreferences = getMyPreferences(state);

        const channelsByCategory: {[categoryId: string]: Channel[]} = {};
        for (const category of categories) {
            channelsByCategory[category.id] = [];
        }

        // Divide the channels into the initial categories. Note that the categories still include archived channels
        // and hidden DMs that must be handled separately.
        for (const channel of Object.values(allChannels)) {
            if (channel.team_id !== teamId && channel.team_id !== '') {
                continue;
            }

            if (!myMembers[channel.id]) {
                continue;
            }

            // Assume category IDs match up with the ones that are generated in the reducer
            let categoryId: string;
            if (isFavoriteChannel(myPreferences, channel.id)) {
                categoryId = `${teamId}-favorites`;
            } else if (channel.type === General.DM_CHANNEL || channel.type === General.GM_CHANNEL) {
                categoryId = `${teamId}-direct_messages`;
            } else {
                categoryId = `${teamId}-channels`;
            }

            channelsByCategory[categoryId].push(channel);
        }

        for (const category of categories) {
            let channels = channelsByCategory[category.id];

            // Assume we've already loaded everything needed to sort the channels even though we likely won't have
            // users loaded for DMs and GMs
            if (channels.some((channel) => channel.type === General.DM_CHANNEL || channel.type === General.GM_CHANNEL)) {
                channels = makeSortChannelsByNameWithDMs()(state, channels);
            } else {
                channels = makeSortChannelsByName()(state, channels);
            }

            dispatch({
                type: ChannelCategoryTypes.RECEIVED_CATEGORY,
                data: {
                    ...category,
                    channel_ids: channels.map((channel) => channel.id),
                },
            });
        }

        return {data: true};
    };
}

// addChannelToInitialCategory returns an action that can be dispatched to add a newly-joined or newly-created channel
// to its either the Channels or Direct Messages category based on the type of channel. New DM and GM channels are
// added to the Direct Messages category on each team.
export function addChannelToInitialCategory(channel: Channel): ActionFunc {
    return (dispatch: DispatchFunc, getState: GetStateFunc) => {
        const state = getState();

        if (channel.type === General.DM_CHANNEL || channel.type === General.GM_CHANNEL) {
            // Add the new channel to the DM category on each team
            const categories = Object.values(getAllCategoriesByIds(state));
            const dmCategories = categories.filter((category) => category.type === CategoryTypes.DIRECT_MESSAGES);

            return dispatch({
                type: ChannelCategoryTypes.RECEIVED_CATEGORIES,
                data: dmCategories.map((category) => ({
                    ...category,
                    channel_ids: insertWithoutDuplicates(category.channel_ids, channel.id, 0),
                })),
            });
        }

        // Add the new channel to the Channels category on the channel's team
        const channelsCategory = getCategoryInTeamByType(state, channel.team_id, CategoryTypes.CHANNELS);

        if (!channelsCategory) {
            // No categories were found for this team, so the categories for this team haven't been loaded yet.
            // The channel will have been added to the category by the server, so we'll get it once the categories
            // are actually loaded.
            return {data: false};
        }

        return dispatch(addChannelToCategory(channelsCategory.id, channel.id));
    };
}

// addChannelToCategory returns an action that can be dispatched to add a channel to a given category without specifying
// its order. The channel will be removed from its previous category (if any) on the given category's team and it will be
// placed first in its new category.
export function addChannelToCategory(categoryId: string, channelId: string): ActionFunc {
    return moveChannelToCategory(categoryId, channelId, 0);
}

export function moveChannelToCategory(categoryId: string, channelId: string, newIndex: number) {
    return (dispatch: DispatchFunc, getState: GetStateFunc) => {
        const category = getCategory(getState(), categoryId);

        // Add the channel to the new category
        const categories = [{
            ...category,
            channel_ids: insertWithoutDuplicates(category.channel_ids, channelId, newIndex),
        }];

        // And remove it from the old category
        const originalCategory = getCategoryInTeamWithChannel(getState(), category.team_id, channelId);
        if (originalCategory && originalCategory.id !== category.id) {
            categories.push({
                ...originalCategory,
                channel_ids: removeItem(originalCategory.channel_ids, channelId),
            });
        }

        // And update the favorite preferences if we're adding or removing the channel from favorites
        if (category.type === CategoryTypes.FAVORITES) {
            dispatch(favoriteChannel(channelId, false));
        } else if (originalCategory && originalCategory.type === CategoryTypes.FAVORITES) {
            dispatch(unfavoriteChannel(channelId, false));
        }

        return dispatch({
            type: ChannelCategoryTypes.RECEIVED_CATEGORIES,
            data: categories,
        });
    };
}

export function moveCategory(categoryId: string, newIndex: number) {
    return (dispatch: DispatchFunc, getState: GetStateFunc) => {
        const category = getCategory(getState(), categoryId);

        const order = getCategoryIdsForTeam(getState(), category.team_id)!;

        return dispatch({
            type: ChannelCategoryTypes.RECEIVED_CATEGORY_ORDER,
            data: insertWithoutDuplicates(order, category.id, newIndex),
        });
    };
}

function insertWithoutDuplicates<T>(array: T[], item: T, newIndex: number) {
    const index = array.indexOf(item);
    if (newIndex === index) {
        // The item doesn't need to be moved since its location hasn't changed
        return array;
    }

    const newArray = [...array];

    // Remove the item from its old location if it already exists in the array
    if (index !== -1) {
        newArray.splice(index, 1);
    }

    // And re-add it in its new location
    newArray.splice(newIndex, 0, item);

    return newArray;
}

function removeItem<T>(array: T[], item: T) {
    const index = array.indexOf(item);
    if (index === -1) {
        return array;
    }

    const result = [...array];
    result.splice(index, 1);
    return result;
}
