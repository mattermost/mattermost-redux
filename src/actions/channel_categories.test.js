// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import nock from 'nock';

import configureStore from 'test/test_store';

import {Client4} from 'client';

import {General} from '../constants';
import {CategoryTypes} from '../constants/channel_categories';

import {getAllCategoriesByIds} from 'selectors/entities/channel_categories';
import {isFavoriteChannel} from 'selectors/entities/channels';

import TestHelper, {DEFAULT_SERVER} from 'test/test_helper';

import {CategorySorting} from 'types/channel_categories';

import * as Actions from './channel_categories';
import {getCategory, getCategoryIdsForTeam} from '../selectors/entities/channel_categories';

const OK_RESPONSE = {status: 'OK'};

beforeAll(() => {
    Client4.setUrl(DEFAULT_SERVER);
});

describe('setCategorySorting', () => {
    test('should set sorting method correctly', async () => {
        const currentUserId = TestHelper.generateId();
        const teamId = TestHelper.generateId();

        const category1 = {id: 'category1', team_id: teamId};

        const store = await configureStore({
            entities: {
                channelCategories: {
                    byId: {
                        category1,
                    },
                },
                users: {
                    currentUserId,
                },
            },
        });

        nock(Client4.getBaseRoute()).
            put(`/users/${currentUserId}/teams/${teamId}/channels/categories/${category1.id}`).
            reply(200, {...category1, sorting: CategorySorting.Recency});

        let result = await store.dispatch(Actions.setCategorySorting('category1', CategorySorting.Recency));

        expect(result.error).toBeUndefined();
        expect(store.getState().entities.channelCategories.byId.category1).toMatchObject({sorting: CategorySorting.Recency});

        nock(Client4.getBaseRoute()).
            put(`/users/${currentUserId}/teams/${teamId}/channels/categories/${category1.id}`).
            reply(200, {...category1, sorting: CategorySorting.Alphabetical});

        result = await store.dispatch(Actions.setCategorySorting('category1', CategorySorting.Alphabetical));

        expect(result.error).toBeUndefined();
        expect(store.getState().entities.channelCategories.byId.category1).toMatchObject({sorting: CategorySorting.Alphabetical});
    });
});

