// Copyright (c) 2017-present Mattermost, Inc. All Rights Reserved.
// See License.txt for license information.
// @flow

import type {Team} from 'types/teams';

export function teamListToMap(teamList: Array<Team>): {[string]: Team} {
    const teams = {};
    for (let i = 0; i < teamList.length; i++) {
        teams[teamList[i].id] = teamList[i];
    }
    return teams;
}
