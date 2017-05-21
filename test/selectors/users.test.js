// Copyright (c) 2017 Mattermost, Inc. All Rights Reserved.
// See License.txt for license information.

import assert from 'assert';

import deepFreezeAndThrowOnMutation from 'utils/deep_freeze';
import {sortByUsername} from 'utils/user_utils';
import TestHelper from 'test/test_helper';
import * as Selectors from 'selectors/entities/users';
import {Preferences} from 'constants';

describe('Selectors.Users', () => {
    const team1 = TestHelper.fakeTeamWithId();

    const channel1 = TestHelper.fakeChannelWithId(team1.id);

    const user1 = TestHelper.fakeUserWithId();
    const user2 = TestHelper.fakeUserWithId();
    const user3 = TestHelper.fakeUserWithId();
    const user4 = TestHelper.fakeUserWithId();
    const user5 = TestHelper.fakeUserWithId();
    const profiles = {};
    profiles[user1.id] = user1;
    profiles[user2.id] = user2;
    profiles[user3.id] = user3;
    profiles[user4.id] = user4;
    profiles[user5.id] = user5;

    const profilesInTeam = {};
    profilesInTeam[team1.id] = new Set([user1.id, user2.id]);

    const profilesNotInTeam = {};
    profilesNotInTeam[team1.id] = new Set([user3.id, user4.id]);

    const profilesWithoutTeam = new Set([user5.id]);

    const profilesInChannel = {};
    profilesInChannel[channel1.id] = new Set([user1.id]);

    const profilesNotInChannel = {};
    profilesNotInChannel[channel1.id] = new Set([user2.id]);

    const myPreferences = {};
    myPreferences[`${Preferences.CATEGORY_DIRECT_CHANNEL_SHOW}--${user2.id}`] = {category: Preferences.CATEGORY_DIRECT_CHANNEL_SHOW, name: user2.id, value: 'true'};
    myPreferences[`${Preferences.CATEGORY_DIRECT_CHANNEL_SHOW}--${user3.id}`] = {category: Preferences.CATEGORY_DIRECT_CHANNEL_SHOW, name: user3.id, value: 'false'};

    const testState = deepFreezeAndThrowOnMutation({
        entities: {
            users: {
                currentUserId: user1.id,
                profiles,
                profilesInTeam,
                profilesNotInTeam,
                profilesWithoutTeam,
                profilesInChannel,
                profilesNotInChannel
            },
            teams: {
                currentTeamId: team1.id
            },
            channels: {
                currentChannelId: channel1.id
            },
            preferences: {
                myPreferences
            }
        }
    });

    it('getUserIdsInChannels', () => {
        assert.deepEqual(Selectors.getUserIdsInChannels(testState), profilesInChannel);
    });

    it('getUserIdsNotInChannels', () => {
        assert.deepEqual(Selectors.getUserIdsNotInChannels(testState), profilesNotInChannel);
    });

    it('getUserIdsInTeams', () => {
        assert.deepEqual(Selectors.getUserIdsInTeams(testState), profilesInTeam);
    });

    it('getUserIdsNotInTeams', () => {
        assert.deepEqual(Selectors.getUserIdsNotInTeams(testState), profilesNotInTeam);
    });

    it('getUserIdsWithoutTeam', () => {
        assert.deepEqual(Selectors.getUserIdsWithoutTeam(testState), profilesWithoutTeam);
    });

    it('getUser', () => {
        assert.deepEqual(Selectors.getUser(testState, user1.id), user1);
    });

    it('getUsers', () => {
        assert.deepEqual(Selectors.getUsers(testState), profiles);
    });

    it('getProfilesInCurrentTeam', () => {
        const users = [user1, user2].sort(sortByUsername);
        assert.deepEqual(Selectors.getProfilesInCurrentTeam(testState), users);
    });

    it('getProfilesInTeam', () => {
        const users = [user1, user2].sort(sortByUsername);
        assert.deepEqual(Selectors.getProfilesInTeam(testState, team1.id), users);
        assert.deepEqual(Selectors.getProfilesInTeam(testState, 'junk'), []);
    });

    it('getProfilesNotInCurrentTeam', () => {
        const users = [user3, user4].sort(sortByUsername);
        assert.deepEqual(Selectors.getProfilesNotInCurrentTeam(testState), users);
    });

    it('getProfilesWithoutTeam', () => {
        assert.deepEqual(Selectors.getProfilesWithoutTeam(testState), [user5]);
    });

    it('searchProfiles', () => {
        assert.deepEqual(Selectors.searchProfiles(testState, user1.username), [user1]);
        assert.deepEqual(Selectors.searchProfiles(testState, user2.first_name + ' ' + user2.last_name), [user2]);
        assert.deepEqual(Selectors.searchProfiles(testState, user1.username, true), []);
    });

    it('searchProfilesInCurrentChannel', () => {
        assert.deepEqual(Selectors.searchProfilesInCurrentChannel(testState, user1.username), [user1]);
        assert.deepEqual(Selectors.searchProfilesInCurrentChannel(testState, user1.username, true), []);
    });

    it('searchProfilesNotInCurrentChannel', () => {
        assert.deepEqual(Selectors.searchProfilesNotInCurrentChannel(testState, user2.username), [user2]);
        assert.deepEqual(Selectors.searchProfilesNotInCurrentChannel(testState, user2.username, true), [user2]);
    });

    it('searchProfilesInCurrentTeam', () => {
        assert.deepEqual(Selectors.searchProfilesInCurrentTeam(testState, user1.username), [user1]);
        assert.deepEqual(Selectors.searchProfilesInCurrentTeam(testState, user1.username, true), []);
    });

    it('searchProfilesInTeam', () => {
        assert.deepEqual(Selectors.searchProfilesInTeam(testState, team1.id, user1.username), [user1]);
        assert.deepEqual(Selectors.searchProfilesInTeam(testState, team1.id, user1.username, true), []);
    });

    it('searchProfilesNotInCurrentTeam', () => {
        assert.deepEqual(Selectors.searchProfilesNotInCurrentTeam(testState, user3.username), [user3]);
        assert.deepEqual(Selectors.searchProfilesNotInCurrentTeam(testState, user3.username, true), [user3]);
    });

    it('searchProfilesWithoutTeam', () => {
        assert.deepEqual(Selectors.searchProfilesWithoutTeam(testState, user5.username), [user5]);
        assert.deepEqual(Selectors.searchProfilesWithoutTeam(testState, user5.username, true), [user5]);
    });

    it('isCurrentUserSystemAdmin', () => {
        assert.deepEqual(Selectors.isCurrentUserSystemAdmin(testState), false);
    });

    it('getUserByUsername', () => {
        assert.deepEqual(Selectors.getUserByUsername(testState, user1.username), user1);
    });

    it('getUsersInVisibleDMs', () => {
        assert.deepEqual(Selectors.getUsersInVisibleDMs(testState), [user2]);
    });
});