describe('addChannelToInitialCategory', () => {
    test('should add new DM channel to Direct Messages categories on all teams', async () => {
        const store = await configureStore({
            entities: {
                channelCategories: {
                    byId: {
                        dmCategory1: {id: 'dmCategory1', team_id: 'team1', type: CategoryTypes.DIRECT_MESSAGES, channel_ids: ['dmChannel1', 'dmChannel2']},
                        dmCategory2: {id: 'dmCategory2', team_id: 'team2', type: CategoryTypes.DIRECT_MESSAGES, channel_ids: ['dmChannel1', 'dmChannel2']},
                        channelsCategory1: {id: 'channelsCategory1', team_id: 'team1', type: CategoryTypes.CHANNELS, channel_ids: ['publicChannel1', 'privateChannel1']},
                    },
                },
            },
        });

        const newDmChannel = {id: 'newDmChannel', type: General.DM_CHANNEL};

        store.dispatch(Actions.addChannelToInitialCategory(newDmChannel));

        const categoriesById = getAllCategoriesByIds(store.getState());
        expect(categoriesById.dmCategory1.channel_ids).toEqual(['newDmChannel', 'dmChannel1', 'dmChannel2']);
        expect(categoriesById.dmCategory2.channel_ids).toEqual(['newDmChannel', 'dmChannel1', 'dmChannel2']);
        expect(categoriesById.channelsCategory1.channel_ids).not.toContain('newDmChannel');
    });

    test('should do nothing if categories have not been loaded yet for the given team', async () => {
        const store = await configureStore({
            entities: {
                channelCategories: {
                    byId: {
                        channelsCategory1: {id: 'channelsCategory1', team_id: 'team1', type: CategoryTypes.DIRECT_MESSAGES, channel_ids: ['publicChannel1', 'privateChannel1']},
                    },
                    orderByTeam: {
                        team1: ['channelsCategory1'],
                    },
                },
            },
        });

        const publicChannel1 = {id: 'publicChannel1', type: General.OPEN_CHANNEL, team_id: 'team2'};

        store.dispatch(Actions.addChannelToInitialCategory(publicChannel1));

        const categoriesById = getAllCategoriesByIds(store.getState());
        expect(categoriesById.channelsCategory1.channel_ids).toEqual(['publicChannel1', 'privateChannel1']);
    });

    test('should add new channel to Channels category', async () => {
        const store = await configureStore({
            entities: {
                channelCategories: {
                    byId: {
                        channelsCategory1: {id: 'channelsCategory1', team_id: 'team1', type: CategoryTypes.CHANNELS, channel_ids: ['publicChannel1', 'privateChannel1']},
                        dmCategory1: {id: 'dmCategory1', team_id: 'team1', type: CategoryTypes.DIRECT_MESSAGES, channel_ids: ['dmChannel1', 'dmChannel2']},
                        channelsCategory2: {id: 'channelsCategory2', team_id: 'team2', type: CategoryTypes.CHANNELS, channel_ids: ['publicChannel2', 'privateChannel2']},
                    },
                    orderByTeam: {
                        team1: ['channelsCategory1', 'dmCategory1'],
                        team2: ['channelsCategory2'],
                    },
                },
            },
        });

        const newChannel = {id: 'newChannel', type: General.OPEN_CHANNEL, team_id: 'team1'};

        store.dispatch(Actions.addChannelToInitialCategory(newChannel));

        const categoriesById = getAllCategoriesByIds(store.getState());
        expect(categoriesById.channelsCategory1.channel_ids).toEqual(['newChannel', 'publicChannel1', 'privateChannel1']);
        expect(categoriesById.dmCategory1.channel_ids).not.toContain('newChannel');
        expect(categoriesById.channelsCategory2.channel_ids).not.toContain('newChannel');
    });

    test('should not add duplicate channel to Channels category', async () => {
        const store = await configureStore({
            entities: {
                channelCategories: {
                    byId: {
                        channelsCategory1: {id: 'channelsCategory1', team_id: 'team1', type: CategoryTypes.CHANNELS, channel_ids: ['publicChannel1', 'privateChannel1']},
                    },
                    orderByTeam: {
                        team1: ['channelsCategory1'],
                    },
                },
            },
        });

        const publicChannel1 = {id: 'publicChannel1', type: General.OPEN_CHANNEL, team_id: 'team1'};

        store.dispatch(Actions.addChannelToInitialCategory(publicChannel1));

        const categoriesById = getAllCategoriesByIds(store.getState());
        expect(categoriesById.channelsCategory1.channel_ids).toEqual(['publicChannel1', 'privateChannel1']);
    });
});

