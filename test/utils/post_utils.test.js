// Copyright (c) 2017-present Mattermost, Inc. All Rights Reserved.
// See License.txt for license information.

import assert from 'assert';

import {PostTypes} from 'constants/posts';
import {Permissions} from 'constants';

import {
    canEditPost,
    combineSystemPosts,
    isSystemMessage,
    isUserActivityPost,
    shouldFilterJoinLeavePost,
} from 'utils/post_utils';

describe('PostUtils', () => {
    describe('shouldFilterJoinLeavePost', () => {
        it('show join/leave posts', () => {
            const showJoinLeave = true;

            assert.equal(shouldFilterJoinLeavePost({type: ''}, showJoinLeave), false);
            assert.equal(shouldFilterJoinLeavePost({type: PostTypes.CHANNEL_DELETED}, showJoinLeave), false);
            assert.equal(shouldFilterJoinLeavePost({type: PostTypes.DISPLAYNAME_CHANGE}, showJoinLeave), false);
            assert.equal(shouldFilterJoinLeavePost({type: PostTypes.CONVERT_CHANNEL}, showJoinLeave), false);
            assert.equal(shouldFilterJoinLeavePost({type: PostTypes.EPHEMERAL}, showJoinLeave), false);
            assert.equal(shouldFilterJoinLeavePost({type: PostTypes.HEADER_CHANGE}, showJoinLeave), false);
            assert.equal(shouldFilterJoinLeavePost({type: PostTypes.PURPOSE_CHANGE}, showJoinLeave), false);

            assert.equal(shouldFilterJoinLeavePost({type: PostTypes.JOIN_LEAVE}, showJoinLeave), false);
            assert.equal(shouldFilterJoinLeavePost({type: PostTypes.JOIN_CHANNEL}, showJoinLeave), false);
            assert.equal(shouldFilterJoinLeavePost({type: PostTypes.LEAVE_CHANNEL}, showJoinLeave), false);
            assert.equal(shouldFilterJoinLeavePost({type: PostTypes.ADD_REMOVE}, showJoinLeave), false);
            assert.equal(shouldFilterJoinLeavePost({type: PostTypes.ADD_TO_CHANNEL}, showJoinLeave), false);
            assert.equal(shouldFilterJoinLeavePost({type: PostTypes.REMOVE_FROM_CHANNEL}, showJoinLeave), false);

            assert.equal(shouldFilterJoinLeavePost({type: PostTypes.JOIN_TEAM}, showJoinLeave), false);
            assert.equal(shouldFilterJoinLeavePost({type: PostTypes.LEAVE_TEAM}, showJoinLeave), false);
            assert.equal(shouldFilterJoinLeavePost({type: PostTypes.ADD_TO_TEAM}, showJoinLeave), false);
            assert.equal(shouldFilterJoinLeavePost({type: PostTypes.REMOVE_FROM_TEAM}, showJoinLeave), false);
        });

        it('hide join/leave posts', () => {
            const showJoinLeave = false;

            assert.equal(shouldFilterJoinLeavePost({type: ''}, showJoinLeave), false);
            assert.equal(shouldFilterJoinLeavePost({type: PostTypes.CHANNEL_DELETED}, showJoinLeave), false);
            assert.equal(shouldFilterJoinLeavePost({type: PostTypes.DISPLAYNAME_CHANGE}, showJoinLeave), false);
            assert.equal(shouldFilterJoinLeavePost({type: PostTypes.CONVERT_CHANNEL}, showJoinLeave), false);
            assert.equal(shouldFilterJoinLeavePost({type: PostTypes.EPHEMERAL}, showJoinLeave), false);
            assert.equal(shouldFilterJoinLeavePost({type: PostTypes.HEADER_CHANGE}, showJoinLeave), false);
            assert.equal(shouldFilterJoinLeavePost({type: PostTypes.PURPOSE_CHANGE}, showJoinLeave), false);

            assert.equal(shouldFilterJoinLeavePost({type: PostTypes.JOIN_LEAVE}, showJoinLeave), true);
            assert.equal(shouldFilterJoinLeavePost({type: PostTypes.JOIN_CHANNEL}, showJoinLeave), true);
            assert.equal(shouldFilterJoinLeavePost({type: PostTypes.LEAVE_CHANNEL}, showJoinLeave), true);
            assert.equal(shouldFilterJoinLeavePost({type: PostTypes.ADD_REMOVE}, showJoinLeave), true);
            assert.equal(shouldFilterJoinLeavePost({type: PostTypes.ADD_TO_CHANNEL}, showJoinLeave), true);
            assert.equal(shouldFilterJoinLeavePost({type: PostTypes.REMOVE_FROM_CHANNEL}, showJoinLeave), true);

            assert.equal(shouldFilterJoinLeavePost({type: PostTypes.JOIN_TEAM}, showJoinLeave), true);
            assert.equal(shouldFilterJoinLeavePost({type: PostTypes.LEAVE_TEAM}, showJoinLeave), true);
            assert.equal(shouldFilterJoinLeavePost({type: PostTypes.ADD_TO_TEAM}, showJoinLeave), true);
            assert.equal(shouldFilterJoinLeavePost({type: PostTypes.REMOVE_FROM_TEAM}, showJoinLeave), true);
        });

        it('always join/leave posts for the current user', () => {
            const username = 'user1';
            const otherUsername = 'user2';
            const showJoinLeave = false;

            assert.equal(shouldFilterJoinLeavePost({type: PostTypes.JOIN_CHANNEL, props: {username}}, showJoinLeave, username), false);
            assert.equal(shouldFilterJoinLeavePost({type: PostTypes.JOIN_CHANNEL, props: {username: otherUsername}}, showJoinLeave, username), true);
            assert.equal(shouldFilterJoinLeavePost({type: PostTypes.LEAVE_CHANNEL, props: {username}}, showJoinLeave, username), false);
            assert.equal(shouldFilterJoinLeavePost({type: PostTypes.LEAVE_CHANNEL, props: {username: otherUsername}}, showJoinLeave, username), true);
            assert.equal(shouldFilterJoinLeavePost({type: PostTypes.ADD_TO_CHANNEL, props: {username, addedUsername: otherUsername}}, showJoinLeave, username), false);
            assert.equal(shouldFilterJoinLeavePost({type: PostTypes.ADD_TO_CHANNEL, props: {username: otherUsername, addedUsername: username}}, showJoinLeave, username), false);
            assert.equal(shouldFilterJoinLeavePost({type: PostTypes.ADD_TO_CHANNEL, props: {username: otherUsername, addedUsername: otherUsername}}, showJoinLeave, username), true);
            assert.equal(shouldFilterJoinLeavePost({type: PostTypes.REMOVE_FROM_CHANNEL, props: {removedUsername: username}}, showJoinLeave, username), false);
            assert.equal(shouldFilterJoinLeavePost({type: PostTypes.REMOVE_FROM_CHANNEL, props: {removedUsername: otherUsername}}, showJoinLeave, username), true);

            assert.equal(shouldFilterJoinLeavePost({type: PostTypes.JOIN_TEAM, props: {username}}, showJoinLeave, username), false);
            assert.equal(shouldFilterJoinLeavePost({type: PostTypes.JOIN_TEAM, props: {username: otherUsername}}, showJoinLeave, username), true);
            assert.equal(shouldFilterJoinLeavePost({type: PostTypes.LEAVE_TEAM, props: {username}}, showJoinLeave, username), false);
            assert.equal(shouldFilterJoinLeavePost({type: PostTypes.LEAVE_TEAM, props: {username: otherUsername}}, showJoinLeave, username), true);
            assert.equal(shouldFilterJoinLeavePost({type: PostTypes.ADD_TO_TEAM, props: {username, addedUsername: otherUsername}}, showJoinLeave, username), false);
            assert.equal(shouldFilterJoinLeavePost({type: PostTypes.ADD_TO_TEAM, props: {username: otherUsername, addedUsername: username}}, showJoinLeave, username), false);
            assert.equal(shouldFilterJoinLeavePost({type: PostTypes.ADD_TO_TEAM, props: {username: otherUsername, addedUsername: otherUsername}}, showJoinLeave, username), true);
            assert.equal(shouldFilterJoinLeavePost({type: PostTypes.REMOVE_FROM_TEAM, props: {removedUsername: username}}, showJoinLeave, username), false);
            assert.equal(shouldFilterJoinLeavePost({type: PostTypes.REMOVE_FROM_TEAM, props: {removedUsername: otherUsername}}, showJoinLeave, username), true);
        });
    });

    describe('canEditPost', () => {
        const notLicensed = {IsLicensed: 'false'};
        const licensed = {IsLicensed: 'true'};
        const teamId = 'team-id';
        const channelId = 'channel-id';
        const userId = 'user-id';

        it('should allow to edit my post without license', () => {
            // Hasn't license
            assert.ok(canEditPost({}, {PostEditTimeLimit: -1}, notLicensed, teamId, channelId, userId, {user_id: userId, type: 'normal'}));
            assert.ok(!canEditPost({}, {PostEditTimeLimit: -1}, notLicensed, teamId, channelId, userId, {user_id: userId, type: 'system_test'}));
            assert.ok(!canEditPost({}, {PostEditTimeLimit: -1}, notLicensed, teamId, channelId, userId, {user_id: 'other', type: 'normal'}));
            assert.ok(!canEditPost({}, {PostEditTimeLimit: -1}, notLicensed, teamId, channelId, userId, {user_id: 'other', type: 'system_test'}));
            assert.ok(!canEditPost({}, {PostEditTimeLimit: -1}, notLicensed, teamId, channelId, userId, null));
        });

        it('should work with old permissions version', () => {
            const oldVersionState = {
                entities: {
                    general: {
                        serverVersion: '4.3.0',
                    },
                },
            };

            // With old permissions
            assert.ok(!canEditPost(oldVersionState, {PostEditTimeLimit: null, AllowEditPost: 'never'}, licensed, teamId, channelId, userId, {user_id: userId}));
            assert.ok(canEditPost(oldVersionState, {PostEditTimeLimit: null, AllowEditPost: 'always'}, licensed, teamId, channelId, userId, {user_id: userId}));
            assert.ok(canEditPost(oldVersionState, {PostEditTimeLimit: 300, AllowEditPost: 'time_limit'}, licensed, teamId, channelId, userId, {user_id: userId, create_at: Date.now() - 100}));
            assert.ok(!canEditPost(oldVersionState, {PostEditTimeLimit: 300, AllowEditPost: 'time_limit'}, licensed, teamId, channelId, userId, {user_id: userId, create_at: Date.now() - 600000}));
            assert.ok(!canEditPost(oldVersionState, {PostEditTimeLimit: null, AllowEditPost: 'never'}, licensed, teamId, channelId, userId, {user_id: 'other'}));
            assert.ok(!canEditPost(oldVersionState, {PostEditTimeLimit: null, AllowEditPost: 'always'}, licensed, teamId, channelId, userId, {user_id: 'other'}));
            assert.ok(!canEditPost(oldVersionState, {PostEditTimeLimit: 300, AllowEditPost: 'time_limit'}, licensed, teamId, channelId, userId, {user_id: 'other', create_at: Date.now() - 100}));
            assert.ok(!canEditPost(oldVersionState, {PostEditTimeLimit: 300, AllowEditPost: 'time_limit'}, licensed, teamId, channelId, userId, {user_id: 'other', create_at: Date.now() - 600000}));
        });

        it('should work with new permissions version', () => {
            const newVersionState = {
                entities: {
                    general: {
                        serverVersion: '4.9.0',
                    },
                    users: {
                        currentUserId: userId,
                        profiles: {
                            'user-id': {roles: 'system_role'},
                        },
                    },
                    teams: {
                        currentTeamId: teamId,
                        myMembers: {
                            'team-id': {roles: 'team_role'},
                        },
                    },
                    channels: {
                        currentChannelId: channelId,
                        myMembers: {
                            'channel-id': {roles: 'channel_role'},
                        },
                    },
                    roles: {
                        roles: {
                            system_role: {
                                permissions: [],
                            },
                            team_role: {
                                permissions: [],
                            },
                            channel_role: {
                                permissions: [],
                            },
                        },
                    },
                },
            };

            // With new permissions
            assert.ok(!canEditPost(newVersionState, {PostEditTimeLimit: -1}, licensed, teamId, channelId, userId, {user_id: userId}));
            assert.ok(!canEditPost(newVersionState, {PostEditTimeLimit: 300}, licensed, teamId, channelId, userId, {user_id: userId, create_at: Date.now() - 100}));
            assert.ok(!canEditPost(newVersionState, {PostEditTimeLimit: 300}, licensed, teamId, channelId, userId, {user_id: userId, create_at: Date.now() - 6000000}));
            assert.ok(!canEditPost(newVersionState, {PostEditTimeLimit: -1}, licensed, teamId, channelId, userId, {user_id: 'other'}));
            assert.ok(!canEditPost(newVersionState, {PostEditTimeLimit: 300}, licensed, teamId, channelId, userId, {user_id: 'other', create_at: Date.now() - 100}));
            assert.ok(!canEditPost(newVersionState, {PostEditTimeLimit: 300}, licensed, teamId, channelId, userId, {user_id: 'other', create_at: Date.now() - 6000000}));

            newVersionState.entities.roles = {
                roles: {
                    system_role: {permissions: [Permissions.EDIT_POST]},
                    team_role: {permissions: []},
                    channel_role: {permissions: []},
                },
            };
            assert.ok(canEditPost(newVersionState, {PostEditTimeLimit: -1}, licensed, teamId, channelId, userId, {user_id: userId}));
            assert.ok(canEditPost(newVersionState, {PostEditTimeLimit: 300}, licensed, teamId, channelId, userId, {user_id: userId, create_at: Date.now() - 100}));
            assert.ok(!canEditPost(newVersionState, {PostEditTimeLimit: 300}, licensed, teamId, channelId, userId, {user_id: userId, create_at: Date.now() - 6000000}));
            assert.ok(!canEditPost(newVersionState, {PostEditTimeLimit: -1}, licensed, teamId, channelId, userId, {user_id: 'other'}));
            assert.ok(!canEditPost(newVersionState, {PostEditTimeLimit: 300}, licensed, teamId, channelId, userId, {user_id: 'other', create_at: Date.now() - 100}));
            assert.ok(!canEditPost(newVersionState, {PostEditTimeLimit: 300}, licensed, teamId, channelId, userId, {user_id: 'other', create_at: Date.now() - 6000000}));

            newVersionState.entities.roles = {
                roles: {
                    system_role: {permissions: []},
                    team_role: {permissions: [Permissions.EDIT_POST]},
                    channel_role: {permissions: []},
                },
            };
            assert.ok(canEditPost(newVersionState, {PostEditTimeLimit: -1}, licensed, teamId, channelId, userId, {user_id: userId}));
            assert.ok(canEditPost(newVersionState, {PostEditTimeLimit: 300}, licensed, teamId, channelId, userId, {user_id: userId, create_at: Date.now() - 100}));
            assert.ok(!canEditPost(newVersionState, {PostEditTimeLimit: 300}, licensed, teamId, channelId, userId, {user_id: userId, create_at: Date.now() - 6000000}));
            assert.ok(!canEditPost(newVersionState, {PostEditTimeLimit: -1}, licensed, teamId, channelId, userId, {user_id: 'other'}));
            assert.ok(!canEditPost(newVersionState, {PostEditTimeLimit: 300}, licensed, teamId, channelId, userId, {user_id: 'other', create_at: Date.now() - 100}));
            assert.ok(!canEditPost(newVersionState, {PostEditTimeLimit: 300}, licensed, teamId, channelId, userId, {user_id: 'other', create_at: Date.now() - 6000000}));

            newVersionState.entities.roles = {
                roles: {
                    system_role: {permissions: []},
                    team_role: {permissions: []},
                    channel_role: {permissions: [Permissions.EDIT_POST]},
                },
            };
            assert.ok(canEditPost(newVersionState, {PostEditTimeLimit: -1}, licensed, teamId, channelId, userId, {user_id: userId}));
            assert.ok(canEditPost(newVersionState, {PostEditTimeLimit: 300}, licensed, teamId, channelId, userId, {user_id: userId, create_at: Date.now() - 100}));
            assert.ok(!canEditPost(newVersionState, {PostEditTimeLimit: 300}, licensed, teamId, channelId, userId, {user_id: userId, create_at: Date.now() - 6000000}));
            assert.ok(!canEditPost(newVersionState, {PostEditTimeLimit: -1}, licensed, teamId, channelId, userId, {user_id: 'other'}));
            assert.ok(!canEditPost(newVersionState, {PostEditTimeLimit: 300}, licensed, teamId, channelId, userId, {user_id: 'other', create_at: Date.now() - 100}));
            assert.ok(!canEditPost(newVersionState, {PostEditTimeLimit: 300}, licensed, teamId, channelId, userId, {user_id: 'other', create_at: Date.now() - 6000000}));

            newVersionState.entities.roles = {
                roles: {
                    system_role: {permissions: [Permissions.EDIT_OTHERS_POSTS]},
                    team_role: {permissions: []},
                    channel_role: {permissions: []},
                },
            };
            assert.ok(!canEditPost(newVersionState, {PostEditTimeLimit: -1}, licensed, teamId, channelId, userId, {user_id: userId}));
            assert.ok(!canEditPost(newVersionState, {PostEditTimeLimit: 300}, licensed, teamId, channelId, userId, {user_id: userId, create_at: Date.now() - 100}));
            assert.ok(!canEditPost(newVersionState, {PostEditTimeLimit: 300}, licensed, teamId, channelId, userId, {user_id: userId, create_at: Date.now() - 6000000}));
            assert.ok(!canEditPost(newVersionState, {PostEditTimeLimit: -1}, licensed, teamId, channelId, userId, {user_id: 'other'}));
            assert.ok(!canEditPost(newVersionState, {PostEditTimeLimit: 300}, licensed, teamId, channelId, userId, {user_id: 'other', create_at: Date.now() - 100}));
            assert.ok(!canEditPost(newVersionState, {PostEditTimeLimit: 300}, licensed, teamId, channelId, userId, {user_id: 'other', create_at: Date.now() - 6000000}));

            newVersionState.entities.roles = {
                roles: {
                    system_role: {permissions: []},
                    team_role: {permissions: [Permissions.EDIT_OTHERS_POSTS]},
                    channel_role: {permissions: []},
                },
            };
            assert.ok(!canEditPost(newVersionState, {PostEditTimeLimit: -1}, licensed, teamId, channelId, userId, {user_id: userId}));
            assert.ok(!canEditPost(newVersionState, {PostEditTimeLimit: 300}, licensed, teamId, channelId, userId, {user_id: userId, create_at: Date.now() - 100}));
            assert.ok(!canEditPost(newVersionState, {PostEditTimeLimit: 300}, licensed, teamId, channelId, userId, {user_id: userId, create_at: Date.now() - 6000000}));
            assert.ok(!canEditPost(newVersionState, {PostEditTimeLimit: -1}, licensed, teamId, channelId, userId, {user_id: 'other'}));
            assert.ok(!canEditPost(newVersionState, {PostEditTimeLimit: 300}, licensed, teamId, channelId, userId, {user_id: 'other', create_at: Date.now() - 100}));
            assert.ok(!canEditPost(newVersionState, {PostEditTimeLimit: 300}, licensed, teamId, channelId, userId, {user_id: 'other', create_at: Date.now() - 6000000}));

            newVersionState.entities.roles = {
                roles: {
                    system_role: {permissions: []},
                    team_role: {permissions: []},
                    channel_role: {permissions: [Permissions.EDIT_OTHERS_POSTS]},
                },
            };
            assert.ok(!canEditPost(newVersionState, {PostEditTimeLimit: -1}, licensed, teamId, channelId, userId, {user_id: userId}));
            assert.ok(!canEditPost(newVersionState, {PostEditTimeLimit: 300}, licensed, teamId, channelId, userId, {user_id: userId, create_at: Date.now() - 100}));
            assert.ok(!canEditPost(newVersionState, {PostEditTimeLimit: 300}, licensed, teamId, channelId, userId, {user_id: userId, create_at: Date.now() - 6000000}));
            assert.ok(!canEditPost(newVersionState, {PostEditTimeLimit: -1}, licensed, teamId, channelId, userId, {user_id: 'other'}));
            assert.ok(!canEditPost(newVersionState, {PostEditTimeLimit: 300}, licensed, teamId, channelId, userId, {user_id: 'other', create_at: Date.now() - 100}));
            assert.ok(!canEditPost(newVersionState, {PostEditTimeLimit: 300}, licensed, teamId, channelId, userId, {user_id: 'other', create_at: Date.now() - 6000000}));

            newVersionState.entities.roles = {
                roles: {
                    system_role: {permissions: [Permissions.EDIT_OTHERS_POSTS, Permissions.EDIT_POST]},
                    team_role: {permissions: []},
                    channel_role: {permissions: []},
                },
            };
            assert.ok(canEditPost(newVersionState, {PostEditTimeLimit: -1}, licensed, teamId, channelId, userId, {user_id: userId}));
            assert.ok(canEditPost(newVersionState, {PostEditTimeLimit: 300}, licensed, teamId, channelId, userId, {user_id: userId, create_at: Date.now() - 100}));
            assert.ok(!canEditPost(newVersionState, {PostEditTimeLimit: 300}, licensed, teamId, channelId, userId, {user_id: userId, create_at: Date.now() - 6000000}));
            assert.ok(canEditPost(newVersionState, {PostEditTimeLimit: -1}, licensed, teamId, channelId, userId, {user_id: 'other'}));
            assert.ok(canEditPost(newVersionState, {PostEditTimeLimit: 300}, licensed, teamId, channelId, userId, {user_id: 'other', create_at: Date.now() - 100}));
            assert.ok(!canEditPost(newVersionState, {PostEditTimeLimit: 300}, licensed, teamId, channelId, userId, {user_id: 'other', create_at: Date.now() - 6000000}));

            newVersionState.entities.roles = {
                roles: {
                    system_role: {permissions: []},
                    team_role: {permissions: [Permissions.EDIT_OTHERS_POSTS, Permissions.EDIT_POST]},
                    channel_role: {permissions: []},
                },
            };
            assert.ok(canEditPost(newVersionState, {PostEditTimeLimit: -1}, licensed, teamId, channelId, userId, {user_id: userId}));
            assert.ok(canEditPost(newVersionState, {PostEditTimeLimit: 300}, licensed, teamId, channelId, userId, {user_id: userId, create_at: Date.now() - 100}));
            assert.ok(!canEditPost(newVersionState, {PostEditTimeLimit: 300}, licensed, teamId, channelId, userId, {user_id: userId, create_at: Date.now() - 6000000}));
            assert.ok(canEditPost(newVersionState, {PostEditTimeLimit: -1}, licensed, teamId, channelId, userId, {user_id: 'other'}));
            assert.ok(canEditPost(newVersionState, {PostEditTimeLimit: 300}, licensed, teamId, channelId, userId, {user_id: 'other', create_at: Date.now() - 100}));
            assert.ok(!canEditPost(newVersionState, {PostEditTimeLimit: 300}, licensed, teamId, channelId, userId, {user_id: 'other', create_at: Date.now() - 6000000}));

            newVersionState.entities.roles = {
                roles: {
                    system_role: {permissions: []},
                    team_role: {permissions: []},
                    channel_role: {permissions: [Permissions.EDIT_OTHERS_POSTS, Permissions.EDIT_POST]},
                },
            };
            assert.ok(canEditPost(newVersionState, {PostEditTimeLimit: -1}, licensed, teamId, channelId, userId, {user_id: userId}));
            assert.ok(canEditPost(newVersionState, {PostEditTimeLimit: 300}, licensed, teamId, channelId, userId, {user_id: userId, create_at: Date.now() - 100}));
            assert.ok(!canEditPost(newVersionState, {PostEditTimeLimit: 300}, licensed, teamId, channelId, userId, {user_id: userId, create_at: Date.now() - 6000000}));
            assert.ok(canEditPost(newVersionState, {PostEditTimeLimit: -1}, licensed, teamId, channelId, userId, {user_id: 'other'}));
            assert.ok(canEditPost(newVersionState, {PostEditTimeLimit: 300}, licensed, teamId, channelId, userId, {user_id: 'other', create_at: Date.now() - 100}));
            assert.ok(!canEditPost(newVersionState, {PostEditTimeLimit: 300}, licensed, teamId, channelId, userId, {user_id: 'other', create_at: Date.now() - 6000000}));
        });
    });

    describe('isSystemMessage', () => {
        it('should identify if post is system message', () => {  // eslint-disable-line
            const testCases = [
                {input: {type: ''}, output: false},

                {input: {type: PostTypes.CHANNEL_DELETED}, output: true},
                {input: {type: PostTypes.DISPLAYNAME_CHANGE}, output: true},
                {input: {type: PostTypes.CONVERT_CHANNEL}, output: true},
                {input: {type: PostTypes.EPHEMERAL}, output: true},
                {input: {type: PostTypes.EPHEMERAL_ADD_TO_CHANNEL}, output: true},
                {input: {type: PostTypes.HEADER_CHANGE}, output: true},
                {input: {type: PostTypes.PURPOSE_CHANGE}, output: true},

                {input: {type: PostTypes.JOIN_LEAVE}, output: true},  // deprecated system type
                {input: {type: PostTypes.ADD_REMOVE}, output: true},  // deprecated system type

                {input: {type: PostTypes.COMBINED_USER_ACTIVITY}, output: true},

                {input: {type: PostTypes.ADD_TO_CHANNEL}, output: true},
                {input: {type: PostTypes.JOIN_CHANNEL}, output: true},
                {input: {type: PostTypes.LEAVE_CHANNEL}, output: true},
                {input: {type: PostTypes.REMOVE_FROM_CHANNEL}, output: true},
                {input: {type: PostTypes.ADD_TO_TEAM}, output: true},
                {input: {type: PostTypes.JOIN_TEAM}, output: true},
                {input: {type: PostTypes.LEAVE_TEAM}, output: true},
                {input: {type: PostTypes.REMOVE_FROM_TEAM}, output: true},
            ];

            testCases.forEach((testCase) => {
                assert.equal(
                    isSystemMessage(testCase.input),
                    testCase.output,
                    `isSystemMessage('${testCase.input}') should return ${testCase.output}`,
                );
            });
        });
    });

    describe('isUserActivityPost', () => {
        it('should identify if post is user activity - add/remove/join/leave channel/team', () => {  // eslint-disable-line
            const testCases = [
                {input: '', output: false},
                {input: null, output: false},

                {input: PostTypes.CHANNEL_DELETED, output: false},
                {input: PostTypes.DISPLAYNAME_CHANGE, output: false},
                {input: PostTypes.CONVERT_CHANNEL, output: false},
                {input: PostTypes.EPHEMERAL, output: false},
                {input: PostTypes.EPHEMERAL_ADD_TO_CHANNEL, output: false},
                {input: PostTypes.HEADER_CHANGE, output: false},
                {input: PostTypes.PURPOSE_CHANGE, output: false},

                {input: PostTypes.JOIN_LEAVE, output: false},  // deprecated system type
                {input: PostTypes.ADD_REMOVE, output: false},  // deprecated system type

                {input: PostTypes.COMBINED_USER_ACTIVITY, output: false},

                {input: PostTypes.ADD_TO_CHANNEL, output: true},
                {input: PostTypes.JOIN_CHANNEL, output: true},
                {input: PostTypes.LEAVE_CHANNEL, output: true},
                {input: PostTypes.REMOVE_FROM_CHANNEL, output: true},
                {input: PostTypes.ADD_TO_TEAM, output: true},
                {input: PostTypes.JOIN_TEAM, output: true},
                {input: PostTypes.LEAVE_TEAM, output: true},
                {input: PostTypes.REMOVE_FROM_TEAM, output: true},
            ];

            testCases.forEach((testCase) => {
                assert.equal(
                    isUserActivityPost(testCase.input),
                    testCase.output,
                    `isUserActivityPost('${testCase.input}') should return ${testCase.output}`,
                );
            });
        });
    });

    describe('combineSystemPosts', () => {
        const postIdUA1 = '11';
        const postIdUA2 = '12';
        const postIdUA5 = '15';
        const postIdUA6 = '16';
        const postUA1 = {id: '11', type: PostTypes.ADD_TO_CHANNEL, state: '', create_at: 11, props: {}, delete_at: 0};
        const postUA2 = {id: '12', type: PostTypes.JOIN_CHANNEL, state: '', create_at: 12, props: {}, delete_at: 0};
        const postUA5 = {id: '15', type: PostTypes.LEAVE_CHANNEL, state: '', create_at: 15, props: {}, delete_at: 0};
        const postUA6 = {id: '16', type: PostTypes.REMOVE_FROM_CHANNEL, state: '', create_at: 16, props: {}, delete_at: 0};

        const postId1 = '1';
        const postId2 = '2';
        const postId13 = '13';
        const postId14 = '14';
        const postId17 = '17';
        const postId18 = '18';
        const postId22 = '22';

        const post1 = {id: '1', type: '', state: '', create_at: 1, props: {}, delete_at: 0};
        const post2 = {id: '2', type: '', state: '', create_at: 2, props: {}, delete_at: 0};
        const post13 = {id: '13', type: '', state: '', create_at: 13, props: {}, delete_at: 0};
        const post14 = {id: '14', type: '', state: '', create_at: 14, props: {}, delete_at: 0};
        const post17 = {id: '17', type: '', state: '', create_at: 17, props: {}, delete_at: 0};
        const post18 = {id: '18', type: '', state: '', create_at: 18, props: {}, delete_at: 0};
        const post22 = {id: '22', type: '', state: '', create_at: 22, props: {}, delete_at: 0};

        it('should combine consecutive user activity posts', () => {  // eslint-disable-line
            const out = combineSystemPosts([postIdUA2, postIdUA1], {[postIdUA1]: postUA1, [postIdUA2]: postUA2});

            assert.equal(out.postsForChannel.length, 1);
            assert.equal(Object.keys(out.nextPosts).length, 3);

            const combinedPostId = out.postsForChannel[0];
            assert.equal(out.nextPosts[combinedPostId].type, PostTypes.COMBINED_USER_ACTIVITY);
            assert.equal(out.nextPosts[combinedPostId].create_at, 11);
            assert.equal(out.nextPosts[combinedPostId].system_post_ids[0], '12');
            assert.equal(out.nextPosts[combinedPostId].system_post_ids[1], '11');
            assert.equal(out.nextPosts[combinedPostId].user_activity_posts[0], postUA2);
            assert.equal(out.nextPosts[combinedPostId].user_activity_posts[1], postUA1);
        });

        it('should combine consecutive user activity posts between posts', () => {  // eslint-disable-line
            const out = combineSystemPosts(
                [postId18, postId17, postIdUA6, postIdUA5, postId14, postId13, postIdUA2, postIdUA1, postId2, postId1],
                {
                    [postId1]: post1,
                    [postId2]: post2,
                    [postIdUA1]: postUA1,
                    [postIdUA2]: postUA2,
                    [postId13]: post13,
                    [postId14]: post14,
                    [postIdUA5]: postUA5,
                    [postIdUA6]: postUA6,
                    [postId17]: post17,
                    [postId18]: post18,
                }
            );

            assert.equal(out.postsForChannel.length, 8);
            assert.equal(Object.keys(out.nextPosts).length, 12);

            const combinedPostId1 = out.postsForChannel[5];
            assert.equal(out.nextPosts[combinedPostId1].type, PostTypes.COMBINED_USER_ACTIVITY);
            assert.equal(out.nextPosts[combinedPostId1].create_at, 11);
            assert.equal(out.nextPosts[combinedPostId1].system_post_ids[0], '12');
            assert.equal(out.nextPosts[combinedPostId1].system_post_ids[1], '11');
            assert.equal(out.nextPosts[combinedPostId1].user_activity_posts[0], postUA2);
            assert.equal(out.nextPosts[combinedPostId1].user_activity_posts[1], postUA1);

            const combinedPostId2 = out.postsForChannel[2];
            assert.equal(out.nextPosts[combinedPostId2].type, PostTypes.COMBINED_USER_ACTIVITY);
            assert.equal(out.nextPosts[combinedPostId2].create_at, 15);
            assert.equal(out.nextPosts[combinedPostId2].system_post_ids[0], '16');
            assert.equal(out.nextPosts[combinedPostId2].system_post_ids[1], '15');
            assert.equal(out.nextPosts[combinedPostId2].user_activity_posts[0], postUA6);
            assert.equal(out.nextPosts[combinedPostId2].user_activity_posts[1], postUA5);
        });

        it('should combine system_combined_user_activity followed by consecutive user activity posts', () => {  // eslint-disable-line
            const combinedPost = {
                id: 'combined_post_id',
                root_id: '',
                type: 'system_combined_user_activity',
                message: '',
                create_at: 9,
                delete_at: 0,
                user_activity_posts: [{id: '10'}, {id: '9'}],
                system_post_ids: ['10', '9'],
            };
            const out = combineSystemPosts(
                [postIdUA2, postIdUA1, combinedPost.id],
                {[combinedPost.id]: combinedPost, [postIdUA1]: postUA1, [postIdUA2]: postUA2}
            );

            assert.equal(out.postsForChannel.length, 1);
            assert.equal(Object.keys(out.nextPosts).length, 3);
            assert.equal(out.nextPosts[combinedPost.id].type, PostTypes.COMBINED_USER_ACTIVITY);
            assert.equal(out.nextPosts[combinedPost.id].create_at, 9);
            assert.equal(out.nextPosts[combinedPost.id].system_post_ids[0], '12');
            assert.equal(out.nextPosts[combinedPost.id].system_post_ids[1], '11');
            assert.equal(out.nextPosts[combinedPost.id].system_post_ids[2], '10');
            assert.equal(out.nextPosts[combinedPost.id].system_post_ids[3], '9');
        });

        it('should combine consecutive user activity posts followed by system_combined_user_activity', () => {  // eslint-disable-line
            const combinedPost = {
                id: 'combined_post_id',
                root_id: '',
                type: 'system_combined_user_activity',
                message: '',
                create_at: 13,
                delete_at: 0,
                user_activity_posts: [{id: '14'}, {id: '13'}],
                system_post_ids: ['14', '13'],
            };
            const out = combineSystemPosts(
                [combinedPost.id, postIdUA2, postIdUA1],
                {[combinedPost.id]: combinedPost, [postIdUA1]: postUA1, [postIdUA2]: postUA2}
            );

            assert.equal(out.postsForChannel.length, 1);
            assert.equal(Object.keys(out.nextPosts).length, 3);
            assert.equal(out.nextPosts[combinedPost.id].type, PostTypes.COMBINED_USER_ACTIVITY);
            assert.equal(out.nextPosts[combinedPost.id].create_at, 11);
            assert.equal(out.nextPosts[combinedPost.id].system_post_ids[0], '14');
            assert.equal(out.nextPosts[combinedPost.id].system_post_ids[1], '13');
            assert.equal(out.nextPosts[combinedPost.id].system_post_ids[2], '12');
            assert.equal(out.nextPosts[combinedPost.id].system_post_ids[3], '11');
        });

        it('should combine consecutive combined and user activity posts between regular posts', () => {  // eslint-disable-line
            const out = combineSystemPosts(
                [postId22, postIdUA2, postIdUA1, postId2, postId1],
                {[postIdUA1]: postUA1, [postIdUA2]: postUA2, [postId1]: post1, [postId2]: post2, [postId22]: post22}
            );
            const combinedPostId = out.postsForChannel[1];

            assert.equal(out.postsForChannel.length, 4);
            assert.equal(Object.keys(out.nextPosts).length, 6);
            assert.equal(out.nextPosts[combinedPostId].type, PostTypes.COMBINED_USER_ACTIVITY);
            assert.equal(out.nextPosts[combinedPostId].create_at, 11);
            assert.equal(out.nextPosts[combinedPostId].system_post_ids[0], '12');
            assert.equal(out.nextPosts[combinedPostId].system_post_ids[1], '11');
            assert.equal(out.nextPosts[combinedPostId].user_activity_posts[0], postUA2);
            assert.equal(out.nextPosts[combinedPostId].user_activity_posts[1], postUA1);
        });

        it('should combine system_combined_user_activity followed by consecutive user activity posts between regular posts', () => {  // eslint-disable-line
            const combinedPost = {
                id: 'combined_post_id',
                root_id: '',
                type: 'system_combined_user_activity',
                message: '',
                create_at: 9,
                delete_at: 0,
                user_activity_posts: [{id: '10'}, {id: '9'}],
                system_post_ids: ['10', '9'],
            };

            const out = combineSystemPosts(
                [postId22, postIdUA2, postIdUA1, combinedPost.id, postId2, postId1],
                {[postId1]: post1, [postId2]: post2, [combinedPost.id]: combinedPost, [postIdUA1]: postUA1, [postIdUA2]: postUA2, [postId22]: post22}
            );

            assert.equal(out.postsForChannel.length, 4);
            assert.equal(Object.keys(out.nextPosts).length, 6);
            assert.equal(out.nextPosts[combinedPost.id].type, PostTypes.COMBINED_USER_ACTIVITY);
            assert.equal(out.nextPosts[combinedPost.id].create_at, 9);
            assert.equal(out.nextPosts[combinedPost.id].system_post_ids[0], '12');
            assert.equal(out.nextPosts[combinedPost.id].system_post_ids[1], '11');
            assert.equal(out.nextPosts[combinedPost.id].system_post_ids[2], '10');
            assert.equal(out.nextPosts[combinedPost.id].system_post_ids[3], '9');
        });
    });
});
