// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import assert from 'assert';
import nock from 'nock';
import {Server, WebSocket as MockWebSocket} from 'mock-socket';
import thunk from 'redux-thunk';
import configureMockStore from 'redux-mock-store';

import * as Actions from 'actions/websocket';
import * as ChannelActions from 'actions/channels';
import * as PostActions from 'actions/posts';
import * as TeamActions from 'actions/teams';
import * as UserActions from 'actions/users';

import {Client4} from 'client';
import {General, Posts, RequestStatus, WebsocketEvents} from 'constants';
import {
    PostTypes,
    TeamTypes,
    UserTypes,
    ChannelTypes,
    GeneralTypes,
} from 'action_types';
import TestHelper from 'test/test_helper';
import configureStore from 'test/test_store';

describe('Actions.Websocket', () => {
    let store;
    let mockServer;
    beforeAll(async () => {
        store = await configureStore();
        await TestHelper.initBasic(Client4);

        const connUrl = (Client4.getUrl() + '/api/v4/websocket').replace(/^http:/, 'ws:');
        mockServer = new Server(connUrl);
        return store.dispatch(Actions.init(
            'web',
            null,
            null,
            MockWebSocket
        ));
    });

    afterAll(async () => {
        Actions.close()();
        mockServer.stop();
        await TestHelper.tearDown();
    });

    it('WebSocket Connect', () => {
        const ws = store.getState().requests.general.websocket;
        assert.ok(ws.status === RequestStatus.SUCCESS);
    });

    it('Websocket Handle New Post', async () => {
        const channelId = TestHelper.basicChannel.id;

        nock(Client4.getBaseRoute()).
            post('/users/ids').
            reply(200, [TestHelper.basicUser.id]);

        nock(Client4.getBaseRoute()).
            post('/users/status/ids').
            reply(200, [{user_id: TestHelper.basicUser.id, status: 'online', manual: false, last_activity_at: 1507662212199}]);

        mockServer.emit('message', JSON.stringify({event: WebsocketEvents.POSTED, data: {channel_display_name: TestHelper.basicChannel.display_name, channel_name: TestHelper.basicChannel.name, channel_type: 'O', post: `{"id": "71k8gz5ompbpfkrzaxzodffj8w", "create_at": 1508245311774, "update_at": 1508245311774, "edit_at": 0, "delete_at": 0, "is_pinned": false, "user_id": "${TestHelper.basicUser.id}", "channel_id": "${channelId}", "root_id": "", "parent_id": "", "original_id": "", "message": "Unit Test", "type": "", "props": {}, "hashtags": "", "pending_post_id": "t36kso9nwtdhbm8dbkd6g4eeby: 1508245311749"}`, sender_name: TestHelper.basicUser.username, team_id: TestHelper.basicTeam.id}, broadcast: {omit_users: null, user_id: '', channel_id: channelId, team_id: ''}, seq: 2}));

        const entities = store.getState().entities;
        const {posts} = entities.posts;
        const postId = Object.keys(posts)[0];

        assert.ok(posts[postId].message.indexOf('Unit Test') > -1);
    });

    it('Websocket Handle Post Edited', async () => {
        const post = {id: '71k8gz5ompbpfkrzaxzodffj8w'};
        mockServer.emit('message', JSON.stringify({event: WebsocketEvents.POST_EDITED, data: {post: `{"id": "71k8gz5ompbpfkrzaxzodffj8w","create_at": 1508245311774,"update_at": 1508247709215,"edit_at": 1508247709215,"delete_at": 0,"is_pinned": false,"user_id": "${TestHelper.basicUser.id}","channel_id": "${TestHelper.basicChannel.id}","root_id": "","parent_id": "","original_id": "","message": "Unit Test (edited)","type": "","props": {},"hashtags": "","pending_post_id": ""}`}, broadcast: {omit_users: null, user_id: '', channel_id: '18k9ffsuci8xxm7ak68zfdyrce', team_id: ''}, seq: 2}));

        await TestHelper.wait(300);

        const {posts} = store.getState().entities.posts;
        assert.ok(posts);
        assert.ok(posts[post.id]);
        assert.ok(posts[post.id].message.indexOf('(edited)') > -1);
    });

    it('Websocket Handle Post Deleted', async () => {
        const post = TestHelper.fakePost();
        post.channel_id = TestHelper.basicChannel.id;

        post.id = '71k8gz5ompbpfkrzaxzodffj8w';
        store.dispatch(PostActions.receivedPost(post));
        mockServer.emit('message', JSON.stringify({event: WebsocketEvents.POST_DELETED, data: {post: `{"id": "71k8gz5ompbpfkrzaxzodffj8w","create_at": 1508245311774,"update_at": 1508247709215,"edit_at": 1508247709215,"delete_at": 0,"is_pinned": false,"user_id": "${TestHelper.basicUser.id}","channel_id": "${post.channel_id}","root_id": "","parent_id": "","original_id": "","message": "Unit Test","type": "","props": {},"hashtags": "","pending_post_id": ""}`}, broadcast: {omit_users: null, user_id: '', channel_id: '18k9ffsuci8xxm7ak68zfdyrce', team_id: ''}, seq: 7}));

        const entities = store.getState().entities;
        const {posts} = entities.posts;
        assert.strictEqual(posts[post.id].state, Posts.POST_DELETED);
    });

    it('Websocket Handle Reaction Added to Post', (done) => {
        async function test() {
            const emoji = '+1';
            const post = {id: 'w7yo9377zbfi9mgiq5gbfpn3ha'};
            mockServer.emit('message', JSON.stringify({event: WebsocketEvents.REACTION_ADDED, data: {reaction: `{"user_id":"${TestHelper.basicUser.id}","post_id":"w7yo9377zbfi9mgiq5gbfpn3ha","emoji_name":"${emoji}","create_at":1508249125852}`}, broadcast: {omit_users: null, user_id: '', channel_id: TestHelper.basicChannel.id, team_id: ''}, seq: 12}));

            setTimeout(() => {
                const nextEntities = store.getState().entities;
                const {reactions} = nextEntities.posts;
                const reactionsForPost = reactions[post.id];

                assert.ok(reactionsForPost.hasOwnProperty(`${TestHelper.basicUser.id}-${emoji}`));
                done();
            }, 500);
        }

        test();
    });

    it('Websocket Handle Reaction Removed from Post', (done) => {
        async function test() {
            const emoji = '+1';
            const post = {id: 'w7yo9377zbfi9mgiq5gbfpn3ha'};
            store.dispatch({type: PostTypes.RECEIVED_REACTION, data: {user_id: TestHelper.basicUser.id, post_id: post.id, emoji_name: '+1'}});
            mockServer.emit('message', JSON.stringify({event: WebsocketEvents.REACTION_REMOVED, data: {reaction: `{"user_id":"${TestHelper.basicUser.id}","post_id":"w7yo9377zbfi9mgiq5gbfpn3ha","emoji_name":"+1","create_at":0}`}, broadcast: {omit_users: null, user_id: '', channel_id: TestHelper.basicChannel.id, team_id: ''}, seq: 18}));

            function checkForRemove() {
                return new Promise((resolve) => {
                    setTimeout(() => {
                        const nextEntities = store.getState().entities;
                        const {reactions} = nextEntities.posts;
                        const reactionsForPost = reactions[post.id];

                        assert.ok(!reactionsForPost.hasOwnProperty(`${TestHelper.basicUser.id}-${emoji}`));
                        resolve();
                        done();
                    }, 500);
                });
            }

            await checkForRemove();
        }

        test();
    });

    // If we move this test lower it will fail cause of a permissions issue
    it('Websocket handle team updated', (done) => {
        async function test() {
            const team = {id: '55pfercbm7bsmd11p5cjpgsbwr'};
            mockServer.emit('message', JSON.stringify({event: WebsocketEvents.UPDATE_TEAM, data: {team: `{"id":"55pfercbm7bsmd11p5cjpgsbwr","create_at":1495553950859,"update_at":1508250370054,"delete_at":0,"display_name":"${TestHelper.basicTeam.display_name}","name":"${TestHelper.basicTeam.name}","description":"description","email":"","type":"O","company_name":"","allowed_domains":"","invite_id":"m93f54fu5bfntewp8ctwonw19w","allow_open_invite":true}`}, broadcast: {omit_users: null, user_id: '', channel_id: '', team_id: ''}, seq: 26}));

            setTimeout(() => {
                const entities = store.getState().entities;
                const {teams} = entities.teams;
                const updated = teams[team.id];
                assert.ok(updated);
                assert.strictEqual(updated.allow_open_invite, true);
                done();
            }, 500);
        }

        test();
    });

    it('Websocket handle team patched', (done) => {
        async function test() {
            const team = {id: '55pfercbm7bsmd11p5cjpgsbwr'};
            mockServer.emit('message', JSON.stringify({event: WebsocketEvents.UPDATE_TEAM, data: {team: `{"id":"55pfercbm7bsmd11p5cjpgsbwr","create_at":1495553950859,"update_at":1508250370054,"delete_at":0,"display_name":"${TestHelper.basicTeam.display_name}","name":"${TestHelper.basicTeam.name}","description":"description","email":"","type":"O","company_name":"","allowed_domains":"","invite_id":"m93f54fu5bfntewp8ctwonw19w","allow_open_invite":true}`}, broadcast: {omit_users: null, user_id: '', channel_id: '', team_id: ''}, seq: 26}));

            setTimeout(() => {
                const entities = store.getState().entities;
                const {teams} = entities.teams;
                const updated = teams[team.id];
                assert.ok(updated);
                assert.strictEqual(updated.allow_open_invite, true);
                done();
            }, 500);
        }

        test();
    });

    it('WebSocket Leave Team', async () => {
        const team = TestHelper.basicTeam;
        store.dispatch({type: UserTypes.RECEIVED_ME, data: TestHelper.basicUser});
        store.dispatch({type: TeamTypes.RECEIVED_TEAM, data: TestHelper.basicTeam});
        store.dispatch({type: TeamTypes.RECEIVED_MY_TEAM_MEMBER, data: TestHelper.basicTeamMember});
        mockServer.emit('message', JSON.stringify({event: WebsocketEvents.LEAVE_TEAM, data: {team_id: team.id, user_id: TestHelper.basicUser.id}, broadcast: {omit_users: null, user_id: '', channel_id: '', team_id: team.id}, seq: 35}));

        const {myMembers} = store.getState().entities.teams;
        assert.ifError(myMembers[team.id]);
    });

    it('Websocket Handle User Added', async () => {
        const user = {...TestHelper.fakeUser(), id: TestHelper.generateId()};
        store.dispatch({type: UserTypes.RECEIVED_PROFILE_IN_CHANNEL, data: {id: TestHelper.basicChannel.id, user_id: user.id}});
        mockServer.emit('message', JSON.stringify({event: WebsocketEvents.USER_ADDED, data: {team_id: TestHelper.basicTeam.id, user_id: user.id}, broadcast: {omit_users: null, user_id: '', channel_id: TestHelper.basicChannel.id, team_id: ''}, seq: 42}));

        const entities = store.getState().entities;
        const profilesInChannel = entities.users.profilesInChannel;
        assert.ok(profilesInChannel[TestHelper.basicChannel.id].has(user.id));
    });

    it('Websocket Handle User Removed', async () => {
        const user = {...TestHelper.fakeUser(), id: TestHelper.generateId()};
        store.dispatch({type: UserTypes.RECEIVED_PROFILE_NOT_IN_CHANNEL, data: {id: TestHelper.basicChannel.id, user_id: user.id}});
        mockServer.emit('message', JSON.stringify({event: WebsocketEvents.USER_REMOVED, data: {remover_id: TestHelper.basicUser.id, user_id: user.id}, broadcast: {omit_users: null, user_id: '', channel_id: TestHelper.basicChannel.id, team_id: ''}, seq: 42}));

        const state = store.getState();
        const entities = state.entities;
        const profilesNotInChannel = entities.users.profilesNotInChannel;

        assert.ok(profilesNotInChannel[TestHelper.basicChannel.id].has(user.id));
    });

    it('Websocket Handle User Updated', async () => {
        const user = {...TestHelper.fakeUser(), id: TestHelper.generateId()};
        mockServer.emit('message', JSON.stringify({event: WebsocketEvents.USER_UPDATED, data: {user: {id: user.id, create_at: 1495570297229, update_at: 1508253268652, delete_at: 0, username: 'tim', auth_data: '', auth_service: '', email: 'tim@bladekick.com', nickname: '', first_name: 'tester4', last_name: '', position: '', roles: 'system_user', locale: 'en'}}, broadcast: {omit_users: null, user_id: '', channel_id: '', team_id: ''}, seq: 53}));

        store.subscribe(() => {
            const state = store.getState();
            const entities = state.entities;
            const profiles = entities.users.profiles;

            assert.strictEqual(profiles[user.id].first_name, 'tester4');
        });
    });

    it('Websocket Handle Channel Created', (done) => {
        async function test() {
            const channel = {id: '95tpi6f4apy39k6zxuo3msxzhy', display_name: 'test'};
            store.dispatch({type: ChannelTypes.RECEIVED_CHANNEL, data: channel});
            mockServer.emit('message', JSON.stringify({event: WebsocketEvents.CHANNEL_CREATED, data: {channel_id: '95tpi6f4apy39k6zxuo3msxzhy', team_id: TestHelper.basicTeam.id}, broadcast: {omit_users: null, user_id: 't36kso9nwtdhbm8dbkd6g4eeby', channel_id: '', team_id: ''}, seq: 57}));

            setTimeout(() => {
                const state = store.getState();
                const entities = state.entities;
                const {channels} = entities.channels;

                assert.ok(channels[channel.id]);
                done();
            }, 1000);
        }

        test();
    });

    it('Websocket Handle Channel Updated', async () => {
        const channelName = 'Test name';
        const channelId = TestHelper.basicChannel.id;

        mockServer.emit('message', JSON.stringify({event: WebsocketEvents.CHANNEL_UPDATED, data: {channel: `{"id":"${channelId}","create_at":1508253647983,"update_at":1508254198797,"delete_at":0,"team_id":"55pfercbm7bsmd11p5cjpgsbwr","type":"O","display_name":"${channelName}","name":"${TestHelper.basicChannel.name}","header":"header","purpose":"","last_post_at":1508253648004,"total_msg_count":0,"extra_update_at":1508253648001,"creator_id":"${TestHelper.basicUser.id}"}`}, broadcast: {omit_users: null, user_id: '', channel_id: channelId, team_id: ''}, seq: 62}));

        await TestHelper.wait(300);

        const state = store.getState();
        const entities = state.entities;
        const {channels} = entities.channels;

        assert.strictEqual(channels[channelId].display_name, channelName);
    });

    it('Websocket Handle Channel Converted', async () => {
        const channelType = 'P';
        const channelId = TestHelper.basicChannel.id;

        nock(Client4.getChannelsRoute()).
            get(`/${TestHelper.basicChannel.id}`).
            reply(200, {...TestHelper.basicChannel, type: channelType});

        mockServer.emit('message', JSON.stringify({
            event: WebsocketEvents.CHANNEL_CONVERTED,
            data: {channel_id: channelId},
            broadcast: {omit_users: null, user_id: '', channel_id: '', team_id: TestHelper.basicTeam.id},
            seq: 65},
        ));

        store.dispatch({type: ChannelTypes.RECEIVED_CHANNEL, data: {...TestHelper.basicChannel, type: channelType}});

        await TestHelper.wait(300);

        const state = store.getState();
        const entities = state.entities;
        const {channels} = entities.channels;

        assert.strictEqual(channels[channelId].type, channelType);
    });

    it('Websocket Handle Channel Deleted', (done) => {
        async function test() {
            await store.dispatch(TeamActions.selectTeam(TestHelper.basicTeam));
            await store.dispatch(ChannelActions.selectChannel(TestHelper.basicChannel.id));

            store.dispatch({type: ChannelTypes.RECEIVED_CHANNEL, data: {id: TestHelper.generateId(), name: General.DEFAULT_CHANNEL, team_id: TestHelper.basicTeam.id, display_name: General.DEFAULT_CHANNEL}});
            store.dispatch({type: ChannelTypes.RECEIVED_CHANNEL, data: TestHelper.basicChannel});

            nock(Client4.getUserRoute('me')).
                get(`/teams/${TestHelper.basicTeam.id}/channels/members`).
                reply(201, [{user_id: TestHelper.basicUser.id, channel_id: TestHelper.basicChannel.id}]);

            mockServer.emit('message', JSON.stringify({event: WebsocketEvents.CHANNEL_DELETED, data: {channel_id: TestHelper.basicChannel.id}, broadcast: {omit_users: null, user_id: '', channel_id: '', team_id: TestHelper.basicTeam.id}, seq: 68}));

            setTimeout(() => {
                const state = store.getState();
                const entities = state.entities;
                const {channels, currentChannelId} = entities.channels;

                assert.ok(channels[currentChannelId].name === General.DEFAULT_CHANNEL);
                done();
            }, 500);
        }

        test();
    });

    it('Websocket Handle Direct Channel', (done) => {
        async function test() {
            const channel = {id: TestHelper.generateId(), name: TestHelper.basicUser.id + '__' + TestHelper.generateId(), type: 'D'};

            nock(Client4.getChannelsRoute()).
                get(`/${channel.id}/members/me`).
                reply(201, {user_id: TestHelper.basicUser.id, channel_id: channel.id});

            mockServer.emit('message', JSON.stringify({event: WebsocketEvents.DIRECT_ADDED, data: {teammate_id: 'btaxe5msnpnqurayosn5p8twuw'}, broadcast: {omit_users: null, user_id: '', channel_id: channel.id, team_id: ''}, seq: 2}));
            store.dispatch({type: ChannelTypes.RECEIVED_CHANNEL, data: channel});

            setTimeout(() => {
                const {channels} = store.getState().entities.channels;
                assert.ok(Object.keys(channels).length);
                done();
            }, 500);
        }

        test();
    });

    it('Websocket handle user added to team', (done) => {
        async function test() {
            const team = {id: TestHelper.generateId()};

            nock(Client4.getTeamRoute(team.id)).
                get('').
                reply(200, team);

            nock(Client4.getUserRoute('me')).
                get('/teams/members').
                reply(200, [{team_id: team.id, user_id: TestHelper.basicUser.id}]);

            nock(Client4.getUserRoute('me')).
                get('/teams/unread').
                reply(200, [{team_id: team.id, msg_count: 0, mention_count: 0}]);

            mockServer.emit('message', JSON.stringify({event: WebsocketEvents.ADDED_TO_TEAM, data: {team_id: team.id, user_id: TestHelper.basicUser.id}, broadcast: {omit_users: null, user_id: TestHelper.basicUser.id, channel_id: '', team_id: ''}, seq: 2}));

            setTimeout(() => {
                const {teams, myMembers} = store.getState().entities.teams;
                assert.ok(teams[team.id]);
                assert.ok(myMembers[team.id]);

                const member = myMembers[team.id];
                assert.ok(member.hasOwnProperty('mention_count'));
                done();
            }, 500);
        }

        test();
    });

    it('Websocket handle emoji added', (done) => {
        async function test() {
            const created = {id: '1mmgakhhupfgfm8oug6pooc5no'};
            mockServer.emit('message', JSON.stringify({event: WebsocketEvents.EMOJI_ADDED, data: {emoji: `{"id":"1mmgakhhupfgfm8oug6pooc5no","create_at":1508263941321,"update_at":1508263941321,"delete_at":0,"creator_id":"t36kso9nwtdhbm8dbkd6g4eeby","name":"${TestHelper.generateId()}"}`}, broadcast: {omit_users: null, user_id: '', channel_id: '', team_id: ''}, seq: 2}));

            await TestHelper.wait(200);

            const state = store.getState();

            const emojis = state.entities.emojis.customEmoji;
            assert.ok(emojis);
            assert.ok(emojis[created.id]);
            done();
        }

        test();
    });

    it('handle license changed', (done) => {
        async function test() {
            mockServer.emit('message', JSON.stringify({event: WebsocketEvents.LICENSE_CHANGED, data: {license: {IsLicensed: 'true'}}}));

            await TestHelper.wait(200);

            const state = store.getState();

            const license = state.entities.general.license;
            assert.ok(license);
            assert.ok(license.IsLicensed);
            done();
        }

        test();
    });

    it('handle config changed', (done) => {
        async function test() {
            mockServer.emit('message', JSON.stringify({event: WebsocketEvents.CONFIG_CHANGED, data: {config: {EnableCustomEmoji: 'true', EnableLinkPreviews: 'false'}}}));

            await TestHelper.wait(200);

            const state = store.getState();

            const config = state.entities.general.config;
            assert.ok(config);
            assert.ok(config.EnableCustomEmoji === 'true');
            assert.ok(config.EnableLinkPreviews === 'false');
            done();
        }

        test();
    });

    it('handle open dialog', (done) => {
        async function test() {
            mockServer.emit('message', JSON.stringify({event: WebsocketEvents.OPEN_DIALOG, data: {dialog: JSON.stringify({url: 'someurl', trigger_id: 'sometriggerid', dialog: {}})}}));

            await TestHelper.wait(200);

            const state = store.getState();

            const dialog = state.entities.integrations.dialog;
            assert.ok(dialog);
            assert.ok(dialog.url === 'someurl');
            assert.ok(dialog.trigger_id === 'sometriggerid');
            assert.ok(dialog.dialog);
            done();
        }

        test();
    });
});