describe('addChannelToCategory', () => {
    const currentUserId = TestHelper.generateId();
    const teamId = TestHelper.generateId();

    test('should add the channel to the given category', async () => {
        const category1 = {id: 'category1', team_id: teamId, channel_ids: ['channel1', 'channel2'], sorting: CategorySorting.Default};
        const category2 = {id: 'category2', team_id: teamId, channel_ids: ['channel3', 'channel4'], sorting: CategorySorting.Default};

        const store = await configureStore({
            entities: {
                channelCategories: {
                    byId: {
                        category1,
                        category2,
                    },
                },
                users: {
                    currentUserId,
                },
            },
        });

        nock(Client4.getBaseRoute()).
            put(`/users/${currentUserId}/teams/${teamId}/channels/categories`).
            reply(200, [{...category1, channel_ids: ['channel5', 'channel1', 'channel2']}]);

        await store.dispatch(Actions.addChannelToCategory('category1', 'channel5'));

        const state = store.getState();

        expect(state.entities.channelCategories.byId.category1.channel_ids).toEqual(['channel5', 'channel1', 'channel2']);
        expect(state.entities.channelCategories.byId.category2).toBe(category2);

        // Also should not change the sort order of the category
        expect(state.entities.channelCategories.byId.category1.sorting).toBe(CategorySorting.Default);
    });

    test('should remove the channel from its previous category', async () => {
        const category1 = {id: 'category1', team_id: teamId, channel_ids: ['channel1', 'channel2'], sorting: CategorySorting.Default};
        const category2 = {id: 'category2', team_id: teamId, channel_ids: ['channel3', 'channel4'], sorting: CategorySorting.Default};

        const store = await configureStore({
            entities: {
                channelCategories: {
                    byId: {
                        category1,
                        category2,
                    },
                },
                users: {
                    currentUserId,
                },
            },
        });

        nock(Client4.getBaseRoute()).
            put(`/users/${currentUserId}/teams/${teamId}/channels/categories`).
            reply(200, [
                {...category1, channel_ids: ['channel3', 'channel1', 'channel2']},
                {...category2, channel_ids: ['channel4']},
            ]);

        await store.dispatch(Actions.addChannelToCategory('category1', 'channel3'));

        const state = store.getState();

        expect(state.entities.channelCategories.byId.category1.channel_ids).toEqual(['channel3', 'channel1', 'channel2']);
        expect(state.entities.channelCategories.byId.category2.channel_ids).toEqual(['channel4']);

        // Also should not change the sort order of either category
        expect(state.entities.channelCategories.byId.category1.sorting).toBe(CategorySorting.Default);
        expect(state.entities.channelCategories.byId.category2.sorting).toBe(CategorySorting.Default);
    });
});

