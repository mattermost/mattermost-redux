// Copyright (c) 2016 Mattermost, Inc. All Rights Reserved.
// See License.txt for license information.

import assert from 'assert';
import nock from 'nock';

import * as Actions from 'actions/channels';
import {addUserToTeam, getMyTeams, getMyTeamMembers, getMyTeamUnreads} from 'actions/teams';
import {getMe, getProfilesByIds, login} from 'actions/users';
import {createIncomingHook, createOutgoingHook} from 'actions/integrations';
import {Client, Client4} from 'client';
import {General, RequestStatus, Preferences} from 'constants';
import {getPreferenceKey} from 'utils/preference_utils';
import TestHelper from 'test/test_helper';
import configureStore from 'test/test_store';

describe('Actions.Channels', () => {
    let store;
    before(async () => {
        await TestHelper.initBasic(Client, Client4);
    });

    beforeEach(async () => {
        store = await configureStore();
    });

    after(async () => {
        await TestHelper.basicClient.logout();
        await TestHelper.basicClient4.logout();
    });

    it('selectChannel', async () => {
        const channelId = TestHelper.generateId();

        await Actions.selectChannel(channelId)(store.dispatch, store.getState);
        await TestHelper.wait(100);
        const state = store.getState();

        assert.equal(state.entities.channels.currentChannelId, channelId);
    });

    it('createChannel', async () => {
        const channel = {
            team_id: TestHelper.basicTeam.id,
            name: 'redux-test',
            display_name: 'Redux Test',
            purpose: 'This is to test redux',
            header: 'MM with Redux',
            type: 'O'
        };

        await Actions.createChannel(channel, TestHelper.basicUser.id)(store.dispatch, store.getState);
        const createRequest = store.getState().requests.channels.createChannel;
        const membersRequest = store.getState().requests.channels.myMembers;
        if (createRequest.status === RequestStatus.FAILURE) {
            throw new Error(JSON.stringify(createRequest.error));
        } else if (membersRequest.status === RequestStatus.FAILURE) {
            throw new Error(JSON.stringify(membersRequest.error));
        }
        const {channels, myMembers} = store.getState().entities.channels;
        const channelsCount = Object.keys(channels).length;
        const membersCount = Object.keys(myMembers).length;
        assert.ok(channels);
        assert.ok(myMembers);
        assert.ok(channels[Object.keys(myMembers)[0]]);
        assert.ok(myMembers[Object.keys(channels)[0]]);
        assert.equal(myMembers[Object.keys(channels)[0]].user_id, TestHelper.basicUser.id);
        assert.equal(channelsCount, membersCount);
        assert.equal(channelsCount, 1);
        assert.equal(membersCount, 1);
    });

    it('createDirectChannel', async () => {
        const user = await TestHelper.basicClient4.createUser(
            TestHelper.fakeUser(),
            null,
            null,
            TestHelper.basicTeam.invite_id
        );

        await getProfilesByIds([user.id])(store.dispatch, store.getState);
        const result = await Actions.createDirectChannel(TestHelper.basicUser.id, user.id)(store.dispatch, store.getState);
        const created = result.data;

        const createRequest = store.getState().requests.channels.createChannel;
        if (createRequest.status === RequestStatus.FAILURE) {
            throw new Error(createRequest.error);
        }

        const state = store.getState();
        const {channels, myMembers} = state.entities.channels;
        const {profiles, profilesInChannel} = state.entities.users;
        const preferences = state.entities.preferences.myPreferences;
        const channelsCount = Object.keys(channels).length;
        const membersCount = Object.keys(myMembers).length;

        assert.ok(channels, 'channels is empty');
        assert.ok(myMembers, 'members is empty');
        assert.ok(profiles[user.id], 'profiles does not have userId');
        assert.ok(Object.keys(preferences).length, 'preferences is empty');
        assert.ok(channels[Object.keys(myMembers)[0]], 'channels should have the member');
        assert.ok(myMembers[Object.keys(channels)[0]], 'members should belong to channel');
        assert.equal(myMembers[Object.keys(channels)[0]].user_id, TestHelper.basicUser.id);
        assert.equal(channelsCount, membersCount);
        assert.equal(channels[Object.keys(channels)[0]].type, 'D');
        assert.equal(channelsCount, 1);
        assert.equal(membersCount, 1);

        assert.ok(profilesInChannel, 'profiles in channel is empty');
        assert.ok(profilesInChannel[created.id], 'profiles in channel is empty for channel');
        assert.equal(profilesInChannel[created.id].size, 2, 'incorrect number of profiles in channel');
        assert.ok(profilesInChannel[created.id].has(TestHelper.basicUser.id), 'creator is not in channel');
        assert.ok(profilesInChannel[created.id].has(user.id), 'user is not in channel');
    });

    it('createGroupChannel', async () => {
        const user = await TestHelper.basicClient4.createUser(
            TestHelper.fakeUser(),
            null,
            null,
            TestHelper.basicTeam.invite_id
        );

        const user2 = await TestHelper.basicClient4.createUser(
            TestHelper.fakeUser(),
            null,
            null,
            TestHelper.basicTeam.invite_id
        );

        await login(TestHelper.basicUser.email, 'password1')(store.dispatch, store.getState);

        await getProfilesByIds([user.id, user2.id])(store.dispatch, store.getState);
        const result = await Actions.createGroupChannel([TestHelper.basicUser.id, user.id, user2.id])(store.dispatch, store.getState);
        const created = result.data;

        assert.ok(!result.error, 'error was returned');
        assert.ok(created, 'channel was not returned');

        const createRequest = store.getState().requests.channels.createChannel;
        if (createRequest.status === RequestStatus.FAILURE) {
            throw new Error(createRequest.error);
        }

        const state = store.getState();
        const {channels, myMembers} = state.entities.channels;
        const preferences = state.entities.preferences.myPreferences;
        const {profilesInChannel} = state.entities.users;

        assert.ok(channels, 'channels is empty');
        assert.ok(channels[created.id], 'channel does not exist');
        assert.ok(myMembers, 'members is empty');
        assert.ok(myMembers[created.id], 'member does not exist');
        assert.ok(Object.keys(preferences).length, 'preferences is empty');

        assert.ok(profilesInChannel, 'profiles in channel is empty');
        assert.ok(profilesInChannel[created.id], 'profiles in channel is empty for channel');
        assert.equal(profilesInChannel[created.id].size, 3, 'incorrect number of profiles in channel');
        assert.ok(profilesInChannel[created.id].has(TestHelper.basicUser.id), 'creator is not in channel');
        assert.ok(profilesInChannel[created.id].has(user.id), 'user is not in channel');
        assert.ok(profilesInChannel[created.id].has(user2.id), 'user2 is not in channel');
    });

    it('updateChannel', async () => {
        const channel = {
            ...TestHelper.basicChannel,
            purpose: 'This is to test redux',
            header: 'MM with Redux'
        };

        await Actions.updateChannel(channel)(store.dispatch, store.getState);

        const updateRequest = store.getState().requests.channels.updateChannel;
        if (updateRequest.status === RequestStatus.FAILURE) {
            throw new Error(JSON.stringify(updateRequest.error));
        }

        const {channels} = store.getState().entities.channels;
        const channelId = Object.keys(channels)[0];
        assert.ok(channelId);
        assert.ok(channels[channelId]);
        assert.strictEqual(channels[channelId].header, 'MM with Redux');
    });

    it('patchChannel', async () => {
        const channel = {
            header: 'MM with Redux2'
        };

        await Actions.patchChannel(TestHelper.basicChannel.id, channel)(store.dispatch, store.getState);

        const updateRequest = store.getState().requests.channels.updateChannel;
        if (updateRequest.status === RequestStatus.FAILURE) {
            throw new Error(JSON.stringify(updateRequest.error));
        }

        const {channels} = store.getState().entities.channels;
        const channelId = Object.keys(channels)[0];
        assert.ok(channelId);
        assert.ok(channels[channelId]);
        assert.strictEqual(channels[channelId].header, 'MM with Redux2');
    });

    it('getChannel', async () => {
        await Actions.getChannel(TestHelper.basicChannel.id)(store.dispatch, store.getState);

        const channelRequest = store.getState().requests.channels.getChannel;
        if (channelRequest.status === RequestStatus.FAILURE) {
            throw new Error(JSON.stringify(channelRequest.error));
        }

        const {channels} = store.getState().entities.channels;
        assert.ok(channels[TestHelper.basicChannel.id]);
    });

    it('getChannelAndMyMember', async () => {
        await Actions.getChannelAndMyMember(TestHelper.basicChannel.id)(store.dispatch, store.getState);

        const channelRequest = store.getState().requests.channels.getChannel;
        if (channelRequest.status === RequestStatus.FAILURE) {
            throw new Error(JSON.stringify(channelRequest.error));
        }

        const {channels, myMembers} = store.getState().entities.channels;
        assert.ok(channels[TestHelper.basicChannel.id]);
        assert.ok(myMembers[TestHelper.basicChannel.id]);
    });

    it('fetchMyChannelsAndMembers', async () => {
        const user = await TestHelper.basicClient4.createUser(
            TestHelper.fakeUser(),
            null,
            null,
            TestHelper.basicTeam.invite_id
        );

        const directChannel = await Actions.createDirectChannel(TestHelper.basicUser.id, user.id)(store.dispatch, store.getState);

        await Actions.fetchMyChannelsAndMembers(TestHelper.basicTeam.id)(store.dispatch, store.getState);

        const channelsRequest = store.getState().requests.channels.myChannels;
        const membersRequest = store.getState().requests.channels.myMembers;
        if (channelsRequest.status === RequestStatus.FAILURE) {
            throw new Error(JSON.stringify(channelsRequest.error));
        } else if (membersRequest.status === RequestStatus.FAILURE) {
            throw new Error(JSON.stringify(membersRequest.error));
        }

        const {channels, channelsInTeam, myMembers} = store.getState().entities.channels;
        assert.ok(channels);
        assert.ok(myMembers);
        assert.ok(channels[Object.keys(myMembers)[0]]);
        assert.ok(myMembers[Object.keys(channels)[0]]);
        assert.ok(channelsInTeam[''].has(directChannel.data.id));
        assert.equal(Object.keys(channels).length, Object.keys(myMembers).length);
    });

    it('updateChannelNotifyProps', async () => {
        const notifyProps = {
            mark_unread: 'mention',
            desktop: 'none'
        };

        await Actions.fetchMyChannelsAndMembers(TestHelper.basicTeam.id)(store.dispatch, store.getState);
        await Actions.updateChannelNotifyProps(
            TestHelper.basicUser.id,
            TestHelper.basicChannel.id,
            notifyProps)(store.dispatch, store.getState);

        const updateRequest = store.getState().requests.channels.updateChannelNotifyProps;
        if (updateRequest.status === RequestStatus.FAILURE) {
            throw new Error(JSON.stringify(updateRequest.error));
        }

        const members = store.getState().entities.channels.myMembers;
        const member = members[TestHelper.basicChannel.id];
        assert.ok(member);
        assert.equal(member.notify_props.mark_unread, 'mention');
        assert.equal(member.notify_props.desktop, 'none');
    });

    it('deleteChannel', async () => {
        const secondClient = TestHelper.createClient4();
        const user = await TestHelper.basicClient4.createUser(
            TestHelper.fakeUser(),
            null,
            null,
            TestHelper.basicTeam.invite_id
        );
        await secondClient.login(user.email, 'password1');

        const secondChannel = await secondClient.createChannel(
            TestHelper.fakeChannel(TestHelper.basicTeam.id));

        await Actions.joinChannel(
            TestHelper.basicUser.id,
            TestHelper.basicTeam.id,
            secondChannel.id
        )(store.dispatch, store.getState);

        await Actions.fetchMyChannelsAndMembers(TestHelper.basicTeam.id)(store.dispatch, store.getState);

        const incomingHook = await createIncomingHook({channel_id: secondChannel.id, display_name: 'test', description: 'test'})(store.dispatch, store.getState);
        const outgoingHook = await createOutgoingHook({channel_id: secondChannel.id, team_id: TestHelper.basicTeam.id, display_name: 'test', trigger_words: [TestHelper.generateId()], callback_urls: ['http://localhost/notarealendpoint']})(store.dispatch, store.getState);

        await Actions.deleteChannel(
            secondChannel.id
        )(store.dispatch, store.getState);

        const deleteRequest = store.getState().requests.channels.deleteChannel;
        if (deleteRequest.status === RequestStatus.FAILURE) {
            throw new Error(JSON.stringify(deleteRequest.error));
        }

        const {channels, myMembers} = store.getState().entities.channels;
        const {incomingHooks, outgoingHooks} = store.getState().entities.integrations;
        assert.ifError(channels[secondChannel.id]);
        assert.ifError(myMembers[secondChannel.id]);
        assert.ifError(incomingHooks[incomingHook.id]);
        assert.ifError(outgoingHooks[outgoingHook.id]);
    });

    it('viewChannel', async () => {
        const userChannel = await Client4.createChannel(
            TestHelper.fakeChannel(TestHelper.basicTeam.id)
        );
        await Actions.fetchMyChannelsAndMembers(TestHelper.basicTeam.id)(store.dispatch, store.getState);
        const members = store.getState().entities.channels.myMembers;
        const member = members[TestHelper.basicChannel.id];
        const otherMember = members[userChannel.id];
        assert.ok(member);
        assert.ok(otherMember);

        await Actions.viewChannel(
            TestHelper.basicChannel.id,
            userChannel.id
        )(store.dispatch, store.getState);

        const updateRequest = store.getState().requests.channels.updateLastViewedAt;
        if (updateRequest.status === RequestStatus.FAILURE) {
            throw new Error(JSON.stringify(updateRequest.error));
        }
    });

    it('markChannelAsUnread', async () => {
        await getMe()(store.dispatch, store.getState);
        await getMyTeams()(store.dispatch, store.getState);
        await getMyTeamMembers()(store.dispatch, store.getState);
        await getMyTeamUnreads()(store.dispatch, store.getState);

        const userChannel = await Client4.createChannel(
            TestHelper.fakeChannel(TestHelper.basicTeam.id)
        );
        await Actions.fetchMyChannelsAndMembers(TestHelper.basicTeam.id)(store.dispatch, store.getState);

        const {channels} = store.getState().entities.channels;
        assert.ok(channels);

        const channelId = userChannel.id;
        await Actions.markChannelAsUnread(
            TestHelper.basicTeam.id,
            channelId,
            JSON.stringify([TestHelper.basicUser.id])
        )(store.dispatch, store.getState);

        const state = store.getState();
        const {channels: myChannels, myMembers: channelMembers} = state.entities.channels;
        const {myMembers: teamMembers} = state.entities.teams;
        const channel = myChannels[channelId];
        const channelMember = channelMembers[channelId];
        const teamMember = teamMembers[TestHelper.basicTeam.id];

        assert.equal((channel.total_msg_count - channelMember.msg_count), 1);
        assert.equal(channelMember.mention_count, 1);
        assert.equal(teamMember.msg_count, 1);
        assert.equal(teamMember.mention_count, 1);
    });

    describe('markChannelAsRead', async () => {
        it('one read channel', async () => {
            const channelId = TestHelper.generateId();
            const teamId = TestHelper.generateId();

            store = await configureStore({
                entities: {
                    channels: {
                        channels: {
                            [channelId]: {
                                id: channelId,
                                team_id: teamId,
                                total_msg_count: 10
                            }
                        },
                        myMembers: {
                            [channelId]: {
                                channel_id: channelId,
                                mention_count: 0,
                                msg_count: 10
                            }
                        }
                    },
                    teams: {
                        myMembers: {
                            [teamId]: {
                                id: teamId,
                                mention_count: 0,
                                msg_count: 0
                            }
                        }
                    }
                }
            });

            await Actions.markChannelAsRead(channelId)(store.dispatch, store.getState);

            const state = store.getState();

            assert.equal(state.entities.channels.myMembers[channelId].mention_count, 0);
            assert.equal(state.entities.channels.myMembers[channelId].msg_count, state.entities.channels.channels[channelId].total_msg_count);

            assert.equal(state.entities.teams.myMembers[teamId].mention_count, 0);
            assert.equal(state.entities.teams.myMembers[teamId].msg_count, 0);
        });

        it('one unread channel', async () => {
            const channelId = TestHelper.generateId();
            const teamId = TestHelper.generateId();

            store = await configureStore({
                entities: {
                    channels: {
                        channels: {
                            [channelId]: {
                                id: channelId,
                                team_id: teamId,
                                total_msg_count: 10
                            }
                        },
                        myMembers: {
                            [channelId]: {
                                channel_id: channelId,
                                mention_count: 2,
                                msg_count: 5
                            }
                        }
                    },
                    teams: {
                        myMembers: {
                            [teamId]: {
                                id: teamId,
                                mention_count: 2,
                                msg_count: 5
                            }
                        }
                    }
                }
            });

            await Actions.markChannelAsRead(channelId)(store.dispatch, store.getState);

            const state = store.getState();

            assert.equal(state.entities.channels.myMembers[channelId].mention_count, 0);
            assert.equal(state.entities.channels.myMembers[channelId].msg_count, state.entities.channels.channels[channelId].total_msg_count);

            assert.equal(state.entities.teams.myMembers[teamId].mention_count, 0);
            assert.equal(state.entities.teams.myMembers[teamId].msg_count, 0);
        });

        it('one unread DM channel', async () => {
            const channelId = TestHelper.generateId();

            store = await configureStore({
                entities: {
                    channels: {
                        channels: {
                            [channelId]: {
                                id: channelId,
                                team_id: '',
                                total_msg_count: 10
                            }
                        },
                        myMembers: {
                            [channelId]: {
                                channel_id: channelId,
                                mention_count: 2,
                                msg_count: 5
                            }
                        }
                    },
                    teams: {
                        myMembers: {
                        }
                    }
                }
            });

            await Actions.markChannelAsRead(channelId)(store.dispatch, store.getState);

            const state = store.getState();

            assert.equal(state.entities.channels.myMembers[channelId].mention_count, 0);
            assert.equal(state.entities.channels.myMembers[channelId].msg_count, state.entities.channels.channels[channelId].total_msg_count);
        });

        it('two unread channels, same team, reading one', async () => {
            const channelId1 = TestHelper.generateId();
            const channelId2 = TestHelper.generateId();
            const teamId = TestHelper.generateId();

            store = await configureStore({
                entities: {
                    channels: {
                        channels: {
                            [channelId1]: {
                                id: channelId1,
                                team_id: teamId,
                                total_msg_count: 10
                            },
                            [channelId2]: {
                                id: channelId2,
                                team_id: teamId,
                                total_msg_count: 12
                            }
                        },
                        myMembers: {
                            [channelId1]: {
                                channel_id: channelId1,
                                mention_count: 2,
                                msg_count: 5
                            },
                            [channelId2]: {
                                channel_id: channelId2,
                                mention_count: 4,
                                msg_count: 9
                            }
                        }
                    },
                    teams: {
                        myMembers: {
                            [teamId]: {
                                id: teamId,
                                mention_count: 6,
                                msg_count: 8
                            }
                        }
                    }
                }
            });

            await Actions.markChannelAsRead(channelId1)(store.dispatch, store.getState);

            const state = store.getState();

            assert.equal(state.entities.channels.myMembers[channelId1].mention_count, 0);
            assert.equal(state.entities.channels.myMembers[channelId1].msg_count, state.entities.channels.channels[channelId1].total_msg_count);

            assert.equal(state.entities.channels.myMembers[channelId2].mention_count, 4);
            assert.equal(state.entities.channels.myMembers[channelId2].msg_count, 9);

            assert.equal(state.entities.teams.myMembers[teamId].mention_count, 4);
            assert.equal(state.entities.teams.myMembers[teamId].msg_count, 3);
        });

        it('two unread channels, same team, reading both', async () => {
            const channelId1 = TestHelper.generateId();
            const channelId2 = TestHelper.generateId();
            const teamId = TestHelper.generateId();

            store = await configureStore({
                entities: {
                    channels: {
                        channels: {
                            [channelId1]: {
                                id: channelId1,
                                team_id: teamId,
                                total_msg_count: 10
                            },
                            [channelId2]: {
                                id: channelId2,
                                team_id: teamId,
                                total_msg_count: 12
                            }
                        },
                        myMembers: {
                            [channelId1]: {
                                channel_id: channelId1,
                                mention_count: 2,
                                msg_count: 5
                            },
                            [channelId2]: {
                                channel_id: channelId2,
                                mention_count: 4,
                                msg_count: 9
                            }
                        }
                    },
                    teams: {
                        myMembers: {
                            [teamId]: {
                                id: teamId,
                                mention_count: 6,
                                msg_count: 8
                            }
                        }
                    }
                }
            });

            await Actions.markChannelAsRead(channelId1, channelId2)(store.dispatch, store.getState);

            const state = store.getState();

            assert.equal(state.entities.channels.myMembers[channelId1].mention_count, 0);
            assert.equal(state.entities.channels.myMembers[channelId1].msg_count, state.entities.channels.channels[channelId1].total_msg_count);

            assert.equal(state.entities.channels.myMembers[channelId2].mention_count, 0);
            assert.equal(state.entities.channels.myMembers[channelId2].msg_count, state.entities.channels.channels[channelId2].total_msg_count);

            assert.equal(state.entities.teams.myMembers[teamId].mention_count, 0);
            assert.equal(state.entities.teams.myMembers[teamId].msg_count, 0);
        });

        it('two unread channels, same team, reading both (opposite order)', async () => {
            const channelId1 = TestHelper.generateId();
            const channelId2 = TestHelper.generateId();
            const teamId = TestHelper.generateId();

            store = await configureStore({
                entities: {
                    channels: {
                        channels: {
                            [channelId1]: {
                                id: channelId1,
                                team_id: teamId,
                                total_msg_count: 10
                            },
                            [channelId2]: {
                                id: channelId2,
                                team_id: teamId,
                                total_msg_count: 12
                            }
                        },
                        myMembers: {
                            [channelId1]: {
                                channel_id: channelId1,
                                mention_count: 2,
                                msg_count: 5
                            },
                            [channelId2]: {
                                channel_id: channelId2,
                                mention_count: 4,
                                msg_count: 9
                            }
                        }
                    },
                    teams: {
                        myMembers: {
                            [teamId]: {
                                id: teamId,
                                mention_count: 6,
                                msg_count: 8
                            }
                        }
                    }
                }
            });

            await Actions.markChannelAsRead(channelId2, channelId1)(store.dispatch, store.getState);

            const state = store.getState();

            assert.equal(state.entities.channels.myMembers[channelId1].mention_count, 0);
            assert.equal(state.entities.channels.myMembers[channelId1].msg_count, state.entities.channels.channels[channelId1].total_msg_count);

            assert.equal(state.entities.channels.myMembers[channelId2].mention_count, 0);
            assert.equal(state.entities.channels.myMembers[channelId2].msg_count, state.entities.channels.channels[channelId2].total_msg_count);

            assert.equal(state.entities.teams.myMembers[teamId].mention_count, 0);
            assert.equal(state.entities.teams.myMembers[teamId].msg_count, 0);
        });

        it('two unread channels, different teams, reading one', async () => {
            const channelId1 = TestHelper.generateId();
            const channelId2 = TestHelper.generateId();
            const teamId1 = TestHelper.generateId();
            const teamId2 = TestHelper.generateId();

            store = await configureStore({
                entities: {
                    channels: {
                        channels: {
                            [channelId1]: {
                                id: channelId1,
                                team_id: teamId1,
                                total_msg_count: 10
                            },
                            [channelId2]: {
                                id: channelId2,
                                team_id: teamId2,
                                total_msg_count: 12
                            }
                        },
                        myMembers: {
                            [channelId1]: {
                                channel_id: channelId1,
                                mention_count: 2,
                                msg_count: 5
                            },
                            [channelId2]: {
                                channel_id: channelId2,
                                mention_count: 4,
                                msg_count: 9
                            }
                        }
                    },
                    teams: {
                        myMembers: {
                            [teamId1]: {
                                id: teamId1,
                                mention_count: 2,
                                msg_count: 5
                            },
                            [teamId2]: {
                                id: teamId2,
                                mention_count: 4,
                                msg_count: 3
                            }
                        }
                    }
                }
            });

            await Actions.markChannelAsRead(channelId1)(store.dispatch, store.getState);

            const state = store.getState();

            assert.equal(state.entities.channels.myMembers[channelId1].mention_count, 0);
            assert.equal(state.entities.channels.myMembers[channelId1].msg_count, state.entities.channels.channels[channelId1].total_msg_count);

            assert.equal(state.entities.channels.myMembers[channelId2].mention_count, 4);
            assert.equal(state.entities.channels.myMembers[channelId2].msg_count, 9);

            assert.equal(state.entities.teams.myMembers[teamId1].mention_count, 0);
            assert.equal(state.entities.teams.myMembers[teamId1].msg_count, 0);

            assert.equal(state.entities.teams.myMembers[teamId2].mention_count, 4);
            assert.equal(state.entities.teams.myMembers[teamId2].msg_count, 3);
        });

        it('two unread channels, different teams, reading both', async () => {
            const channelId1 = TestHelper.generateId();
            const channelId2 = TestHelper.generateId();
            const teamId1 = TestHelper.generateId();
            const teamId2 = TestHelper.generateId();

            store = await configureStore({
                entities: {
                    channels: {
                        channels: {
                            [channelId1]: {
                                id: channelId1,
                                team_id: teamId1,
                                total_msg_count: 10
                            },
                            [channelId2]: {
                                id: channelId2,
                                team_id: teamId2,
                                total_msg_count: 12
                            }
                        },
                        myMembers: {
                            [channelId1]: {
                                channel_id: channelId1,
                                mention_count: 2,
                                msg_count: 5
                            },
                            [channelId2]: {
                                channel_id: channelId2,
                                mention_count: 4,
                                msg_count: 9
                            }
                        }
                    },
                    teams: {
                        myMembers: {
                            [teamId1]: {
                                id: teamId1,
                                mention_count: 2,
                                msg_count: 5
                            },
                            [teamId2]: {
                                id: teamId2,
                                mention_count: 4,
                                msg_count: 3
                            }
                        }
                    }
                }
            });

            await Actions.markChannelAsRead(channelId1, channelId2)(store.dispatch, store.getState);

            const state = store.getState();

            assert.equal(state.entities.channels.myMembers[channelId1].mention_count, 0);
            assert.equal(state.entities.channels.myMembers[channelId1].msg_count, state.entities.channels.channels[channelId1].total_msg_count);

            assert.equal(state.entities.channels.myMembers[channelId2].mention_count, 0);
            assert.equal(state.entities.channels.myMembers[channelId2].msg_count, state.entities.channels.channels[channelId2].total_msg_count);

            assert.equal(state.entities.teams.myMembers[teamId1].mention_count, 0);
            assert.equal(state.entities.teams.myMembers[teamId1].msg_count, 0);

            assert.equal(state.entities.teams.myMembers[teamId2].mention_count, 0);
            assert.equal(state.entities.teams.myMembers[teamId2].msg_count, 0);
        });

        it('two unread channels, different teams, reading both (opposite order)', async () => {
            const channelId1 = TestHelper.generateId();
            const channelId2 = TestHelper.generateId();
            const teamId1 = TestHelper.generateId();
            const teamId2 = TestHelper.generateId();

            store = await configureStore({
                entities: {
                    channels: {
                        channels: {
                            [channelId1]: {
                                id: channelId1,
                                team_id: teamId1,
                                total_msg_count: 10
                            },
                            [channelId2]: {
                                id: channelId2,
                                team_id: teamId2,
                                total_msg_count: 12
                            }
                        },
                        myMembers: {
                            [channelId1]: {
                                channel_id: channelId1,
                                mention_count: 2,
                                msg_count: 5
                            },
                            [channelId2]: {
                                channel_id: channelId2,
                                mention_count: 4,
                                msg_count: 9
                            }
                        }
                    },
                    teams: {
                        myMembers: {
                            [teamId1]: {
                                id: teamId1,
                                mention_count: 2,
                                msg_count: 5
                            },
                            [teamId2]: {
                                id: teamId2,
                                mention_count: 4,
                                msg_count: 3
                            }
                        }
                    }
                }
            });

            await Actions.markChannelAsRead(channelId1, channelId2)(store.dispatch, store.getState);

            const state = store.getState();

            assert.equal(state.entities.channels.myMembers[channelId1].mention_count, 0);
            assert.equal(state.entities.channels.myMembers[channelId1].msg_count, state.entities.channels.channels[channelId1].total_msg_count);

            assert.equal(state.entities.channels.myMembers[channelId2].mention_count, 0);
            assert.equal(state.entities.channels.myMembers[channelId2].msg_count, state.entities.channels.channels[channelId2].total_msg_count);

            assert.equal(state.entities.teams.myMembers[teamId1].mention_count, 0);
            assert.equal(state.entities.teams.myMembers[teamId1].msg_count, 0);

            assert.equal(state.entities.teams.myMembers[teamId2].mention_count, 0);
            assert.equal(state.entities.teams.myMembers[teamId2].msg_count, 0);
        });
    });

    it('getChannels', async () => {
        const userClient = TestHelper.createClient4();
        const user = await TestHelper.basicClient4.createUser(
            TestHelper.fakeUser(),
            null,
            null,
            TestHelper.basicTeam.invite_id
        );
        await userClient.login(user.email, 'password1');

        const userChannel = await userClient.createChannel(
            TestHelper.fakeChannel(TestHelper.basicTeam.id)
        );

        await Actions.getChannels(TestHelper.basicTeam.id, 0)(store.dispatch, store.getState);

        const moreRequest = store.getState().requests.channels.getChannels;
        if (moreRequest.status === RequestStatus.FAILURE) {
            throw new Error(JSON.stringify(moreRequest.error));
        }

        const {channels, channelsInTeam, myMembers} = store.getState().entities.channels;
        const channel = channels[userChannel.id];
        const team = channelsInTeam[userChannel.team_id];

        assert.ok(channel);
        assert.ok(team);
        assert.ok(team.has(userChannel.id));
        assert.ifError(myMembers[channel.id]);
    });

    it('getChannelMembers', async () => {
        await Actions.getChannelMembers(TestHelper.basicChannel.id)(store.dispatch, store.getState);

        const membersRequest = store.getState().requests.channels.members;
        if (membersRequest.status === RequestStatus.FAILURE) {
            throw new Error(JSON.stringify(membersRequest.error));
        }

        const {membersInChannel} = store.getState().entities.channels;

        assert.ok(membersInChannel);
        assert.ok(membersInChannel[TestHelper.basicChannel.id]);
        assert.ok(membersInChannel[TestHelper.basicChannel.id][TestHelper.basicUser.id]);
    });

    it('getChannelMember', async () => {
        await Actions.getChannelMember(TestHelper.basicChannel.id, TestHelper.basicUser.id)(store.dispatch, store.getState);

        const membersRequest = store.getState().requests.channels.members;
        if (membersRequest.status === RequestStatus.FAILURE) {
            throw new Error(JSON.stringify(membersRequest.error));
        }

        const {membersInChannel} = store.getState().entities.channels;

        assert.ok(membersInChannel);
        assert.ok(membersInChannel[TestHelper.basicChannel.id]);
        assert.ok(membersInChannel[TestHelper.basicChannel.id][TestHelper.basicUser.id]);
    });

    it('getMyChannelMember', async () => {
        await Actions.getMyChannelMember(TestHelper.basicChannel.id)(store.dispatch, store.getState);

        const membersRequest = store.getState().requests.channels.members;
        if (membersRequest.status === RequestStatus.FAILURE) {
            throw new Error(JSON.stringify(membersRequest.error));
        }

        const {myMembers} = store.getState().entities.channels;

        assert.ok(myMembers);
        assert.ok(myMembers[TestHelper.basicChannel.id]);
    });

    it('getChannelMembersByIds', async () => {
        await Actions.getChannelMembersByIds(TestHelper.basicChannel.id, [TestHelper.basicUser.id])(store.dispatch, store.getState);

        const membersRequest = store.getState().requests.channels.members;
        if (membersRequest.status === RequestStatus.FAILURE) {
            throw new Error(JSON.stringify(membersRequest.error));
        }

        const {membersInChannel} = store.getState().entities.channels;

        assert.ok(membersInChannel);
        assert.ok(membersInChannel[TestHelper.basicChannel.id]);
        assert.ok(membersInChannel[TestHelper.basicChannel.id][TestHelper.basicUser.id]);
    });

    it('getChannelStats', async () => {
        await Actions.getChannelStats(
            TestHelper.basicChannel.id
        )(store.dispatch, store.getState);

        const statsRequest = store.getState().requests.channels.getChannelStats;
        if (statsRequest.status === RequestStatus.FAILURE) {
            throw new Error(JSON.stringify(statsRequest.error));
        }

        const {stats} = store.getState().entities.channels;
        const stat = stats[TestHelper.basicChannel.id];
        assert.ok(stat);
        assert.equal(stat.member_count, 1);
    });

    it('addChannelMember', async () => {
        const channelId = TestHelper.basicChannel.id;

        const user = await TestHelper.basicClient4.createUser(
            TestHelper.fakeUser(),
            null,
            null,
            TestHelper.basicTeam.invite_id
        );

        await Actions.joinChannel(
            TestHelper.basicUser.id,
            TestHelper.basicTeam.id,
            channelId
        )(store.dispatch, store.getState);

        await Actions.getChannelStats(
            channelId
        )(store.dispatch, store.getState);

        let state = store.getState();
        let {stats} = state.entities.channels;
        assert.ok(stats, 'stats');
        assert.ok(stats[channelId], 'stats for channel');
        assert.ok(stats[channelId].member_count, 'member count for channel');
        assert.equal(stats[channelId].member_count, 1, 'incorrect member count for channel');

        await Actions.addChannelMember(
            channelId,
            user.id
        )(store.dispatch, store.getState);

        state = store.getState();

        const addRequest = state.requests.channels.addChannelMember;
        if (addRequest.status === RequestStatus.FAILURE) {
            throw new Error(JSON.stringify(addRequest.error));
        }

        const {profilesInChannel, profilesNotInChannel} = state.entities.users;
        const channel = profilesInChannel[channelId];
        const notChannel = profilesNotInChannel[channelId];
        assert.ok(channel);
        assert.ok(notChannel);
        assert.ok(channel.has(user.id));
        assert.ifError(notChannel.has(user.id));

        stats = state.entities.channels.stats;
        assert.ok(stats, 'stats');
        assert.ok(stats[channelId], 'stats for channel');
        assert.ok(stats[channelId].member_count, 'member count for channel');
        assert.equal(stats[channelId].member_count, 2, 'incorrect member count for channel');
    });

    it('removeChannelMember', async () => {
        const channelId = TestHelper.basicChannel.id;

        const user = await TestHelper.basicClient4.createUser(
            TestHelper.fakeUser(),
            null,
            null,
            TestHelper.basicTeam.invite_id
        );

        await Actions.joinChannel(
                TestHelper.basicUser.id,
                TestHelper.basicTeam.id,
                channelId
            )(store.dispatch, store.getState);

        await Actions.getChannelStats(
            channelId
        )(store.dispatch, store.getState);

        await Actions.addChannelMember(
            channelId,
            user.id
        )(store.dispatch, store.getState);

        let state = store.getState();
        let {stats} = state.entities.channels;
        assert.ok(stats, 'stats');
        assert.ok(stats[channelId], 'stats for channel');
        assert.ok(stats[channelId].member_count, 'member count for channel');
        assert.equal(stats[channelId].member_count, 3, 'incorrect member count for channel');

        await Actions.removeChannelMember(
            channelId,
            user.id
        )(store.dispatch, store.getState);

        state = store.getState();

        const removeRequest = state.requests.channels.removeChannelMember;
        if (removeRequest.status === RequestStatus.FAILURE) {
            throw new Error(JSON.stringify(removeRequest.error));
        }

        const {profilesInChannel, profilesNotInChannel} = state.entities.users;
        const channel = profilesInChannel[channelId];
        const notChannel = profilesNotInChannel[channelId];
        assert.ok(channel);
        assert.ok(notChannel);
        assert.ok(notChannel.has(user.id));
        assert.ifError(channel.has(user.id));

        stats = state.entities.channels.stats;
        assert.ok(stats, 'stats');
        assert.ok(stats[channelId], 'stats for channel');
        assert.ok(stats[channelId].member_count, 'member count for channel');
        assert.equal(stats[channelId].member_count, 2, 'incorrect member count for channel');
    });

    it('updateChannelMemberRoles', async () => {
        const user = await TestHelper.basicClient4.createUser(TestHelper.fakeUser());
        await addUserToTeam(TestHelper.basicTeam.id, user.id)(store.dispatch, store.getState);
        await Actions.addChannelMember(TestHelper.basicChannel.id, user.id)(store.dispatch, store.getState);

        const roles = General.CHANNEL_USER_ROLE + ' ' + General.CHANNEL_ADMIN_ROLE;
        await Actions.updateChannelMemberRoles(TestHelper.basicChannel.id, user.id, roles)(store.dispatch, store.getState);

        const membersRequest = store.getState().requests.channels.updateChannelMember;
        const members = store.getState().entities.channels.membersInChannel;

        if (membersRequest.status === RequestStatus.FAILURE) {
            throw new Error(JSON.stringify(membersRequest.error));
        }

        assert.ok(members[TestHelper.basicChannel.id]);
        assert.ok(members[TestHelper.basicChannel.id][user.id]);
        assert.ok(members[TestHelper.basicChannel.id][user.id].roles === roles);
    });

    it('updateChannelHeader', async () => {
        await Actions.getChannel(TestHelper.basicChannel.id)(store.dispatch, store.getState);

        const channelRequest = store.getState().requests.channels.getChannel;
        if (channelRequest.status === RequestStatus.FAILURE) {
            throw new Error(JSON.stringify(channelRequest.error));
        }

        const header = 'this is an updated test header';
        await Actions.updateChannelHeader(
            TestHelper.basicChannel.id,
            header
        )(store.dispatch, store.getState);
        const {channels} = store.getState().entities.channels;
        const channel = channels[TestHelper.basicChannel.id];
        assert.ok(channel);
        assert.deepEqual(channel.header, header);
    });

    it('updateChannelPurpose', async () => {
        await Actions.getChannel(TestHelper.basicChannel.id)(store.dispatch, store.getState);

        const channelRequest = store.getState().requests.channels.getChannel;
        if (channelRequest.status === RequestStatus.FAILURE) {
            throw new Error(JSON.stringify(channelRequest.error));
        }

        const purpose = 'this is an updated test purpose';
        await Actions.updateChannelPurpose(
            TestHelper.basicChannel.id,
            purpose
        )(store.dispatch, store.getState);
        const {channels} = store.getState().entities.channels;
        const channel = channels[TestHelper.basicChannel.id];
        assert.ok(channel);
        assert.deepEqual(channel.purpose, purpose);
    });

    it('leaveChannel', (done) => {
        async function test() {
            await login(TestHelper.basicUser.email, 'password1')(store.dispatch, store.getState);
            await Actions.joinChannel(
                TestHelper.basicUser.id,
                TestHelper.basicTeam.id,
                TestHelper.basicChannel.id
            )(store.dispatch, store.getState);

            const {channels, myMembers} = store.getState().entities.channels;
            assert.ok(channels[TestHelper.basicChannel.id]);
            assert.ok(myMembers[TestHelper.basicChannel.id]);

            TestHelper.activateMocking();
            nock(Client4.getBaseRoute()).
            delete(`/channels/${TestHelper.basicChannel.id}/members/${TestHelper.basicUser.id}`).
            reply(400);

            // This action will retry after 1000ms
            await Actions.leaveChannel(
                TestHelper.basicChannel.id
            )(store.dispatch, store.getState);
            nock.restore();

            setTimeout(test2, 1200);
        }

        async function test2() {
            // retry will have completed and should have left the channel successfully
            const {channels, myMembers} = store.getState().entities.channels;

            assert.ok(channels[TestHelper.basicChannel.id]);
            assert.ifError(myMembers[TestHelper.basicChannel.id]);
            done();
        }

        test();
    });

    it('leave private channel', async() => {
        let channel = {
            team_id: TestHelper.basicTeam.id,
            name: 'redux-test-private',
            display_name: 'Redux Test',
            purpose: 'This is to test redux',
            header: 'MM with Redux',
            type: 'P'
        };

        channel = await Actions.createChannel(channel, TestHelper.basicUser.id)(store.dispatch, store.getState);
        let channels = store.getState().entities.channels.channels;
        assert.ok(channels[channel.id]);

        await Actions.leaveChannel(
            channel.id
        )(store.dispatch, store.getState);
        channels = store.getState().entities.channels.channels;
        const myMembers = store.getState().entities.channels.myMembers;
        assert.ok(!channels[channel.id]);
        assert.ok(!myMembers[channel.id]);
    });

    it('joinChannel', async () => {
        await Actions.joinChannel(
            TestHelper.basicUser.id,
            TestHelper.basicTeam.id,
            TestHelper.basicChannel.id
        )(store.dispatch, store.getState);

        const joinRequest = store.getState().requests.channels.joinChannel;
        if (joinRequest.status === RequestStatus.FAILURE) {
            throw new Error(JSON.stringify(joinRequest.error));
        }

        const {channels, myMembers} = store.getState().entities.channels;
        assert.ok(channels[TestHelper.basicChannel.id]);
        assert.ok(myMembers[TestHelper.basicChannel.id]);
    });

    it('joinChannelByName', async () => {
        const secondClient = TestHelper.createClient4();
        const user = await TestHelper.basicClient4.createUser(
            TestHelper.fakeUser(),
            null,
            null,
            TestHelper.basicTeam.invite_id
        );
        await secondClient.login(user.email, 'password1');

        const secondChannel = await secondClient.createChannel(
            TestHelper.fakeChannel(TestHelper.basicTeam.id));

        await Actions.joinChannel(
            TestHelper.basicUser.id,
            TestHelper.basicTeam.id,
            null,
            secondChannel.name
        )(store.dispatch, store.getState);

        const joinRequest = store.getState().requests.channels.joinChannel;
        if (joinRequest.status === RequestStatus.FAILURE) {
            throw new Error(JSON.stringify(joinRequest.error));
        }

        const {channels, myMembers} = store.getState().entities.channels;
        assert.ok(channels[secondChannel.id]);
        assert.ok(myMembers[secondChannel.id]);
    });

    it('favoriteChannel', async () => {
        Actions.favoriteChannel(TestHelper.basicChannel.id)(store.dispatch, store.getState);

        const state = store.getState();
        const prefKey = getPreferenceKey(Preferences.CATEGORY_FAVORITE_CHANNEL, TestHelper.basicChannel.id);
        const preference = state.entities.preferences.myPreferences[prefKey];
        assert.ok(preference);
        assert.ok(preference.value === 'true');
    });

    it('unfavoriteChannel', async () => {
        Actions.favoriteChannel(TestHelper.basicChannel.id)(store.dispatch, store.getState);

        let state = store.getState();
        let prefKey = getPreferenceKey(Preferences.CATEGORY_FAVORITE_CHANNEL, TestHelper.basicChannel.id);
        let preference = state.entities.preferences.myPreferences[prefKey];
        assert.ok(preference);
        assert.ok(preference.value === 'true');

        Actions.unfavoriteChannel(TestHelper.basicChannel.id)(store.dispatch, store.getState);

        state = store.getState();
        prefKey = getPreferenceKey(Preferences.CATEGORY_FAVORITE_CHANNEL, TestHelper.basicChannel.id);
        preference = state.entities.preferences.myPreferences[prefKey];
        assert.ok(!preference);
    });
});
