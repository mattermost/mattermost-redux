// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import assert from 'assert';

import TestHelper from 'test/test_helper';

import deepFreezeAndThrowOnMutation from 'utils/deep_freeze';

import * as Selectors from './threads';

describe('Selectors.Threads.getThreadsInCurrentTeam', () => {
    const team1 = TestHelper.fakeTeamWithId();
    const team2 = TestHelper.fakeTeamWithId();

    it('should return threads in current team', () => {
        const user = TestHelper.fakeUserWithId();

        const profiles = {
            [user.id]: user,
        };

        const testState = deepFreezeAndThrowOnMutation({
            entities: {
                users: {
                    currentUserId: user.id,
                    profiles,
                },
                teams: {
                    currentTeamId: team1.id,
                },
                threads: {
                    threads: {
                        a: {},
                        b: {},
                    },
                    threadsInTeam: {
                        [team1]: ['a', 'b'],
                        [team2]: ['c', 'd'],
                    },
                },
            },
        });

        assert.deepEqual(Selectors.getThreadsInCurrentTeam(testState), ['a', 'b']);
    });
});
