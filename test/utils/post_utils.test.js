// Copyright (c) 2017-present Mattermost, Inc. All Rights Reserved.
// See License.txt for license information.

import assert from 'assert';

import {PostTypes} from 'constants/posts';
import {Permissions} from 'constants';

import {
    canEditPost,
    combineUserActivitySystemPost,
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

    describe('combineUserActivitySystemPost', () => {
        it('should return null', () => {
            assert.equal(Boolean(combineUserActivitySystemPost()), false);
            assert.equal(Boolean(combineUserActivitySystemPost([])), false);
        });

        const postAddToChannel1 = {type: PostTypes.ADD_TO_CHANNEL, user_id: 'user_id_1', props: {addedUserId: 'added_user_id_1'}};
        const postAddToChannel2 = {type: PostTypes.ADD_TO_CHANNEL, user_id: 'user_id_1', props: {addedUserId: 'added_user_id_2'}};
        const postAddToChannel3 = {type: PostTypes.ADD_TO_CHANNEL, user_id: 'user_id_1', props: {addedUserId: 'added_user_id_3'}};
        const postAddToChannel4 = {type: PostTypes.ADD_TO_CHANNEL, user_id: 'user_id_2', props: {addedUserId: 'added_user_id_4'}};
        it('should match return for ADD_TO_CHANNEL', () => {
            const out1 = {
                allUserIds: ['added_user_id_1', 'user_id_1'],
                messageData: [{actorId: 'user_id_1', postType: PostTypes.ADD_TO_CHANNEL, userIds: ['added_user_id_1']}],
            };
            assert.deepEqual(combineUserActivitySystemPost([postAddToChannel1]), out1);

            const out2 = {
                allUserIds: ['added_user_id_1', 'added_user_id_2', 'user_id_1'],
                messageData: [{actorId: 'user_id_1', postType: PostTypes.ADD_TO_CHANNEL, userIds: ['added_user_id_1', 'added_user_id_2']}],
            };
            assert.deepEqual(combineUserActivitySystemPost([postAddToChannel1, postAddToChannel2]), out2);

            const out3 = {
                allUserIds: ['added_user_id_1', 'added_user_id_2', 'added_user_id_3', 'user_id_1'],
                messageData: [{actorId: 'user_id_1', postType: PostTypes.ADD_TO_CHANNEL, userIds: ['added_user_id_1', 'added_user_id_2', 'added_user_id_3']}],
            };
            assert.deepEqual(combineUserActivitySystemPost([postAddToChannel1, postAddToChannel2, postAddToChannel3]), out3);

            const out4 = {
                allUserIds: ['added_user_id_1', 'added_user_id_2', 'added_user_id_3', 'user_id_1', 'added_user_id_4', 'user_id_2'],
                messageData: [
                    {actorId: 'user_id_1', postType: PostTypes.ADD_TO_CHANNEL, userIds: ['added_user_id_1', 'added_user_id_2', 'added_user_id_3']},
                    {actorId: 'user_id_2', postType: PostTypes.ADD_TO_CHANNEL, userIds: ['added_user_id_4']},
                ],
            };
            assert.deepEqual(combineUserActivitySystemPost([postAddToChannel1, postAddToChannel2, postAddToChannel3, postAddToChannel4]), out4);
        });

        const postAddToTeam1 = {type: PostTypes.ADD_TO_TEAM, user_id: 'user_id_1', props: {addedUserId: 'added_user_id_1'}};
        const postAddToTeam2 = {type: PostTypes.ADD_TO_TEAM, user_id: 'user_id_1', props: {addedUserId: 'added_user_id_2'}};
        const postAddToTeam3 = {type: PostTypes.ADD_TO_TEAM, user_id: 'user_id_1', props: {addedUserId: 'added_user_id_3'}};
        const postAddToTeam4 = {type: PostTypes.ADD_TO_TEAM, user_id: 'user_id_2', props: {addedUserId: 'added_user_id_4'}};
        it('should match return for ADD_TO_TEAM', () => {
            const out1 = {
                allUserIds: ['added_user_id_1', 'user_id_1'],
                messageData: [{actorId: 'user_id_1', postType: PostTypes.ADD_TO_TEAM, userIds: ['added_user_id_1']}],
            };
            assert.deepEqual(combineUserActivitySystemPost([postAddToTeam1]), out1);

            const out2 = {
                allUserIds: ['added_user_id_1', 'added_user_id_2', 'user_id_1'],
                messageData: [{actorId: 'user_id_1', postType: PostTypes.ADD_TO_TEAM, userIds: ['added_user_id_1', 'added_user_id_2']}],
            };
            assert.deepEqual(combineUserActivitySystemPost([postAddToTeam1, postAddToTeam2]), out2);

            const out3 = {
                allUserIds: ['added_user_id_1', 'added_user_id_2', 'added_user_id_3', 'user_id_1'],
                messageData: [{actorId: 'user_id_1', postType: PostTypes.ADD_TO_TEAM, userIds: ['added_user_id_1', 'added_user_id_2', 'added_user_id_3']}],
            };
            assert.deepEqual(combineUserActivitySystemPost([postAddToTeam1, postAddToTeam2, postAddToTeam3]), out3);

            const out4 = {
                allUserIds: ['added_user_id_1', 'added_user_id_2', 'added_user_id_3', 'user_id_1', 'added_user_id_4', 'user_id_2'],
                messageData: [
                    {actorId: 'user_id_1', postType: PostTypes.ADD_TO_TEAM, userIds: ['added_user_id_1', 'added_user_id_2', 'added_user_id_3']},
                    {actorId: 'user_id_2', postType: PostTypes.ADD_TO_TEAM, userIds: ['added_user_id_4']},
                ],
            };
            assert.deepEqual(combineUserActivitySystemPost([postAddToTeam1, postAddToTeam2, postAddToTeam3, postAddToTeam4]), out4);
        });

        const postJoinChannel1 = {type: PostTypes.JOIN_CHANNEL, user_id: 'user_id_1'};
        const postJoinChannel2 = {type: PostTypes.JOIN_CHANNEL, user_id: 'user_id_2'};
        const postJoinChannel3 = {type: PostTypes.JOIN_CHANNEL, user_id: 'user_id_3'};
        const postJoinChannel4 = {type: PostTypes.JOIN_CHANNEL, user_id: 'user_id_4'};
        it('should match return for JOIN_CHANNEL', () => {
            const out1 = {
                allUserIds: ['user_id_1'],
                messageData: [{postType: PostTypes.JOIN_CHANNEL, userIds: ['user_id_1']}],
            };
            assert.deepEqual(combineUserActivitySystemPost([postJoinChannel1]), out1);

            const out2 = {
                allUserIds: ['user_id_1', 'user_id_2'],
                messageData: [{postType: PostTypes.JOIN_CHANNEL, userIds: ['user_id_1', 'user_id_2']}],
            };
            assert.deepEqual(combineUserActivitySystemPost([postJoinChannel1, postJoinChannel2]), out2);

            const out3 = {
                allUserIds: ['user_id_1', 'user_id_2', 'user_id_3'],
                messageData: [{postType: PostTypes.JOIN_CHANNEL, userIds: ['user_id_1', 'user_id_2', 'user_id_3']}],
            };
            assert.deepEqual(combineUserActivitySystemPost([postJoinChannel1, postJoinChannel2, postJoinChannel3]), out3);

            const out4 = {
                allUserIds: ['user_id_1', 'user_id_2', 'user_id_3', 'user_id_4'],
                messageData: [{postType: PostTypes.JOIN_CHANNEL, userIds: ['user_id_1', 'user_id_2', 'user_id_3', 'user_id_4']}],
            };
            assert.deepEqual(combineUserActivitySystemPost([postJoinChannel1, postJoinChannel2, postJoinChannel3, postJoinChannel4]), out4);
        });

        const postJoinTeam1 = {type: PostTypes.JOIN_TEAM, user_id: 'user_id_1'};
        const postJoinTeam2 = {type: PostTypes.JOIN_TEAM, user_id: 'user_id_2'};
        const postJoinTeam3 = {type: PostTypes.JOIN_TEAM, user_id: 'user_id_3'};
        const postJoinTeam4 = {type: PostTypes.JOIN_TEAM, user_id: 'user_id_4'};
        it('should match return for JOIN_TEAM', () => {
            const out1 = {
                allUserIds: ['user_id_1'],
                messageData: [{postType: PostTypes.JOIN_TEAM, userIds: ['user_id_1']}],
            };
            assert.deepEqual(combineUserActivitySystemPost([postJoinTeam1]), out1);

            const out2 = {
                allUserIds: ['user_id_1', 'user_id_2'],
                messageData: [{postType: PostTypes.JOIN_TEAM, userIds: ['user_id_1', 'user_id_2']}],
            };
            assert.deepEqual(combineUserActivitySystemPost([postJoinTeam1, postJoinTeam2]), out2);

            const out3 = {
                allUserIds: ['user_id_1', 'user_id_2', 'user_id_3'],
                messageData: [{postType: PostTypes.JOIN_TEAM, userIds: ['user_id_1', 'user_id_2', 'user_id_3']}],
            };
            assert.deepEqual(combineUserActivitySystemPost([postJoinTeam1, postJoinTeam2, postJoinTeam3]), out3);

            const out4 = {
                allUserIds: ['user_id_1', 'user_id_2', 'user_id_3', 'user_id_4'],
                messageData: [{postType: PostTypes.JOIN_TEAM, userIds: ['user_id_1', 'user_id_2', 'user_id_3', 'user_id_4']}],
            };
            assert.deepEqual(combineUserActivitySystemPost([postJoinTeam1, postJoinTeam2, postJoinTeam3, postJoinTeam4]), out4);
        });

        const postLeaveChannel1 = {type: PostTypes.LEAVE_CHANNEL, user_id: 'user_id_1'};
        const postLeaveChannel2 = {type: PostTypes.LEAVE_CHANNEL, user_id: 'user_id_2'};
        const postLeaveChannel3 = {type: PostTypes.LEAVE_CHANNEL, user_id: 'user_id_3'};
        const postLeaveChannel4 = {type: PostTypes.LEAVE_CHANNEL, user_id: 'user_id_4'};
        it('should match return for LEAVE_CHANNEL', () => {
            const out1 = {
                allUserIds: ['user_id_1'],
                messageData: [{postType: PostTypes.LEAVE_CHANNEL, userIds: ['user_id_1']}],
            };
            assert.deepEqual(combineUserActivitySystemPost([postLeaveChannel1]), out1);

            const out2 = {
                allUserIds: ['user_id_1', 'user_id_2'],
                messageData: [{postType: PostTypes.LEAVE_CHANNEL, userIds: ['user_id_1', 'user_id_2']}],
            };
            assert.deepEqual(combineUserActivitySystemPost([postLeaveChannel1, postLeaveChannel2]), out2);

            const out3 = {
                allUserIds: ['user_id_1', 'user_id_2', 'user_id_3'],
                messageData: [{postType: PostTypes.LEAVE_CHANNEL, userIds: ['user_id_1', 'user_id_2', 'user_id_3']}],
            };
            assert.deepEqual(combineUserActivitySystemPost([postLeaveChannel1, postLeaveChannel2, postLeaveChannel3]), out3);

            const out4 = {
                allUserIds: ['user_id_1', 'user_id_2', 'user_id_3', 'user_id_4'],
                messageData: [{postType: PostTypes.LEAVE_CHANNEL, userIds: ['user_id_1', 'user_id_2', 'user_id_3', 'user_id_4']}],
            };
            assert.deepEqual(combineUserActivitySystemPost([postLeaveChannel1, postLeaveChannel2, postLeaveChannel3, postLeaveChannel4]), out4);
        });

        const postLeaveTeam1 = {type: PostTypes.LEAVE_TEAM, user_id: 'user_id_1'};
        const postLeaveTeam2 = {type: PostTypes.LEAVE_TEAM, user_id: 'user_id_2'};
        const postLeaveTeam3 = {type: PostTypes.LEAVE_TEAM, user_id: 'user_id_3'};
        const postLeaveTeam4 = {type: PostTypes.LEAVE_TEAM, user_id: 'user_id_4'};
        it('should match return for LEAVE_TEAM', () => {
            const out1 = {
                allUserIds: ['user_id_1'],
                messageData: [{postType: PostTypes.LEAVE_TEAM, userIds: ['user_id_1']}],
            };
            assert.deepEqual(combineUserActivitySystemPost([postLeaveTeam1]), out1);

            const out2 = {
                allUserIds: ['user_id_1', 'user_id_2'],
                messageData: [{postType: PostTypes.LEAVE_TEAM, userIds: ['user_id_1', 'user_id_2']}],
            };
            assert.deepEqual(combineUserActivitySystemPost([postLeaveTeam1, postLeaveTeam2]), out2);

            const out3 = {
                allUserIds: ['user_id_1', 'user_id_2', 'user_id_3'],
                messageData: [{postType: PostTypes.LEAVE_TEAM, userIds: ['user_id_1', 'user_id_2', 'user_id_3']}],
            };
            assert.deepEqual(combineUserActivitySystemPost([postLeaveTeam1, postLeaveTeam2, postLeaveTeam3]), out3);

            const out4 = {
                allUserIds: ['user_id_1', 'user_id_2', 'user_id_3', 'user_id_4'],
                messageData: [{postType: PostTypes.LEAVE_TEAM, userIds: ['user_id_1', 'user_id_2', 'user_id_3', 'user_id_4']}],
            };
            assert.deepEqual(combineUserActivitySystemPost([postLeaveTeam1, postLeaveTeam2, postLeaveTeam3, postLeaveTeam4]), out4);
        });

        const postRemoveFromChannel1 = {type: PostTypes.REMOVE_FROM_CHANNEL, props: {removedUserId: 'user_id_1'}};
        const postRemoveFromChannel2 = {type: PostTypes.REMOVE_FROM_CHANNEL, props: {removedUserId: 'user_id_2'}};
        const postRemoveFromChannel3 = {type: PostTypes.REMOVE_FROM_CHANNEL, props: {removedUserId: 'user_id_3'}};
        const postRemoveFromChannel4 = {type: PostTypes.REMOVE_FROM_CHANNEL, props: {removedUserId: 'user_id_4'}};
        it('should match return for REMOVE_FROM_CHANNEL', () => {
            const out1 = {
                allUserIds: ['user_id_1'],
                messageData: [{postType: PostTypes.REMOVE_FROM_CHANNEL, userIds: ['user_id_1']}],
            };
            assert.deepEqual(combineUserActivitySystemPost([postRemoveFromChannel1]), out1);

            const out2 = {
                allUserIds: ['user_id_1', 'user_id_2'],
                messageData: [{postType: PostTypes.REMOVE_FROM_CHANNEL, userIds: ['user_id_1', 'user_id_2']}],
            };
            assert.deepEqual(combineUserActivitySystemPost([postRemoveFromChannel1, postRemoveFromChannel2]), out2);

            const out3 = {
                allUserIds: ['user_id_1', 'user_id_2', 'user_id_3'],
                messageData: [{postType: PostTypes.REMOVE_FROM_CHANNEL, userIds: ['user_id_1', 'user_id_2', 'user_id_3']}],
            };
            assert.deepEqual(combineUserActivitySystemPost([postRemoveFromChannel1, postRemoveFromChannel2, postRemoveFromChannel3]), out3);

            const out4 = {
                allUserIds: ['user_id_1', 'user_id_2', 'user_id_3', 'user_id_4'],
                messageData: [{postType: PostTypes.REMOVE_FROM_CHANNEL, userIds: ['user_id_1', 'user_id_2', 'user_id_3', 'user_id_4']}],
            };
            assert.deepEqual(combineUserActivitySystemPost([postRemoveFromChannel1, postRemoveFromChannel2, postRemoveFromChannel3, postRemoveFromChannel4]), out4);
        });

        const postRemoveFromTeam1 = {type: PostTypes.REMOVE_FROM_TEAM, user_id: 'user_id_1'};
        const postRemoveFromTeam2 = {type: PostTypes.REMOVE_FROM_TEAM, user_id: 'user_id_2'};
        const postRemoveFromTeam3 = {type: PostTypes.REMOVE_FROM_TEAM, user_id: 'user_id_3'};
        const postRemoveFromTeam4 = {type: PostTypes.REMOVE_FROM_TEAM, user_id: 'user_id_4'};
        it('should match return for REMOVE_FROM_TEAM', () => {
            const out1 = {
                allUserIds: ['user_id_1'],
                messageData: [{postType: PostTypes.REMOVE_FROM_TEAM, userIds: ['user_id_1']}],
            };
            assert.deepEqual(combineUserActivitySystemPost([postRemoveFromTeam1]), out1);

            const out2 = {
                allUserIds: ['user_id_1', 'user_id_2'],
                messageData: [{postType: PostTypes.REMOVE_FROM_TEAM, userIds: ['user_id_1', 'user_id_2']}],
            };
            assert.deepEqual(combineUserActivitySystemPost([postRemoveFromTeam1, postRemoveFromTeam2]), out2);

            const out3 = {
                allUserIds: ['user_id_1', 'user_id_2', 'user_id_3'],
                messageData: [{postType: PostTypes.REMOVE_FROM_TEAM, userIds: ['user_id_1', 'user_id_2', 'user_id_3']}],
            };
            assert.deepEqual(combineUserActivitySystemPost([postRemoveFromTeam1, postRemoveFromTeam2, postRemoveFromTeam3]), out3);

            const out4 = {
                allUserIds: ['user_id_1', 'user_id_2', 'user_id_3', 'user_id_4'],
                messageData: [{postType: PostTypes.REMOVE_FROM_TEAM, userIds: ['user_id_1', 'user_id_2', 'user_id_3', 'user_id_4']}],
            };
            assert.deepEqual(combineUserActivitySystemPost([postRemoveFromTeam1, postRemoveFromTeam2, postRemoveFromTeam3, postRemoveFromTeam4]), out4);
        });

        it('should match return on combination', () => {
            const out1 = {
                allUserIds: ['added_user_id_1', 'added_user_id_2', 'user_id_1'],
                messageData: [
                    {actorId: 'user_id_1', postType: PostTypes.ADD_TO_TEAM, userIds: ['added_user_id_1', 'added_user_id_2']},
                    {actorId: 'user_id_1', postType: PostTypes.ADD_TO_CHANNEL, userIds: ['added_user_id_1', 'added_user_id_2']},
                ],
            };
            assert.deepEqual(combineUserActivitySystemPost([postAddToChannel1, postAddToChannel2, postAddToTeam1, postAddToTeam2]), out1);

            const out2 = {
                allUserIds: ['user_id_1', 'user_id_2'],
                messageData: [
                    {postType: PostTypes.JOIN_TEAM, userIds: ['user_id_1', 'user_id_2']},
                    {postType: PostTypes.JOIN_CHANNEL, userIds: ['user_id_1', 'user_id_2']},
                ],
            };
            assert.deepEqual(combineUserActivitySystemPost([postJoinChannel1, postJoinChannel2, postJoinTeam1, postJoinTeam2]), out2);

            const out3 = {
                allUserIds: ['user_id_1', 'user_id_2'],
                messageData: [
                    {postType: PostTypes.LEAVE_TEAM, userIds: ['user_id_1', 'user_id_2']},
                    {postType: PostTypes.LEAVE_CHANNEL, userIds: ['user_id_1', 'user_id_2']},
                ],
            };
            assert.deepEqual(combineUserActivitySystemPost([postLeaveChannel1, postLeaveChannel2, postLeaveTeam1, postLeaveTeam2]), out3);

            const out4 = {
                allUserIds: ['user_id_1', 'user_id_2'],
                messageData: [
                    {postType: PostTypes.REMOVE_FROM_TEAM, userIds: ['user_id_1', 'user_id_2']},
                    {postType: PostTypes.REMOVE_FROM_CHANNEL, userIds: ['user_id_1', 'user_id_2']},
                ],
            };
            assert.deepEqual(combineUserActivitySystemPost([postRemoveFromChannel1, postRemoveFromChannel2, postRemoveFromTeam1, postRemoveFromTeam2]), out4);

            const out5 = {
                allUserIds: ['added_user_id_1', 'added_user_id_2', 'user_id_1', 'user_id_2'],
                messageData: [
                    {postType: PostTypes.JOIN_CHANNEL, userIds: ['user_id_1', 'user_id_2']},
                    {actorId: 'user_id_1', postType: PostTypes.ADD_TO_CHANNEL, userIds: ['added_user_id_1', 'added_user_id_2']},
                    {postType: PostTypes.REMOVE_FROM_CHANNEL, userIds: ['user_id_1', 'user_id_2']},
                    {postType: PostTypes.LEAVE_CHANNEL, userIds: ['user_id_1', 'user_id_2']},
                ],
            };
            assert.deepEqual(combineUserActivitySystemPost([
                postAddToChannel1,
                postJoinChannel1,
                postLeaveChannel1,
                postRemoveFromChannel1,
                postAddToChannel2,
                postJoinChannel2,
                postLeaveChannel2,
                postRemoveFromChannel2,
            ]), out5);

            const out6 = {
                allUserIds: ['added_user_id_3', 'user_id_1', 'added_user_id_4', 'user_id_2', 'user_id_3', 'user_id_4'],
                messageData: [
                    {postType: PostTypes.JOIN_TEAM, userIds: ['user_id_3', 'user_id_4']},
                    {actorId: 'user_id_1', postType: PostTypes.ADD_TO_TEAM, userIds: ['added_user_id_3']},
                    {actorId: 'user_id_2', postType: PostTypes.ADD_TO_TEAM, userIds: ['added_user_id_4']},
                    {postType: PostTypes.REMOVE_FROM_TEAM, userIds: ['user_id_3', 'user_id_4']},
                    {postType: PostTypes.LEAVE_TEAM, userIds: ['user_id_3', 'user_id_4']},
                ],
            };
            assert.deepEqual(combineUserActivitySystemPost([
                postAddToTeam3,
                postJoinTeam3,
                postLeaveTeam3,
                postRemoveFromTeam3,
                postAddToTeam4,
                postJoinTeam4,
                postLeaveTeam4,
                postRemoveFromTeam4,
            ]), out6);

            const out7 = {
                allUserIds: ['added_user_id_3', 'added_user_id_1', 'added_user_id_2', 'user_id_1', 'added_user_id_4', 'user_id_2', 'user_id_3', 'user_id_4'],
                messageData: [
                    {postType: PostTypes.JOIN_TEAM, userIds: ['user_id_3', 'user_id_4', 'user_id_1', 'user_id_2']},
                    {actorId: 'user_id_1', postType: PostTypes.ADD_TO_TEAM, userIds: ['added_user_id_3', 'added_user_id_1', 'added_user_id_2']},
                    {actorId: 'user_id_2', postType: PostTypes.ADD_TO_TEAM, userIds: ['added_user_id_4']},
                    {postType: PostTypes.REMOVE_FROM_TEAM, userIds: ['user_id_3', 'user_id_4', 'user_id_1', 'user_id_2']},
                    {postType: PostTypes.LEAVE_TEAM, userIds: ['user_id_3', 'user_id_4', 'user_id_1', 'user_id_2']},
                    {postType: PostTypes.JOIN_CHANNEL, userIds: ['user_id_1', 'user_id_2', 'user_id_3', 'user_id_4']},
                    {actorId: 'user_id_1', postType: PostTypes.ADD_TO_CHANNEL, userIds: ['added_user_id_1', 'added_user_id_2', 'added_user_id_3']},
                    {actorId: 'user_id_2', postType: PostTypes.ADD_TO_CHANNEL, userIds: ['added_user_id_4']},
                    {postType: PostTypes.REMOVE_FROM_CHANNEL, userIds: ['user_id_1', 'user_id_2', 'user_id_3', 'user_id_4']},
                    {postType: PostTypes.LEAVE_CHANNEL, userIds: ['user_id_1', 'user_id_2', 'user_id_3', 'user_id_4']},
                ],
            };
            assert.deepEqual(combineUserActivitySystemPost([
                postAddToTeam3,
                postJoinTeam3,
                postLeaveTeam3,
                postRemoveFromTeam3,
                postAddToTeam4,
                postJoinTeam4,
                postLeaveTeam4,
                postRemoveFromTeam4,

                postAddToChannel1,
                postJoinChannel1,
                postLeaveChannel1,
                postRemoveFromChannel1,
                postAddToChannel2,
                postJoinChannel2,
                postLeaveChannel2,
                postRemoveFromChannel2,

                postAddToChannel3,
                postJoinChannel3,
                postLeaveChannel3,
                postRemoveFromChannel3,
                postAddToChannel4,
                postJoinChannel4,
                postLeaveChannel4,
                postRemoveFromChannel4,

                postAddToTeam1,
                postJoinTeam1,
                postLeaveTeam1,
                postRemoveFromTeam1,
                postAddToTeam2,
                postJoinTeam2,
                postLeaveTeam2,
                postRemoveFromTeam2,
            ]), out7);

            const out8 = {
                allUserIds: ['added_user_id_3', 'user_id_1', 'user_id_3', 'added_user_id_1'],
                messageData: [
                    {postType: PostTypes.JOIN_TEAM, userIds: ['user_id_3']},
                    {actorId: 'user_id_1', postType: PostTypes.ADD_TO_TEAM, userIds: ['added_user_id_3']},
                    {postType: PostTypes.REMOVE_FROM_TEAM, userIds: ['user_id_3']},
                    {postType: PostTypes.LEAVE_TEAM, userIds: ['user_id_3']},
                    {postType: PostTypes.JOIN_CHANNEL, userIds: ['user_id_1']},
                    {actorId: 'user_id_1', postType: PostTypes.ADD_TO_CHANNEL, userIds: ['added_user_id_1']},
                    {postType: PostTypes.REMOVE_FROM_CHANNEL, userIds: ['user_id_1']},
                    {postType: PostTypes.LEAVE_CHANNEL, userIds: ['user_id_1']},
                ],
            };
            assert.deepEqual(combineUserActivitySystemPost([
                postAddToTeam3,
                postAddToTeam3,
                postJoinTeam3,
                postJoinTeam3,
                postLeaveTeam3,
                postLeaveTeam3,
                postRemoveFromTeam3,
                postRemoveFromTeam3,

                postAddToChannel1,
                postAddToChannel1,
                postJoinChannel1,
                postJoinChannel1,
                postLeaveChannel1,
                postLeaveChannel1,
                postRemoveFromChannel1,
                postRemoveFromChannel1,
            ]), out8);
        });
    });

    describe('combineSystemPosts', () => {
        const postIdUA9 = '9';
        const postIdUA10 = '10';
        const postIdUA11 = '11';
        const postIdUA12 = '12';
        const postIdUA13 = '13';
        const postIdUA14 = '14';
        const postIdUA15 = '15';
        const postIdUA16 = '16';
        const postUA9 = {id: '9', message: 'added_user_id_10 added to channel by user_id_9', type: PostTypes.ADD_TO_CHANNEL, user_id: 'user_id_9', props: {addedUserId: 'added_user_id_10'}, state: '', create_at: 9, delete_at: 0};
        const postUA10 = {id: '10', message: 'user_id_11 joined the channel', type: PostTypes.JOIN_CHANNEL, user_id: 'user_id_11', state: '', create_at: 10, props: {}, delete_at: 0};
        const postUA11 = {id: '11', message: 'added_user_id_1 added to channel by user_id_1', type: PostTypes.ADD_TO_CHANNEL, user_id: 'user_id_1', props: {addedUserId: 'added_user_id_1'}, state: '', create_at: 11, delete_at: 0};
        const postUA12 = {id: '12', message: 'user_id_2 joined the channel', type: PostTypes.JOIN_CHANNEL, user_id: 'user_id_2', state: '', create_at: 12, props: {}, delete_at: 0};
        const postUA13 = {id: '13', message: 'user_id_13 removed from the channel', type: PostTypes.REMOVE_FROM_CHANNEL, state: '', create_at: 13, props: {removedUserId: 'user_id_13'}, delete_at: 0};
        const postUA14 = {id: '14', message: 'user_id_14 left the channel', type: PostTypes.LEAVE_CHANNEL, user_id: 'user_id_14', state: '', create_at: 14, props: {}, delete_at: 0};
        const postUA15 = {id: '15', message: 'user_id_3 left the channel', type: PostTypes.LEAVE_CHANNEL, user_id: 'user_id_3', state: '', create_at: 15, props: {}, delete_at: 0};
        const postUA16 = {id: '16', message: 'user_id_4 removed from the channel', type: PostTypes.REMOVE_FROM_CHANNEL, state: '', create_at: 16, props: {removedUserId: 'user_id_4'}, delete_at: 0};

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

        it('should combine consecutive user activity posts', () => {
            const out = combineSystemPosts([postIdUA12, postIdUA11], {[postIdUA11]: postUA11, [postIdUA12]: postUA12});
            const expectedUserActivityPosts = {
                allUserIds: ['user_id_2', 'added_user_id_1', 'user_id_1'],
                messageData: [
                    {postType: 'system_join_channel', userIds: ['user_id_2']},
                    {postType: 'system_add_to_channel', userIds: ['added_user_id_1'], actorId: 'user_id_1'},
                ],
            };

            assert.equal(out.postsForChannel.length, 1);
            assert.equal(Object.keys(out.nextPosts).length, 3);

            const combinedPostId = out.postsForChannel[0];
            assert.equal(out.nextPosts[combinedPostId].type, PostTypes.COMBINED_USER_ACTIVITY);
            assert.equal(out.nextPosts[combinedPostId].create_at, 11);
            assert.equal(out.nextPosts[combinedPostId].system_post_ids[0], '12');
            assert.equal(out.nextPosts[combinedPostId].system_post_ids[1], '11');
            assert.equal(out.nextPosts[combinedPostId].user_activity_posts[0], postUA12);
            assert.equal(out.nextPosts[combinedPostId].user_activity_posts[1], postUA11);
            assert.deepEqual(out.nextPosts[combinedPostId].props.user_activity, expectedUserActivityPosts);
            assert.deepEqual(out.nextPosts[combinedPostId].props.messages, [postUA12.message, postUA11.message]);
            assert.equal(out.nextPosts[combinedPostId].message, [postUA12.message, postUA11.message].join('\n'));
        });

        it('should combine consecutive user activity posts between posts', () => {
            const out = combineSystemPosts(
                [postId18, postId17, postIdUA16, postIdUA15, postId14, postId13, postIdUA12, postIdUA11, postId2, postId1],
                {
                    [postId1]: post1,
                    [postId2]: post2,
                    [postIdUA11]: postUA11,
                    [postIdUA12]: postUA12,
                    [postId13]: post13,
                    [postId14]: post14,
                    [postIdUA15]: postUA15,
                    [postIdUA16]: postUA16,
                    [postId17]: post17,
                    [postId18]: post18,
                }
            );

            assert.equal(out.postsForChannel.length, 8);
            assert.equal(Object.keys(out.nextPosts).length, 12);

            const expectedUserActivityPosts1 = {
                allUserIds: ['user_id_2', 'added_user_id_1', 'user_id_1'],
                messageData: [
                    {postType: 'system_join_channel', userIds: ['user_id_2']},
                    {postType: 'system_add_to_channel', userIds: ['added_user_id_1'], actorId: 'user_id_1'},
                ],
            };
            const combinedPostId1 = out.postsForChannel[5];
            assert.equal(out.nextPosts[combinedPostId1].type, PostTypes.COMBINED_USER_ACTIVITY);
            assert.equal(out.nextPosts[combinedPostId1].create_at, 11);
            assert.equal(out.nextPosts[combinedPostId1].system_post_ids[0], '12');
            assert.equal(out.nextPosts[combinedPostId1].system_post_ids[1], '11');
            assert.equal(out.nextPosts[combinedPostId1].user_activity_posts[0], postUA12);
            assert.equal(out.nextPosts[combinedPostId1].user_activity_posts[1], postUA11);
            assert.deepEqual(out.nextPosts[combinedPostId1].props.user_activity, expectedUserActivityPosts1);
            assert.deepEqual(out.nextPosts[combinedPostId1].props.messages, [postUA12.message, postUA11.message]);
            assert.equal(out.nextPosts[combinedPostId1].message, [postUA12.message, postUA11.message].join('\n'));

            const expectedUserActivityPosts2 = {
                allUserIds: ['user_id_4', 'user_id_3'],
                messageData: [
                    {postType: 'system_remove_from_channel', userIds: ['user_id_4']},
                    {postType: 'system_leave_channel', userIds: ['user_id_3']},
                ],
            };
            const combinedPostId2 = out.postsForChannel[2];
            assert.equal(out.nextPosts[combinedPostId2].type, PostTypes.COMBINED_USER_ACTIVITY);
            assert.equal(out.nextPosts[combinedPostId2].create_at, 15);
            assert.equal(out.nextPosts[combinedPostId2].system_post_ids[0], '16');
            assert.equal(out.nextPosts[combinedPostId2].system_post_ids[1], '15');
            assert.equal(out.nextPosts[combinedPostId2].user_activity_posts[0], postUA16);
            assert.equal(out.nextPosts[combinedPostId2].user_activity_posts[1], postUA15);
            assert.deepEqual(out.nextPosts[combinedPostId2].props.user_activity, expectedUserActivityPosts2);
            assert.deepEqual(out.nextPosts[combinedPostId2].props.messages, [postUA16.message, postUA15.message]);
            assert.equal(out.nextPosts[combinedPostId2].message, [postUA16.message, postUA15.message].join('\n'));
        });

        it('should combine system_combined_user_activity followed by consecutive user activity posts', () => {
            const combinedPost = {
                id: 'combined_post_id',
                root_id: '',
                type: 'system_combined_user_activity',
                message: 'user_id_9 joined the channel\nadded_user_id_10 added to channel by user_id_11',
                create_at: 9,
                delete_at: 0,
                user_activity_posts: [postUA10, postUA9],
                props: {
                    user_activity: {
                        allUserIds: ['user_id_9', 'added_user_id_10', 'user_id_11'],
                        messageData: [
                            {postType: 'system_join_channel', userIds: ['user_id_11']},
                            {postType: 'system_add_to_channel', userIds: ['added_user_id_10'], actorId: 'user_id_11'},
                        ],
                    },
                    messages: ['user_id_11 joined the channel', 'added_user_id_10 added to channel by user_id_9'],
                },
                system_post_ids: [postIdUA10, postIdUA9],
            };
            const out = combineSystemPosts(
                [postIdUA12, postIdUA11, combinedPost.id],
                {[combinedPost.id]: combinedPost, [postIdUA11]: postUA11, [postIdUA12]: postUA12}
            );
            const expectedUserActivityPosts = {
                allUserIds: ['user_id_2', 'user_id_11', 'added_user_id_1', 'user_id_1', 'added_user_id_10', 'user_id_9'],
                messageData: [
                    {postType: 'system_join_channel', userIds: ['user_id_2', 'user_id_11']},
                    {postType: 'system_add_to_channel', userIds: ['added_user_id_1'], actorId: 'user_id_1'},
                    {postType: 'system_add_to_channel', userIds: ['added_user_id_10'], actorId: 'user_id_9'},
                ],
            };
            assert.equal(out.postsForChannel.length, 1);
            assert.equal(Object.keys(out.nextPosts).length, 3);
            assert.equal(out.nextPosts[combinedPost.id].type, PostTypes.COMBINED_USER_ACTIVITY);
            assert.equal(out.nextPosts[combinedPost.id].create_at, 9);
            assert.equal(out.nextPosts[combinedPost.id].system_post_ids[0], '12');
            assert.equal(out.nextPosts[combinedPost.id].system_post_ids[1], '11');
            assert.equal(out.nextPosts[combinedPost.id].system_post_ids[2], '10');
            assert.equal(out.nextPosts[combinedPost.id].system_post_ids[3], '9');
            assert.deepEqual(out.nextPosts[combinedPost.id].props.user_activity, expectedUserActivityPosts);
            assert.deepEqual(out.nextPosts[combinedPost.id].props.messages, [postUA12.message, postUA11.message, postUA10.message, postUA9.message]);
            assert.equal(out.nextPosts[combinedPost.id].message, [postUA12.message, postUA11.message, postUA10.message, postUA9.message].join('\n'));
        });

        it('should combine consecutive user activity posts followed by system_combined_user_activity', () => {
            const combinedPost = {
                id: 'combined_post_id',
                root_id: '',
                type: 'system_combined_user_activity',
                message: '',
                create_at: 13,
                delete_at: 0,
                user_activity_posts: [postUA14, postUA13],
                props: {
                    user_activity: {
                        allUserIds: ['user_id_13', 'user_id_14'],
                        messageData: [
                            {postType: 'system_removed_channel', userIds: ['user_id_13']},
                            {postType: 'system_left_channel', userIds: ['user_id_14']},
                        ],
                    },
                    messages: ['user_id_14 left the channel', 'user_id_13 removed from the channel'],
                },
                system_post_ids: [postIdUA14, postIdUA13],
            };
            const out = combineSystemPosts(
                [combinedPost.id, postIdUA12, postIdUA11],
                {[combinedPost.id]: combinedPost, [postIdUA11]: postUA11, [postIdUA12]: postUA12}
            );
            const expectedUserActivityPosts = {
                allUserIds: ['user_id_14', 'user_id_13', 'user_id_2', 'added_user_id_1', 'user_id_1'],
                messageData: [
                    {postType: 'system_join_channel', userIds: ['user_id_2']},
                    {postType: 'system_add_to_channel', userIds: ['added_user_id_1'], actorId: 'user_id_1'},
                    {postType: 'system_remove_from_channel', userIds: ['user_id_13']},
                    {postType: 'system_leave_channel', userIds: ['user_id_14']},
                ],
            };

            assert.equal(out.postsForChannel.length, 1);
            assert.equal(Object.keys(out.nextPosts).length, 3);
            assert.equal(out.nextPosts[combinedPost.id].type, PostTypes.COMBINED_USER_ACTIVITY);
            assert.equal(out.nextPosts[combinedPost.id].create_at, 11);
            assert.equal(out.nextPosts[combinedPost.id].system_post_ids[0], '14');
            assert.equal(out.nextPosts[combinedPost.id].system_post_ids[1], '13');
            assert.equal(out.nextPosts[combinedPost.id].system_post_ids[2], '12');
            assert.equal(out.nextPosts[combinedPost.id].system_post_ids[3], '11');
            assert.deepEqual(out.nextPosts[combinedPost.id].props.user_activity, expectedUserActivityPosts);
            assert.deepEqual(out.nextPosts[combinedPost.id].props.messages, [postUA14.message, postUA13.message, postUA12.message, postUA11.message]);
            assert.equal(out.nextPosts[combinedPost.id].message, [postUA14.message, postUA13.message, postUA12.message, postUA11.message].join('\n'));
        });

        it('should combine consecutive combined and user activity posts between regular posts', () => {
            const out = combineSystemPosts(
                [postId22, postIdUA12, postIdUA11, postId2, postId1],
                {[postIdUA11]: postUA11, [postIdUA12]: postUA12, [postId1]: post1, [postId2]: post2, [postId22]: post22}
            );
            const expectedUserActivityPosts = {
                allUserIds: ['user_id_2', 'added_user_id_1', 'user_id_1'],
                messageData: [
                    {postType: 'system_join_channel', userIds: ['user_id_2']},
                    {postType: 'system_add_to_channel', userIds: ['added_user_id_1'], actorId: 'user_id_1'},
                ],
            };

            const combinedPostId = out.postsForChannel[1];
            assert.equal(out.postsForChannel.length, 4);
            assert.equal(Object.keys(out.nextPosts).length, 6);
            assert.equal(out.nextPosts[combinedPostId].type, PostTypes.COMBINED_USER_ACTIVITY);
            assert.equal(out.nextPosts[combinedPostId].create_at, 11);
            assert.equal(out.nextPosts[combinedPostId].system_post_ids[0], '12');
            assert.equal(out.nextPosts[combinedPostId].system_post_ids[1], '11');
            assert.equal(out.nextPosts[combinedPostId].user_activity_posts[0], postUA12);
            assert.equal(out.nextPosts[combinedPostId].user_activity_posts[1], postUA11);
            assert.deepEqual(out.nextPosts[combinedPostId].props.user_activity, expectedUserActivityPosts);
        });

        it('should combine system_combined_user_activity followed by consecutive user activity posts between regular posts', () => {
            const combinedPost = {
                id: 'combined_post_id',
                root_id: '',
                type: 'system_combined_user_activity',
                message: '',
                create_at: 9,
                delete_at: 0,
                user_activity_posts: [postUA10, postUA9],
                props: {
                    user_activity: {
                        allUserIds: ['user_id_9', 'added_user_id_10', 'user_id_11'],
                        messageData: [
                            {postType: 'system_join_channel', userIds: ['user_id_11']},
                            {postType: 'system_add_to_channel', userIds: ['added_user_id_10'], actorId: 'user_id_11'},
                        ],
                    },
                    messages: ['user_id_11 joined the channel', 'added_user_id_10 added to channel by user_id_9'],
                },
                system_post_ids: ['10', '9'],
            };

            const out = combineSystemPosts(
                [postId22, postIdUA12, postIdUA11, combinedPost.id, postId2, postId1],
                {[postId1]: post1, [postId2]: post2, [combinedPost.id]: combinedPost, [postIdUA11]: postUA11, [postIdUA12]: postUA12, [postId22]: post22}
            );
            const expectedUserActivityPosts = {
                allUserIds: ['user_id_2', 'user_id_11', 'added_user_id_1', 'user_id_1', 'added_user_id_10', 'user_id_9'],
                messageData: [
                    {postType: 'system_join_channel', userIds: ['user_id_2', 'user_id_11']},
                    {postType: 'system_add_to_channel', userIds: ['added_user_id_1'], actorId: 'user_id_1'},
                    {postType: 'system_add_to_channel', userIds: ['added_user_id_10'], actorId: 'user_id_9'},
                ],
            };

            assert.equal(out.postsForChannel.length, 4);
            assert.equal(Object.keys(out.nextPosts).length, 6);
            assert.equal(out.nextPosts[combinedPost.id].type, PostTypes.COMBINED_USER_ACTIVITY);
            assert.equal(out.nextPosts[combinedPost.id].create_at, 9);
            assert.equal(out.nextPosts[combinedPost.id].system_post_ids[0], '12');
            assert.equal(out.nextPosts[combinedPost.id].system_post_ids[1], '11');
            assert.equal(out.nextPosts[combinedPost.id].system_post_ids[2], '10');
            assert.equal(out.nextPosts[combinedPost.id].system_post_ids[3], '9');
            assert.deepEqual(out.nextPosts[combinedPost.id].props.user_activity, expectedUserActivityPosts);
        });
    });
});