describe('Actions.Websocket doReconnect', () => {
    const mockStore = configureMockStore([thunk]);

    const currentTeamId = 'team-id';
    const currentUserId = 'user-id';
    const currentChannelId = 'channel-id';

    const initialState = {
        entities: {
            teams: {
                currentTeamId,
                myMembers: {
                    [currentTeamId]: [currentUserId],
                },
                teams: {
                    [currentTeamId]: {
                        id: currentTeamId,
                    },
                },
            },
            channels: {
                currentChannelId,
            },
            users: {
                currentUserId,
            },
            preferences: {
                myPreferences: {},
            },
        },
    };

    const MOCK_GET_STATUSES_BY_IDS = 'MOCK_GET_STATUSES_BY_IDS';
    const MOCK_MY_TEAM_UNREADS = 'MOCK_MY_TEAM_UNREADS';
    const MOCK_GET_MY_TEAMS = 'MOCK_GET_MY_TEAMS';
    const MOCK_GET_MY_TEAM_MEMBERS = 'MOCK_GET_MY_TEAM_MEMBERS';
    const MOCK_GET_POSTS = 'MOCK_GET_POSTS';
    const MOCK_CHANNELS_REQUEST = 'MOCK_CHANNELS_REQUEST';

    beforeAll(() => {
        UserActions.getStatusesByIds = jest.fn().mockReturnValue({
            type: MOCK_GET_STATUSES_BY_IDS,
        });
        nock(Client4.getBaseRoute()).
            get('/status/ids').
            reply(200, []);

        TeamActions.getMyTeamUnreads = jest.fn().mockReturnValue({
            type: MOCK_MY_TEAM_UNREADS,
        });
        nock(Client4.getBaseRoute()).
            get('/users/me/teams/unread').
            reply(200, []);

        TeamActions.getMyTeams = jest.fn().mockReturnValue({
            type: MOCK_GET_MY_TEAMS,
        });
        nock(Client4.getBaseRoute()).
            get('/users/me/teams').
            reply(200, []);

        TeamActions.getMyTeamMembers = jest.fn().mockReturnValue({
            type: MOCK_GET_MY_TEAM_MEMBERS,
        });
        nock(Client4.getBaseRoute()).
            get(`/users/me/teams/${currentTeamId}/channels/members`).
            reply(200, []);

        PostActions.getPosts = jest.fn().mockReturnValue({
            type: MOCK_GET_POSTS,
        });
        nock(Client4.getBaseRoute()).
            get(`/channels/${currentChannelId}/posts`).
            reply(200, []);

        ChannelActions.fetchMyChannelsAndMembers = jest.fn().mockReturnValue({
            type: MOCK_CHANNELS_REQUEST,
        });
        nock(Client4.getBaseRoute()).
            get(`/users/me/teams/${currentTeamId}/channels`).
            reply(200, []);
        nock(Client4.getBaseRoute()).
            get(`/users/me/teams/${currentTeamId}/channels/members`).
            reply(200, []);
    });

    it('handle doReconnect', async () => {
        const testStore = await mockStore(initialState);

        const expectedActions = [
            {type: MOCK_GET_STATUSES_BY_IDS},
            {type: MOCK_MY_TEAM_UNREADS},
            {type: MOCK_GET_MY_TEAMS},
            {type: MOCK_GET_MY_TEAM_MEMBERS},
            {type: MOCK_GET_POSTS},
            {type: MOCK_CHANNELS_REQUEST},
            {type: GeneralTypes.WEBSOCKET_SUCCESS},
        ];

        await testStore.dispatch(Actions.doReconnect());

        expect(testStore.getActions()).toEqual(expect.arrayContaining(expectedActions));
    });

    it('handle doReconnect after user left current team', async () => {
        const state = {...initialState};
        state.entities.teams.myMembers = {};
        const testStore = await mockStore(state);

        const expectedActions = [
            {type: MOCK_GET_STATUSES_BY_IDS},
            {type: MOCK_MY_TEAM_UNREADS},
            {type: MOCK_GET_MY_TEAMS},
            {type: MOCK_GET_MY_TEAM_MEMBERS},
            {type: TeamTypes.LEAVE_TEAM, data: initialState.entities.teams.teams[currentTeamId]},
            {type: GeneralTypes.WEBSOCKET_SUCCESS},
        ];

        const expectedMissingActions = [
            {type: MOCK_GET_POSTS},
            {type: MOCK_CHANNELS_REQUEST},
        ];

        await testStore.dispatch(Actions.doReconnect());

        const actions = testStore.getActions();
        expect(actions).toEqual(expect.arrayContaining(expectedActions));
        expect(actions).not.toEqual(expect.arrayContaining(expectedMissingActions));
    });
});
