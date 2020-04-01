// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {$ID, IDMappedObjects, RelationOneToOne} from './utilities';
import {Team} from './teams';
import {Channel} from './channels';

export type ChannelCategoryType = 'favorites' | 'public' | 'private' | 'direct_messages' | 'custom';

export type ChannelCategory = {
    id: string;
    team_id: $ID<Team>;
    type: ChannelCategoryType;
    display_name: string;

    // This will be added in phase 2 of Channel Sidebar Organization once the server provides the categories
    // TODO: Remove the optional param, only for mock
    channel_ids?: $ID<Channel>[];
};

export type ChannelCategoriesState = {
    byId: IDMappedObjects<ChannelCategory>;
    orderByTeam: RelationOneToOne<Team, $ID<ChannelCategory>[]>;
};
