// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {Channel} from './channels';
import {Team} from './teams';
import {$ID, IDMappedObjects, RelationOneToOne} from './utilities';

// TODO update values to match the ones used by the server code
export type ChannelCategoryType = 'favorites' | 'channels' | 'direct_messages' | 'custom';

export enum CategorySorting {
    Alphabetical = 'alpha',
    Default = '', // behaves the same as manual
    Recency = 'recent',
    Manual = 'manual',
}

export type ChannelCategory = {
    id: string;
    team_id: $ID<Team>;
    type: ChannelCategoryType;
    display_name: string;
    sorting: CategorySorting;
    channel_ids: $ID<Channel>[];
};

export type ChannelCategoriesState = {
    byId: IDMappedObjects<ChannelCategory>;
    orderByTeam: RelationOneToOne<Team, $ID<ChannelCategory>[]>;
};
