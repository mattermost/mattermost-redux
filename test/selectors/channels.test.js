// Copyright (c) 2017 Mattermost, Inc. All Rights Reserved.
// See License.txt for license information.

import assert from 'assert';

import deepFreezeAndThrowOnMutation from 'utils/deep_freeze';
import TestHelper from 'test/test_helper';
import {sortChannelsByDisplayName} from 'utils/channel_utils';
import * as Selectors from 'selectors/entities/channels';
import {General} from 'constants';

describe('Selectors.Channels', () => {
    const team1 = TestHelper.fakeTeamWithId();
    const team2 = TestHelper.fakeTeamWithId();

    const channel1 = TestHelper.fakeChannelWithId(team1.id);
    const channel2 = TestHelper.fakeChannelWithId(team1.id);
    const channel3 = TestHelper.fakeChannelWithId(team2.id);
    const channel4 = TestHelper.fakeChannelWithId('');
    const channel5 = TestHelper.fakeChannelWithId(team1.id);
    channel5.type = General.PRIVATE_CHANNEL;
    const channel6 = TestHelper.fakeChannelWithId(team1.id);

    const channels = {};
    channels[channel1.id] = channel1;
    channels[channel2.id] = channel2;
    channels[channel3.id] = channel3;
    channels[channel4.id] = channel4;
    channels[channel5.id] = channel5;
    channels[channel6.id] = channel6;

    const channelsInTeam = {};
    channelsInTeam[team1.id] = [channel1.id, channel2.id, channel5.id, channel6.id];
    channelsInTeam[team2.id] = [channel3.id];
    channelsInTeam[''] = [channel4.id];

    const user = TestHelper.fakeUserWithId();
    const profiles = {};
    profiles[user.id] = user;

    const membersInChannel = {};
    membersInChannel[channel1.id] = {};
    membersInChannel[channel1.id][user.id] = {channel_id: channel1.id, user_id: user.id};
    membersInChannel[channel2.id] = {};
    membersInChannel[channel2.id][user.id] = {channel_id: channel2.id, user_id: user.id};
    membersInChannel[channel3.id] = {};
    membersInChannel[channel3.id][user.id] = {channel_id: channel3.id, user_id: user.id};
    membersInChannel[channel4.id] = {};
    membersInChannel[channel4.id][user.id] = {channel_id: channel4.id, user_id: user.id};
    membersInChannel[channel5.id] = {};
    membersInChannel[channel6.id] = {};

    const myMembers = {};
    myMembers[channel1.id] = {channel_id: channel1.id, user_id: user.id};
    myMembers[channel2.id] = {channel_id: channel2.id, user_id: user.id, mention_count: 1};
    myMembers[channel3.id] = {channel_id: channel3.id, user_id: user.id, mention_count: 1};
    myMembers[channel4.id] = {channel_id: channel4.id, user_id: user.id};

    const testState = deepFreezeAndThrowOnMutation({
        entities: {
            users: {
                currentUserId: user.id,
                profiles
            },
            teams: {
                currentTeamId: team1.id
            },
            channels: {
                currentChannelId: channel1.id,
                channels,
                channelsInTeam,
                membersInChannel,
                myMembers
            }
        }
    });

    it('should return channels in current team', () => {
        const channelsInCurrentTeam = [channel1, channel2, channel5, channel6].sort(sortChannelsByDisplayName.bind(null, []));
        assert.deepEqual(Selectors.getChannelsInCurrentTeam(testState), channelsInCurrentTeam);
    });

    it('get my channels in current team and DMs', () => {
        const channelsInCurrentTeam = [channel1, channel2].sort(sortChannelsByDisplayName.bind(null, []));
        assert.deepEqual(Selectors.getMyChannels(testState), [...channelsInCurrentTeam, channel4]);
    });

    it('should return members in current channel', () => {
        assert.deepEqual(Selectors.getMembersInCurrentChannel(testState), membersInChannel[channel1.id]);
    });

    it('get public channels not member of', () => {
        assert.deepEqual(Selectors.getOtherChannels(testState), [channel6]);
    });

    it('get channel', () => {
        assert.deepEqual(Selectors.getChannel(testState, channel1.id), channel1);
    });

    it('get unreads for current team', () => {
        assert.equal(Selectors.getUnreadsInCurrentTeam(testState).mentionCount, 1);
    });
});
