// Copyright (c) 2017-present Mattermost, Inc. All Rights Reserved.
// See License.txt for license information.

import assert from 'assert';

import {PostTypes} from 'constants/posts';
import {Permissions} from 'constants';

import {shouldFilterJoinLeavePost, canEditPost} from 'utils/post_utils';

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
});