describe('moveChannelToCategory', () => {
    const currentUserId = TestHelper.generateId();
    const teamId = TestHelper.generateId();

    test('should add the channel to the given category at the correct index', async () => {
        const category1 = {id: 'category1', team_id: teamId, channel_ids: ['channel1', 'channel2']};
        const category2 = {id: 'category2', team_id: teamId, channel_ids: ['channel3', 'channel4']};
        const otherTeamCategory = {id: 'otherTeamCategory', team_id: 'team2', channel_ids: ['channel1', 'channel2']};

        const store = await configureStore({
            entities: {
                channelCategories: {
                    byId: {
                        category1,
                        category2,
                        otherTeamCategory,
                    },
                },
                users: {
                    currentUserId,
                },
            },
        });

        nock(Client4.getBaseRoute()).
            put(`/users/${currentUserId}/teams/${teamId}/channels/categories`).
            reply(200, [{...category1, channel_ids: ['channel1', 'channel5', 'channel2']}]);

        await store.dispatch(Actions.moveChannelToCategory('category1', 'channel5', 1));

        let state = store.getState();

        expect(state.entities.channelCategories.byId.category1.channel_ids).toEqual(['channel1', 'channel5', 'channel2']);
        expect(state.entities.channelCategories.byId.category2).toBe(category2);
        expect(state.entities.channelCategories.byId.otherTeamCategory).toBe(otherTeamCategory);

        nock(Client4.getBaseRoute()).
            put(`/users/${currentUserId}/teams/${teamId}/channels/categories`).
            reply(200, [{...category1, channel_ids: ['channel1', 'channel5', 'channel6', 'channel2']}]);

        await store.dispatch(Actions.moveChannelToCategory('category1', 'channel6', 2));

        state = store.getState();

        expect(state.entities.channelCategories.byId.category1.channel_ids).toEqual(['channel1', 'channel5', 'channel6', 'channel2']);
        expect(state.entities.channelCategories.byId.category2).toBe(category2);
        expect(state.entities.channelCategories.byId.otherTeamCategory).toBe(otherTeamCategory);
    });

    test('should remove the channel from its previous category', async () => {
        const category1 = {id: 'category1', team_id: teamId, channel_ids: ['channel1', 'channel2']};
        const category2 = {id: 'category2', team_id: teamId, channel_ids: ['channel3', 'channel4']};
        const otherTeamCategory = {id: 'otherTeamCategory', team_id: 'team2', channel_ids: ['channel1', 'channel2']};

        const store = await configureStore({
            entities: {
                channelCategories: {
                    byId: {
                        category1,
                        category2,
                        otherTeamCategory,
                    },
                },
                users: {
                    currentUserId,
                },
            },
        });

        nock(Client4.getBaseRoute()).
            put(`/users/${currentUserId}/teams/${teamId}/channels/categories`).
            reply(200, [
                {...category1, channel_ids: ['channel2']},
                {...category2, channel_ids: ['channel3', 'channel4', 'channel1']},
            ]);

        await store.dispatch(Actions.moveChannelToCategory('category2', 'channel1', 2));

        const state = store.getState();

        expect(state.entities.channelCategories.byId.category1.channel_ids).toEqual(['channel2']);
        expect(state.entities.channelCategories.byId.category2.channel_ids).toEqual(['channel3', 'channel4', 'channel1']);
        expect(state.entities.channelCategories.byId.otherTeamCategory).toBe(otherTeamCategory);
    });

    test('should move channel within its current category', async () => {
        const category1 = {id: 'category1', team_id: teamId, channel_ids: ['channel1', 'channel2', 'channel3', 'channel4', 'channel5']};

        const store = await configureStore({
            entities: {
                channelCategories: {
                    byId: {
                        category1,
                    },
                },
                users: {
                    currentUserId,
                },
            },
        });

        nock(Client4.getBaseRoute()).
            put(`/users/${currentUserId}/teams/${teamId}/channels/categories`).
            reply(200, [{...category1, channel_ids: ['channel1', 'channel5', 'channel2', 'channel3', 'channel4']}]);

        await store.dispatch(Actions.moveChannelToCategory('category1', 'channel5', 1));

        let state = store.getState();

        expect(state.entities.channelCategories.byId.category1.channel_ids).toEqual(['channel1', 'channel5', 'channel2', 'channel3', 'channel4']);

        nock(Client4.getBaseRoute()).
            put(`/users/${currentUserId}/teams/${teamId}/channels/categories`).
            reply(200, [{...category1, channel_ids: ['channel5', 'channel2', 'channel3', 'channel1', 'channel4']}]);

        await store.dispatch(Actions.moveChannelToCategory('category1', 'channel1', 3));

        state = store.getState();

        expect(state.entities.channelCategories.byId.category1.channel_ids).toEqual(['channel5', 'channel2', 'channel3', 'channel1', 'channel4']);
    });

    test('moving a channel to the favorites category should also favorite the channel in preferences', async () => {
        const favoritesCategory = {id: 'favoritesCategory', team_id: teamId, type: CategoryTypes.FAVORITES, channel_ids: []};
        const otherCategory = {id: 'otherCategory', team_id: teamId, type: CategoryTypes.CUSTOM, channel_ids: ['channel1']};

        const store = await configureStore({
            entities: {
                channelCategories: {
                    byId: {
                        favoritesCategory,
                        otherCategory,
                    },
                },
                preferences: {
                    myPreferences: {},
                },
                users: {
                    currentUserId,
                },
            },
        });

        let state = store.getState();

        expect(isFavoriteChannel(state, 'channel1')).toBe(false);

        nock(Client4.getBaseRoute()).
            put(`/users/${currentUserId}/teams/${teamId}/channels/categories`).
            reply(200, [
                {...favoritesCategory, channel_ids: ['channel1']},
                {...otherCategory, channel_ids: []},
            ]);

        // Move the channel into favorites
        await store.dispatch(Actions.moveChannelToCategory('favoritesCategory', 'channel1', 0));

        state = store.getState();

        expect(state.entities.channelCategories.byId.favoritesCategory.channel_ids).toEqual(['channel1']);
        expect(state.entities.channelCategories.byId.otherCategory.channel_ids).toEqual([]);
        expect(isFavoriteChannel(state, 'channel1')).toBe(true);

        nock(Client4.getBaseRoute()).
            put(`/users/${currentUserId}/teams/${teamId}/channels/categories`).
            reply(200, [
                {...favoritesCategory, channel_ids: []},
                {...otherCategory, channel_ids: ['channel1']},
            ]);

        // And back out
        await store.dispatch(Actions.moveChannelToCategory('otherCategory', 'channel1', 0));

        state = store.getState();

        expect(state.entities.channelCategories.byId.favoritesCategory.channel_ids).toEqual([]);
        expect(state.entities.channelCategories.byId.otherCategory.channel_ids).toEqual(['channel1']);
        expect(isFavoriteChannel(state, 'channel1')).toBe(false);
    });

    test('should set the destination category to manual sorting', async () => {
        const category1 = {id: 'category1', team_id: teamId, channel_ids: ['channel1', 'channel2'], sorting: CategorySorting.Default};
        const category2 = {id: 'category2', team_id: teamId, channel_ids: ['channel3', 'channel4'], sorting: CategorySorting.Default};

        const store = await configureStore({
            entities: {
                channelCategories: {
                    byId: {
                        category1,
                        category2,
                    },
                },
                users: {
                    currentUserId,
                },
            },
        });

        nock(Client4.getBaseRoute()).
            put(`/users/${currentUserId}/teams/${teamId}/channels/categories`).
            reply(200, [
                {...category1, channel_ids: ['channel2']},
                {...category2, channel_ids: ['channel1', 'channel3', 'channel4'], sorting: CategorySorting.Manual},
            ]);

        await store.dispatch(Actions.moveChannelToCategory(category2.id, 'channel1', 0));

        let state = store.getState();
        expect(state.entities.channelCategories.byId.category1.sorting).toBe(CategorySorting.Default);
        expect(state.entities.channelCategories.byId.category2.sorting).toBe(CategorySorting.Manual);

        nock(Client4.getBaseRoute()).
            put(`/users/${currentUserId}/teams/${teamId}/channels/categories`).
            reply(200, [
                {...category1, channel_ids: ['channel2', 'channel1'], sorting: CategorySorting.Manual},
                {...category2, channel_ids: ['channel3', 'channel4'], sorting: CategorySorting.Manual},
            ]);

        await store.dispatch(Actions.moveChannelToCategory(category1.id, 'channel1', 2));

        state = store.getState();
        expect(state.entities.channelCategories.byId.category1.sorting).toBe(CategorySorting.Manual);
        expect(state.entities.channelCategories.byId.category2.sorting).toBe(CategorySorting.Manual);
    });
});

