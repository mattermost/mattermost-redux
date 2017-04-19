// Copyright (c) 2016 Mattermost, Inc. All Rights Reserved.
// See License.txt for license information.

import assert from 'assert';

import * as Actions from 'actions/users';
import {Client, Client4} from 'client';
import {RequestStatus} from 'constants';
import TestHelper from 'test/test_helper';
import configureStore from 'test/test_store';

describe('Actions.Users', () => {
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

    it('createUser', async () => {
        let user = TestHelper.fakeUser();
        user = await Actions.createUser(user)(store.dispatch, store.getState);

        const state = store.getState();
        const createRequest = state.requests.users.create;
        const {profiles} = state.entities.users;

        if (createRequest.status === RequestStatus.FAILURE) {
            throw new Error(JSON.stringify(createRequest.error));
        }

        assert.ok(profiles);
        assert.ok(profiles[user.id]);
    });

    it('login', async () => {
        const user = TestHelper.basicUser;
        await TestHelper.basicClient4.logout();
        await Actions.login(user.email, 'password1')(store.dispatch, store.getState);

        const state = store.getState();
        const loginRequest = state.requests.users.login;
        const {currentUserId, profiles} = state.entities.users;
        const preferences = state.entities.preferences.myPreferences;
        const teamMembers = state.entities.teams.myMembers;

        if (loginRequest.status === RequestStatus.FAILURE) {
            throw new Error(JSON.stringify(loginRequest.error));
        }

        assert.ok(currentUserId);
        assert.ok(profiles);
        assert.ok(profiles[currentUserId]);
        assert.ok(Object.keys(preferences).length);

        Object.keys(teamMembers).forEach((id) => {
            assert.ok(teamMembers[id].team_id);
            assert.equal(teamMembers[id].user_id, currentUserId);
        });
    });

    it('logout', async () => {
        await Actions.logout()(store.dispatch, store.getState);

        const state = store.getState();
        const logoutRequest = state.requests.users.logout;
        const general = state.entities.general;
        const users = state.entities.users;
        const teams = state.entities.teams;
        const channels = state.entities.channels;
        const posts = state.entities.posts;
        const preferences = state.entities.preferences;

        if (logoutRequest.status === RequestStatus.FAILURE) {
            throw new Error(JSON.stringify(logoutRequest.error));
        }

        assert.deepStrictEqual(general.config, {}, 'config not empty');
        assert.deepStrictEqual(general.license, {}, 'license not empty');
        assert.strictEqual(users.currentUserId, '', 'current user id not empty');
        assert.deepStrictEqual(users.mySessions, [], 'user sessions not empty');
        assert.deepStrictEqual(users.myAudits, [], 'user audits not empty');
        assert.deepStrictEqual(users.profiles, {}, 'user profiles not empty');
        assert.deepStrictEqual(users.profilesInTeam, {}, 'users profiles in team not empty');
        assert.deepStrictEqual(users.profilesInChannel, {}, 'users profiles in channel not empty');
        assert.deepStrictEqual(users.profilesNotInChannel, {}, 'users profiles NOT in channel not empty');
        assert.deepStrictEqual(users.statuses, {}, 'users statuses not empty');
        assert.strictEqual(teams.currentTeamId, '', 'current team id is not empty');
        assert.deepStrictEqual(teams.teams, {}, 'teams is not empty');
        assert.deepStrictEqual(teams.myMembers, {}, 'team members is not empty');
        assert.deepStrictEqual(teams.membersInTeam, {}, 'members in team is not empty');
        assert.deepStrictEqual(teams.stats, {}, 'team stats is not empty');
        assert.strictEqual(channels.currentChannelId, '', 'current channel id is not empty');
        assert.deepStrictEqual(channels.channels, {}, 'channels is not empty');
        assert.deepStrictEqual(channels.channelsInTeam, {}, 'channelsInTeam is not empty');
        assert.deepStrictEqual(channels.myMembers, {}, 'channel members is not empty');
        assert.deepStrictEqual(channels.stats, {}, 'channel stats is not empty');
        assert.strictEqual(posts.selectedPostId, '', 'selected post id is not empty');
        assert.strictEqual(posts.currentFocusedPostId, '', 'current focused post id is not empty');
        assert.deepStrictEqual(posts.posts, {}, 'posts is not empty');
        assert.deepStrictEqual(posts.postsInChannel, {}, 'posts by channel is not empty');
        assert.deepStrictEqual(preferences.myPreferences, {}, 'user preferences not empty');
    });

    it('getProfiles', async () => {
        await TestHelper.basicClient4.login(TestHelper.basicUser.email, 'password1');
        await TestHelper.basicClient4.createUser(TestHelper.fakeUser());
        await Actions.getProfiles(0)(store.dispatch, store.getState);

        const profilesRequest = store.getState().requests.users.getProfiles;
        const {profiles} = store.getState().entities.users;

        if (profilesRequest.status === RequestStatus.FAILURE) {
            throw new Error(JSON.stringify(profilesRequest.error));
        }

        assert.ok(Object.keys(profiles).length);
    });

    it('getProfilesByIds', async () => {
        await TestHelper.basicClient4.login(TestHelper.basicUser.email, 'password1');
        const user = await TestHelper.basicClient4.createUser(TestHelper.fakeUser());
        await Actions.getProfilesByIds([user.id])(store.dispatch, store.getState);

        const profilesRequest = store.getState().requests.users.getProfiles;
        const {profiles} = store.getState().entities.users;

        if (profilesRequest.status === RequestStatus.FAILURE) {
            throw new Error(JSON.stringify(profilesRequest.error));
        }

        assert.ok(profiles[user.id]);
    });

    it('getProfilesInTeam', async () => {
        await Actions.getProfilesInTeam(TestHelper.basicTeam.id, 0)(store.dispatch, store.getState);

        const profilesRequest = store.getState().requests.users.getProfilesInTeam;
        const {profilesInTeam, profiles} = store.getState().entities.users;

        if (profilesRequest.status === RequestStatus.FAILURE) {
            throw new Error(JSON.stringify(profilesRequest.error));
        }

        const team = profilesInTeam[TestHelper.basicTeam.id];
        assert.ok(team);
        assert.ok(team.has(TestHelper.basicUser.id));
        assert.equal(Object.keys(profiles).length, team.size, 'profiles != profiles in team');
    });

    it('getProfilesInChannel', async () => {
        await Actions.getProfilesInChannel(
            TestHelper.basicChannel.id,
            0
        )(store.dispatch, store.getState);

        const profilesRequest = store.getState().requests.users.getProfilesInChannel;
        const {profiles, profilesInChannel} = store.getState().entities.users;

        if (profilesRequest.status === RequestStatus.FAILURE) {
            throw new Error(JSON.stringify(profilesRequest.error));
        }

        const channel = profilesInChannel[TestHelper.basicChannel.id];
        assert.ok(channel.has(TestHelper.basicUser.id));
        assert.equal(Object.keys(profiles).length, channel.size, 'profiles != profiles in channel');
    });

    it('getProfilesNotInChannel', async () => {
        const user = await TestHelper.basicClient4.createUser(
            TestHelper.fakeUser(),
            null,
            null,
            TestHelper.basicTeam.invite_id
        );

        await Actions.getProfilesNotInChannel(
            TestHelper.basicTeam.id,
            TestHelper.basicChannel.id,
            0
        )(store.dispatch, store.getState);

        const profilesRequest = store.getState().requests.users.getProfilesNotInChannel;
        const {profiles, profilesNotInChannel} = store.getState().entities.users;

        if (profilesRequest.status === RequestStatus.FAILURE) {
            throw new Error(JSON.stringify(profilesRequest.error));
        }

        const channel = profilesNotInChannel[TestHelper.basicChannel.id];
        assert.ok(channel.has(user.id));
        assert.equal(Object.keys(profiles).length, channel.size, 'profiles != profiles in channel');
    });

    it('getUser', async () => {
        const user = await TestHelper.basicClient4.createUser(
            TestHelper.fakeUser(),
            null,
            null,
            TestHelper.basicTeam.invite_id
        );

        await Actions.getUser(
            user.id
        )(store.dispatch, store.getState);

        const state = store.getState();
        const profileRequest = state.requests.users.getUser;
        const {profiles} = state.entities.users;

        if (profileRequest.status === RequestStatus.FAILURE) {
            throw new Error(JSON.stringify(profileRequest.error));
        }

        assert.ok(profiles[user.id]);
        assert.equal(profiles[user.id].id, user.id);
    });

    it('getUserByUsername', async () => {
        const user = await TestHelper.basicClient4.createUser(
            TestHelper.fakeUser(),
            null,
            null,
            TestHelper.basicTeam.invite_id
        );

        await Actions.getUserByUsername(
            user.username
        )(store.dispatch, store.getState);

        const state = store.getState();
        const profileRequest = state.requests.users.getUserByUsername;
        const {profiles} = state.entities.users;

        if (profileRequest.status === RequestStatus.FAILURE) {
            throw new Error(JSON.stringify(profileRequest.error));
        }

        assert.ok(profiles[user.id]);
        assert.equal(profiles[user.id].username, user.username);
    });

    it('searchProfiles', async () => {
        const user = TestHelper.basicUser;

        await Actions.searchProfiles(
            user.username
        )(store.dispatch, store.getState);

        const state = store.getState();
        const searchRequest = state.requests.users.searchProfiles;
        const {profiles} = state.entities.users;

        if (searchRequest.status === RequestStatus.FAILURE) {
            throw new Error(JSON.stringify(searchRequest.error));
        }

        assert.ok(profiles[user.id]);
        assert.equal(profiles[user.id].id, user.id);
    });

    it('getStatusesByIds', async () => {
        const user = await TestHelper.basicClient4.createUser(TestHelper.fakeUser());

        await Actions.getStatusesByIds(
            [TestHelper.basicUser.id, user.id]
        )(store.dispatch, store.getState);

        const statusesRequest = store.getState().requests.users.getStatusesByIds;
        const statuses = store.getState().entities.users.statuses;

        if (statusesRequest.status === RequestStatus.FAILURE) {
            throw new Error(JSON.stringify(statusesRequest.error));
        }

        assert.ok(statuses[TestHelper.basicUser.id]);
        assert.ok(statuses[user.id]);
        assert.equal(Object.keys(statuses).length, 2);
    });

    it('getSessions', async () => {
        await Actions.getSessions(TestHelper.basicUser.id)(store.dispatch, store.getState);

        const sessionsRequest = store.getState().requests.users.getSessions;
        const sessions = store.getState().entities.users.mySessions;

        if (sessionsRequest.status === RequestStatus.FAILURE) {
            throw new Error(JSON.stringify(sessionsRequest.error));
        }

        assert.ok(sessions.length);
        assert.equal(sessions[0].user_id, TestHelper.basicUser.id);
    });

    it('revokeSession', async () => {
        await Actions.getSessions(TestHelper.basicUser.id)(store.dispatch, store.getState);

        const sessionsRequest = store.getState().requests.users.getSessions;
        let sessions = store.getState().entities.users.mySessions;
        if (sessionsRequest.status === RequestStatus.FAILURE) {
            throw new Error(JSON.stringify(sessionsRequest.error));
        }

        const sessionsLength = sessions.length;

        await Actions.revokeSession(TestHelper.basicUser.id, sessions[0].id)(store.dispatch, store.getState);

        const revokeRequest = store.getState().requests.users.revokeSession;
        if (revokeRequest.status === RequestStatus.FAILURE) {
            throw new Error(JSON.stringify(revokeRequest.error));
        }

        sessions = store.getState().entities.users.mySessions;
        assert.ok(sessions.length === sessionsLength - 1);
    });

    it('revokeSession and logout', async () => {
        await TestHelper.basicClient4.login(TestHelper.basicUser.email, 'password1');
        await Actions.getSessions(TestHelper.basicUser.id)(store.dispatch, store.getState);

        const sessionsRequest = store.getState().requests.users.getSessions;
        const sessions = store.getState().entities.users.mySessions;

        if (sessionsRequest.status === RequestStatus.FAILURE) {
            throw new Error(JSON.stringify(sessionsRequest.error));
        }

        await Actions.revokeSession(TestHelper.basicUser.id, sessions[0].id)(store.dispatch, store.getState);

        const revokeRequest = store.getState().requests.users.revokeSession;
        if (revokeRequest.status === RequestStatus.FAILURE) {
            throw new Error(JSON.stringify(revokeRequest.error));
        }

        await Actions.getProfiles(0)(store.dispatch, store.getState);

        const logoutRequest = store.getState().requests.users.logout;
        if (logoutRequest.status === RequestStatus.FAILURE) {
            throw new Error(JSON.stringify(logoutRequest.error));
        }
    });

    it('getUserAudits', async () => {
        await TestHelper.basicClient4.login(TestHelper.basicUser.email, 'password1');
        await Actions.getUserAudits(TestHelper.basicUser.id)(store.dispatch, store.getState);

        const auditsRequest = store.getState().requests.users.getAudits;
        const audits = store.getState().entities.users.myAudits;

        if (auditsRequest.status === RequestStatus.FAILURE) {
            throw new Error(JSON.stringify(auditsRequest.error));
        }

        assert.ok(audits.length);
        assert.equal(audits[0].user_id, TestHelper.basicUser.id);
    });

    it('autocompleteUsersInChannel', async () => {
        const user = await TestHelper.basicClient4.createUser(
            TestHelper.fakeUser(),
            null,
            null,
            TestHelper.basicTeam.invite_id
        );

        await TestHelper.basicClient4.login(TestHelper.basicUser.email, 'password1');
        await Actions.autocompleteUsersInChannel(
            TestHelper.basicTeam.id,
            TestHelper.basicChannel.id,
            ''
        )(store.dispatch, store.getState);

        const autocompleteRequest = store.getState().requests.users.autocompleteUsersInChannel;
        const {profiles, profilesNotInChannel, profilesInChannel} = store.getState().entities.users;

        if (autocompleteRequest.status === RequestStatus.FAILURE) {
            throw new Error(JSON.stringify(autocompleteRequest.error));
        }

        const notInChannel = profilesNotInChannel[TestHelper.basicChannel.id];
        const inChannel = profilesInChannel[TestHelper.basicChannel.id];
        assert.ok(notInChannel.has(user.id));
        assert.ok(inChannel.has(TestHelper.basicUser.id));
        assert.ok(profiles[user.id]);
    });

    it('updateUserNotifyProps', async () => {
        await Actions.login(TestHelper.basicUser.email, 'password1')(store.dispatch, store.getState);

        const state = store.getState();
        const currentUser = state.entities.users.profiles[state.entities.users.currentUserId];
        const notifyProps = currentUser.notify_props;

        await Actions.updateUserNotifyProps({
            ...notifyProps,
            comments: 'any',
            email: 'false',
            first_name: 'false',
            mention_keys: '',
            user_id: currentUser.id
        })(store.dispatch, store.getState);

        const updateRequest = store.getState().requests.users.updateUserNotifyProps;
        const {currentUserId, profiles} = store.getState().entities.users;
        const updateNotifyProps = profiles[currentUserId].notify_props;

        if (updateRequest.status === RequestStatus.FAILURE) {
            throw new Error(JSON.stringify(updateRequest.error));
        }

        assert.equal(updateNotifyProps.comments, 'any');
        assert.equal(updateNotifyProps.email, 'false');
        assert.equal(updateNotifyProps.first_name, 'false');
        assert.equal(updateNotifyProps.mention_keys, '');
    });

    it('checkMfa', async () => {
        const user = TestHelper.basicUser;
        const mfaRequired = await Actions.checkMfa(user.email)(store.dispatch, store.getState);

        const state = store.getState();
        const mfaRequest = state.requests.users.checkMfa;

        if (mfaRequest.status === RequestStatus.FAILURE) {
            throw new Error(JSON.stringify(mfaRequest.error));
        }

        assert.ok(!mfaRequired);
    });
});
