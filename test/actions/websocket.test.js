// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import fs from 'fs';
import assert from 'assert';
import nock from 'nock';
import {Server, WebSocket as MockWebSocket} from 'mock-socket';

import * as Actions from 'actions/websocket';
import * as ChannelActions from 'actions/channels';
import * as TeamActions from 'actions/teams';
import * as GeneralActions from 'actions/general';

import {Client4} from 'client';
import {General, Posts, RequestStatus, WebsocketEvents} from 'constants';
import {PostTypes, TeamTypes, UserTypes, ChannelTypes} from 'action_types';
import TestHelper from 'test/test_helper';
import configureStore from 'test/test_store';

const webSocketConnector = TestHelper.isLiveServer() ? require('ws') : MockWebSocket;

describe('Actions.Websocket', () => {
    let store;
    let mockServer;
    before(async () => {
        store = await configureStore();
        await TestHelper.initBasic(Client4);

        const connUrl = (Client4.getUrl() + '/api/v4/websocket').replace(/^http:/, 'ws:');
        mockServer = new Server(connUrl);
        return store.dispatch(Actions.init(
            'web',
            null,
            null,
            webSocketConnector
        ));
    });

    after(async () => {
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

        if (TestHelper.isLiveServer()) {
            const post = {...TestHelper.fakePost(), channel_id: TestHelper.basicChannel.id};
            const client = TestHelper.createClient4();
            const user = await client.createUser(
                TestHelper.fakeUser(),
                null,
                null,
                TestHelper.basicTeam.invite_id
            );
            await client.login(user.email, 'password1');

            await Client4.addToChannel(user.id, TestHelper.basicChannel.id);

            await client.createPost(post);
        } else {
            nock(Client4.getBaseRoute()).
                post('/users/ids').
                reply(200, [TestHelper.basicUser.id]);

            nock(Client4.getBaseRoute()).
                post('/users/status/ids').
                reply(200, [{user_id: TestHelper.basicUser.id, status: 'online', manual: false, last_activity_at: 1507662212199}]);

            mockServer.emit('message', JSON.stringify({event: WebsocketEvents.POSTED, data: {channel_display_name: TestHelper.basicChannel.display_name, channel_name: TestHelper.basicChannel.name, channel_type: 'O', post: `{"id": "71k8gz5ompbpfkrzaxzodffj8w", "create_at": 1508245311774, "update_at": 1508245311774, "edit_at": 0, "delete_at": 0, "is_pinned": false, "user_id": "${TestHelper.basicUser.id}", "channel_id": "${channelId}", "root_id": "", "parent_id": "", "original_id": "", "message": "Unit Test", "type": "", "props": {}, "hashtags": "", "pending_post_id": "t36kso9nwtdhbm8dbkd6g4eeby: 1508245311749"}`, sender_name: TestHelper.basicUser.username, team_id: TestHelper.basicTeam.id}, broadcast: {omit_users: null, user_id: '', channel_id: channelId, team_id: ''}, seq: 2}));
        }

        const entities = store.getState().entities;
        const {posts, postsInChannel} = entities.posts;
        const postId = postsInChannel[channelId][0];

        assert.ok(posts[postId].message.indexOf('Unit Test') > -1);
    });

    it('Websocket Handle Post Edited', async () => {
        let post;
        if (TestHelper.isLiveServer()) {
            post = {...TestHelper.fakePost(), channel_id: TestHelper.basicChannel.id};
            const client = TestHelper.createClient4();
            const user = await client.createUser(
                TestHelper.fakeUser(),
                null,
                null,
                TestHelper.basicTeam.invite_id
            );

            await Client4.addToChannel(user.id, TestHelper.basicChannel.id);
            await client.login(user.email, 'password1');

            post = await client.createPost(post);
            post.message += ' (edited)';

            await client.updatePost(post);
        } else {
            post = {id: '71k8gz5ompbpfkrzaxzodffj8w'};
            mockServer.emit('message', JSON.stringify({event: WebsocketEvents.POST_EDITED, data: {post: `{"id": "71k8gz5ompbpfkrzaxzodffj8w","create_at": 1508245311774,"update_at": 1508247709215,"edit_at": 1508247709215,"delete_at": 0,"is_pinned": false,"user_id": "${TestHelper.basicUser.id}","channel_id": "${TestHelper.basicChannel.id}","root_id": "","parent_id": "","original_id": "","message": "Unit Test (edited)","type": "","props": {},"hashtags": "","pending_post_id": ""}`}, broadcast: {omit_users: null, user_id: '', channel_id: '18k9ffsuci8xxm7ak68zfdyrce', team_id: ''}, seq: 2}));
        }

        await TestHelper.wait(300);

        const {posts} = store.getState().entities.posts;
        assert.ok(posts);
        assert.ok(posts[post.id]);
        assert.ok(posts[post.id].message.indexOf('(edited)') > -1);
    });

    it('Websocket Handle Post Deleted', async () => {
        let post = TestHelper.fakePost();
        post.channel_id = TestHelper.basicChannel.id;

        if (TestHelper.isLiveServer()) {
            const client = TestHelper.createClient4();
            const user = await client.createUser(
                TestHelper.fakeUser(),
                null,
                null,
                TestHelper.basicTeam.invite_id
            );

            await Client4.addToChannel(user.id, TestHelper.basicChannel.id);
            await client.login(user.email, 'password1');
            post = await client.createPost(post);

            await client.deletePost(post.id);
        } else {
            post.id = '71k8gz5ompbpfkrzaxzodffj8w';
            store.dispatch({type: PostTypes.RECEIVED_POST, data: post});
            mockServer.emit('message', JSON.stringify({event: WebsocketEvents.POST_DELETED, data: {post: `{"id": "71k8gz5ompbpfkrzaxzodffj8w","create_at": 1508245311774,"update_at": 1508247709215,"edit_at": 1508247709215,"delete_at": 0,"is_pinned": false,"user_id": "${TestHelper.basicUser.id}","channel_id": "${post.channel_id}","root_id": "","parent_id": "","original_id": "","message": "Unit Test","type": "","props": {},"hashtags": "","pending_post_id": ""}`}, broadcast: {omit_users: null, user_id: '', channel_id: '18k9ffsuci8xxm7ak68zfdyrce', team_id: ''}, seq: 7}));
        }

        const entities = store.getState().entities;
        const {posts} = entities.posts;
        assert.strictEqual(posts[post.id].state, Posts.POST_DELETED);
    });

    it('Websocket Handle Reaction Added to Post', (done) => {
        async function test() {
            const emoji = '+1';
            let post;

            if (TestHelper.isLiveServer()) {
                const client = TestHelper.createClient4();
                const user = await client.createUser(
                    TestHelper.fakeUser(),
                    null,
                    null,
                    TestHelper.basicTeam.invite_id
                );
                await client.login(user.email, 'password1');

                await Client4.addToChannel(user.id, TestHelper.basicChannel.id);

                post = await client.createPost({...TestHelper.fakePost(), channel_id: TestHelper.basicChannel.id});

                await Client4.addReaction(TestHelper.basicUser.id, post.id, emoji);
            } else {
                post = {id: 'w7yo9377zbfi9mgiq5gbfpn3ha'};
                mockServer.emit('message', JSON.stringify({event: WebsocketEvents.REACTION_ADDED, data: {reaction: `{"user_id":"${TestHelper.basicUser.id}","post_id":"w7yo9377zbfi9mgiq5gbfpn3ha","emoji_name":"${emoji}","create_at":1508249125852}`}, broadcast: {omit_users: null, user_id: '', channel_id: TestHelper.basicChannel.id, team_id: ''}, seq: 12}));
            }

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
            let post;

            if (TestHelper.isLiveServer()) {
                const client = TestHelper.createClient4();
                const user = await client.createUser(
                    TestHelper.fakeUser(),
                    null,
                    null,
                    TestHelper.basicTeam.invite_id
                );

                await client.login(user.email, 'password1');

                await Client4.addToChannel(user.id, TestHelper.basicChannel.id);

                const newPost = {...TestHelper.fakePost(), channel_id: TestHelper.basicChannel.id};
                post = await client.createPost(newPost);

                await Client4.addReaction(TestHelper.basicUser.id, post.id, emoji);

                const checkForAdd = () => {
                    return new Promise((resolve) => {
                        setTimeout(() => {
                            const nextEntities = store.getState().entities;
                            const {reactions} = nextEntities.posts;
                            const reactionsForPost = reactions[post.id];

                            assert.ok(reactionsForPost.hasOwnProperty(`${TestHelper.basicUser.id}-${emoji}`));
                            resolve();
                        }, 500);
                    });
                };

                await checkForAdd();
                await Client4.removeReaction(TestHelper.basicUser.id, post.id, emoji);
            } else {
                post = {id: 'w7yo9377zbfi9mgiq5gbfpn3ha'};
                store.dispatch({type: PostTypes.RECEIVED_REACTION, data: {user_id: TestHelper.basicUser.id, post_id: post.id, emoji_name: '+1'}});
                mockServer.emit('message', JSON.stringify({event: WebsocketEvents.REACTION_REMOVED, data: {reaction: `{"user_id":"${TestHelper.basicUser.id}","post_id":"w7yo9377zbfi9mgiq5gbfpn3ha","emoji_name":"+1","create_at":0}`}, broadcast: {omit_users: null, user_id: '', channel_id: TestHelper.basicChannel.id, team_id: ''}, seq: 18}));
            }

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
            let team;
            if (TestHelper.isLiveServer()) {
                await store.dispatch(TeamActions.getMyTeams());
                const {teams: myTeams} = store.getState().entities.teams;
                assert.ok(Object.keys(myTeams));

                team = {...Object.values(myTeams)[0]};
                team.allow_open_invite = true;
                TestHelper.basicClient4.updateTeam(team);
            } else {
                team = {id: '55pfercbm7bsmd11p5cjpgsbwr'};
                mockServer.emit('message', JSON.stringify({event: WebsocketEvents.UPDATE_TEAM, data: {team: `{"id":"55pfercbm7bsmd11p5cjpgsbwr","create_at":1495553950859,"update_at":1508250370054,"delete_at":0,"display_name":"${TestHelper.basicTeam.display_name}","name":"${TestHelper.basicTeam.name}","description":"description","email":"","type":"O","company_name":"","allowed_domains":"","invite_id":"m93f54fu5bfntewp8ctwonw19w","allow_open_invite":true}`}, broadcast: {omit_users: null, user_id: '', channel_id: '', team_id: ''}, seq: 26}));
            }

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
            let team;
            if (TestHelper.isLiveServer()) {
                await store.dispatch(TeamActions.getMyTeams());
                const {teams: myTeams} = store.getState().entities.teams;
                assert.ok(Object.keys(myTeams));

                team = {...Object.values(myTeams)[0]};
                team.allow_open_invite = true;
                TestHelper.basicClient4.patchTeam(team);
            } else {
                team = {id: '55pfercbm7bsmd11p5cjpgsbwr'};
                mockServer.emit('message', JSON.stringify({event: WebsocketEvents.UPDATE_TEAM, data: {team: `{"id":"55pfercbm7bsmd11p5cjpgsbwr","create_at":1495553950859,"update_at":1508250370054,"delete_at":0,"display_name":"${TestHelper.basicTeam.display_name}","name":"${TestHelper.basicTeam.name}","description":"description","email":"","type":"O","company_name":"","allowed_domains":"","invite_id":"m93f54fu5bfntewp8ctwonw19w","allow_open_invite":true}`}, broadcast: {omit_users: null, user_id: '', channel_id: '', team_id: ''}, seq: 26}));
            }

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
        let team;
        if (TestHelper.isLiveServer()) {
            const client = TestHelper.createClient4();
            const user = await client.createUser(TestHelper.fakeUser());
            await client.login(user.email, 'password1');
            team = await client.createTeam(TestHelper.fakeTeam());
            const channel = await client.createChannel(TestHelper.fakeChannel(team.id));
            await client.addToTeam(team.id, TestHelper.basicUser.id);
            await client.addToChannel(TestHelper.basicUser.id, channel.id);

            await store.dispatch(GeneralActions.setStoreFromLocalData({
                url: Client4.getUrl(),
                token: Client4.getToken(),
            }));
            await store.dispatch(TeamActions.selectTeam(team));
            await store.dispatch(ChannelActions.selectChannel(channel.id));
            await client.removeFromTeam(team.id, TestHelper.basicUser.id);
        } else {
            team = TestHelper.basicTeam;
            store.dispatch({type: UserTypes.RECEIVED_ME, data: TestHelper.basicUser});
            store.dispatch({type: TeamTypes.RECEIVED_TEAM, data: TestHelper.basicTeam});
            store.dispatch({type: TeamTypes.RECEIVED_MY_TEAM_MEMBER, data: TestHelper.basicTeamMember});
            mockServer.emit('message', JSON.stringify({event: WebsocketEvents.LEAVE_TEAM, data: {team_id: team.id, user_id: TestHelper.basicUser.id}, broadcast: {omit_users: null, user_id: '', channel_id: '', team_id: team.id}, seq: 35}));
        }

        const {myMembers} = store.getState().entities.teams;
        assert.ifError(myMembers[team.id]);
    }).timeout(3000);

    it('Websocket Handle User Added', async () => {
        let user;
        if (TestHelper.isLiveServer()) {
            const client = TestHelper.createClient4();
            user = await client.createUser(
                TestHelper.fakeUser(),
                null,
                null,
                TestHelper.basicTeam.invite_id
            );

            await store.dispatch(TeamActions.selectTeam(TestHelper.basicTeam));

            await store.dispatch(ChannelActions.addChannelMember(
                TestHelper.basicChannel.id,
                user.id
            ));
        } else {
            user = {...TestHelper.fakeUser(), id: TestHelper.generateId()};
            store.dispatch({type: UserTypes.RECEIVED_PROFILE_IN_CHANNEL, data: {id: TestHelper.basicChannel.id, user_id: user.id}});
            mockServer.emit('message', JSON.stringify({event: WebsocketEvents.USER_ADDED, data: {team_id: TestHelper.basicTeam.id, user_id: user.id}, broadcast: {omit_users: null, user_id: '', channel_id: TestHelper.basicChannel.id, team_id: ''}, seq: 42}));
        }

        const entities = store.getState().entities;
        const profilesInChannel = entities.users.profilesInChannel;
        assert.ok(profilesInChannel[TestHelper.basicChannel.id].has(user.id));
    });

    it('Websocket Handle User Removed', async () => {
        let user;
        if (TestHelper.isLiveServer()) {
            await store.dispatch(TeamActions.selectTeam(TestHelper.basicTeam));

            user = await TestHelper.basicClient4.createUser(
                TestHelper.fakeUser(),
                null,
                null,
                TestHelper.basicTeam.invite_id
            );

            await store.dispatch(ChannelActions.addChannelMember(
                TestHelper.basicChannel.id,
                user.id
            ));

            await store.dispatch(ChannelActions.removeChannelMember(
                TestHelper.basicChannel.id,
                user.id
            ));
        } else {
            user = {...TestHelper.fakeUser(), id: TestHelper.generateId()};
            store.dispatch({type: UserTypes.RECEIVED_PROFILE_NOT_IN_CHANNEL, data: {id: TestHelper.basicChannel.id, user_id: user.id}});
            mockServer.emit('message', JSON.stringify({event: WebsocketEvents.USER_REMOVED, data: {remover_id: TestHelper.basicUser.id, user_id: user.id}, broadcast: {omit_users: null, user_id: '', channel_id: TestHelper.basicChannel.id, team_id: ''}, seq: 42}));
        }

        const state = store.getState();
        const entities = state.entities;
        const profilesNotInChannel = entities.users.profilesNotInChannel;

        assert.ok(profilesNotInChannel[TestHelper.basicChannel.id].has(user.id));
    });

    it('Websocket Handle User Updated', async () => {
        let user;

        if (TestHelper.isLiveServer()) {
            const client = TestHelper.createClient4();
            user = await client.createUser(
                TestHelper.fakeUser(),
                null,
                null,
                TestHelper.basicTeam.invite_id
            );

            await client.login(user.email, 'password1');
            await client.updateUser({...user, first_name: 'tester4'});
        } else {
            user = {...TestHelper.fakeUser(), id: TestHelper.generateId()};
            mockServer.emit('message', JSON.stringify({event: WebsocketEvents.USER_UPDATED, data: {user: {id: user.id, create_at: 1495570297229, update_at: 1508253268652, delete_at: 0, username: 'tim', auth_data: '', auth_service: '', email: 'tim@bladekick.com', nickname: '', first_name: 'tester4', last_name: '', position: '', roles: 'system_user', locale: 'en'}}, broadcast: {omit_users: null, user_id: '', channel_id: '', team_id: ''}, seq: 53}));
        }

        store.subscribe(() => {
            const state = store.getState();
            const entities = state.entities;
            const profiles = entities.users.profiles;

            assert.strictEqual(profiles[user.id].first_name, 'tester4');
        });
    });

    it('Websocket Handle Channel Created', (done) => {
        async function test() {
            let channel;

            if (TestHelper.isLiveServer()) {
                await store.dispatch(TeamActions.selectTeam(TestHelper.basicTeam));
                channel = await Client4.createChannel(TestHelper.fakeChannel(TestHelper.basicTeam.id));
            } else {
                channel = {id: '95tpi6f4apy39k6zxuo3msxzhy'};
                store.dispatch({type: ChannelTypes.RECEIVED_CHANNEL, data: channel});
                mockServer.emit('message', JSON.stringify({event: WebsocketEvents.CHANNEL_CREATED, data: {channel_id: '95tpi6f4apy39k6zxuo3msxzhy', team_id: TestHelper.basicTeam.id}, broadcast: {omit_users: null, user_id: 't36kso9nwtdhbm8dbkd6g4eeby', channel_id: '', team_id: ''}, seq: 57}));
            }

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

        if (TestHelper.isLiveServer()) {
            const client = TestHelper.createClient4();
            await client.login(TestHelper.basicUser.email, 'password1');
            await client.updateChannel({...TestHelper.basicChannel, display_name: channelName});
        } else {
            mockServer.emit('message', JSON.stringify({event: WebsocketEvents.CHANNEL_UPDATED, data: {channel: `{"id":"${channelId}","create_at":1508253647983,"update_at":1508254198797,"delete_at":0,"team_id":"55pfercbm7bsmd11p5cjpgsbwr","type":"O","display_name":"${channelName}","name":"${TestHelper.basicChannel.name}","header":"header","purpose":"","last_post_at":1508253648004,"total_msg_count":0,"extra_update_at":1508253648001,"creator_id":"${TestHelper.basicUser.id}"}`}, broadcast: {omit_users: null, user_id: '', channel_id: channelId, team_id: ''}, seq: 62}));
        }

        await TestHelper.wait(300);

        const state = store.getState();
        const entities = state.entities;
        const {channels} = entities.channels;

        assert.strictEqual(channels[channelId].display_name, channelName);
    });

    it('Websocket Handle Channel Converted', async () => {
        const channelType = 'P';
        const channelId = TestHelper.basicChannel.id;

        if (TestHelper.isLiveServer()) {
            const client = TestHelper.createClient4();
            await client.login(TestHelper.basicUser.email, 'password1');
            await client.convertChannelToPrivate({channel_id: channelId});
        } else {
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
        }

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

            if (TestHelper.isLiveServer()) {
                await store.dispatch(ChannelActions.fetchMyChannelsAndMembers(TestHelper.basicTeam.id));
                await Client4.deleteChannel(
                    TestHelper.basicChannel.id
                );
            } else {
                store.dispatch({type: ChannelTypes.RECEIVED_CHANNEL, data: {id: TestHelper.generateId(), name: General.DEFAULT_CHANNEL, team_id: TestHelper.basicTeam.id}});
                store.dispatch({type: ChannelTypes.RECEIVED_CHANNEL, data: TestHelper.basicChannel});

                nock(Client4.getUserRoute('me')).
                    get(`/teams/${TestHelper.basicTeam.id}/channels/members`).
                    reply(201, [{user_id: TestHelper.basicUser.id, channel_id: TestHelper.basicChannel.id}]);

                mockServer.emit('message', JSON.stringify({event: WebsocketEvents.CHANNEL_DELETED, data: {channel_id: TestHelper.basicChannel.id}, broadcast: {omit_users: null, user_id: '', channel_id: '', team_id: TestHelper.basicTeam.id}, seq: 68}));
            }

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
            if (TestHelper.isLiveServer()) {
                const client = TestHelper.createClient4();
                const user = await client.createUser(
                    TestHelper.fakeUser(),
                    null,
                    null,
                    TestHelper.basicTeam.invite_id
                );

                await client.login(user.email, 'password1');
                await store.dispatch(TeamActions.selectTeam(TestHelper.basicTeam));
                await client.createDirectChannel([user.id, TestHelper.basicUser.id]);
            } else {
                const channel = {id: TestHelper.generateId(), name: TestHelper.basicUser.id + '__' + TestHelper.generateId(), type: 'D'};

                nock(Client4.getChannelsRoute()).
                    get(`/${channel.id}/members/me`).
                    reply(201, {user_id: TestHelper.basicUser.id, channel_id: channel.id});

                mockServer.emit('message', JSON.stringify({event: WebsocketEvents.DIRECT_ADDED, data: {teammate_id: 'btaxe5msnpnqurayosn5p8twuw'}, broadcast: {omit_users: null, user_id: '', channel_id: channel.id, team_id: ''}, seq: 2}));
                store.dispatch({type: ChannelTypes.RECEIVED_CHANNEL, data: channel});
            }

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
            let team;
            if (TestHelper.isLiveServer()) {
                const client = TestHelper.createClient4();
                const user = await client.createUser(
                    TestHelper.fakeUser(),
                    null,
                    null,
                    TestHelper.basicTeam.invite_id
                );
                await client.login(user.email, 'password1');

                team = await client.createTeam(TestHelper.fakeTeam());
                client.addToTeam(team.id, TestHelper.basicUser.id);
            } else {
                team = {id: TestHelper.generateId()};

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
            }

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
            let created;
            if (TestHelper.isLiveServer()) {
                const client = TestHelper.createClient4();
                const user = await client.createUser(
                    TestHelper.fakeUser(),
                    null,
                    null,
                    TestHelper.basicTeam.invite_id
                );
                await client.login(user.email, 'password1');

                const testImageData = fs.createReadStream('test/assets/images/test.png');
                created = await Client4.createCustomEmoji({
                    name: TestHelper.generateId(),
                    creator_id: TestHelper.basicUser.id,
                }, testImageData);
            } else {
                created = {id: '1mmgakhhupfgfm8oug6pooc5no'};
                mockServer.emit('message', JSON.stringify({event: WebsocketEvents.EMOJI_ADDED, data: {emoji: `{"id":"1mmgakhhupfgfm8oug6pooc5no","create_at":1508263941321,"update_at":1508263941321,"delete_at":0,"creator_id":"t36kso9nwtdhbm8dbkd6g4eeby","name":"${TestHelper.generateId()}"}`}, broadcast: {omit_users: null, user_id: '', channel_id: '', team_id: ''}, seq: 2}));
            }

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
            if (TestHelper.isLiveServer()) {
                // No live server version implemented for this test case.
                this.skip();
            } else {
                mockServer.emit('message', JSON.stringify({event: WebsocketEvents.LICENSE_CHANGED, data: {license: {IsLicensed: 'true'}}}));
            }

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
            if (TestHelper.isLiveServer()) {
                // No live server version implemented for this test case.
                this.skip();
            } else {
                mockServer.emit('message', JSON.stringify({event: WebsocketEvents.CONFIG_CHANGED, data: {config: {EnableCustomEmoji: 'true', EnableLinkPreviews: 'false'}}}));
            }

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
            if (TestHelper.isLiveServer()) {
                // No live server version implemented for this test case.
                this.skip();
            } else {
                mockServer.emit('message', JSON.stringify({event: WebsocketEvents.OPEN_DIALOG, data: {dialog: JSON.stringify({url: 'someurl', trigger_id: 'sometriggerid', dialog: {}})}}));
            }

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
