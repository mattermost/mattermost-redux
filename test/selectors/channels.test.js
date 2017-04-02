// Copyright (c) 2017 Mattermost, Inc. All Rights Reserved.
// See License.txt for license information.

import assert from 'assert';

import deepFreezeAndThrowOnMutation from 'utils/deep_freeze';
import TestHelper from 'test/test_helper';
import {sortChannelsByDisplayName} from 'utils/channel_utils';
import * as Selectors from 'selectors/entities/channels';

describe('Selectors.Channels', () => {
    const team1 = TestHelper.fakeTeamWithId();
    const team2 = TestHelper.fakeTeamWithId();

    const channel1 = TestHelper.fakeChannelWithId(team1.id);
    const channel2 = TestHelper.fakeChannelWithId(team1.id);
    const channel3 = TestHelper.fakeChannelWithId(team2.id);
    const channel4 = TestHelper.fakeChannelWithId('');

    const channels = {};
    channels[channel1.id] = channel1;
    channels[channel2.id] = channel2;
    channels[channel3.id] = channel3;
    channels[channel4.id] = channel4;

    const channelsInTeam = {};
    channelsInTeam[team1.id] = [channel1.id, channel2.id];
    channelsInTeam[team2.id] = [channel3.id];
    channelsInTeam[''] = [channel4.id];

    const user = TestHelper.fakeUserWithId();
    const profiles = {};
    profiles[user.id] = user;

    const members = {};
    members[channel1.id + user.id] = {channel_id: channel1.id, user_id: user.id};
    members[channel2.id + user.id] = {channel_id: channel2.id, user_id: user.id};
    members[channel3.id + user.id] = {channel_id: channel3.id, user_id: user.id};
    members[channel4.id + user.id] = {channel_id: channel4.id, user_id: user.id};

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
                members
            }
        }
    });

    it('should return channels in current team', () => {
        const channelsInCurrentTeam = [channel1, channel2].sort(sortChannelsByDisplayName.bind(null, []));
        assert.deepEqual(Selectors.getChannelsInCurrentTeam(testState), channelsInCurrentTeam);
    });

    it('should return members in current channel', () => {
        assert.deepEqual(Selectors.getMembersInCurrentChannel(testState), [members[channel1.id + user.id]]);
    });
});
