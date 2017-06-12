// Copyright (c) 2017 Mattermost, Inc. All Rights Reserved.
// See License.txt for license information.

import assert from 'assert';

import deepFreezeAndThrowOnMutation from 'utils/deep_freeze';
import * as Selectors from 'selectors/entities/integrations';
import TestHelper from 'test/test_helper';

describe('Selectors.Integrations', () => {
    const teamId = TestHelper.generateId();
    const Id1 = TestHelper.generateId();
    const Id2 = TestHelper.generateId();
    const command1 = TestHelper.testCommand();
    const command2 = TestHelper.testCommand();

    command1.team_id = teamId;
    command2.team_id = teamId;
    command2.username = 'username';

    const commands = {};
    commands[Id1] = command1;
    commands[Id2] = command2;

    const state = deepFreezeAndThrowOnMutation({
        entities: {
            integrations: {
                commands
            }
        }
    });

    it('should return commands as array', () => {
        assert.deepEqual(Selectors.getCommandsAsArray(state), [command1, command2]);
    });
});
