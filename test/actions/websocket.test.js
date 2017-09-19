// Copyright (c) 2016 Mattermost, Inc. All Rights Reserved.
// See License.txt for license information.

import fs from 'fs';
import assert from 'assert';
import * as Actions from 'actions/websocket';
import * as ChannelActions from 'actions/channels';
import * as TeamActions from 'actions/teams';
import * as GeneralActions from 'actions/general';

import {Client, Client4} from 'client';
import {General, Posts, RequestStatus} from 'constants';
import TestHelper from 'test/test_helper';
import configureStore from 'test/test_store';

describe('Actions.Websocket', () => {
    let store;
    before(async () => {
        store = await configureStore();
        await TestHelper.initBasic(Client, Client4);
        const webSocketConnector = require('ws');
        return await Actions.init(
            'ios',
            null,
            null,
            webSocketConnector
        )(store.dispatch, store.getState);
    });

    after(async () => {
        Actions.close()();
        await TestHelper.basicClient.logout();
        await TestHelper.basicClient4.logout();
    });

    it('WebSocket Connect', () => {
        const ws = store.getState().requests.general.websocket;
        assert.ok(ws.status === RequestStatus.SUCCESS);
    });

    it('Websocket Handle New Post', async () => {
        const client = TestHelper.createClient4();
        const user = await client.createUser(
            TestHelper.fakeUser(),
            null,
            null,
            TestHelper.basicTeam.invite_id
        );
        await client.login(user.email, 'password1');

        await Client4.addToChannel(user.id, TestHelper.basicChannel.id);

        const post = {...TestHelper.fakePost(), channel_id: TestHelper.basicChannel.id};
        await client.createPost(post);

        const entities = store.getState().entities;
        const {posts, postsInChannel} = entities.posts;
        const channelId = TestHelper.basicChannel.id;
        const postId = postsInChannel[channelId][0];

        assert.ok(posts[postId].message.indexOf('Unit Test') > -1);
    });

    it('Websocket Handle Post Edited', async () => {
        let post = {...TestHelper.fakePost(), channel_id: TestHelper.basicChannel.id};
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

        store.subscribe(async () => {
            const entities = store.getState().entities;
            const {posts} = entities.posts;
            assert.ok(posts[post.id].message.indexOf('(edited)') > -1);
        });
    });

    it('Websocket Handle Post Deleted', async () => {
        const client = TestHelper.createClient4();
        const user = await client.createUser(
            TestHelper.fakeUser(),
            null,
            null,
            TestHelper.basicTeam.invite_id
        );

        await Client4.addToChannel(user.id, TestHelper.basicChannel.id);
        await client.login(user.email, 'password1');
        let post = TestHelper.fakePost();
        post.channel_id = TestHelper.basicChannel.id;
        post = await client.createPost(post);

        await client.deletePost(post.id);

        store.subscribe(async () => {
            const entities = store.getState().entities;
            const {posts} = entities.posts;
            assert.strictEqual(posts[post.id].state, Posts.POST_DELETED);
        });
    });

    it('Websocket Handle Reaction Added to Post', (done) => {
        async function test() {
            const client = TestHelper.createClient4();
            const user = await client.createUser(
                TestHelper.fakeUser(),
                null,
                null,
                TestHelper.basicTeam.invite_id
            );
            await client.login(user.email, 'password1');

            await Client4.addToChannel(user.id, TestHelper.basicChannel.id);

            const post = await client.createPost({...TestHelper.fakePost(), channel_id: TestHelper.basicChannel.id});
            const emoji = '+1';

            await Client4.addReaction(TestHelper.basicUser.id, post.id, emoji);

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
            const post = await client.createPost(newPost);
            const emoji = '+1';

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

            await checkForAdd();
            await Client4.removeReaction(TestHelper.basicUser.id, post.id, emoji);
            await checkForRemove();
        }

        test();
    });

    // If we move this test lower it will fail cause of a permissions issue
    it('Websocket handle team updated', (done) => {
        async function test() {
            await TeamActions.getMyTeams()(store.dispatch, store.getState);
            const {teams: myTeams} = store.getState().entities.teams;
            assert.ok(Object.keys(myTeams));

            const team = {...Object.values(myTeams)[0]};
            team.allow_open_invite = true;
            TestHelper.basicClient4.updateTeam(team);

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
        const client = TestHelper.createClient4();
        const user = await client.createUser(TestHelper.fakeUser());
        await client.login(user.email, 'password1');
        const team = await client.createTeam(TestHelper.fakeTeam());
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

        const {myMembers} = store.getState().entities.teams;
        assert.ifError(myMembers[team.id]);
    }).timeout(3000);

    it('Websocket Handle User Added', async () => {
        const client = TestHelper.createClient4();
        const user = await client.createUser(
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

        const entities = store.getState().entities;
        const profilesInChannel = entities.users.profilesInChannel;
        assert.ok(profilesInChannel[TestHelper.basicChannel.id].has(user.id));
    });

    it('Websocket Handle User Removed', async () => {
        await TeamActions.selectTeam(TestHelper.basicTeam)(store.dispatch, store.getState);

        const user = await TestHelper.basicClient4.createUser(
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

        const state = store.getState();
        const entities = state.entities;
        const profilesNotInChannel = entities.users.profilesNotInChannel;

        assert.ok(profilesNotInChannel[TestHelper.basicChannel.id].has(user.id));
    });

    it('Websocket Handle User Updated', async () => {
        const client = TestHelper.createClient4();
        const user = await client.createUser(
            TestHelper.fakeUser(),
            null,
            null,
            TestHelper.basicTeam.invite_id
        );

        await client.login(user.email, 'password1');
        await client.updateUser({...user, first_name: 'tester4'});

        store.subscribe(() => {
            const state = store.getState();
            const entities = state.entities;
            const profiles = entities.users.profiles;

            assert.strictEqual(profiles[user.id].first_name, 'tester4');
        });
    });

    it('Websocket Handle Channel Created', (done) => {
        async function test() {
            await TeamActions.selectTeam(TestHelper.basicTeam)(store.dispatch, store.getState);
            const channel = await Client4.createChannel(TestHelper.fakeChannel(TestHelper.basicTeam.id));

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
        const client = TestHelper.createClient4();
        const channelName = 'Test name';
        const channelId = TestHelper.basicChannel.id;
        await client.login(TestHelper.basicUser.email, 'password1');
        await client.updateChannel({...TestHelper.basicChannel, display_name: channelName});

        store.subscribe(() => {
            const state = store.getState();
            const entities = state.entities;
            const {channels} = entities.channels;

            assert.strictEqual(channels[channelId].display_name, channelName);
        });
    });

    it('Websocket Handle Channel Deleted', (done) => {
        async function test() {
            await TeamActions.selectTeam(TestHelper.basicTeam)(store.dispatch, store.getState);
            await ChannelActions.fetchMyChannelsAndMembers(TestHelper.basicTeam.id)(store.dispatch, store.getState);
            await ChannelActions.selectChannel(TestHelper.basicChannel.id)(store.dispatch, store.getState);
            await Client4.deleteChannel(
                TestHelper.basicChannel.id
            );

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
            const client = TestHelper.createClient4();
            const user = await client.createUser(
                TestHelper.fakeUser(),
                null,
                null,
                TestHelper.basicTeam.invite_id
            );

            await client.login(user.email, 'password1');
            await TeamActions.selectTeam(TestHelper.basicTeam)(store.dispatch, store.getState);

            setTimeout(() => {
                const entities = store.getState().entities;
                const {channels} = entities.channels;
                assert.ok(Object.keys(channels).length);
                done();
            }, 500);

            await client.createDirectChannel([user.id, TestHelper.basicUser.id]);
        }

        test();
    });

    it('Websocket handle user added to team', (done) => {
        async function test() {
            const client = TestHelper.createClient4();
            const user = await client.createUser(
                TestHelper.fakeUser(),
                null,
                null,
                TestHelper.basicTeam.invite_id
            );
            await client.login(user.email, 'password1');

            const team = await client.createTeam(TestHelper.fakeTeam());
            client.addToTeam(team.id, TestHelper.basicUser.id);

            setTimeout(() => {
                const entities = store.getState().entities;
                const {teams, myMembers} = entities.teams;
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
            const client = TestHelper.createClient4();
            const user = await client.createUser(
                TestHelper.fakeUser(),
                null,
                null,
                TestHelper.basicTeam.invite_id
            );
            await client.login(user.email, 'password1');

            const testImageData = fs.createReadStream('test/assets/images/test.png');
            const created = await Client4.createCustomEmoji({
                name: TestHelper.generateId(),
                creator_id: TestHelper.basicUser.id
            }, testImageData);

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
