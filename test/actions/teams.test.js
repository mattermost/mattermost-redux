// Copyright (c) 2016 Mattermost, Inc. All Rights Reserved.
// See License.txt for license information.

import assert from 'assert';

import * as Actions from 'actions/teams';
import {login} from 'actions/users';
import {Client, Client4} from 'client';
import {General, RequestStatus} from 'constants';
import {GeneralTypes} from 'action_types';
import TestHelper from 'test/test_helper';
import configureStore from 'test/test_store';

describe('Actions.Teams', () => {
    let store;
    before(async () => {
        await TestHelper.initBasic(Client, Client4);
    });

    beforeEach(async () => {
        store = await configureStore();
    });

    after(async () => {
        await TestHelper.basicClient.logout();
        await TestHelper.basicClient4.logout();
    });

    it('selectTeam', async () => {
        await Actions.selectTeam(TestHelper.basicTeam)(store.dispatch, store.getState);
        await TestHelper.wait(100);
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

    it('getTeamsForUser', async () => {
        await Actions.getTeamsForUser(TestHelper.basicUser.id)(store.dispatch, store.getState);

        const teamsRequest = store.getState().requests.teams.getTeams;
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

    it('getTeam', async () => {
        const team = await Client4.createTeam(TestHelper.fakeTeam());
        await Actions.getTeam(team.id)(store.dispatch, store.getState);

        const state = store.getState();
        const {getTeam: teamRequest} = state.requests.teams;
        const {teams} = state.entities.teams;

        if (teamRequest.status === RequestStatus.FAILURE) {
            throw new Error(JSON.stringify(teamRequest.error));
        }

        assert.ok(teams);
        assert.ok(teams[team.id]);
    });

    it('createTeam', async () => {
        await Actions.createTeam(
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

    it('Join Open Team', async () => {
        const client = TestHelper.createClient4();
        const user = await client.createUser(
            TestHelper.fakeUser(),
            null,
            null,
            TestHelper.basicTeam.invite_id
        );
        await client.login(user.email, 'password1');
        const team = await client.createTeam({...TestHelper.fakeTeam(), allow_open_invite: true});
        const team2 = await client.createTeam({...TestHelper.fakeTeam(), allow_open_invite: true});

        store.dispatch({type: GeneralTypes.RECEIVED_SERVER_VERSION, data: '3.10.0'});
        await Actions.joinTeam(team.invite_id, team.id)(store.dispatch, store.getState);

        store.dispatch({type: GeneralTypes.RECEIVED_SERVER_VERSION, data: '4.0.0'});
        await Actions.joinTeam(team2.invite_id, team2.id)(store.dispatch, store.getState);

        const state = store.getState();

        const request = state.requests.teams.joinTeam;

        if (request.status !== RequestStatus.SUCCESS) {
            throw new Error(JSON.stringify(request.error));
        }

        const {teams, myMembers} = state.entities.teams;
        assert.ok(teams[team.id]);
        assert.ok(teams[team2.id]);
        assert.ok(myMembers[team.id]);
        assert.ok(myMembers[team2.id]);
    });

    it('getMyTeamMembers and getMyTeamUnreads', async () => {
        await Actions.getMyTeamMembers()(store.dispatch, store.getState);
        await Actions.getMyTeamUnreads()(store.dispatch, store.getState);

        const {
            getMyTeamMembers: membersRequest,
            getMyTeamUnreads: unreadRequest
        } = store.getState().requests.teams;
        const members = store.getState().entities.teams.myMembers;

        if (membersRequest.status === RequestStatus.FAILURE) {
            throw new Error(JSON.stringify(membersRequest.error));
        }

        if (unreadRequest.status === RequestStatus.FAILURE) {
            throw new Error(JSON.stringify(unreadRequest.error));
        }

        const member = members[TestHelper.basicTeam.id];
        assert.ok(member);
        assert.ok(member.hasOwnProperty('mention_count'));
    });

    it('getTeamMembersForUser', async () => {
        await Actions.getTeamMembersForUser(TestHelper.basicUser.id)(store.dispatch, store.getState);

        const membersRequest = store.getState().requests.teams.getTeamMembers;
        const membersInTeam = store.getState().entities.teams.membersInTeam;

        if (membersRequest.status === RequestStatus.FAILURE) {
            throw new Error(JSON.stringify(membersRequest.error));
        }

        assert.ok(membersInTeam);
        assert.ok(membersInTeam[TestHelper.basicTeam.id]);
        assert.ok(membersInTeam[TestHelper.basicTeam.id][TestHelper.basicUser.id]);
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
        assert.ok(members[TestHelper.basicTeam.id][user.id]);
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
        assert.ok(members[TestHelper.basicTeam.id][user1.id]);
        assert.ok(members[TestHelper.basicTeam.id][user2.id]);
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
        assert.equal(stat.total_member_count, 5);
        assert.equal(stat.active_member_count, 5);
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
        assert.ok(members[TestHelper.basicTeam.id][user.id]);
    });

    it('addUsersToTeam', async () => {
        const user = await TestHelper.basicClient4.createUser(TestHelper.fakeUser());
        const user2 = await TestHelper.basicClient4.createUser(TestHelper.fakeUser());

        await Actions.addUsersToTeam(TestHelper.basicTeam.id, [user.id, user2.id])(store.dispatch, store.getState);

        const membersRequest = store.getState().requests.teams.addUserToTeam;
        const members = store.getState().entities.teams.membersInTeam;
        const profilesInTeam = store.getState().entities.users.profilesInTeam;

        if (membersRequest.status === RequestStatus.FAILURE) {
            throw new Error(JSON.stringify(membersRequest.error));
        }

        assert.ok(members[TestHelper.basicTeam.id]);
        assert.ok(members[TestHelper.basicTeam.id][user.id]);
        assert.ok(members[TestHelper.basicTeam.id][user2.id]);
        assert.ok(profilesInTeam[TestHelper.basicTeam.id]);
        assert.ok(profilesInTeam[TestHelper.basicTeam.id].has(user.id));
        assert.ok(profilesInTeam[TestHelper.basicTeam.id].has(user2.id));
    });

    it('removeUserFromTeam', async () => {
        const user = await TestHelper.basicClient4.createUser(TestHelper.fakeUser());

        await Actions.addUserToTeam(TestHelper.basicTeam.id, user.id)(store.dispatch, store.getState);

        let state = store.getState();
        let members = state.entities.teams.membersInTeam;
        let profilesInTeam = state.entities.users.profilesInTeam;
        let profilesNotInTeam = state.entities.users.profilesNotInTeam;
        const addRequest = state.requests.teams.addUserToTeam;

        if (addRequest.status === RequestStatus.FAILURE) {
            throw new Error(JSON.stringify(addRequest.error));
        }

        assert.ok(members[TestHelper.basicTeam.id]);
        assert.ok(members[TestHelper.basicTeam.id][user.id]);
        assert.ok(profilesInTeam[TestHelper.basicTeam.id].has(user.id));
        assert.ok(!profilesNotInTeam[TestHelper.basicTeam.id].has(user.id));
        await Actions.removeUserFromTeam(TestHelper.basicTeam.id, user.id)(store.dispatch, store.getState);
        state = store.getState();

        const removeRequest = state.requests.teams.removeUserFromTeam;

        if (removeRequest.status === RequestStatus.FAILURE) {
            throw new Error(JSON.stringify(removeRequest.error));
        }

        members = state.entities.teams.membersInTeam;
        profilesInTeam = state.entities.users.profilesInTeam;
        profilesNotInTeam = state.entities.users.profilesNotInTeam;
        assert.ok(members[TestHelper.basicTeam.id]);
        assert.ok(!members[TestHelper.basicTeam.id][user.id]);
        assert.ok(!profilesInTeam[TestHelper.basicTeam.id].has(user.id));
        assert.ok(profilesNotInTeam[TestHelper.basicTeam.id].has(user.id));
    });

    it('updateTeamMemberRoles', async () => {
        const user = await TestHelper.basicClient4.createUser(TestHelper.fakeUser());
        await Actions.addUserToTeam(TestHelper.basicTeam.id, user.id)(store.dispatch, store.getState);

        const roles = General.TEAM_USER_ROLE + ' ' + General.TEAM_ADMIN_ROLE;
        await Actions.updateTeamMemberRoles(TestHelper.basicTeam.id, user.id, roles)(store.dispatch, store.getState);

        const membersRequest = store.getState().requests.teams.updateTeamMember;
        const members = store.getState().entities.teams.membersInTeam;

        if (membersRequest.status === RequestStatus.FAILURE) {
            throw new Error(JSON.stringify(membersRequest.error));
        }

        assert.ok(members[TestHelper.basicTeam.id]);
        assert.ok(members[TestHelper.basicTeam.id][user.id]);
        assert.ok(members[TestHelper.basicTeam.id][user.id].roles === roles);
    });

    it('sendEmailInvitesToTeam', async () => {
        await Actions.sendEmailInvitesToTeam(TestHelper.basicTeam.id, ['fakeemail1@example.com', 'fakeemail2@example.com'])(store.dispatch, store.getState);

        const inviteRequest = store.getState().requests.teams.emailInvite;

        if (inviteRequest.status === RequestStatus.FAILURE) {
            throw new Error(JSON.stringify(inviteRequest.error));
        }
    });

    it('checkIfTeamExists', async () => {
        let exists = await Actions.checkIfTeamExists(TestHelper.basicTeam.name)(store.dispatch, store.getState);

        let teamRequest = store.getState().requests.teams.getTeam;

        if (teamRequest.status === RequestStatus.FAILURE) {
            throw new Error(JSON.stringify(teamRequest.error));
        }

        assert.ok(exists === true);

        exists = await Actions.checkIfTeamExists('junk')(store.dispatch, store.getState);

        teamRequest = store.getState().requests.teams.getTeam;

        if (teamRequest.status === RequestStatus.FAILURE) {
            throw new Error(JSON.stringify(teamRequest.error));
        }

        assert.ok(exists === false);
    });
});
