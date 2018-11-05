// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import assert from 'assert';

import {Preferences} from 'constants';
import deepFreezeAndThrowOnMutation from 'utils/deep_freeze';
import {sortByUsername} from 'utils/user_utils';
import TestHelper from 'test/test_helper';
import * as Selectors from 'selectors/entities/users';

describe('Selectors.Users', () => {
    const team1 = TestHelper.fakeTeamWithId();

    const channel1 = TestHelper.fakeChannelWithId(team1.id);
    const channel2 = TestHelper.fakeChannelWithId(team1.id);

    const user1 = TestHelper.fakeUserWithId();
    user1.notify_props = {mention_keys: 'testkey1,testkey2'};
    const user2 = TestHelper.fakeUserWithId();
    user2.delete_at = 1;
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
    profilesInChannel[channel2.id] = new Set([user1.id, user2.id]);

    const profilesNotInChannel = {};
    profilesNotInChannel[channel1.id] = new Set([user2.id]);

    const userSessions = [{
        create_at: 1,
        expires_at: 2,
        props: {},
        user_id: user1.id,
        roles: '',
    }];

    const userAudits = [{
        action: 'test_user_action',
        create_at: 1535007018934,
        extra_info: 'success',
        id: 'test_id',
        ip_address: '::1',
        session_id: '',
        user_id: 'test_user_id',
    }];

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
                profilesNotInChannel,
                mySessions: userSessions,
                myAudits: userAudits,
            },
            teams: {
                currentTeamId: team1.id,
            },
            channels: {
                currentChannelId: channel1.id,
            },
            preferences: {
                myPreferences,
            },
        },
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

    it('getUserSessions', () => {
        assert.deepEqual(Selectors.getUserSessions(testState), userSessions);
    });

    it('getUserAudits', () => {
        assert.deepEqual(Selectors.getUserAudits(testState), userAudits);
    });

    it('getUser', () => {
        assert.deepEqual(Selectors.getUser(testState, user1.id), user1);
    });

    it('getUsers', () => {
        assert.deepEqual(Selectors.getUsers(testState), profiles);
    });

    describe('getCurrentUserMentionKeys', () => {
        it('at mention', () => {
            const userId = '1234';
            const notifyProps = {};
            const state = {
                entities: {
                    users: {
                        currentUserId: userId,
                        profiles: {
                            [userId]: {id: userId, username: 'user', first_name: 'First', last_name: 'Last', notify_props: notifyProps},
                        },
                    },
                },
            };

            assert.deepEqual(Selectors.getCurrentUserMentionKeys(state), [{key: '@user'}]);
        });

        it('channel', () => {
            const userId = '1234';
            const notifyProps = {
                channel: 'true',
            };
            const state = {
                entities: {
                    users: {
                        currentUserId: userId,
                        profiles: {
                            [userId]: {id: userId, username: 'user', first_name: 'First', last_name: 'Last', notify_props: notifyProps},
                        },
                    },
                },
            };

            assert.deepEqual(Selectors.getCurrentUserMentionKeys(state), [{key: '@channel'}, {key: '@all'}, {key: '@here'}, {key: '@user'}]);
        });

        it('first name', () => {
            const userId = '1234';
            const notifyProps = {
                first_name: 'true',
            };
            const state = {
                entities: {
                    users: {
                        currentUserId: userId,
                        profiles: {
                            [userId]: {id: userId, username: 'user', first_name: 'First', last_name: 'Last', notify_props: notifyProps},
                        },
                    },
                },
            };

            assert.deepEqual(Selectors.getCurrentUserMentionKeys(state), [{key: 'First', caseSensitive: true}, {key: '@user'}]);
        });

        it('custom keys', () => {
            const userId = '1234';
            const notifyProps = {
                mention_keys: 'test,foo,@user,user',
            };
            const state = {
                entities: {
                    users: {
                        currentUserId: userId,
                        profiles: {
                            [userId]: {id: userId, username: 'user', first_name: 'First', last_name: 'Last', notify_props: notifyProps},
                        },
                    },
                },
            };

            assert.deepEqual(Selectors.getCurrentUserMentionKeys(state), [{key: 'test'}, {key: 'foo'}, {key: '@user'}, {key: 'user'}]);
        });
    });

    it('getProfiles', () => {
        const users = [user1, user2, user3, user4, user5].sort(sortByUsername);
        assert.deepEqual(Selectors.getProfiles(testState), users);
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

    it('getUserByEmail', () => {
        assert.deepEqual(Selectors.getUserByEmail(testState, user1.email), user1);
        assert.deepEqual(Selectors.getUserByEmail(testState, user2.email), user2);
    });

    it('makeGetProfilesInChannel', () => {
        const getProfilesInChannel = Selectors.makeGetProfilesInChannel();
        assert.deepEqual(getProfilesInChannel(testState, channel1.id), [user1]);

        const users = [user1, user2].sort(sortByUsername);
        assert.deepEqual(getProfilesInChannel(testState, channel2.id), users);
        assert.deepEqual(getProfilesInChannel(testState, channel2.id, true), [user1]);

        assert.deepEqual(getProfilesInChannel(testState, 'nonexistentid'), []);
        assert.deepEqual(getProfilesInChannel(testState, 'nonexistentid'), []);
    });

    it('makeGetProfilesInChannel, unknown user id in channel', () => {
        const state = {
            ...testState,
            entities: {
                ...testState.entities,
                users: {
                    ...testState.entities.users,
                    profilesInChannel: {
                        ...testState.entities.users.profilesInChannel,
                        [channel1.id]: new Set([...testState.entities.users.profilesInChannel[channel1.id], 'unknown']),
                    },
                },
            },
        };

        const getProfilesInChannel = Selectors.makeGetProfilesInChannel();
        assert.deepEqual(getProfilesInChannel(state, channel1.id), [user1]);
        assert.deepEqual(getProfilesInChannel(state, channel1.id, true), [user1]);
    });

    it('makeGetProfilesByIdsAndUsernames', () => {
        const getProfilesByIdsAndUsernames = Selectors.makeGetProfilesByIdsAndUsernames();

        const testCases = [
            {input: {allUserIds: [], allUsernames: []}, output: []},
            {input: {allUserIds: ['nonexistentid'], allUsernames: ['nonexistentid']}, output: []},
            {input: {allUserIds: [user1.id], allUsernames: []}, output: [user1]},
            {input: {allUserIds: [user1.id]}, output: [user1]},
            {input: {allUserIds: [user1.id, 'nonexistentid']}, output: [user1]},
            {input: {allUserIds: [user1.id, user2.id]}, output: [user1, user2]},
            {input: {allUserIds: ['nonexistentid', user1.id, user2.id]}, output: [user1, user2]},
            {input: {allUserIds: [], allUsernames: [user1.username]}, output: [user1]},
            {input: {allUsernames: [user1.username]}, output: [user1]},
            {input: {allUsernames: [user1.username, 'nonexistentid']}, output: [user1]},
            {input: {allUsernames: [user1.username, user2.username]}, output: [user1, user2]},
            {input: {allUsernames: [user1.username, 'nonexistentid', user2.username]}, output: [user1, user2]},
            {input: {allUserIds: [user1.id], allUsernames: [user2.username]}, output: [user1, user2]},
            {input: {allUserIds: [user1.id, user2.id], allUsernames: [user3.username, user4.username]}, output: [user1, user2, user3, user4]},
            {input: {allUserIds: [user1.username, user2.username], allUsernames: [user3.id, user4.id]}, output: []},
        ];

        testCases.forEach((testCase) => {
            assert.deepEqual(getProfilesByIdsAndUsernames(testState, testCase.input), testCase.output);
        });
    });

    it('shouldShowTermsOfService', () => {
        const userId = 1234;

        // Test latest terms not accepted
        assert.equal(Selectors.shouldShowTermsOfService({
            entities: {
                general: {
                    config: {
                        CustomTermsOfServiceId: '1',
                        EnableCustomTermsOfService: 'true',
                    },
                    license: {
                        IsLicensed: 'true',
                    },
                },
                users: {
                    currentUserId: userId,
                    myAcceptedTermsOfServiceData: {
                        id: '0',
                    },
                    profiles: {
                        [userId]: {id: userId, username: 'user', first_name: 'First', last_name: 'Last'},
                    },
                },
            },
        }), true);

        // Test Feature disabled
        assert.equal(Selectors.shouldShowTermsOfService({
            entities: {
                general: {
                    config: {
                        CustomTermsOfServiceId: '1',
                        EnableCustomTermsOfService: 'false',
                    },
                    license: {
                        IsLicensed: 'true',
                    },
                },
                users: {
                    currentUserId: userId,
                    myAcceptedTermsOfServiceData: {
                        id: '1',
                    },
                    profiles: {
                        [userId]: {id: userId, username: 'user', first_name: 'First', last_name: 'Last'},
                    },
                },
            },
        }), false);

        // Test unlicensed
        assert.equal(Selectors.shouldShowTermsOfService({
            entities: {
                general: {
                    config: {
                        CustomTermsOfServiceId: '1',
                        EnableCustomTermsOfService: 'true',
                    },
                    license: {
                        IsLicensed: 'false',
                    },
                },
                users: {
                    currentUserId: userId,
                    myAcceptedTermsOfServiceData: {
                        id: '1',
                    },
                    profiles: {
                        [userId]: {id: userId, username: 'user', first_name: 'First', last_name: 'Last'},
                    },
                },
            },
        }), false);

        // Test terms already accepted
        assert.equal(Selectors.shouldShowTermsOfService({
            entities: {
                general: {
                    config: {
                        CustomTermsOfServiceId: '1',
                        EnableCustomTermsOfService: 'true',
                    },
                    license: {
                        IsLicensed: 'true',
                    },
                },
                users: {
                    currentUserId: userId,
                    myAcceptedTermsOfServiceData: {
                        id: '1',
                    },
                    profiles: {
                        [userId]: {id: userId, username: 'user', first_name: 'First', last_name: 'Last'},
                    },
                },
            },
        }), false);

        // Test not logged in
        assert.equal(Selectors.shouldShowTermsOfService({
            entities: {
                general: {
                    config: {
                        CustomTermsOfServiceId: '1',
                        EnableCustomTermsOfService: 'true',
                    },
                    license: {
                        IsLicensed: 'true',
                    },
                },
                users: {
                    currentUserId: userId,
                    myAcceptedTermsOfServiceData: {
                        id: '',
                        time: 0,
                    },
                    profiles: {},
                },
            },
        }), false);
    });
});

