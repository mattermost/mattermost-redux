// Copyright (c) 2016 Mattermost, Inc. All Rights Reserved.
// See License.txt for license information.

import assert from 'assert';
import nock from 'nock';

import * as Actions from 'actions/channels';
import {getProfilesByIds, login} from 'actions/users';
import {Client, Client4} from 'client';
import {RequestStatus} from 'constants';
import TestHelper from 'test/test_helper';
import configureStore from 'test/test_store';

describe('Actions.Channels', () => {
    let store;
    let secondChannel;
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
        await Actions.createDirectChannel(TestHelper.basicUser.id, user.id)(store.dispatch, store.getState);

        const createRequest = store.getState().requests.channels.createChannel;
        if (createRequest.status === RequestStatus.FAILURE) {
            throw new Error(createRequest.error);
        }

        const state = store.getState();
        const {channels, myMembers} = state.entities.channels;
        const profiles = state.entities.users.profiles;
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
        assert.ok(channelsInTeam[''].has(directChannel.id));
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
            TestHelper.basicTeam.id,
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

    it('leaveChannel', (done) => {
        async function test() {
            await login(TestHelper.basicUser.email, 'password1')(store.dispatch, store.getState);
            await Actions.joinChannel(
                TestHelper.basicUser.id,
                TestHelper.basicTeam.id,
                TestHelper.basicChannel.id
            )(store.dispatch, store.getState);

            TestHelper.activateMocking();
            nock(Client4.getBaseRoute()).
            delete(`/channels/${TestHelper.basicChannel.id}/members/${TestHelper.basicUser.id}`).
            reply(400);

            await Actions.leaveChannel(
                TestHelper.basicChannel.id
            )(store.dispatch, store.getState);
            nock.restore();

            setTimeout(test2, 100);
        }

        async function test2() {
            let {channels, myMembers} = store.getState().entities.channels;
            assert.ok(channels[TestHelper.basicChannel.id]);
            assert.ok(myMembers[TestHelper.basicChannel.id]);

            await Actions.leaveChannel(
                TestHelper.basicChannel.id
            )(store.dispatch, store.getState);
            channels = store.getState().entities.channels.channels;
            myMembers = store.getState().entities.channels.myMembers;
            assert.ok(channels[TestHelper.basicChannel.id]);
            assert.ifError(myMembers[TestHelper.basicChannel.id]);
            done();
        }

        test();
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

        secondChannel = await secondClient.createChannel(
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

    it('deleteChannel', async () => {
        await Actions.fetchMyChannelsAndMembers(TestHelper.basicTeam.id)(store.dispatch, store.getState);
        await Actions.deleteChannel(
            secondChannel.id
        )(store.dispatch, store.getState);

        const deleteRequest = store.getState().requests.channels.deleteChannel;
        if (deleteRequest.status === RequestStatus.FAILURE) {
            throw new Error(JSON.stringify(deleteRequest.error));
        }

        const {channels, myMembers} = store.getState().entities.channels;
        assert.ifError(channels[secondChannel.id]);
        assert.ifError(myMembers[secondChannel.id]);
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

        const {members} = store.getState().entities.channels;

        assert.ok(members);
        assert.ok(members[TestHelper.basicChannel.id + TestHelper.basicUser.id]);
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
        const user = await TestHelper.basicClient4.createUser(
            TestHelper.fakeUser(),
            null,
            null,
            TestHelper.basicTeam.invite_id
        );

        await Actions.addChannelMember(
            TestHelper.basicChannel.id,
            user.id
        )(store.dispatch, store.getState);

        const addRequest = store.getState().requests.channels.addChannelMember;
        if (addRequest.status === RequestStatus.FAILURE) {
            throw new Error(JSON.stringify(addRequest.error));
        }

        const {profilesInChannel, profilesNotInChannel} = store.getState().entities.users;
        const channel = profilesInChannel[TestHelper.basicChannel.id];
        const notChannel = profilesNotInChannel[TestHelper.basicChannel.id];
        assert.ok(channel);
        assert.ok(notChannel);
        assert.ok(channel.has(user.id));
        assert.ifError(notChannel.has(user.id));
    });

    it('removeChannelMember', async () => {
        const user = await TestHelper.basicClient4.createUser(
            TestHelper.fakeUser(),
            null,
            null,
            TestHelper.basicTeam.invite_id
        );

        await Actions.addChannelMember(
            TestHelper.basicChannel.id,
            user.id
        )(store.dispatch, store.getState);

        await Actions.removeChannelMember(
            TestHelper.basicChannel.id,
            user.id
        )(store.dispatch, store.getState);

        const removeRequest = store.getState().requests.channels.removeChannelMember;
        if (removeRequest.status === RequestStatus.FAILURE) {
            throw new Error(JSON.stringify(removeRequest.error));
        }

        const {profilesInChannel, profilesNotInChannel} = store.getState().entities.users;
        const channel = profilesInChannel[TestHelper.basicChannel.id];
        const notChannel = profilesNotInChannel[TestHelper.basicChannel.id];
        assert.ok(channel);
        assert.ok(notChannel);
        assert.ok(notChannel.has(user.id));
        assert.ifError(channel.has(user.id));
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
});
