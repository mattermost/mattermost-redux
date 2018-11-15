// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
// @flow

import {Groups} from 'constants';

export type SyncableType = Groups.SYNCABLE_TYPE_TEAM | Groups.SYNCABLE_TYPE_CHANNEL;

export type SyncablePatch = {|
    can_leave: boolean,
    auto_add: boolean
|};
