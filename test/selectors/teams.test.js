// Copyright (c) 2017 Mattermost, Inc. All Rights Reserved.
// See License.txt for license information.

import assert from 'assert';

import deepFreezeAndThrowOnMutation from 'utils/deep_freeze';
import TestHelper from 'test/test_helper';
import * as Selectors from 'selectors/entities/teams';

describe('Selectors.Teams', () => {
    const team1 = TestHelper.fakeTeamWithId();
    const team2 = TestHelper.fakeTeamWithId();

    const teams = {};
    teams[team1.id] = team1;
    teams[team2.id] = team2;

    const user = TestHelper.fakeUserWithId();
    const profiles = {};
    profiles[user.id] = user;

    const myMembers = {};
    myMembers[team1.id] = {channel_id: team1.id, user_id: user.id};
    myMembers[team2.id] = {channel_id: team2.id, user_id: user.id};

    const testState = deepFreezeAndThrowOnMutation({
        entities: {
            users: {
                currentUserId: user.id,
                profiles
            },
            teams: {
                currentTeamId: team1.id,
                teams,
                myMembers
            }
        }
    });

    it('getMyTeams', () => {
        assert.deepEqual(Selectors.getMyTeams(testState), [team1, team2]);
    });
});
