// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import assert from 'assert';

import deepFreezeAndThrowOnMutation from 'utils/deep_freeze';
import TestHelper from 'test/test_helper';
import * as Selectors from 'selectors/entities/teams';
import {General} from 'constants';

describe('Selectors.Teams', () => {
    const team1 = TestHelper.fakeTeamWithId();
    const team2 = TestHelper.fakeTeamWithId();
    const team3 = TestHelper.fakeTeamWithId();
    const team4 = TestHelper.fakeTeamWithId();
    const team5 = TestHelper.fakeTeamWithId();

    const teams = {};
    teams[team1.id] = team1;
    teams[team2.id] = team2;
    teams[team3.id] = team3;
    teams[team4.id] = team4;
    teams[team5.id] = team5;
    team1.display_name = 'Marketeam';
    team2.display_name = 'Core Team';
    team3.allow_open_invite = true;
    team4.allow_open_invite = true;
    team3.display_name = 'Team AA';
    team4.display_name = 'aa-team';
    team5.delete_at = 10;
    team5.allow_open_invite = true;

    const user = TestHelper.fakeUserWithId();
    const user2 = TestHelper.fakeUserWithId();
    const user3 = TestHelper.fakeUserWithId();
    const profiles = {};
    profiles[user.id] = user;
    profiles[user2.id] = user2;
    profiles[user3.id] = user3;

    const myMembers = {};
    myMembers[team1.id] = {team_id: team1.id, user_id: user.id, roles: General.TEAM_USER_ROLE, mention_count: 1};
    myMembers[team2.id] = {team_id: team2.id, user_id: user.id, roles: General.TEAM_USER_ROLE, mention_count: 3};

    const membersInTeam = {};
    membersInTeam[team1.id] = {};
    membersInTeam[team1.id][user2.id] = {team_id: team1.id, user_id: user2.id, roles: General.TEAM_USER_ROLE};
    membersInTeam[team1.id][user3.id] = {team_id: team1.id, user_id: user3.id, roles: General.TEAM_USER_ROLE};

    const testState = deepFreezeAndThrowOnMutation({
        entities: {
            users: {
                currentUserId: user.id,
                profiles,
            },
            teams: {
                currentTeamId: team1.id,
                teams,
                myMembers,
                membersInTeam,
            },
        },
    });

    it('getTeamsList', () => {
        assert.deepEqual(Selectors.getTeamsList(testState), [team1, team2, team3, team4, team5]);
    });

    it('getMyTeams', () => {
        assert.deepEqual(Selectors.getMyTeams(testState), [team1, team2]);
    });

    it('getMembersInCurrentTeam', () => {
        assert.deepEqual(Selectors.getMembersInCurrentTeam(testState), membersInTeam[team1.id]);
    });

    it('getTeamMember', () => {
        assert.deepEqual(Selectors.getTeamMember(testState, team1.id, user2.id), membersInTeam[team1.id][user2.id]);
    });

    it('getJoinableTeams', () => {
        const openTeams = [team3, team4];
        const joinableTeams = Selectors.getJoinableTeams(testState);
        assert.strictEqual(joinableTeams[0], openTeams[0]);
        assert.strictEqual(joinableTeams[1], openTeams[1]);
    });

    it('getSortedJoinableTeams', () => {
        const openTeams = [team4, team3];
        const joinableTeams = Selectors.getSortedJoinableTeams(testState);
        assert.strictEqual(joinableTeams[0], openTeams[0]);
        assert.strictEqual(joinableTeams[1], openTeams[1]);
    });

    it('isCurrentUserCurrentTeamAdmin', () => {
        assert.deepEqual(Selectors.isCurrentUserCurrentTeamAdmin(testState), false);
    });

    it('getMyTeamMember', () => {
        assert.deepEqual(Selectors.getMyTeamMember(testState, team1.id), myMembers[team1.id]);
    });

    it('getTeam', () => {
        const modifiedState = {
            ...testState,
            entities: {
                ...testState.entities,
                teams: {
                    ...testState.entities.teams,
                    teams: {
                        ...testState.entities.teams.teams,
                        [team3.id]: {
                            ...team3,
                            allow_open_invite: false,
                        },
                    },
                },
            },
        };

        const fromOriginalState = Selectors.getTeam(testState, team1.id);
        const fromModifiedState = Selectors.getTeam(modifiedState, team1.id);
        assert.ok(fromOriginalState === fromModifiedState);
    });

    it('getJoinableTeamIds', () => {
        const modifiedState = {
            ...testState,
            entities: {
                ...testState.entities,
                teams: {
                    ...testState.entities.teams,
                    teams: {
                        ...testState.entities.teams.teams,
                        [team3.id]: {
                            ...team3,
                            display_name: 'Welcome',
                        },
                    },
                },
            },
        };

        const fromOriginalState = Selectors.getJoinableTeamIds(testState);
        const fromModifiedState = Selectors.getJoinableTeamIds(modifiedState);
        assert.ok(fromOriginalState === fromModifiedState);
    });

    it('getMySortedTeamIds', () => {
        const modifiedState = {
            ...testState,
            entities: {
                ...testState.entities,
                teams: {
                    ...testState.entities.teams,
                    teams: {
                        ...testState.entities.teams.teams,
                        [team3.id]: {
                            ...team3,
                            display_name: 'Welcome',
                        },
                    },
                },
            },
        };

        const updateState = {
            ...testState,
            entities: {
                ...testState.entities,
                teams: {
                    ...testState.entities.teams,
                    teams: {
                        ...testState.entities.teams.teams,
                        [team2.id]: {
                            ...team2,
                            display_name: 'Yankz',
                        },
                    },
                },
            },
        };

        const fromOriginalState = Selectors.getMySortedTeamIds(testState);
        const fromModifiedState = Selectors.getMySortedTeamIds(modifiedState);
        const fromUpdateState = Selectors.getMySortedTeamIds(updateState);

        assert.ok(fromOriginalState === fromModifiedState);
        assert.ok(fromModifiedState[0] === team2.id);

        assert.ok(fromModifiedState !== fromUpdateState);
        assert.ok(fromUpdateState[0] === team1.id);
    });

    it('getMyTeamsCount', () => {
        const modifiedState = {
            ...testState,
            entities: {
                ...testState.entities,
                teams: {
                    ...testState.entities.teams,
                    teams: {
                        ...testState.entities.teams.teams,
                        [team3.id]: {
                            ...team3,
                            display_name: 'Welcome',
                        },
                    },
                },
            },
        };

        const updateState = {
            ...testState,
            entities: {
                ...testState.entities,
                teams: {
                    ...testState.entities.teams,
                    myMembers: {
                        ...testState.entities.teams.myMembers,
                        [team3.id]: {team_id: team3.id, user_id: user.id, roles: General.TEAM_USER_ROLE},
                    },
                },
            },
        };

        const fromOriginalState = Selectors.getMyTeamsCount(testState);
        const fromModifiedState = Selectors.getMyTeamsCount(modifiedState);
        const fromUpdateState = Selectors.getMyTeamsCount(updateState);

        assert.ok(fromOriginalState === fromModifiedState);
        assert.ok(fromModifiedState === 2);

        assert.ok(fromModifiedState !== fromUpdateState);
        assert.ok(fromUpdateState === 3);
    });

    it('getChannelDrawerBadgeCount', () => {
        const mentions = Selectors.getChannelDrawerBadgeCount(testState);
        assert.ok(mentions === 3);
    });

    it('getTeamMentions', () => {
        const factory1 = Selectors.makeGetBadgeCountForTeamId();
        const factory2 = Selectors.makeGetBadgeCountForTeamId();
        const factory3 = Selectors.makeGetBadgeCountForTeamId();

        const mentions1 = factory1(testState, team1.id);
        assert.ok(mentions1 === 1);

        const mentions2 = factory2(testState, team2.id);
        assert.ok(mentions2 === 3);

        // Not a member of the team
        const mentions3 = factory3(testState, team3.id);
        assert.ok(mentions3 === 0);
    });

    it('getCurrentRelativeTeamUrl', () => {
        assert.deepEqual(Selectors.getCurrentRelativeTeamUrl(testState), '/' + team1.name);
        assert.deepEqual(Selectors.getCurrentRelativeTeamUrl({entities: {teams: {teams: {}}}}), '/');
    });
});
