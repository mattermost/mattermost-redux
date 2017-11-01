// Copyright (c) 2016 Mattermost, Inc. All Rights Reserved.
// See License.txt for license information.

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

describe('Actions.Websocket', () => {
    let store;
    let mockServer;
    before(async () => {
        store = await configureStore();
        await TestHelper.initBasic(Client4);

        const connUrl = (Client4.getUrl() + '/api/v4/websocket').replace(/^http:/, 'ws:');
        mockServer = new Server(connUrl);
        const webSocketConnector = TestHelper.isLiveServer() ? require('ws') : MockWebSocket;
        return await Actions.init(
            'ios',
            null,
            null,
            webSocketConnector
        )(store.dispatch, store.getState);
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

            mockServer.send(JSON.stringify({event: WebsocketEvents.POSTED, data: {channel_display_name: TestHelper.basicChannel.display_name, channel_name: TestHelper.basicChannel.name, channel_type: 'O', post: `{"id": "71k8gz5ompbpfkrzaxzodffj8w", "create_at": 1508245311774, "update_at": 1508245311774, "edit_at": 0, "delete_at": 0, "is_pinned": false, "user_id": "${TestHelper.basicUser.id}", "channel_id": "${channelId}", "root_id": "", "parent_id": "", "original_id": "", "message": "Unit Test", "type": "", "props": {}, "hashtags": "", "pending_post_id": "t36kso9nwtdhbm8dbkd6g4eeby: 1508245311749"}`, sender_name: TestHelper.basicUser.username, team_id: TestHelper.basicTeam.id}, broadcast: {omit_users: null, user_id: '', channel_id: channelId, team_id: ''}, seq: 2}));
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
            mockServer.send(JSON.stringify({event: WebsocketEvents.POST_EDITED, data: {post: `{"id": "71k8gz5ompbpfkrzaxzodffj8w","create_at": 1508245311774,"update_at": 1508247709215,"edit_at": 1508247709215,"delete_at": 0,"is_pinned": false,"user_id": "${TestHelper.basicUser.id}","channel_id": "${TestHelper.basicChannel.id}","root_id": "","parent_id": "","original_id": "","message": "Unit Test (edited)","type": "","props": {},"hashtags": "","pending_post_id": ""}`}, broadcast: {omit_users: null, user_id: '', channel_id: '18k9ffsuci8xxm7ak68zfdyrce', team_id: ''}, seq: 2}));
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
            mockServer.send(JSON.stringify({event: WebsocketEvents.POST_DELETED, data: {post: `{"id": "71k8gz5ompbpfkrzaxzodffj8w","create_at": 1508245311774,"update_at": 1508247709215,"edit_at": 1508247709215,"delete_at": 0,"is_pinned": false,"user_id": "${TestHelper.basicUser.id}","channel_id": "${post.channel_id}","root_id": "","parent_id": "","original_id": "","message": "Unit Test","type": "","props": {},"hashtags": "","pending_post_id": ""}`}, broadcast: {omit_users: null, user_id: '', channel_id: '18k9ffsuci8xxm7ak68zfdyrce', team_id: ''}, seq: 7}));
        }

        store.subscribe(async () => {
            const entities = store.getState().entities;
            const {posts} = entities.posts;
            assert.strictEqual(posts[post.id].state, Posts.POST_DELETED);
        });
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
                mockServer.send(JSON.stringify({event: WebsocketEvents.REACTION_ADDED, data: {reaction: `{"user_id":"${TestHelper.basicUser.id}","post_id":"w7yo9377zbfi9mgiq5gbfpn3ha","emoji_name":"${emoji}","create_at":1508249125852}`}, broadcast: {omit_users: null, user_id: '', channel_id: TestHelper.basicChannel.id, team_id: ''}, seq: 12}));
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

                function checkForAdd() {
                    return new Promise((resolve) => {
                        setTimeout(() => {
                            const nextEntities = store.getState().entities;
                            const {reactions} = nextEntities.posts;
                            const reactionsForPost = reactions[post.id];

                            assert.ok(reactionsForPost.hasOwnProperty(`${TestHelper.basicUser.id}-${emoji}`));
                            resolve();
                        }, 500);
                    });
                }

                await checkForAdd();
                await Client4.removeReaction(TestHelper.basicUser.id, post.id, emoji);
            } else {
                post = {id: 'w7yo9377zbfi9mgiq5gbfpn3ha'};
                store.dispatch({type: PostTypes.RECEIVED_REACTION, data: {user_id: TestHelper.basicUser.id, post_id: post.id, emoji_name: '+1'}});
                mockServer.send(JSON.stringify({event: WebsocketEvents.REACTION_REMOVED, data: {reaction: `{"user_id":"${TestHelper.basicUser.id}","post_id":"w7yo9377zbfi9mgiq5gbfpn3ha","emoji_name":"+1","create_at":0}`}, broadcast: {omit_users: null, user_id: '', channel_id: TestHelper.basicChannel.id, team_id: ''}, seq: 18}));
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
                await TeamActions.getMyTeams()(store.dispatch, store.getState);
                const {teams: myTeams} = store.getState().entities.teams;
                assert.ok(Object.keys(myTeams));

                team = {...Object.values(myTeams)[0]};
                team.allow_open_invite = true;
                TestHelper.basicClient4.updateTeam(team);
            } else {
                team = {id: '55pfercbm7bsmd11p5cjpgsbwr'};
                mockServer.send(JSON.stringify({event: WebsocketEvents.UPDATE_TEAM, data: {team: `{"id":"55pfercbm7bsmd11p5cjpgsbwr","create_at":1495553950859,"update_at":1508250370054,"delete_at":0,"display_name":"${TestHelper.basicTeam.display_name}","name":"${TestHelper.basicTeam.name}","description":"description","email":"","type":"O","company_name":"","allowed_domains":"","invite_id":"m93f54fu5bfntewp8ctwonw19w","allow_open_invite":true}`}, broadcast: {omit_users: null, user_id: '', channel_id: '', team_id: ''}, seq: 26}));
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

            await GeneralActions.setStoreFromLocalData({
                url: Client4.getUrl(),
                token: Client4.getToken()
            })(store.dispatch, store.getState);
            await TeamActions.selectTeam(team)(store.dispatch, store.getState);
            await ChannelActions.selectChannel(channel.id)(store.dispatch, store.getState);
            await client.removeFromTeam(team.id, TestHelper.basicUser.id);
        } else {
            team = TestHelper.basicTeam;
            store.dispatch({type: UserTypes.RECEIVED_ME, data: TestHelper.basicUser});
            store.dispatch({type: TeamTypes.RECEIVED_TEAM, data: TestHelper.basicTeam});
            store.dispatch({type: TeamTypes.RECEIVED_MY_TEAM_MEMBER, data: TestHelper.basicTeamMember});
            mockServer.send(JSON.stringify({event: WebsocketEvents.LEAVE_TEAM, data: {team_id: team.id, user_id: TestHelper.basicUser.id}, broadcast: {omit_users: null, user_id: '', channel_id: '', team_id: team.id}, seq: 35}));
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

            await TeamActions.selectTeam(TestHelper.basicTeam)(store.dispatch, store.getState);

            await ChannelActions.addChannelMember(
                TestHelper.basicChannel.id,
                user.id
            )(store.dispatch, store.getState);
        } else {
            user = {...TestHelper.fakeUser(), id: TestHelper.generateId()};
            store.dispatch({type: UserTypes.RECEIVED_PROFILE_IN_CHANNEL, id: TestHelper.basicChannel.id, data: {user_id: user.id}});
            mockServer.send(JSON.stringify({event: WebsocketEvents.USER_ADDED, data: {team_id: TestHelper.basicTeam.id, user_id: user.id}, broadcast: {omit_users: null, user_id: '', channel_id: TestHelper.basicChannel.id, team_id: ''}, seq: 42}));
        }

        const entities = store.getState().entities;
        const profilesInChannel = entities.users.profilesInChannel;
        assert.ok(profilesInChannel[TestHelper.basicChannel.id].has(user.id));
    });

    it('Websocket Handle User Removed', async () => {
        let user;
        if (TestHelper.isLiveServer()) {
            await TeamActions.selectTeam(TestHelper.basicTeam)(store.dispatch, store.getState);

            user = await TestHelper.basicClient4.createUser(
                TestHelper.fakeUser(),
                null,
                null,
                TestHelper.basicTeam.invite_id
            );

            await ChannelActions.addChannelMember(
                TestHelper.basicChannel.id,
                user.id
            )(store.dispatch, store.getState);

            await ChannelActions.removeChannelMember(
                TestHelper.basicChannel.id,
                user.id
            )(store.dispatch, store.getState);
        } else {
            user = {...TestHelper.fakeUser(), id: TestHelper.generateId()};
            store.dispatch({type: UserTypes.RECEIVED_PROFILE_NOT_IN_CHANNEL, id: TestHelper.basicChannel.id, data: {user_id: user.id}});
            mockServer.send(JSON.stringify({event: WebsocketEvents.USER_REMOVED, data: {remover_id: TestHelper.basicUser.id, user_id: user.id}, broadcast: {omit_users: null, user_id: '', channel_id: TestHelper.basicChannel.id, team_id: ''}, seq: 42}));
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
            mockServer.send(JSON.stringify({event: WebsocketEvents.USER_UPDATED, data: {user: {id: user.id, create_at: 1495570297229, update_at: 1508253268652, delete_at: 0, username: 'tim', auth_data: '', auth_service: '', email: 'tim@bladekick.com', nickname: '', first_name: 'tester4', last_name: '', position: '', roles: 'system_user', locale: 'en'}}, broadcast: {omit_users: null, user_id: '', channel_id: '', team_id: ''}, seq: 53}));
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
                await TeamActions.selectTeam(TestHelper.basicTeam)(store.dispatch, store.getState);
                channel = await Client4.createChannel(TestHelper.fakeChannel(TestHelper.basicTeam.id));
            } else {
                channel = {id: '95tpi6f4apy39k6zxuo3msxzhy'};
                store.dispatch({type: ChannelTypes.RECEIVED_CHANNEL, data: channel});
                mockServer.send(JSON.stringify({event: WebsocketEvents.CHANNEL_CREATED, data: {channel_id: '95tpi6f4apy39k6zxuo3msxzhy', team_id: TestHelper.basicTeam.id}, broadcast: {omit_users: null, user_id: 't36kso9nwtdhbm8dbkd6g4eeby', channel_id: '', team_id: ''}, seq: 57}));
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
            mockServer.send(JSON.stringify({event: WebsocketEvents.CHANNEL_UPDATED, data: {channel: `{"id":"${channelId}","create_at":1508253647983,"update_at":1508254198797,"delete_at":0,"team_id":"55pfercbm7bsmd11p5cjpgsbwr","type":"O","display_name":"${channelName}","name":"${TestHelper.basicChannel.name}","header":"header","purpose":"","last_post_at":1508253648004,"total_msg_count":0,"extra_update_at":1508253648001,"creator_id":"${TestHelper.basicUser.id}"}`}, broadcast: {omit_users: null, user_id: '', channel_id: channelId, team_id: ''}, seq: 62}));
        }

        await TestHelper.wait(300);

        const state = store.getState();
        const entities = state.entities;
        const {channels} = entities.channels;

        assert.strictEqual(channels[channelId].display_name, channelName);
    });

    it('Websocket Handle Channel Deleted', (done) => {
        async function test() {
            await TeamActions.selectTeam(TestHelper.basicTeam)(store.dispatch, store.getState);
            await ChannelActions.selectChannel(TestHelper.basicChannel.id)(store.dispatch, store.getState);

            if (TestHelper.isLiveServer()) {
                await ChannelActions.fetchMyChannelsAndMembers(TestHelper.basicTeam.id)(store.dispatch, store.getState);
                await Client4.deleteChannel(
                    TestHelper.basicChannel.id
                );
            } else {
                store.dispatch({type: ChannelTypes.RECEIVED_CHANNEL, data: {id: TestHelper.generateId(), name: General.DEFAULT_CHANNEL}});
                store.dispatch({type: ChannelTypes.RECEIVED_CHANNEL, data: TestHelper.basicChannel});
                mockServer.send(JSON.stringify({event: WebsocketEvents.CHANNEL_DELETED, data: {channel_id: TestHelper.basicChannel.id}, broadcast: {omit_users: null, user_id: '', channel_id: '', team_id: TestHelper.basicTeam.id}, seq: 68}));
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
                await TeamActions.selectTeam(TestHelper.basicTeam)(store.dispatch, store.getState);
                await client.createDirectChannel([user.id, TestHelper.basicUser.id]);
            } else {
                const channel = {id: TestHelper.generateId(), name: TestHelper.basicUser.id + '__' + TestHelper.generateId(), type: 'D'};

                mockServer.send(JSON.stringify({event: WebsocketEvents.DIRECT_ADDED, data: {teammate_id: 'btaxe5msnpnqurayosn5p8twuw'}, broadcast: {omit_users: null, user_id: '', channel_id: channel.id, team_id: ''}, seq: 2}));
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

                mockServer.send(JSON.stringify({event: WebsocketEvents.ADDED_TO_TEAM, data: {team_id: team.id, user_id: TestHelper.basicUser.id}, broadcast: {omit_users: null, user_id: TestHelper.basicUser.id, channel_id: '', team_id: ''}, seq: 2}));
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
                    creator_id: TestHelper.basicUser.id
                }, testImageData);
            } else {
                created = {id: '1mmgakhhupfgfm8oug6pooc5no'};
                mockServer.send(JSON.stringify({event: WebsocketEvents.EMOJI_ADDED, data: {emoji: `{"id":"1mmgakhhupfgfm8oug6pooc5no","create_at":1508263941321,"update_at":1508263941321,"delete_at":0,"creator_id":"t36kso9nwtdhbm8dbkd6g4eeby","name":"${TestHelper.generateId()}"}`}, broadcast: {omit_users: null, user_id: '', channel_id: '', team_id: ''}, seq: 2}));
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
});
