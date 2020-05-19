// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {combineReducers} from 'redux';

import {CategoryTypes} from '../../constants/channel_categories';

import {ChannelCategoryTypes, TeamTypes, UserTypes, ChannelTypes} from 'action_types';

import {GenericAction} from 'types/actions';
import {ChannelCategory, CategorySorting} from 'types/channel_categories';
import {Team, TeamMembership} from 'types/teams';
import {$ID, IDMappedObjects, RelationOneToOne} from 'types/utilities';

import {removeItem} from 'utils/array_utils';

export function byId(state: IDMappedObjects<ChannelCategory> = {}, action: GenericAction) {
    switch (action.type) {
    case TeamTypes.RECEIVED_MY_TEAM_MEMBER: {
        // This will be removed once categories are sent by the server
        const member: TeamMembership = action.data;

        // Note that this adds new categories before state to prevent overwriting existing categories
        return {
            ...makeDefaultCategories(member.team_id),
            ...state,
        };
    }
    case TeamTypes.RECEIVED_MY_TEAM_MEMBERS: {
        // This will be removed once categories are sent by the server
        const members: TeamMembership[] = action.data;

        return members.reduce((nextState, member) => {
            // Note that this adds new categories before state to prevent overwriting existing categories
            return {
                ...makeDefaultCategories(member.team_id),
                ...nextState,
            };
        }, state);
    }

    case ChannelCategoryTypes.RECEIVED_CATEGORIES: {
        const categories: ChannelCategory[] = action.data;

        return categories.reduce((nextState, category) => {
            return {
                ...nextState,
                [category.id]: {
                    ...nextState[category.id],
                    ...category,
                },
            };
        }, state);
    }
    case ChannelCategoryTypes.RECEIVED_CATEGORY: {
        const category: ChannelCategory = action.data;

        return {
            ...state,
            [category.id]: {
                ...state[category.id],
                ...category,
            },
        };
    }

    case ChannelCategoryTypes.CATEGORY_DELETED: {
        const categoryId: $ID<ChannelCategory> = action.data;

        const nextState = {...state};

        Reflect.deleteProperty(nextState, categoryId);

        return nextState;
    }

    case ChannelTypes.LEAVE_CHANNEL: {
        const channelId: string = action.data.id;

        const nextState = {...state};
        let changed = false;

        for (const category of Object.values(state)) {
            const index = category.channel_ids.indexOf(channelId);

            if (index === -1) {
                continue;
            }

            const nextChannelIds = [...category.channel_ids];
            nextChannelIds.splice(index, 1);

            nextState[category.id] = {
                ...category,
                channel_ids: nextChannelIds,
            };

            changed = true;
        }

        return changed ? nextState : state;
    }
    case TeamTypes.LEAVE_TEAM: {
        const team: Team = action.data;

        const nextState = {...state};
        let changed = false;

        for (const category of Object.values(state)) {
            if (category.team_id !== team.id) {
                continue;
            }

            Reflect.deleteProperty(nextState, category.id);
            changed = true;
        }

        return changed ? nextState : state;
    }

    case UserTypes.LOGOUT_SUCCESS:
        return {};
    default:
        return state;
    }
}

export function orderByTeam(state: RelationOneToOne<Team, $ID<ChannelCategory>[]> = {}, action: GenericAction) {
    switch (action.type) {
    case TeamTypes.RECEIVED_MY_TEAM_MEMBER: {
        // This will be removed once categories are sent by the server
        const member: TeamMembership = action.data;

        if (state[member.team_id]) {
            return state;
        }

        return {
            ...state,
            [member.team_id]: makeDefaultCategoryIds(member.team_id),
        };
    }
    case TeamTypes.RECEIVED_MY_TEAM_MEMBERS: {
        // This will be removed once categories are sent by the server
        const members: TeamMembership[] = action.data;

        return members.reduce((nextState, member) => {
            if (state[member.team_id]) {
                return nextState;
            }

            return {
                ...nextState,
                [member.team_id]: makeDefaultCategoryIds(member.team_id),
            };
        }, state);
    }

    case ChannelCategoryTypes.RECEIVED_CATEGORY_ORDER: {
        const teamId: string = action.data.teamId;
        const categoryIds: string[] = action.data.categoryIds;

        return {
            ...state,
            [teamId]: categoryIds,
        };
    }

    case ChannelCategoryTypes.CATEGORY_DELETED: {
        const categoryId: $ID<ChannelCategory> = action.data;

        const nextState = {...state};

        for (const teamId of Object.keys(nextState)) {
            // removeItem only modifies the array if it contains the category ID, so other teams' state won't be modified
            nextState[teamId] = removeItem(state[teamId], categoryId);
        }

        return nextState;
    }

    case TeamTypes.LEAVE_TEAM: {
        const team: Team = action.data;

        if (!state[team.id]) {
            return state;
        }

        const nextState = {...state};
        Reflect.deleteProperty(nextState, team.id);

        return nextState;
    }

    case UserTypes.LOGOUT_SUCCESS:
        return {};
    default:
        return state;
    }
}

function makeDefaultCategoryIds(teamId: string): $ID<ChannelCategory>[] {
    return Object.keys(makeDefaultCategories(teamId));
}

function makeDefaultCategories(teamId: string): IDMappedObjects<ChannelCategory> {
    return {
        [`${teamId}-favorites`]: {
            id: `${teamId}-favorites`,
            team_id: teamId,
            type: CategoryTypes.FAVORITES,
            display_name: 'Favorites',
            sorting: CategorySorting.Default,
            channel_ids: [],
        },
        [`${teamId}-channels`]: {
            id: `${teamId}-channels`,
            team_id: teamId,
            type: CategoryTypes.CHANNELS,
            display_name: 'Channels',
            sorting: CategorySorting.Default,
            channel_ids: [],
        },
        [`${teamId}-direct_messages`]: {
            id: `${teamId}-direct_messages`,
            team_id: teamId,
            type: CategoryTypes.DIRECT_MESSAGES,
            display_name: 'Direct Messages',
            sorting: CategorySorting.Alphabetical,
            channel_ids: [],
        },
    };
}

export default combineReducers({
    byId,
    orderByTeam,
});
