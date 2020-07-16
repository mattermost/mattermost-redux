// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {ChannelCategoryTypes} from 'action_types';

import {Client4} from 'client';

import {unfavoriteChannel, favoriteChannel} from 'actions/channels';
import {logError} from 'actions/errors';
import {forceLogoutIfNecessary} from 'actions/helpers';

import {General} from '../constants';
import {CategoryTypes} from 'constants/channel_categories';

import {
    getAllCategoriesByIds,
    getCategory,
    getCategoryIdsForTeam,
    getCategoryInTeamByType,
    getCategoryInTeamWithChannel,
} from 'selectors/entities/channel_categories';
import {makeGetChannelsForIds} from 'selectors/entities/channels';
import {getCurrentUserId} from 'selectors/entities/users';

import {
    ActionFunc,
    Action,
    batchActions,
    DispatchFunc,
    GetStateFunc,
} from 'types/actions';
import {CategorySorting, OrderedChannelCategories} from 'types/channel_categories';
import {Channel} from 'types/channels';
import {$ID} from 'types/utilities';

import {insertWithoutDuplicates, removeItem} from 'utils/array_utils';

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
    return async (dispatch: DispatchFunc, getState: GetStateFunc) => {
        const state = getState();
        const currentUserId = getCurrentUserId(state);
        const category = getCategory(state, categoryId);

        let updatedCategory;
        try {
            updatedCategory = await Client4.updateChannelCategory(currentUserId, category.team_id, {
                ...category,
                sorting,
            });
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch, getState);
            dispatch(logError(error));
            return {error};
        }

        return dispatch({
            type: ChannelCategoryTypes.RECEIVED_CATEGORY,
            data: updatedCategory,
        });
    };
}

export function fetchMyCategories(teamId: string) {
    return async (dispatch: DispatchFunc, getState: GetStateFunc) => {
        const currentUserId = getCurrentUserId(getState());

        let data: OrderedChannelCategories;
        try {
            data = await Client4.getChannelCategories(currentUserId, teamId);
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch, getState);
            dispatch(logError(error));
            return {error};
        }

        return dispatch(batchActions([
            {
                type: ChannelCategoryTypes.RECEIVED_CATEGORIES,
                data: data.categories,
            },
            {
                type: ChannelCategoryTypes.RECEIVED_CATEGORY_ORDER,
                data: {
                    teamId,
                    order: data.order,
                },
            },
        ]));
    };
}