describe('moveCategory', () => {
    const currentUserId = TestHelper.generateId();

    test('should move the category to the correct index', async () => {
        const store = await configureStore({
            entities: {
                channelCategories: {
                    orderByTeam: {
                        team1: ['category1', 'category2', 'category3', 'category4'],
                        team2: ['category5', 'category6'],
                    },
                },
                users: {
                    currentUserId,
                },
            },
        });

        const initialState = store.getState();

        nock(Client4.getBaseRoute()).
            put(`/users/${currentUserId}/teams/team1/channels/categories/order`).
            reply(200, ['category2', 'category3', 'category4', 'category1']);

        await store.dispatch(Actions.moveCategory('team1', 'category1', 3));

        let state = store.getState();

        expect(state.entities.channelCategories.orderByTeam.team1).toEqual(['category2', 'category3', 'category4', 'category1']);
        expect(state.entities.channelCategories.orderByTeam.team2).toBe(initialState.entities.channelCategories.orderByTeam.team2);

        nock(Client4.getBaseRoute()).
            put(`/users/${currentUserId}/teams/team1/channels/categories/order`).
            reply(200, ['category3', 'category2', 'category4', 'category1']);

        await store.dispatch(Actions.moveCategory('team1', 'category3', 0));

        state = store.getState();

        expect(state.entities.channelCategories.orderByTeam.team1).toEqual(['category3', 'category2', 'category4', 'category1']);

        nock(Client4.getBaseRoute()).
            put(`/users/${currentUserId}/teams/team1/channels/categories/order`).
            reply(200, ['category3', 'category4', 'category2', 'category1']);

        await store.dispatch(Actions.moveCategory('team1', 'category4', 1));

        state = store.getState();

        expect(state.entities.channelCategories.orderByTeam.team1).toEqual(['category3', 'category4', 'category2', 'category1']);
    });
});

