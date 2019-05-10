// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import assert from 'assert';

import deepFreezeAndThrowOnMutation from 'utils/deep_freeze';
import * as Selectors from 'selectors/entities/groups';

describe('Selectors.Schemes', () => {
    const teamID = 'c6ubwm63apgftbjs71enbjjpsh';
    const expectedAssociatedGroupID1 = 'xh585kyz3tn55q6ipfo57btwnc';
    const expectedAssociatedGroupID2 = 'emdwu98u6jg9xfn9p5zu48bojo';
    const associatedGroupIDs = [expectedAssociatedGroupID1, expectedAssociatedGroupID2];
    const testState = deepFreezeAndThrowOnMutation({
        entities: {
            groups: {
                syncables: {},
                members: {},
                groups: {
                    xh585kyz3tn55q6ipfo57btwnc: {
                        id: expectedAssociatedGroupID1,
                        name: '9uobsi3xb3y5tfjb3ze7umnh1o',
                        display_name: 'abc',
                        description: '',
                        source: 'ldap',
                        remote_id: 'abc',
                        create_at: 1553808969975,
                        update_at: 1553808969975,
                        delete_at: 0,
                        has_syncables: false,
                        member_count: 2,
                    },
                    xos794c6tfb57eog481acokozc: {
                        id: 'xos794c6tfb57eog481acokozc',
                        name: '5mte953ncbfpunpr3zmtopiwbo',
                        display_name: 'developers',
                        description: '',
                        source: 'ldap',
                        remote_id: 'developers',
                        create_at: 1553808970570,
                        update_at: 1553808970570,
                        delete_at: 0,
                        has_syncables: false,
                        member_count: 5,
                    },
                    tnd8zod9f3fdtqosxjmhwucbth: {
                        id: 'tnd8zod9f3fdtqosxjmhwucbth',
                        name: 'nobctj4brfgtpj3a1peiyq47tc',
                        display_name: 'engineering',
                        description: '',
                        source: 'ldap',
                        remote_id: 'engineering',
                        create_at: 1553808971099,
                        update_at: 1553808971099,
                        delete_at: 0,
                        has_syncables: false,
                        member_count: 8,
                    },
                    emdwu98u6jg9xfn9p5zu48bojo: {
                        id: expectedAssociatedGroupID2,
                        name: '7ybu9oy77jgedqp4pph8f4j5ge',
                        display_name: 'xyz',
                        description: '',
                        source: 'ldap',
                        remote_id: 'xyz',
                        create_at: 1553808972099,
                        update_at: 1553808972099,
                        delete_at: 0,
                        has_syncables: false,
                        member_count: 2,
                    },
                },
            },
            teams: {
                groupsAssociatedToTeam: {
                    c6ubwm63apgftbjs71enbjjpsh: associatedGroupIDs,
                },
            },
        },
    });

    it('getGroupsAssociatedToTeam', () => {
        const expected = [
            testState.entities.groups.groups[expectedAssociatedGroupID1],
            testState.entities.groups.groups[expectedAssociatedGroupID2],
        ];
        assert.deepEqual(Selectors.getGroupsAssociatedToTeam(testState, teamID), expected);
    });

    it('getGroupsNotAssociatedToTeam', () => {
        const expected = Object.entries(testState.entities.groups.groups).filter(([groupID]) => !associatedGroupIDs.includes(groupID)).map(([, group]) => group);
        assert.deepEqual(Selectors.getGroupsNotAssociatedToTeam(testState, teamID), expected);
    });
});
