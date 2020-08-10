// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import assert from 'assert';

import deepFreezeAndThrowOnMutation from 'utils/deep_freeze';
import * as Selectors from 'selectors/entities/groups';
import TestHelper from 'test/test_helper';

describe('Selectors.Groups', () => {
    const team = TestHelper.fakeTeamWithId();
    const teamID = team.id;
    const expectedAssociatedGroupID1 = 'xh585kyz3tn55q6ipfo57btwnc';
    const expectedAssociatedGroupID2 = 'emdwu98u6jg9xfn9p5zu48bojo';
    const teamAssociatedGroupIDs = [expectedAssociatedGroupID1, expectedAssociatedGroupID2];

    const channel = TestHelper.fakeChannelWithId(teamID);
    const channelID = channel.id;

    const expectedAssociatedGroupID3 = 'xos794c6tfb57eog481acokozc';
    const expectedAssociatedGroupID4 = 'tnd8zod9f3fdtqosxjmhwucbth';
    const channelAssociatedGroupIDs = [expectedAssociatedGroupID3, expectedAssociatedGroupID4];
    const group1 = {
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
        allow_reference: true,
    };
    const group2 = {
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
        allow_reference: false,
    };
    const group3 = {
        id: expectedAssociatedGroupID3,
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
        allow_reference: false,
    };
    const group4 = {
        id: [expectedAssociatedGroupID4],
        name: 'nobctj4brfgtpj3a1peiyq47tc',
        display_name: 'engineering',
        description: '',
        source: 'ldap',
        create_at: 1553808971099,
        remote_id: 'engineering',
        update_at: 1553808971099,
        delete_at: 0,
        has_syncables: false,
        member_count: 8,
        allow_reference: true,
    };
    const testState = deepFreezeAndThrowOnMutation({
        entities: {
            groups: {
                syncables: {},
                members: {},
                groups: {
                    [expectedAssociatedGroupID1]: group1,
                    [expectedAssociatedGroupID2]: group2,
                    [expectedAssociatedGroupID3]: group3,
                    [expectedAssociatedGroupID4]: group4,
                },
                myGroups: {
                    [expectedAssociatedGroupID1]: group1,
                    [expectedAssociatedGroupID2]: group2,
                    [expectedAssociatedGroupID4]: group4,
                },
            },
            teams: {
                currentTeamId: teamID,
                teams: {
                    [teamID]: {...team, group_constrained: false},
                },
                groupsAssociatedToTeam: {
                    [teamID]: {ids: teamAssociatedGroupIDs},
                },
            },
            channels: {
                currentChannelId: channelID,
                groupsAssociatedToChannel: {
                    [channelID]: {ids: channelAssociatedGroupIDs},
                },
                channels: {
                    [channelID]: channel,
                },
            },
            general: {
                config: {},
            },
            preferences: {
                myPreferences: {},
            },
        },
    });

    it('getGroupsAssociatedToTeam', () => {
        const expected = [
            group1,
            group2,
        ];
        assert.deepEqual(Selectors.getGroupsAssociatedToTeam(testState, teamID), expected);
    });

    it('getGroupsNotAssociatedToTeam', () => {
        const expected = Object.entries(testState.entities.groups.groups).filter(([groupID]) => !teamAssociatedGroupIDs.includes(groupID)).map(([, group]) => group);
        assert.deepEqual(Selectors.getGroupsNotAssociatedToTeam(testState, teamID), expected);
    });

    it('getGroupsAssociatedToChannel', () => {
        const expected = [
            group3,
            group4,
        ];
        assert.deepEqual(Selectors.getGroupsAssociatedToChannel(testState, channelID), expected);
    });

    it('getGroupsNotAssociatedToChannel', () => {
        let expected = Object.values(testState.entities.groups.groups).filter((group) => !channelAssociatedGroupIDs.includes(group.id));
        assert.deepEqual(Selectors.getGroupsNotAssociatedToChannel(testState, channelID, teamID), expected);

        let cloneState = JSON.parse(JSON.stringify(testState));
        cloneState.entities.teams.teams[teamID].group_constrained = true;
        cloneState.entities.teams.groupsAssociatedToTeam[teamID].ids = [expectedAssociatedGroupID1];
        cloneState = deepFreezeAndThrowOnMutation(cloneState);

        expected = Object.values(cloneState.entities.groups.groups).filter((group) => !channelAssociatedGroupIDs.includes(group.id) && cloneState.entities.teams.groupsAssociatedToTeam[teamID].ids.includes(group.id));
        assert.deepEqual(Selectors.getGroupsNotAssociatedToChannel(cloneState, channelID, teamID), expected);
    });

    it('getGroupsAssociatedToTeamForReference', () => {
        const expected = [
            group1,
        ];
        assert.deepEqual(Selectors.getGroupsAssociatedToTeamForReference(testState, teamID), expected);
    });

    it('getGroupsAssociatedToChannelForReference', () => {
        const expected = [
            group4,
        ];
        assert.deepEqual(Selectors.getGroupsAssociatedToChannelForReference(testState, channelID), expected);
    });

    it('getAllGroupsForReference', () => {
        const expected = [
            group1,
            group4,
        ];
        assert.deepEqual(Selectors.getAllGroupsForReference(testState, channelID), expected);
    });

    it('getMyGroupMentionKeys', () => {
        const expected = [
            {
                key: `@${group1.name}`,
            },
            {
                key: `@${group4.name}`,
            },
        ];
        assert.deepEqual(Selectors.getMyGroupMentionKeys(testState), expected);
    });

    it('getGroupsAssociatedToCurrentTeamForReference', () => {
        const expected = [
            group1,
        ];
        assert.deepEqual(Selectors.getGroupsAssociatedToCurrentTeamForReference(testState), expected);
    });

    it('getGroupsForReferenceInCurrentChannel', () => {
        const expected = [
            group1,
            group4,
        ];
        assert.deepEqual(Selectors.getGroupsForReferenceInCurrentChannel(testState), expected);
    });

    it('searchGroupsForReferenceInCurrentChannel', () => {
        const expected = [
            group1,
        ];
        assert.deepEqual(Selectors.searchGroupsForReferenceInCurrentChannel(testState, group1.display_name), expected);
    });

    it('getGroupsForReferenceInCurrentChannelByMentionKey', () => {
        const expected = new Map([
            group1,
            group4,
        ].map((group) => [`@${group.name}`, group]));
        assert.deepEqual(Selectors.getGroupsForReferenceInCurrentChannelByMentionKey(testState), expected);
    });

    it('getGroupsForReferenceInCurrentChannelByName', () => {
        const expected = {
            [group1.name]: group1,
            [group4.name]: group4,
        };
        assert.deepEqual(Selectors.getGroupsForReferenceInCurrentChannelByName(testState), expected);
    });

    it('getMyGroupsForReferenceInCurrentChannel', () => {
        const expected = [
            group1,
            group4,
        ];
        assert.deepEqual(Selectors.getMyGroupsForReferenceInCurrentChannel(testState), expected);

        let cloneState = JSON.parse(JSON.stringify(testState));
        cloneState.entities.groups.myGroups = {};
        cloneState = deepFreezeAndThrowOnMutation(cloneState);

        assert.deepEqual(Selectors.getMyGroupsForReferenceInCurrentChannel(cloneState), []);
    });
});