describe('createCategory', () => {
    const currentUserId = TestHelper.generateId();
    const teamId = TestHelper.generateId();
    const categoryName = 'new category';

    test('should add the new category to a team which never had any to begin with', async () => {
        const store = await configureStore({
            entities: {
                channelCategories: {
                    orderByTeam: {
                        [teamId]: [],
                    },
                },
                users: {
                    currentUserId,
                },
            },
        });

        nock(Client4.getBaseRoute()).
            post(`/users/${currentUserId}/teams/${teamId}/channels/categories`).
            reply(200, {
                display_name: categoryName,
                team_id: teamId,
                channel_ids: [],
            });

        const result = await store.dispatch(Actions.createCategory(teamId, categoryName));

        const state = store.getState();

        // The category and its order should be saved
        expect(state.entities.channelCategories.orderByTeam[teamId]).toEqual([result.data.id]);
        expect(state.entities.channelCategories.byId[result.data.id]).toEqual(result.data);
    });

    test('should add a new category as the first category', async () => {
        const channelsCategory = {id: 'channelsCategory', team_id: teamId, type: CategoryTypes.CHANNELS};

        const store = await configureStore({
            entities: {
                channelCategories: {
                    byId: {
                        channelsCategory,
                    },
                    orderByTeam: {
                        [teamId]: [channelsCategory.id],
                    },
                },
                users: {
                    currentUserId,
                },
            },
        });

        nock(Client4.getBaseRoute()).
            post(`/users/${currentUserId}/teams/${teamId}/channels/categories`).
            reply(200, {
                display_name: categoryName,
                team_id: teamId,
                channel_ids: [],
            });

        const result = await store.dispatch(Actions.createCategory(teamId, 'new category'));

        const state = store.getState();

        // The new category should come first
        expect(state.entities.channelCategories.orderByTeam[teamId]).toEqual([result.data.id, channelsCategory.id]);
    });

    test('should add a new category after the favorites category if the favorites were first', async () => {
        const channelsCategory = {id: 'channelsCategory', team_id: teamId, type: CategoryTypes.CHANNELS};
        const favoritesCategory = {id: 'favoritesCategory', team_id: teamId, type: CategoryTypes.FAVORITES};

        const store = await configureStore({
            entities: {
                channelCategories: {
                    byId: {
                        channelsCategory,
                        favoritesCategory,
                    },
                    orderByTeam: {
                        [teamId]: [favoritesCategory.id, channelsCategory.id],
                    },
                },
                users: {
                    currentUserId,
                },
            },
        });

        nock(Client4.getBaseRoute()).
            post(`/users/${currentUserId}/teams/${teamId}/channels/categories`).
            reply(200, {
                display_name: categoryName,
                team_id: teamId,
                channel_ids: [],
            });

        const result = await store.dispatch(Actions.createCategory(teamId, 'new category'));

        const state = store.getState();

        // The new category should come after the favorites category
        expect(state.entities.channelCategories.orderByTeam[teamId]).toEqual([favoritesCategory.id, result.data.id, channelsCategory.id]);
    });

    test('should add a new category as the first category if favorites exists and it is not first', async () => {
        const channelsCategory = {id: 'channelsCategory', team_id: teamId, type: CategoryTypes.CHANNELS};
        const favoritesCategory = {id: 'favoritesCategory', team_id: teamId, type: CategoryTypes.FAVORITES};

        const store = await configureStore({
            entities: {
                channelCategories: {
                    byId: {
                        channelsCategory,
                        favoritesCategory,
                    },
                    orderByTeam: {
                        [teamId]: [channelsCategory.id, favoritesCategory.id],
                    },
                },
                users: {
                    currentUserId,
                },
            },
        });

        nock(Client4.getBaseRoute()).
            post(`/users/${currentUserId}/teams/${teamId}/channels/categories`).
            reply(200, {
                display_name: categoryName,
                team_id: teamId,
                channel_ids: [],
            });

        const result = await store.dispatch(Actions.createCategory(teamId, 'new category'));

        const state = store.getState();

        // The new category should come first
        expect(state.entities.channelCategories.orderByTeam[teamId]).toEqual([result.data.id, channelsCategory.id, favoritesCategory.id]);
    });

    test('should add new channels to the category and remove them from their old category', async () => {
        const channelsCategory = {id: 'channelsCategory', team_id: teamId, type: CategoryTypes.CHANNELS, channel_ids: ['channel1', 'channel3']};
        const favoritesCategory = {id: 'favoritesCategory', team_id: teamId, type: CategoryTypes.FAVORITES, channel_ids: ['channel2', 'channel4']};

        const store = await configureStore({
            entities: {
                channelCategories: {
                    byId: {
                        channelsCategory,
                        favoritesCategory,
                    },
                    orderByTeam: {
                        [teamId]: [favoritesCategory.id, channelsCategory.id],
                    },
                },
                users: {
                    currentUserId,
                },
            },
        });

        nock(Client4.getBaseRoute()).
            post(`/users/${currentUserId}/teams/${teamId}/channels/categories`).
            reply(200, {
                display_name: categoryName,
                team_id: teamId,
                channel_ids: ['channel1', 'channel2'],
            });

        const result = await store.dispatch(Actions.createCategory(teamId, 'new category', ['channel1', 'channel2']));

        const state = store.getState();

        // Should save the category with the specified channels
        expect(result.data.channel_ids).toEqual(['channel1', 'channel2']);
        expect(state.entities.channelCategories.byId[result.data.id]).toEqual(result.data);

        // And should remove the channels from their previous categories
        expect(state.entities.channelCategories.byId[channelsCategory.id].channel_ids).toEqual(['channel3']);
        expect(state.entities.channelCategories.byId[favoritesCategory.id].channel_ids).toEqual(['channel4']);
    });
});

