// Copyright (c) 2016 Mattermost, Inc. All Rights Reserved.
// See License.txt for license information.

import assert from 'assert';

import * as Actions from 'actions/teams';
import {login} from 'actions/users';
import {Client, Client4} from 'client';
import configureStore from 'store';
import {RequestStatus} from 'constants';
import TestHelper from 'test/test_helper';

describe('Actions.Teams', () => {
    let store;
    before(async () => {
        await TestHelper.initBasic(Client, Client4);
    });

    beforeEach(() => {
        store = configureStore();
    });

    after(async () => {
        await TestHelper.basicClient.logout();
        await TestHelper.basicClient4.logout();
    });

    it('selectTeam', async () => {
        await Actions.selectTeam(TestHelper.basicTeam)(store.dispatch, store.getState);
        const {currentTeamId} = store.getState().entities.teams;

        assert.ok(currentTeamId);
        assert.equal(currentTeamId, TestHelper.basicTeam.id);
    });

    it('getMyTeams', async () => {
        await login(TestHelper.basicUser.email, 'password1')(store.dispatch, store.getState);
        await Actions.getMyTeams()(store.dispatch, store.getState);

        const teamsRequest = store.getState().requests.teams.getMyTeams;
        const {teams} = store.getState().entities.teams;

        if (teamsRequest.status === RequestStatus.FAILURE) {
            throw new Error(JSON.stringify(teamsRequest.error));
        }

        assert.ok(teams);
        assert.ok(teams[TestHelper.basicTeam.id]);
    });

    it('getTeams', async () => {
        let team = {...TestHelper.fakeTeam(), allow_open_invite: true};

        team = await Client4.createTeam(team);
        await Actions.getTeams()(store.dispatch, store.getState);

        const teamsRequest = store.getState().requests.teams.getTeams;
        const {teams} = store.getState().entities.teams;

        if (teamsRequest.status === RequestStatus.FAILURE) {
            throw new Error(JSON.stringify(teamsRequest.error));
        }

        assert.ok(Object.keys(teams).length > 0);
        let found = false;
        for (const teamId in teams) {
            if (teams.hasOwnProperty(teamId) && teamId === team.id) {
                found = true;
                break;
            }
        }

        assert.ok(found);
    });

    it('createTeam', async () => {
        await Actions.createTeam(
            TestHelper.basicUser.id,
            TestHelper.fakeTeam()
        )(store.dispatch, store.getState);

        const createRequest = store.getState().requests.teams.createTeam;
        const {teams, myMembers, currentTeamId} = store.getState().entities.teams;

        if (createRequest.status === RequestStatus.FAILURE) {
            throw new Error(JSON.stringify(createRequest.error));
        }

        const teamId = Object.keys(teams)[0];
        assert.strictEqual(Object.keys(teams).length, 1);
        assert.strictEqual(currentTeamId, teamId);
        assert.ok(myMembers[teamId]);
    });

    it('updateTeam', async () => {
        const displayName = 'The Updated Team';
        const description = 'This is a team created by unit tests';
        const team = {
            ...TestHelper.basicTeam,
            display_name: displayName,
            description
        };

        await Actions.updateTeam(team)(store.dispatch, store.getState);

        const updateRequest = store.getState().requests.teams.updateTeam;
        const {teams} = store.getState().entities.teams;

        if (updateRequest.status === RequestStatus.FAILURE) {
            throw new Error(JSON.stringify(updateRequest.error));
        }

        const updated = teams[TestHelper.basicTeam.id];
        assert.ok(updated);
        assert.strictEqual(updated.display_name, displayName);
        assert.strictEqual(updated.description, description);
    });

    it('getMyTeamMembers', async () => {
        await Actions.getMyTeamMembers()(store.dispatch, store.getState);

        const membersRequest = store.getState().requests.teams.getMyTeamMembers;
        const members = store.getState().entities.teams.myMembers;

        if (membersRequest.status === RequestStatus.FAILURE) {
            throw new Error(JSON.stringify(membersRequest.error));
        }

        assert.ok(members);
        assert.ok(members[TestHelper.basicTeam.id]);
    });

    it('getTeamMember', async () => {
        const user = await TestHelper.basicClient4.createUser(
            TestHelper.fakeUser(),
            null,
            null,
            TestHelper.basicTeam.invite_id
        );

        await Actions.getTeamMember(TestHelper.basicTeam.id, user.id)(store.dispatch, store.getState);

        const membersRequest = store.getState().requests.teams.getTeamMembers;
        const members = store.getState().entities.teams.membersInTeam;

        if (membersRequest.status === RequestStatus.FAILURE) {
            throw new Error(JSON.stringify(membersRequest.error));
        }

        assert.ok(members[TestHelper.basicTeam.id]);
        assert.ok(members[TestHelper.basicTeam.id].has(user.id));
    });

    it('getTeamMembersByIds', async () => {
        const user1 = await TestHelper.basicClient4.createUser(
            TestHelper.fakeUser(),
            null,
            null,
            TestHelper.basicTeam.invite_id
        );

        const user2 = await TestHelper.basicClient4.createUser(
            TestHelper.fakeUser(),
            null,
            null,
            TestHelper.basicTeam.invite_id
        );

        await Actions.getTeamMembersByIds(
            TestHelper.basicTeam.id,
            [user1.id, user2.id]
        )(store.dispatch, store.getState);

        const membersRequest = store.getState().requests.teams.getTeamMembers;
        const members = store.getState().entities.teams.membersInTeam;

        if (membersRequest.status === RequestStatus.FAILURE) {
            throw new Error(JSON.stringify(membersRequest.error));
        }

        assert.ok(members[TestHelper.basicTeam.id]);
        assert.ok(members[TestHelper.basicTeam.id].has(user1.id));
        assert.ok(members[TestHelper.basicTeam.id].has(user2.id));
    });

    it('getTeamStats', async () => {
        await Actions.getTeamStats(TestHelper.basicTeam.id)(store.dispatch, store.getState);

        const {stats} = store.getState().entities.teams;
        const statsRequest = store.getState().requests.teams.getTeamStats;

        if (statsRequest.status === RequestStatus.FAILURE) {
            throw new Error(JSON.stringify(statsRequest.error));
        }

        const stat = stats[TestHelper.basicTeam.id];
        assert.ok(stat);

        // we need to take into account the members of the tests above
        assert.equal(stat.total_member_count, 4);
        assert.equal(stat.active_member_count, 4);
    });

    it('addUserToTeam', async () => {
        const user = await TestHelper.basicClient4.createUser(TestHelper.fakeUser());

        await Actions.addUserToTeam(TestHelper.basicTeam.id, user.id)(store.dispatch, store.getState);

        const membersRequest = store.getState().requests.teams.addUserToTeam;
        const members = store.getState().entities.teams.membersInTeam;

        if (membersRequest.status === RequestStatus.FAILURE) {
            throw new Error(JSON.stringify(membersRequest.error));
        }

        assert.ok(members[TestHelper.basicTeam.id]);
        assert.ok(members[TestHelper.basicTeam.id].has(user.id));
    });

    it('removeUserFromTeam', async () => {
        const user = await TestHelper.basicClient4.createUser(TestHelper.fakeUser());

        await Actions.addUserToTeam(TestHelper.basicTeam.id, user.id)(store.dispatch, store.getState);

        let state = store.getState();
        let members = state.entities.teams.membersInTeam;
        const addRequest = state.requests.teams.addUserToTeam;

        if (addRequest.status === RequestStatus.FAILURE) {
            throw new Error(JSON.stringify(addRequest.error));
        }

        assert.ok(members[TestHelper.basicTeam.id]);
        assert.ok(members[TestHelper.basicTeam.id].has(user.id));
        await Actions.removeUserFromTeam(TestHelper.basicTeam.id, user.id)(store.dispatch, store.getState);
        state = store.getState();

        const removeRequest = state.requests.teams.removeUserFromTeam;

        if (removeRequest.status === RequestStatus.FAILURE) {
            throw new Error(JSON.stringify(removeRequest.error));
        }

        members = state.entities.teams.membersInTeam;
        assert.ok(members[TestHelper.basicTeam.id]);
        assert.ok(!members[TestHelper.basicTeam.id].has(user.id));
    });
});
