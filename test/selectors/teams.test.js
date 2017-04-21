// Copyright (c) 2017 Mattermost, Inc. All Rights Reserved.
// See License.txt for license information.

import assert from 'assert';

import deepFreezeAndThrowOnMutation from 'utils/deep_freeze';
import TestHelper from 'test/test_helper';
import * as Selectors from 'selectors/entities/teams';
import {General, Teams} from 'constants';

describe('Selectors.Teams', () => {
    const team1 = TestHelper.fakeTeamWithId();
    const team2 = TestHelper.fakeTeamWithId();
    const team3 = TestHelper.fakeTeamWithId();
    team3.type = Teams.TEAM_TYPE_INVITE;

    const teams = {};
    teams[team1.id] = team1;
    teams[team2.id] = team2;
    teams[team3.id] = team3;

    const user = TestHelper.fakeUserWithId();
    const user2 = TestHelper.fakeUserWithId();
    const user3 = TestHelper.fakeUserWithId();
    const profiles = {};
    profiles[user.id] = user;
    profiles[user2.id] = user2;
    profiles[user3.id] = user3;

    const myMembers = {};
    myMembers[team1.id] = {team_id: team1.id, user_id: user.id, roles: General.TEAM_USER_ROLE};
    myMembers[team2.id] = {team_id: team2.id, user_id: user.id, roles: General.TEAM_USER_ROLE};

    const membersInTeam = {};
    membersInTeam[team1.id] = {};
    membersInTeam[team1.id][user2.id] = {team_id: team1.id, user_id: user2.id, roles: General.TEAM_USER_ROLE};
    membersInTeam[team1.id][user3.id] = {team_id: team1.id, user_id: user3.id, roles: General.TEAM_USER_ROLE};

    const testState = deepFreezeAndThrowOnMutation({
        entities: {
            users: {
                currentUserId: user.id,
                profiles
            },
            teams: {
                currentTeamId: team1.id,
                teams,
                myMembers,
                membersInTeam
            }
        }
    });

    it('getMyTeams', () => {
        assert.deepEqual(Selectors.getMyTeams(testState), [team1, team2]);
    });

    it('getMembersInCurrentTeam', () => {
        assert.deepEqual(Selectors.getMembersInCurrentTeam(testState), membersInTeam[team1.id]);
    });

    it('getTeamMember', () => {
        assert.deepEqual(Selectors.getTeamMember(testState, team1.id, user2.id), membersInTeam[team1.id][user2.id]);
    });

    it('getOpenTeams', () => {
        const openTeams = {};
        openTeams[team1.id] = team1;
        openTeams[team2.id] = team2;
        assert.deepEqual(Selectors.getOpenTeams(testState), openTeams);
    });
});
