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
import {getAllChannels, getMyChannelMemberships, makeGetChannelsForIds} from 'selectors/entities/channels';
import {getMyPreferences} from 'selectors/entities/preferences';

import {
    ActionFunc,
    Action,
    batchActions,
    DispatchFunc,
    GetStateFunc,
} from 'types/actions';
import {CategorySorting, ChannelCategory} from 'types/channel_categories';
import {Channel} from 'types/channels';
import {$ID} from 'types/utilities';

import {insertWithoutDuplicates, removeItem} from 'utils/array_utils';
import {isFavoriteChannel} from 'utils/channel_utils';
import {generateId} from 'utils/helpers';

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
    return moveChannelToCategory(categoryId, channelId, 0, false);
}

// moveChannelToCategory returns an action that moves a channel into a category and puts it at the given index at the
// category. The channel will also be removed from its previous category (if any) on that category's team. The category's
// order will also be set to manual by default.
export function moveChannelToCategory(categoryId: string, channelId: string, newIndex: number, setManualSorting = true) {
    return (dispatch: DispatchFunc, getState: GetStateFunc) => {
        const category = getCategory(getState(), categoryId);

        // Add the channel to the new category
        const categories = [{
            ...category,
            sorting: setManualSorting ? CategorySorting.Manual : category.sorting,
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

export function moveCategory(teamId: string, categoryId: string, newIndex: number) {
    return (dispatch: DispatchFunc, getState: GetStateFunc) => {
        const order = getCategoryIdsForTeam(getState(), teamId)!;

        return dispatch({
            type: ChannelCategoryTypes.RECEIVED_CATEGORY_ORDER,
            data: {
                teamId,
                categoryIds: insertWithoutDuplicates(order, categoryId, newIndex),
            },
        });
    };
}

export function createCategory(teamId: string, displayName: string, channelIds: $ID<Channel>[] = []): ActionFunc {
    return (dispatch: DispatchFunc, getState: GetStateFunc) => {
        // TODO contact the server to do this

        const newCategory: ChannelCategory = {
            id: generateId(),
            team_id: teamId,
            type: CategoryTypes.CUSTOM,
            display_name: displayName,
            sorting: CategorySorting.Default,
            channel_ids: channelIds,
        };

        const state = getState();

        const categoryIds = getCategoryIdsForTeam(state, teamId);
        const favoritesIsFirst = categoryIds.length > 0 && getCategory(state, categoryIds[0]).type === CategoryTypes.FAVORITES;

        const newCategoryIds = [...categoryIds];

        // Place the new category relative to other categories
        if (favoritesIsFirst) {
            // Place the new category after the favorites category if it comes first
            newCategoryIds.splice(1, 0, newCategory.id);
        } else {
            // Place the new category first
            newCategoryIds.unshift(newCategory.id);
        }

        const categoriesToUpdate = [newCategory];

        // Remove the provided channels from any existing categories they may have existed in
        if (channelIds.length > 0) {
            for (const categoryId of categoryIds) {
                const category = getCategory(state, categoryId);

                // Only modify categories that have to be changed
                if (category.channel_ids.some((channelId) => channelIds.includes(channelId))) {
                    categoriesToUpdate.push({
                        ...category,
                        channel_ids: category.channel_ids.filter((channelId) => !channelIds.includes(channelId)),
                    });
                }
            }
        }

        dispatch(batchActions([
            {
                type: ChannelCategoryTypes.RECEIVED_CATEGORIES,
                data: categoriesToUpdate,
            },
            {
                type: ChannelCategoryTypes.RECEIVED_CATEGORY_ORDER,
                data: {
                    teamId,
                    categoryIds: newCategoryIds,
                },
            },
        ]));

        return {data: newCategory};
    };
}

export function renameCategory(categoryId: string, displayName: string): ActionFunc {
    return (dispatch: DispatchFunc, getState: GetStateFunc) => {
        // TODO actually talk to the server

        const newCategory = {
            ...getCategory(getState(), categoryId),
            display_name: displayName,
        };

        return dispatch({
            type: ChannelCategoryTypes.RECEIVED_CATEGORY,
            data: newCategory,
        });
    };
}

export function deleteCategory(categoryId: string): ActionFunc {
    return (dispatch: DispatchFunc, getState: GetStateFunc) => {
        // TODO actually talk to the server

        const actions: Action[] = [{
            type: ChannelCategoryTypes.CATEGORY_DELETED,
            data: categoryId,
        }];

        const state = getState();
        const category = getCategory(state, categoryId);

        // Remove the channels from this category and add them to their default Channels/Direct Messages categories
        if (category.channel_ids.length > 0) {
            const channels = makeGetChannelsForIds()(state, category.channel_ids);

            const channelsCategory = getCategoryInTeamByType(state, category.team_id, CategoryTypes.CHANNELS);
            const dmsCategory = getCategoryInTeamByType(state, category.team_id, CategoryTypes.DIRECT_MESSAGES);

            const nextChannelsCategory = {
                ...channelsCategory,
                channel_ids: [...channelsCategory?.channel_ids],
            };
            const nextDmsCategory = {
                ...dmsCategory,
                channel_ids: [...dmsCategory?.channel_ids],
            };

            for (const channel of channels) {
                if (channel.type === General.DM_CHANNEL || channel.type === General.GM_CHANNEL) {
                    nextDmsCategory.channel_ids = insertWithoutDuplicates(nextDmsCategory.channel_ids, channel.id, 0);
                } else {
                    nextChannelsCategory.channel_ids = insertWithoutDuplicates(nextChannelsCategory.channel_ids, channel.id, 0);
                }
            }

            actions.push({
                type: ChannelCategoryTypes.RECEIVED_CATEGORIES,
                data: [
                    nextDmsCategory,
                    nextChannelsCategory,
                ],
            });
        }

        return dispatch(batchActions(actions));
    };
}
