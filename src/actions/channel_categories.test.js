// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import configureStore from 'test/test_store';

import {General} from '../constants';
import {Sorting, CategoryTypes} from '../constants/channel_categories';

import {getAllCategoriesByIds} from 'selectors/entities/channel_categories';
import {isFavoriteChannel} from 'selectors/entities/preferences';

import * as Actions from './channel_categories';

describe('setCategorySorting', () => {
    test('should set sorting method correctly', async () => {
        const store = await configureStore({
            entities: {
                channelCategories: {
                    byId: {
                        category1: {id: 'category1'},
                    },
                },
            },
        });

        store.dispatch(Actions.setCategorySorting('category1', Sorting.RECENCY));

        expect(store.getState().entities.channelCategories.byId.category1).toMatchObject({sorting: Sorting.RECENCY});

        store.dispatch(Actions.setCategorySorting('category1', Sorting.ALPHABETICAL));

        expect(store.getState().entities.channelCategories.byId.category1).toMatchObject({sorting: Sorting.ALPHABETICAL});
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
    test('should add the channel to the given category', async () => {
        const category1 = {id: 'category1', channel_ids: ['channel1', 'channel2']};
        const category2 = {id: 'category2', channel_ids: ['channel3', 'channel4']};

        const store = await configureStore({
            entities: {
                channelCategories: {
                    byId: {
                        category1,
                        category2,
                    },
                },
            },
        });

        store.dispatch(Actions.addChannelToCategory('category1', 'channel5'));

        const state = store.getState();

        expect(state.entities.channelCategories.byId.category1.channel_ids).toEqual(['channel5', 'channel1', 'channel2']);
        expect(state.entities.channelCategories.byId.category2).toBe(category2);
    });

    test('should remove the channel from its previous category', async () => {
        const category1 = {id: 'category1', channel_ids: ['channel1', 'channel2']};
        const category2 = {id: 'category2', channel_ids: ['channel3', 'channel4']};

        const store = await configureStore({
            entities: {
                channelCategories: {
                    byId: {
                        category1,
                        category2,
                    },
                },
            },
        });

        store.dispatch(Actions.addChannelToCategory('category1', 'channel3'));

        const state = store.getState();

        expect(state.entities.channelCategories.byId.category1.channel_ids).toEqual(['channel3', 'channel1', 'channel2']);
        expect(state.entities.channelCategories.byId.category2.channel_ids).toEqual(['channel4']);
    });
});

describe('moveChannelToCategory', () => {
    test('should add the channel to the given category at the correct index', async () => {
        const category1 = {id: 'category1', team_id: 'team1', channel_ids: ['channel1', 'channel2']};
        const category2 = {id: 'category2', team_id: 'team1', channel_ids: ['channel3', 'channel4']};
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
            },
        });

        store.dispatch(Actions.moveChannelToCategory('category1', 'channel5', 1));

        let state = store.getState();

        expect(state.entities.channelCategories.byId.category1.channel_ids).toEqual(['channel1', 'channel5', 'channel2']);
        expect(state.entities.channelCategories.byId.category2).toBe(category2);
        expect(state.entities.channelCategories.byId.otherTeamCategory).toBe(otherTeamCategory);

        store.dispatch(Actions.moveChannelToCategory('category1', 'channel6', 2));

        state = store.getState();

        expect(state.entities.channelCategories.byId.category1.channel_ids).toEqual(['channel1', 'channel5', 'channel6', 'channel2']);
        expect(state.entities.channelCategories.byId.category2).toBe(category2);
        expect(state.entities.channelCategories.byId.otherTeamCategory).toBe(otherTeamCategory);
    });

    test('should remove the channel from its previous category', async () => {
        const category1 = {id: 'category1', team_id: 'team1', channel_ids: ['channel1', 'channel2']};
        const category2 = {id: 'category2', team_id: 'team1', channel_ids: ['channel3', 'channel4']};
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
            },
        });

        store.dispatch(Actions.moveChannelToCategory('category2', 'channel1', 2));

        const state = store.getState();

        expect(state.entities.channelCategories.byId.category1.channel_ids).toEqual(['channel2']);
        expect(state.entities.channelCategories.byId.category2.channel_ids).toEqual(['channel3', 'channel4', 'channel1']);
        expect(state.entities.channelCategories.byId.otherTeamCategory).toBe(otherTeamCategory);
    });

    test('should move channel within its current category', async () => {
        const category1 = {id: 'category1', team_id: 'team1', channel_ids: ['channel1', 'channel2', 'channel3', 'channel4', 'channel5']};

        const store = await configureStore({
            entities: {
                channelCategories: {
                    byId: {
                        category1,
                    },
                },
            },
        });

        store.dispatch(Actions.moveChannelToCategory('category1', 'channel5', 1));

        let state = store.getState();

        expect(state.entities.channelCategories.byId.category1.channel_ids).toEqual(['channel1', 'channel5', 'channel2', 'channel3', 'channel4']);

        store.dispatch(Actions.moveChannelToCategory('category1', 'channel1', 3));

        state = store.getState();

        expect(state.entities.channelCategories.byId.category1.channel_ids).toEqual(['channel5', 'channel2', 'channel3', 'channel1', 'channel4']);
    });

    test('moving a channel to the favorites category should also favorite the channel in preferences', async () => {
        const favoritesCategory = {id: 'favoritesCategory', team_id: 'team1', type: CategoryTypes.FAVORITES, channel_ids: []};
        const otherCategory = {id: 'otherCategory', team_id: 'team1', type: CategoryTypes.CUSTOM, channel_ids: ['channel1']};

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
            },
        });

        let state = store.getState();

        expect(isFavoriteChannel(state, 'channel1')).toBe(false);

        // Move the channel into favorites
        store.dispatch(Actions.moveChannelToCategory('favoritesCategory', 'channel1', 0));

        state = store.getState();

        expect(state.entities.channelCategories.byId.favoritesCategory.channel_ids).toEqual(['channel1']);
        expect(state.entities.channelCategories.byId.otherCategory.channel_ids).toEqual([]);
        expect(isFavoriteChannel(state, 'channel1')).toBe(true);

        // And back out
        store.dispatch(Actions.moveChannelToCategory('otherCategory', 'channel1', 0));

        state = store.getState();

        expect(state.entities.channelCategories.byId.favoritesCategory.channel_ids).toEqual([]);
        expect(state.entities.channelCategories.byId.otherCategory.channel_ids).toEqual(['channel1']);
        expect(isFavoriteChannel(state, 'channel1')).toBe(false);
    });
});

describe('moveCategory', () => {
    test('should move the category to the correct index', async () => {
        const store = await configureStore({
            entities: {
                channelCategories: {
                    orderByTeam: {
                        team1: ['category1', 'category2', 'category3', 'category4'],
                        team2: ['category5', 'category6'],
                    },
                },
            },
        });

        const initialState = store.getState();

        store.dispatch(Actions.moveCategory('team1', 'category1', 3));

        let state = store.getState();

        expect(state.entities.channelCategories.orderByTeam.team1).toEqual(['category2', 'category3', 'category4', 'category1']);
        expect(state.entities.channelCategories.orderByTeam.team2).toBe(initialState.entities.channelCategories.orderByTeam.team2);

        store.dispatch(Actions.moveCategory('team1', 'category3', 0));

        state = store.getState();

        expect(state.entities.channelCategories.orderByTeam.team1).toEqual(['category3', 'category2', 'category4', 'category1']);

        store.dispatch(Actions.moveCategory('team1', 'category4', 1));

        state = store.getState();

        expect(state.entities.channelCategories.orderByTeam.team1).toEqual(['category3', 'category4', 'category2', 'category1']);
    });
});
