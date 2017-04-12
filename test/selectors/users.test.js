// Copyright (c) 2017 Mattermost, Inc. All Rights Reserved.
// See License.txt for license information.

import assert from 'assert';

import deepFreezeAndThrowOnMutation from 'utils/deep_freeze';
import TestHelper from 'test/test_helper';
import * as Selectors from 'selectors/entities/users';

describe('Selectors.Users', () => {
    const team1 = TestHelper.fakeTeamWithId();

    const channel1 = TestHelper.fakeChannelWithId(team1.id);

    const user1 = TestHelper.fakeUserWithId();
    const user2 = TestHelper.fakeUserWithId();
    const user3 = TestHelper.fakeUserWithId();
    const user4 = TestHelper.fakeUserWithId();
    const profiles = {};
    profiles[user1.id] = user1;
    profiles[user2.id] = user2;
    profiles[user3.id] = user3;
    profiles[user4.id] = user4;

    const profilesInTeam = {};
    profilesInTeam[team1.id] = new Set([user1.id, user2.id]);

    const profilesNotInTeam = {};
    profilesNotInTeam[team1.id] = new Set([user3.id, user4.id]);

    const profilesWithoutTeam = new Set([user4.id]);

    const profilesInChannel = {};
    profilesInChannel[channel1.id] = new Set([user1.id]);

    const profilesNotInChannel = {};
    profilesNotInChannel[channel1.id] = new Set([user2.id]);

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
            }
        }
    });

    it('getUserIdsInChannel', () => {
        assert.deepEqual(Selectors.getUserIdsInChannel(testState, channel1.id), profilesInChannel[channel1.id]);
    });

    it('getUserIdsNotInChannel', () => {
        assert.deepEqual(Selectors.getUserIdsNotInChannel(testState, channel1.id), profilesNotInChannel[channel1.id]);
    });

    it('getUserIdsInTeam', () => {
        assert.deepEqual(Selectors.getUserIdsInTeam(testState, team1.id), profilesInTeam[team1.id]);
    });

    it('getUserIdsNotInTeam', () => {
        assert.deepEqual(Selectors.getUserIdsNotInTeam(testState, team1.id), profilesNotInTeam[team1.id]);
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
});

