// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {createSelector} from 'reselect';

import {getCurrentTeamId} from 'selectors/entities/teams';
import {getCurrentUserMentionKeys} from 'selectors/entities/users';
import {getCurrentUserGroupMentionKeys} from 'selectors/entities/groups';

import {GlobalState} from 'types/store';

export const getCurrentSearchForCurrentTeam = createSelector(
    (state: GlobalState) => state.entities.search.current,
    getCurrentTeamId,
    (current, teamId) => {
        return current[teamId];
    },
);

export const getAllUserMentionKeys = createSelector(
    getCurrentUserMentionKeys,
    getCurrentUserGroupMentionKeys,
    (userMentionKeys, groupMentionKeys) => {
        return userMentionKeys.concat(groupMentionKeys);
    },
);