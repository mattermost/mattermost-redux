// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import configureStore from 'test/test_store';

import {Sorting} from '../constants/channel_categories';

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
