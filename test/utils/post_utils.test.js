// Copyright (c) 2017-present Mattermost, Inc. All Rights Reserved.
// See License.txt for license information.

import assert from 'assert';

import {PostTypes} from 'constants/posts';
import {Permissions} from 'constants';

import {shouldFilterPost, canEditPost} from 'utils/post_utils';

describe('PostUtils', () => {
    describe('shouldFilterPost', () => {
        it('show join/leave posts', () => {
            const options = {showJoinLeave: true};

            assert.equal(shouldFilterPost({type: ''}, options), false);
            assert.equal(shouldFilterPost({type: PostTypes.CHANNEL_DELETED}, options), false);
            assert.equal(shouldFilterPost({type: PostTypes.DISPLAYNAME_CHANGE}, options), false);
            assert.equal(shouldFilterPost({type: PostTypes.EPHEMERAL}, options), false);
            assert.equal(shouldFilterPost({type: PostTypes.HEADER_CHANGE}, options), false);
            assert.equal(shouldFilterPost({type: PostTypes.PURPOSE_CHANGE}, options), false);

            assert.equal(shouldFilterPost({type: PostTypes.JOIN_LEAVE}, options), false);
            assert.equal(shouldFilterPost({type: PostTypes.JOIN_CHANNEL}, options), false);
            assert.equal(shouldFilterPost({type: PostTypes.LEAVE_CHANNEL}, options), false);
            assert.equal(shouldFilterPost({type: PostTypes.ADD_REMOVE}, options), false);
            assert.equal(shouldFilterPost({type: PostTypes.ADD_TO_CHANNEL}, options), false);
            assert.equal(shouldFilterPost({type: PostTypes.REMOVE_FROM_CHANNEL}, options), false);

            assert.equal(shouldFilterPost({type: PostTypes.JOIN_TEAM}, options), false);
            assert.equal(shouldFilterPost({type: PostTypes.LEAVE_TEAM}, options), false);
            assert.equal(shouldFilterPost({type: PostTypes.ADD_TO_TEAM}, options), false);
            assert.equal(shouldFilterPost({type: PostTypes.REMOVE_FROM_TEAM}, options), false);
        });

        it('show join/leave posts', () => {
            const options = {showJoinLeave: false};

            assert.equal(shouldFilterPost({type: ''}, options), false);
            assert.equal(shouldFilterPost({type: PostTypes.CHANNEL_DELETED}, options), false);
            assert.equal(shouldFilterPost({type: PostTypes.DISPLAYNAME_CHANGE}, options), false);
            assert.equal(shouldFilterPost({type: PostTypes.EPHEMERAL}, options), false);
            assert.equal(shouldFilterPost({type: PostTypes.HEADER_CHANGE}, options), false);
            assert.equal(shouldFilterPost({type: PostTypes.PURPOSE_CHANGE}, options), false);

            assert.equal(shouldFilterPost({type: PostTypes.JOIN_LEAVE}, options), true);
            assert.equal(shouldFilterPost({type: PostTypes.JOIN_CHANNEL}, options), true);
            assert.equal(shouldFilterPost({type: PostTypes.LEAVE_CHANNEL}, options), true);
            assert.equal(shouldFilterPost({type: PostTypes.ADD_REMOVE}, options), true);
            assert.equal(shouldFilterPost({type: PostTypes.ADD_TO_CHANNEL}, options), true);
            assert.equal(shouldFilterPost({type: PostTypes.REMOVE_FROM_CHANNEL}, options), true);

            assert.equal(shouldFilterPost({type: PostTypes.JOIN_TEAM}, options), true);
            assert.equal(shouldFilterPost({type: PostTypes.LEAVE_TEAM}, options), true);
            assert.equal(shouldFilterPost({type: PostTypes.ADD_TO_TEAM}, options), true);
            assert.equal(shouldFilterPost({type: PostTypes.REMOVE_FROM_TEAM}, options), true);
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
                        serverVersion: '4.3.0'
                    }
                }
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
                        serverVersion: '4.8.0'
                    },
                    users: {
                        currentUserId: userId,
                        profiles: {
                            'user-id': {roles: 'system_role'}
                        }
                    },
                    teams: {
                        currentTeamId: teamId,
                        myMembers: {
                            'team-id': {roles: 'team_role'}
                        }
                    },
                    channels: {
                        currentChannelId: channelId,
                        myMembers: {
                            'channel-id': {roles: 'channel_role'}
                        }
                    },
                    roles: {
                        roles: {
                            system_role: {
                                permissions: []
                            },
                            team_role: {
                                permissions: []
                            },
                            channel_role: {
                                permissions: []
                            }
                        }
                    }
                }
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
                    channel_role: {permissions: []}
                }
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
                    channel_role: {permissions: []}
                }
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
                    channel_role: {permissions: [Permissions.EDIT_POST]}
                }
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
                    channel_role: {permissions: []}
                }
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
                    channel_role: {permissions: []}
                }
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
                    channel_role: {permissions: [Permissions.EDIT_OTHERS_POSTS]}
                }
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
                    channel_role: {permissions: []}
                }
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
                    channel_role: {permissions: []}
                }
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
                    channel_role: {permissions: [Permissions.EDIT_OTHERS_POSTS, Permissions.EDIT_POST]}
                }
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
