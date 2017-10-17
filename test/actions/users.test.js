// Copyright (c) 2016 Mattermost, Inc. All Rights Reserved.
// See License.txt for license information.

import assert from 'assert';
import nock from 'nock';
import fs from 'fs';

import * as Actions from 'actions/users';
import {Client, Client4} from 'client';
import {RequestStatus} from 'constants';
import TestHelper from 'test/test_helper';
import configureStore from 'test/test_store';

const OK_RESPONSE = {status: 'OK'};

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

    it('loginById', async () => {
        const user = TestHelper.basicUser;
        await TestHelper.basicClient4.logout();
        await Actions.loginById(user.id, 'password1')(store.dispatch, store.getState);

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

    it('getMissingProfilesByIds', async () => {
        await TestHelper.basicClient4.login(TestHelper.basicUser.email, 'password1');
        const user = await TestHelper.basicClient4.createUser(TestHelper.fakeUser());
        await Actions.getMissingProfilesByIds([user.id])(store.dispatch, store.getState);

        const {profiles} = store.getState().entities.users;
        assert.ok(profiles[user.id]);
    });

    it('getProfilesByUsernames', async () => {
        await TestHelper.basicClient4.login(TestHelper.basicUser.email, 'password1');
        const user = await TestHelper.basicClient4.createUser(TestHelper.fakeUser());
        await Actions.getProfilesByUsernames([user.username])(store.dispatch, store.getState);

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

    it('getProfilesNotInTeam', async () => {
        await TestHelper.basicClient4.createUser(
            TestHelper.fakeUser(),
            null,
            null,
            TestHelper.basicTeam.invite_id
        );

        const team = await Client4.createTeam({...TestHelper.fakeTeam(), allow_open_invite: true});

        await Actions.getProfilesNotInTeam(team.id, 0)(store.dispatch, store.getState);

        const profilesRequest = store.getState().requests.users.getProfilesNotInTeam;
        const {profilesNotInTeam} = store.getState().entities.users;

        if (profilesRequest.status === RequestStatus.FAILURE) {
            throw new Error(JSON.stringify(profilesRequest.error));
        }

        const notInTeam = profilesNotInTeam[team.id];
        assert.ok(notInTeam);
        assert.ok(notInTeam.size > 0);
    });

    it('getProfilesWithoutTeam', async () => {
        const user = await TestHelper.basicClient4.createUser(
            TestHelper.fakeUser(),
        );

        TestHelper.activateMocking();
        nock(Client4.getBaseRoute()).
            get('/users').
            query(true).
            reply(200, [user]);

        await Actions.getProfilesWithoutTeam(0)(store.dispatch, store.getState);
        nock.restore();

        const profilesRequest = store.getState().requests.users.getProfilesWithoutTeam;
        const {profilesWithoutTeam, profiles} = store.getState().entities.users;

        if (profilesRequest.status === RequestStatus.FAILURE) {
            throw new Error(JSON.stringify(profilesRequest.error));
        }

        assert.ok(profilesWithoutTeam);
        assert.ok(profilesWithoutTeam.has(user.id));
        assert.ok(profiles[user.id]);
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

    it('getMe', async () => {
        await Actions.getMe()(store.dispatch, store.getState);

        const state = store.getState();
        const profileRequest = state.requests.users.getUser;
        const {profiles, currentUserId} = state.entities.users;

        if (profileRequest.status === RequestStatus.FAILURE) {
            throw new Error(JSON.stringify(profileRequest.error));
        }

        assert.ok(profiles[currentUserId]);
        assert.equal(profiles[currentUserId].id, currentUserId);
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

    it('getUserByEmail', async () => {
        const user = await TestHelper.basicClient4.createUser(
            TestHelper.fakeUser(),
            null,
            null,
            TestHelper.basicTeam.invite_id
        );

        await Actions.getUserByEmail(
            user.email
        )(store.dispatch, store.getState);

        const state = store.getState();
        const profileRequest = state.requests.users.getUser;
        const {profiles} = state.entities.users;

        if (profileRequest.status === RequestStatus.FAILURE) {
            throw new Error(JSON.stringify(profileRequest.error));
        }

        assert.ok(profiles[user.id]);
        assert.equal(profiles[user.id].email, user.email);
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

    it('getStatus', async () => {
        const user = await TestHelper.basicClient4.createUser(TestHelper.fakeUser());

        await Actions.getStatus(
            user.id
        )(store.dispatch, store.getState);

        const statusRequest = store.getState().requests.users.getStatus;
        const statuses = store.getState().entities.users.statuses;

        if (statusRequest.status === RequestStatus.FAILURE) {
            throw new Error(JSON.stringify(statusRequest.error));
        }

        assert.ok(statuses[user.id]);
    });

    it('setStatus', async () => {
        await Actions.setStatus(
            {user_id: TestHelper.basicUser.id, status: 'away'}
        )(store.dispatch, store.getState);

        const statusRequest = store.getState().requests.users.setStatus;
        const statuses = store.getState().entities.users.statuses;

        if (statusRequest.status === RequestStatus.FAILURE) {
            throw new Error(JSON.stringify(statusRequest.error));
        }

        assert.ok(statuses[TestHelper.basicUser.id] === 'away');
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

    it('autocompleteUsers', async () => {
        const user = await TestHelper.basicClient4.createUser(
            TestHelper.fakeUser(),
            null,
            null,
            TestHelper.basicTeam.invite_id
        );

        await TestHelper.basicClient4.login(TestHelper.basicUser.email, 'password1');
        await Actions.autocompleteUsers(
            '',
            TestHelper.basicTeam.id,
            TestHelper.basicChannel.id
        )(store.dispatch, store.getState);

        const autocompleteRequest = store.getState().requests.users.autocompleteUsers;
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

    it('updateMe', async () => {
        await Actions.login(TestHelper.basicUser.email, 'password1')(store.dispatch, store.getState);

        const state = store.getState();
        const currentUser = state.entities.users.profiles[state.entities.users.currentUserId];
        const notifyProps = currentUser.notify_props;

        await Actions.updateMe({
            notify_props: {
                ...notifyProps,
                comments: 'any',
                email: 'false',
                first_name: 'false',
                mention_keys: '',
                user_id: currentUser.id
            }
        })(store.dispatch, store.getState);

        const updateRequest = store.getState().requests.users.updateMe;
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

    it('updateUserRoles', async () => {
        await Actions.login(TestHelper.basicUser.email, 'password1')(store.dispatch, store.getState);

        const currentUserId = store.getState().entities.users.currentUserId;

        TestHelper.activateMocking();
        nock(Client4.getBaseRoute()).
            put(`/users/${currentUserId}/roles`).
            reply(200, OK_RESPONSE);

        await Actions.updateUserRoles(currentUserId, 'system_user system_admin')(store.dispatch, store.getState);
        nock.restore();

        const updateRequest = store.getState().requests.users.updateUser;
        const {profiles} = store.getState().entities.users;
        const currentUserRoles = profiles[currentUserId].roles;

        if (updateRequest.status === RequestStatus.FAILURE) {
            throw new Error(JSON.stringify(updateRequest.error));
        }

        assert.equal(currentUserRoles, 'system_user system_admin');
    });

    it('updateUserMfa', async () => {
        await Actions.login(TestHelper.basicUser.email, 'password1')(store.dispatch, store.getState);

        const currentUserId = store.getState().entities.users.currentUserId;

        TestHelper.activateMocking();
        nock(Client4.getBaseRoute()).
            put(`/users/${currentUserId}/mfa`).
            reply(200, OK_RESPONSE);

        await Actions.updateUserMfa(currentUserId, true, '123456')(store.dispatch, store.getState);
        nock.restore();

        const updateRequest = store.getState().requests.users.updateUser;
        const {profiles} = store.getState().entities.users;
        const currentUserMfa = profiles[currentUserId].mfa_active;

        if (updateRequest.status === RequestStatus.FAILURE) {
            throw new Error(JSON.stringify(updateRequest.error));
        }

        assert.equal(currentUserMfa, true);
    });

    it('updateUserPassword', async () => {
        await Actions.login(TestHelper.basicUser.email, 'password1')(store.dispatch, store.getState);

        const beforeTime = new Date().getTime();
        const currentUserId = store.getState().entities.users.currentUserId;

        await Actions.updateUserPassword(currentUserId, 'password1', 'password1')(store.dispatch, store.getState);

        const updateRequest = store.getState().requests.users.updateUser;
        const {profiles} = store.getState().entities.users;
        const currentUser = profiles[currentUserId];

        if (updateRequest.status === RequestStatus.FAILURE) {
            throw new Error(JSON.stringify(updateRequest.error));
        }

        assert.ok(currentUser);
        assert.ok(currentUser.last_password_update_at > beforeTime);
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

    it('generateMfaSecret', async () => {
        TestHelper.activateMocking();
        nock(Client4.getBaseRoute()).
            post('/users/me/mfa/generate').
            reply(200, {secret: 'somesecret', qr_code: 'someqrcode'});

        await Actions.generateMfaSecret('me')(store.dispatch, store.getState);
        nock.restore();

        const request = store.getState().requests.users.generateMfaSecret;

        if (request.status === RequestStatus.FAILURE) {
            throw new Error(JSON.stringify(request.error));
        }
    });

    it('updateUserActive', async () => {
        const user = await TestHelper.basicClient4.createUser(
            TestHelper.fakeUser(),
            null,
            null,
            TestHelper.basicTeam.invite_id
        );

        await Actions.login(user.email, 'password1')(store.dispatch, store.getState);

        const beforeTime = new Date().getTime();
        const currentUserId = store.getState().entities.users.currentUserId;

        await Actions.updateUserActive(currentUserId, false)(store.dispatch, store.getState);

        const updateRequest = store.getState().requests.users.updateUser;
        const {profiles} = store.getState().entities.users;
        const currentUser = profiles[currentUserId];

        if (updateRequest.status === RequestStatus.FAILURE) {
            throw new Error(JSON.stringify(updateRequest.error));
        }

        assert.ok(currentUser);
        assert.ok(currentUser.delete_at > beforeTime);

        await Actions.login(TestHelper.basicUser.email, 'password1')(store.dispatch, store.getState);
    });

    it('verifyUserEmail', async () => {
        TestHelper.activateMocking();
        nock(Client4.getBaseRoute()).
            post('/users/email/verify').
            reply(200, OK_RESPONSE);

        await Actions.verifyUserEmail('sometoken')(store.dispatch, store.getState);
        nock.restore();

        const request = store.getState().requests.users.verifyEmail;

        if (request.status === RequestStatus.FAILURE) {
            throw new Error(JSON.stringify(request.error));
        }
    });

    it('sendVerificationEmail', async () => {
        TestHelper.activateMocking();
        nock(Client4.getBaseRoute()).
            post('/users/email/verify/send').
            reply(200, OK_RESPONSE);

        await Actions.sendVerificationEmail(TestHelper.basicUser.email)(store.dispatch, store.getState);
        nock.restore();

        const request = store.getState().requests.users.verifyEmail;

        if (request.status === RequestStatus.FAILURE) {
            throw new Error(JSON.stringify(request.error));
        }
    });

    it('resetUserPassword', async () => {
        TestHelper.activateMocking();
        nock(Client4.getBaseRoute()).
            post('/users/password/reset').
            reply(200, OK_RESPONSE);

        await Actions.resetUserPassword('sometoken', 'newpassword')(store.dispatch, store.getState);
        nock.restore();

        const request = store.getState().requests.users.passwordReset;

        if (request.status === RequestStatus.FAILURE) {
            throw new Error(JSON.stringify(request.error));
        }
    });

    it('sendPasswordResetEmail', async () => {
        TestHelper.activateMocking();
        nock(Client4.getBaseRoute()).
            post('/users/password/reset/send').
            reply(200, OK_RESPONSE);

        await Actions.sendPasswordResetEmail(TestHelper.basicUser.email)(store.dispatch, store.getState);
        nock.restore();

        const request = store.getState().requests.users.passwordReset;

        if (request.status === RequestStatus.FAILURE) {
            throw new Error(JSON.stringify(request.error));
        }
    });

    it('uploadProfileImage', async () => {
        await Actions.login(TestHelper.basicUser.email, 'password1')(store.dispatch, store.getState);

        const testImageData = fs.createReadStream('test/assets/images/test.png');

        const beforeTime = new Date().getTime();
        const currentUserId = store.getState().entities.users.currentUserId;

        await Actions.uploadProfileImage(currentUserId, testImageData)(store.dispatch, store.getState);

        const updateRequest = store.getState().requests.users.updateUser;
        const {profiles} = store.getState().entities.users;
        const currentUser = profiles[currentUserId];

        if (updateRequest.status === RequestStatus.FAILURE) {
            throw new Error(JSON.stringify(updateRequest.error));
        }

        assert.ok(currentUser);
        assert.ok(currentUser.last_picture_update > beforeTime);
    });

    it('switchEmailToOAuth', async () => {
        TestHelper.activateMocking();
        nock(Client4.getBaseRoute()).
            post('/users/login/switch').
            reply(200, {follow_link: '/login'});

        await Actions.switchEmailToOAuth('gitlab', TestHelper.basicUser.email, TestHelper.basicUser.password)(store.dispatch, store.getState);
        nock.restore();

        const request = store.getState().requests.users.switchLogin;

        if (request.status === RequestStatus.FAILURE) {
            throw new Error(JSON.stringify(request.error));
        }
    });

    it('switchOAuthToEmail', async () => {
        TestHelper.activateMocking();
        nock(Client4.getBaseRoute()).
            post('/users/login/switch').
            reply(200, {follow_link: '/login'});

        await Actions.switchOAuthToEmail('gitlab', TestHelper.basicUser.email, TestHelper.basicUser.password)(store.dispatch, store.getState);
        nock.restore();

        const request = store.getState().requests.users.switchLogin;

        if (request.status === RequestStatus.FAILURE) {
            throw new Error(JSON.stringify(request.error));
        }
    });

    it('switchEmailToLdap', async () => {
        TestHelper.activateMocking();
        nock(Client4.getBaseRoute()).
            post('/users/login/switch').
            reply(200, {follow_link: '/login'});

        await Actions.switchEmailToLdap(TestHelper.basicUser.email, TestHelper.basicUser.password, 'someid', 'somepassword')(store.dispatch, store.getState);
        nock.restore();

        const request = store.getState().requests.users.switchLogin;

        if (request.status === RequestStatus.FAILURE) {
            throw new Error(JSON.stringify(request.error));
        }
    });

    it('switchLdapToEmail', async () => {
        TestHelper.activateMocking();
        nock(Client4.getBaseRoute()).
            post('/users/login/switch').
            reply(200, {follow_link: '/login'});

        await Actions.switchLdapToEmail('somepassword', TestHelper.basicUser.email, TestHelper.basicUser.password)(store.dispatch, store.getState);
        nock.restore();

        const request = store.getState().requests.users.switchLogin;

        if (request.status === RequestStatus.FAILURE) {
            throw new Error(JSON.stringify(request.error));
        }
    });

    it('createUserAccessToken', async () => {
        await Actions.login(TestHelper.basicUser.email, 'password1')(store.dispatch, store.getState);

        const currentUserId = store.getState().entities.users.currentUserId;

        TestHelper.activateMocking();
        nock(Client4.getBaseRoute()).
            post(`/users/${currentUserId}/tokens`).
            reply(201, {id: 'someid', token: 'sometoken', description: 'test token', user_id: currentUserId});

        const {data} = await Actions.createUserAccessToken(currentUserId, 'test token')(store.dispatch, store.getState);
        nock.restore();

        const request = store.getState().requests.users.createUserAccessToken;
        const {myUserAccessTokens} = store.getState().entities.users;
        const {userAccessTokens} = store.getState().entities.admin;

        if (request.status === RequestStatus.FAILURE) {
            throw new Error(JSON.stringify(request.error));
        }

        assert.ok(myUserAccessTokens);
        assert.ok(myUserAccessTokens[data.id]);
        assert.ok(!myUserAccessTokens[data.id].token);
        assert.ok(userAccessTokens);
        assert.ok(userAccessTokens[currentUserId]);
        assert.ok(userAccessTokens[currentUserId][data.id]);
        assert.ok(!userAccessTokens[currentUserId][data.id].token);
    });

    it('getUserAccessToken', async () => {
        await Actions.login(TestHelper.basicUser.email, 'password1')(store.dispatch, store.getState);

        const currentUserId = store.getState().entities.users.currentUserId;
        const testId = 'xgeikjf383ftmx8jzrhdocmfne';

        TestHelper.activateMocking();
        nock(Client4.getBaseRoute()).
            get(`/users/tokens/${testId}`).
            reply(200, {id: testId, description: 'test token', user_id: currentUserId});

        await Actions.getUserAccessToken(testId)(store.dispatch, store.getState);
        nock.restore();

        const request = store.getState().requests.users.getUserAccessToken;
        const {myUserAccessTokens} = store.getState().entities.users;
        const {userAccessTokens} = store.getState().entities.admin;

        if (request.status === RequestStatus.FAILURE) {
            throw new Error(JSON.stringify(request.error));
        }

        assert.ok(myUserAccessTokens);
        assert.ok(myUserAccessTokens[testId]);
        assert.ok(!myUserAccessTokens[testId].token);
        assert.ok(userAccessTokens);
        assert.ok(userAccessTokens[currentUserId]);
        assert.ok(userAccessTokens[currentUserId][testId]);
        assert.ok(!userAccessTokens[currentUserId][testId].token);
    });

    it('getUserAccessTokensForUser', async () => {
        await Actions.login(TestHelper.basicUser.email, 'password1')(store.dispatch, store.getState);

        const currentUserId = store.getState().entities.users.currentUserId;
        const testId = 'xgeikjf383ftmx8jzrhdocmfne';

        TestHelper.activateMocking();
        nock(Client4.getBaseRoute()).
            get(`/users/${currentUserId}/tokens`).
            query(true).
            reply(200, [{id: testId, description: 'test token', user_id: currentUserId}]);

        await Actions.getUserAccessTokensForUser(currentUserId)(store.dispatch, store.getState);
        nock.restore();

        const request = store.getState().requests.users.getUserAccessToken;
        const {myUserAccessTokens} = store.getState().entities.users;
        const {userAccessTokens} = store.getState().entities.admin;

        if (request.status === RequestStatus.FAILURE) {
            throw new Error(JSON.stringify(request.error));
        }

        assert.ok(myUserAccessTokens);
        assert.ok(myUserAccessTokens[testId]);
        assert.ok(!myUserAccessTokens[testId].token);
        assert.ok(userAccessTokens);
        assert.ok(userAccessTokens[currentUserId]);
        assert.ok(userAccessTokens[currentUserId][testId]);
        assert.ok(!userAccessTokens[currentUserId][testId].token);
    });

    it('revokeUserAccessToken', async () => {
        await Actions.login(TestHelper.basicUser.email, 'password1')(store.dispatch, store.getState);

        const currentUserId = store.getState().entities.users.currentUserId;
        const testId = 'xgeikjf383ftmx8jzrhdocmfne';

        TestHelper.activateMocking();
        nock(Client4.getBaseRoute()).
            get(`/users/tokens/${testId}`).
            reply(200, {id: testId, description: 'test token', user_id: currentUserId});

        await Actions.getUserAccessToken(testId)(store.dispatch, store.getState);
        nock.restore();

        let {myUserAccessTokens} = store.getState().entities.users;
        let {userAccessTokens} = store.getState().entities.admin;

        assert.ok(myUserAccessTokens);
        assert.ok(myUserAccessTokens[testId]);
        assert.ok(!myUserAccessTokens[testId].token);
        assert.ok(userAccessTokens);
        assert.ok(userAccessTokens[currentUserId]);
        assert.ok(userAccessTokens[currentUserId][testId]);
        assert.ok(!userAccessTokens[currentUserId][testId].token);

        TestHelper.activateMocking();
        nock(Client4.getBaseRoute()).
            post('/users/tokens/revoke').
            reply(200, OK_RESPONSE);

        await Actions.revokeUserAccessToken(testId)(store.dispatch, store.getState);
        nock.restore();

        const request = store.getState().requests.users.revokeUserAccessToken;
        myUserAccessTokens = store.getState().entities.users.myUserAccessTokens;
        userAccessTokens = store.getState().entities.admin.userAccessTokens;

        if (request.status === RequestStatus.FAILURE) {
            throw new Error(JSON.stringify(request.error));
        }

        assert.ok(myUserAccessTokens);
        assert.ok(!myUserAccessTokens[testId]);
        assert.ok(userAccessTokens);
        assert.ok(userAccessTokens[currentUserId]);
        assert.ok(!userAccessTokens[currentUserId][testId]);
    });

    it('disableUserAccessToken', async () => {
        await Actions.login(TestHelper.basicUser.email, 'password1')(store.dispatch, store.getState);

        const currentUserId = store.getState().entities.users.currentUserId;
        const testId = 'xgeikjf383ftmx8jzrhdocmfne';

        TestHelper.activateMocking();
        nock(Client4.getBaseRoute()).
            get(`/users/tokens/${testId}`).
            reply(200, {id: testId, description: 'test token', user_id: currentUserId});

        await Actions.getUserAccessToken(testId)(store.dispatch, store.getState);
        nock.restore();

        let {myUserAccessTokens} = store.getState().entities.users;
        let {userAccessTokens} = store.getState().entities.admin;

        assert.ok(myUserAccessTokens);
        assert.ok(myUserAccessTokens[testId]);
        assert.ok(!myUserAccessTokens[testId].token);
        assert.ok(userAccessTokens);
        assert.ok(userAccessTokens[currentUserId]);
        assert.ok(userAccessTokens[currentUserId][testId]);
        assert.ok(!userAccessTokens[currentUserId][testId].token);

        TestHelper.activateMocking();
        nock(Client4.getBaseRoute()).
            post('/users/tokens/disable').
            reply(200, OK_RESPONSE);

        await Actions.disableUserAccessToken(testId)(store.dispatch, store.getState);
        nock.restore();

        const request = store.getState().requests.users.revokeUserAccessToken;
        myUserAccessTokens = store.getState().entities.users.myUserAccessTokens;
        userAccessTokens = store.getState().entities.admin.userAccessTokens;

        if (request.status === RequestStatus.FAILURE) {
            throw new Error(JSON.stringify(request.error));
        }

        assert.ok(myUserAccessTokens);
        assert.ok(myUserAccessTokens[testId]);
        assert.ok(!myUserAccessTokens[testId].token);
        assert.ok(userAccessTokens);
        assert.ok(userAccessTokens[currentUserId]);
        assert.ok(userAccessTokens[currentUserId][testId]);
        assert.ok(!userAccessTokens[currentUserId][testId].token);
    });

    it('enableUserAccessToken', async () => {
        await Actions.login(TestHelper.basicUser.email, 'password1')(store.dispatch, store.getState);

        const currentUserId = store.getState().entities.users.currentUserId;
        const testId = 'xgeikjf383ftmx8jzrhdocmfne';

        TestHelper.activateMocking();
        nock(Client4.getBaseRoute()).
            get(`/users/tokens/${testId}`).
            reply(200, {id: testId, description: 'test token', user_id: currentUserId});

        await Actions.getUserAccessToken(testId)(store.dispatch, store.getState);
        nock.restore();

        let {myUserAccessTokens} = store.getState().entities.users;
        let {userAccessTokens} = store.getState().entities.admin;

        assert.ok(myUserAccessTokens);
        assert.ok(myUserAccessTokens[testId]);
        assert.ok(!myUserAccessTokens[testId].token);
        assert.ok(userAccessTokens);
        assert.ok(userAccessTokens[currentUserId]);
        assert.ok(userAccessTokens[currentUserId][testId]);
        assert.ok(!userAccessTokens[currentUserId][testId].token);

        TestHelper.activateMocking();
        nock(Client4.getBaseRoute()).
            post('/users/tokens/enable').
            reply(200, OK_RESPONSE);

        await Actions.enableUserAccessToken(testId)(store.dispatch, store.getState);
        nock.restore();

        const request = store.getState().requests.users.revokeUserAccessToken;
        myUserAccessTokens = store.getState().entities.users.myUserAccessTokens;
        userAccessTokens = store.getState().entities.admin.userAccessTokens;

        if (request.status === RequestStatus.FAILURE) {
            throw new Error(JSON.stringify(request.error));
        }

        assert.ok(myUserAccessTokens);
        assert.ok(myUserAccessTokens[testId]);
        assert.ok(!myUserAccessTokens[testId].token);
        assert.ok(userAccessTokens);
        assert.ok(userAccessTokens[currentUserId]);
        assert.ok(userAccessTokens[currentUserId][testId]);
        assert.ok(!userAccessTokens[currentUserId][testId].token);
    });

    it('clearUserAccessTokens', async () => {
        await Actions.login(TestHelper.basicUser.email, 'password1')(store.dispatch, store.getState);

        const currentUserId = store.getState().entities.users.currentUserId;

        TestHelper.activateMocking();
        nock(Client4.getBaseRoute()).
            post(`/users/${currentUserId}/tokens`).
            reply(201, {id: 'someid', token: 'sometoken', description: 'test token', user_id: currentUserId});

        await Actions.createUserAccessToken(currentUserId, 'test token')(store.dispatch, store.getState);
        nock.restore();

        await Actions.clearUserAccessTokens()(store.dispatch, store.getState);

        const {myUserAccessTokens} = store.getState().entities.users;

        assert.ok(Object.values(myUserAccessTokens).length === 0);
    });
});
