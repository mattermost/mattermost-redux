// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {CategorySorting, ChannelCategoryType} from 'types/channel_categories';
import {Dictionary} from 'types/utilities';

export const CategoryTypes: {[name: string]: ChannelCategoryType} = {
    FAVORITES: 'favorites',
    PUBLIC: 'public',
    PRIVATE: 'private',
    DIRECT_MESSAGES: 'direct_messages',
    CUSTOM: 'custom',
};

export const Sorting: Dictionary<CategorySorting> = {
    ALPHABETICAL: 'alphabetical',
    NONE: '',
    RECENCY: 'recency',
};