// addChannelToInitialCategory returns an action that can be dispatched to add a newly-joined or newly-created channel
// to its either the Channels or Direct Messages category based on the type of channel. New DM and GM channels are
// added to the Direct Messages category on each team.
//
// Unless setOnServer is true, this only affects the categories on this client. If it is set to true, this updates
// categories on the server too.
export function addChannelToInitialCategory(channel: Channel, setOnServer = false): ActionFunc {
    return (dispatch: DispatchFunc, getState: GetStateFunc) => {
        const state = getState();
        const categories = Object.values(getAllCategoriesByIds(state));

        if (channel.type === General.DM_CHANNEL || channel.type === General.GM_CHANNEL) {
            // Add the new channel to the DM category on each team
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
        if (categories.some((category) => category.channel_ids.some((channelId) => channelId === channel.id))) {
            return {data: false};
        }
        const channelsCategory = getCategoryInTeamByType(state, channel.team_id, CategoryTypes.CHANNELS);

        if (!channelsCategory) {
            // No categories were found for this team, so the categories for this team haven't been loaded yet.
            // The channel will have been added to the category by the server, so we'll get it once the categories
            // are actually loaded.
            return {data: false};
        }

        if (setOnServer) {
            return dispatch(addChannelToCategory(channelsCategory.id, channel.id));
        }

        return dispatch({
            type: ChannelCategoryTypes.RECEIVED_CATEGORY,
            data: {
                ...channelsCategory,
                channel_ids: insertWithoutDuplicates(channelsCategory.channel_ids, channel.id, 0),
            },
        });
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
    return async (dispatch: DispatchFunc, getState: GetStateFunc) => {
        const state = getState();
        const category = getCategory(state, categoryId);
        const currentUserId = getCurrentUserId(state);

        // Add the channel to the new category
        const categories = [{
            ...category,
            sorting: (setManualSorting && category.type !== CategoryTypes.DIRECT_MESSAGES) ? CategorySorting.Manual : category.sorting,
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

        let data;
        try {
            data = await Client4.updateChannelCategories(currentUserId, category.team_id, categories);
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch, getState);
            dispatch(logError(error));
            return {error};
        }

        // And update the favorite preferences locally on the client in case we have any logic relying on that
        if (category.type === CategoryTypes.FAVORITES) {
            await dispatch(favoriteChannel(channelId, false));
        } else if (originalCategory && originalCategory.type === CategoryTypes.FAVORITES) {
            await dispatch(unfavoriteChannel(channelId, false));
        }

        return dispatch({
            type: ChannelCategoryTypes.RECEIVED_CATEGORIES,
            data,
        });
    };
}

export function moveCategory(teamId: string, categoryId: string, newIndex: number) {
    return async (dispatch: DispatchFunc, getState: GetStateFunc) => {
        const state = getState();
        const order = getCategoryIdsForTeam(state, teamId)!;
        const currentUserId = getCurrentUserId(state);

        const newOrder = insertWithoutDuplicates(order, categoryId, newIndex);

        let updatedOrder;
        try {
            updatedOrder = await Client4.updateChannelCategoryOrder(currentUserId, teamId, newOrder);
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch, getState);
            dispatch(logError(error));
            return {error};
        }

        return dispatch({
            type: ChannelCategoryTypes.RECEIVED_CATEGORY_ORDER,
            data: {
                teamId,
                order: updatedOrder,
            },
        });
    };
}

export function createCategory(teamId: string, displayName: string, channelIds: $ID<Channel>[] = []): ActionFunc {
    return async (dispatch: DispatchFunc, getState: GetStateFunc) => {
        const currentUserId = getCurrentUserId(getState());

        let newCategory;
        try {
            newCategory = await Client4.createChannelCategory(currentUserId, teamId, {
                team_id: teamId,
                user_id: currentUserId,
                display_name: displayName,
                channel_ids: channelIds,
            });
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch, getState);
            dispatch(logError(error));
            return {error};
        }

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
                    order: newCategoryIds,
                },
            },
        ]));

        return {data: newCategory};
    };
}

export function renameCategory(categoryId: string, displayName: string): ActionFunc {
    return async (dispatch: DispatchFunc, getState: GetStateFunc) => {
        const state = getState();
        const category = getCategory(state, categoryId);
        const currentUserId = getCurrentUserId(state);

        let updatedCategory;
        try {
            updatedCategory = await Client4.updateChannelCategory(currentUserId, category.team_id, {
                ...category,
                display_name: displayName,
            });
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch, getState);
            dispatch(logError(error));
            return {error};
        }

        return dispatch({
            type: ChannelCategoryTypes.RECEIVED_CATEGORY,
            data: updatedCategory,
        });
    };
}

export function deleteCategory(categoryId: string): ActionFunc {
    return async (dispatch: DispatchFunc, getState: GetStateFunc) => {
        let state = getState();
        let category = getCategory(state, categoryId);
        const currentUserId = getCurrentUserId(state);

        try {
            await Client4.deleteChannelCategory(currentUserId, category.team_id, category.id);
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch, getState);
            dispatch(logError(error));
            return {error};
        }

        const actions: Action[] = [{
            type: ChannelCategoryTypes.CATEGORY_DELETED,
            data: categoryId,
        }];

        // Get the category again just in case something has changed since before we sent the request
        state = getState();
        category = getCategory(state, categoryId);

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
