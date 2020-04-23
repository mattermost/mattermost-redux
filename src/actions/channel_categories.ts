// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {ChannelCategoryTypes} from 'action_types';

import {fetchMyChannelsAndMembers} from 'actions/channels';

import {General} from '../constants';

import {
    makeGetCategoriesForTeam,
    makeSortChannelsByNameWithDMs,
    makeSortChannelsByName,
} from 'selectors/entities/channel_categories';
import {getAllChannels, getMyChannelMemberships} from 'selectors/entities/channels';
import {getMyPreferences} from 'selectors/entities/preferences';

import {DispatchFunc, GetStateFunc} from 'types/actions';
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
            return;
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
    };
}
