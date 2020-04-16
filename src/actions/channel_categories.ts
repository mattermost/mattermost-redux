// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {ChannelCategoryTypes} from 'action_types';
import {CategorySorting} from 'types/channel_categories';

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
