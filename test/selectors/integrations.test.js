// Copyright (c) 2017 Mattermost, Inc. All Rights Reserved.
// See License.txt for license information.

import assert from 'assert';
import TestHelper from 'test/test_helper';
import deepFreezeAndThrowOnMutation from 'utils/deep_freeze';

import {getOutgoingHooksInCurrentTeam} from 'selectors/entities/integrations';

describe('Selectors.Integrations', () => {
    const team1 = TestHelper.fakeTeamWithId();
    const team2 = TestHelper.fakeTeamWithId();

    const hook1 = TestHelper.fakeOutgoingHookWithId(team1.id);
    const hook2 = TestHelper.fakeOutgoingHookWithId(team1.id);
    const hook3 = TestHelper.fakeOutgoingHookWithId(team2.id);

    const hooks = {[hook1.id]: hook1, [hook2.id]: hook2, [hook3.id]: hook3};

    const testState = deepFreezeAndThrowOnMutation({
        entities: {
            teams: {
                currentTeamId: team1.id
            },
            integrations: {
                outgoingHooks: hooks
            }
        }
    });

    it('should return outgoing hooks in current team', () => {
        const hooksInCurrentTeam1 = [hook1, hook2];
        assert.deepEqual(getOutgoingHooksInCurrentTeam(testState), hooksInCurrentTeam1);
    });
});
