// Copyright (c) 2017 Mattermost, Inc. All Rights Reserved.
// See License.txt for license information.

export function teamListToMap(teamList) {
    const teams = {};
    for (let i = 0; i < teamList.length; i++) {
        teams[teamList[i].id] = teamList[i];
    }
    return teams;
}