describe('renameCategory', () => {
    const currentUserId = TestHelper.generateId();
    const teamId = TestHelper.generateId();

    test('should rename the given category', async () => {
        const store = await configureStore({
            entities: {
                channelCategories: {
                    orderByTeam: {
                        [teamId]: [],
                    },
                },
                users: {
                    currentUserId,
                },
            },
        });

        nock(Client4.getBaseRoute()).
            post(`/users/${currentUserId}/teams/${teamId}/channels/categories`).
            reply(201, {
                id: TestHelper.generateId(),
                display_name: 'original name',
                team_id: teamId,
            });

        const result = await store.dispatch(Actions.createCategory(teamId, 'original name'));
        const category = result.data;

        expect(result.error).toBeUndefined();
        expect(category).toBeDefined();

        let state = store.getState();

        expect(category.display_name).toBe('original name');
        expect(state.entities.channelCategories.byId[category.id].display_name).toBe('original name');

        nock(Client4.getBaseRoute()).
            put(`/users/${currentUserId}/teams/${teamId}/channels/categories/${category.id}`).
            reply(200, {...category, display_name: 'new name'});

        await store.dispatch(Actions.renameCategory(category.id, 'new name'));

        state = store.getState();

        expect(state.entities.channelCategories.byId[category.id].display_name).toBe('new name');
    });
});

describe('deleteCategory', () => {
    const currentUserId = TestHelper.generateId();
    const teamId = TestHelper.generateId();

    test('should remove empty categories', async () => {
        const store = await configureStore({
            entities: {
                channelCategories: {
                    byId: {
                        category1: {id: 'category1', team_id: teamId, channel_ids: []},
                        category2: {id: 'category2', team_id: teamId, channel_ids: []},
                        category3: {id: 'category3', team_id: teamId, channel_ids: []},
                        category4: {id: 'category4', team_id: teamId, channel_ids: []},
                    },
                    orderByTeam: {
                        [teamId]: ['category1', 'category2', 'category3', 'category4'],
                    },
                },
                users: {
                    currentUserId,
                },
            },
        });

        nock(Client4.getBaseRoute()).
            delete(`/users/${currentUserId}/teams/${teamId}/channels/categories/category3`).
            reply(200, OK_RESPONSE);

        await store.dispatch(Actions.deleteCategory('category3'));

        let state = store.getState();

        expect(state.entities.channelCategories.byId.category3).toBeUndefined();
        expect(state.entities.channelCategories.orderByTeam[teamId]).toEqual(['category1', 'category2', 'category4']);
        expect(getCategory(state, 'category3')).toBeUndefined();
        expect(getCategoryIdsForTeam(state, teamId)).toEqual(['category1', 'category2', 'category4']);

        nock(Client4.getBaseRoute()).
            delete(`/users/${currentUserId}/teams/${teamId}/channels/categories/category1`).
            reply(200, OK_RESPONSE);

        await store.dispatch(Actions.deleteCategory('category1'));

        state = store.getState();

        expect(state.entities.channelCategories.byId.category3).toBeUndefined();
        expect(state.entities.channelCategories.orderByTeam[teamId]).toEqual(['category2', 'category4']);
        expect(getCategory(state, 'category1')).toBeUndefined();
        expect(getCategoryIdsForTeam(state, teamId)).toEqual(['category2', 'category4']);
    });

    test('should move any channels from the deleted category to their default categories', async () => {
        const category1 = {id: 'category1', team_id: teamId, type: CategoryTypes.CUSTOM, channel_ids: ['channel1', 'channel2', 'dmChannel1', 'gmChannel1']};
        const channelsCategory = {id: 'channelsCategory', team_id: teamId, type: CategoryTypes.CHANNELS, channel_ids: ['channel3']};
        const dmsCategory = {id: 'dmsCategory', team_id: teamId, type: CategoryTypes.DIRECT_MESSAGES, channel_ids: ['dmChannel2']};

        const store = await configureStore({
            entities: {
                channelCategories: {
                    byId: {
                        category1,
                        channelsCategory,
                        dmsCategory,
                    },
                    orderByTeam: {
                        [teamId]: [category1.id, channelsCategory.id, dmsCategory.id],
                    },
                },
                channels: {
                    channels: {
                        channel1: {id: 'channel1', type: General.OPEN_CHANNEL, delete_at: 0},
                        channel2: {id: 'channel2', type: General.PRIVATE_CHANNEL, delete_at: 0},
                        channel3: {id: 'channel3', type: General.PRIVATE_CHANNEL, delete_at: 0},
                        dmChannel1: {id: 'dmChannel1', type: General.DM_CHANNEL, delete_at: 0},
                        dmChannel2: {id: 'dmChannel2', type: General.DM_CHANNEL, delete_at: 0},
                        gmChannel1: {id: 'gmChannel1', type: General.GM_CHANNEL, delete_at: 0},
                    },
                },
                users: {
                    currentUserId,
                },
            },
        });

        nock(Client4.getBaseRoute()).
            delete(`/users/${currentUserId}/teams/${teamId}/channels/categories/${category1.id}`).
            reply(200, OK_RESPONSE);

        await store.dispatch(Actions.deleteCategory(category1.id));

        const state = store.getState();

        expect(state.entities.channelCategories.byId.category1).toBeUndefined();
        expect(getCategory(state, channelsCategory.id)).toMatchObject({channel_ids: ['channel2', 'channel1', 'channel3']});
        expect(getCategory(state, dmsCategory.id)).toMatchObject({channel_ids: ['gmChannel1', 'dmChannel1', 'dmChannel2']});
    });
});
