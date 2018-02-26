// Copyright (c) 2017 Mattermost, Inc. All Rights Reserved.
// See License.txt for license information.

import assert from 'assert';

import deepFreezeAndThrowOnMutation from 'utils/deep_freeze';
import TestHelper from 'test/test_helper';
import {sortChannelsByDisplayName} from 'utils/channel_utils';
import * as Selectors from 'selectors/entities/channels';
import {General, Preferences} from 'constants';

describe('Selectors.Channels', () => {
    const team1 = TestHelper.fakeTeamWithId();
    const team2 = TestHelper.fakeTeamWithId();

    const channel1 = TestHelper.fakeChannelWithId(team1.id);
    channel1.display_name = 'Channel Name';

    const channel2 = TestHelper.fakeChannelWithId(team1.id);
    channel2.total_msg_count = 2;
    channel2.display_name = 'DEF';

    const channel3 = TestHelper.fakeChannelWithId(team2.id);
    channel3.total_msg_count = 2;

    const channel4 = TestHelper.fakeChannelWithId('');
    channel4.display_name = 'Channel 4';

    const channel5 = TestHelper.fakeChannelWithId(team1.id);
    channel5.type = General.PRIVATE_CHANNEL;
    channel5.display_name = 'Channel 5';

    const channel6 = TestHelper.fakeChannelWithId(team1.id);
    const channel7 = TestHelper.fakeChannelWithId('');
    channel7.display_name = '';
    channel7.type = General.GM_CHANNEL;
    channel7.total_msg_count = 1;

    const channel8 = TestHelper.fakeChannelWithId(team1.id);
    channel8.display_name = 'ABC';
    channel8.total_msg_count = 1;

    const channel9 = TestHelper.fakeChannelWithId(team1.id);
    const channel10 = TestHelper.fakeChannelWithId(team1.id);
    const channel11 = TestHelper.fakeChannelWithId(team1.id);
    channel11.type = General.PRIVATE_CHANNEL;

    const channels = {};
    channels[channel1.id] = channel1;
    channels[channel2.id] = channel2;
    channels[channel3.id] = channel3;
    channels[channel4.id] = channel4;
    channels[channel5.id] = channel5;
    channels[channel6.id] = channel6;
    channels[channel7.id] = channel7;
    channels[channel8.id] = channel8;
    channels[channel9.id] = channel9;
    channels[channel10.id] = channel10;
    channels[channel11.id] = channel11;

    const channelsInTeam = {};
    channelsInTeam[team1.id] = [channel1.id, channel2.id, channel5.id, channel6.id, channel8.id, channel10.id, channel11.id];
    channelsInTeam[team2.id] = [channel3.id];
    channelsInTeam[''] = [channel4.id, channel7.id, channel9.id];

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
    membersInChannel[channel5.id][user.id] = {channel_id: channel5.id, user_id: user.id};
    membersInChannel[channel6.id] = {};
    membersInChannel[channel8.id] = {};
    membersInChannel[channel8.id][user.id] = {channel_id: channel8.id, user_id: user.id};
    membersInChannel[channel9.id] = {};
    membersInChannel[channel9.id][user.id] = {channel_id: channel9.id, user_id: user.id};
    membersInChannel[channel10.id] = {};
    membersInChannel[channel10.id][user.id] = {channel_id: channel10.id, user_id: user.id};
    membersInChannel[channel11.id] = {};
    membersInChannel[channel11.id][user.id] = {channel_id: channel11.id, user_id: user.id};

    const myMembers = {};
    myMembers[channel1.id] = {channel_id: channel1.id, user_id: user.id};
    myMembers[channel2.id] = {channel_id: channel2.id, user_id: user.id, msg_count: 1, mention_count: 1, notify_props: {}};
    myMembers[channel3.id] = {channel_id: channel3.id, user_id: user.id, msg_count: 1, mention_count: 1, notify_props: {}};
    myMembers[channel4.id] = {channel_id: channel4.id, user_id: user.id};
    myMembers[channel5.id] = {channel_id: channel5.id, user_id: user.id};
    myMembers[channel7.id] = {channel_id: channel7.id, user_id: user.id, msg_count: 0, notify_props: {}};
    myMembers[channel8.id] = {channel_id: channel7.id, user_id: user.id, msg_count: 0, notify_props: {}};
    myMembers[channel9.id] = {channel_id: channel9.id, user_id: user.id};
    myMembers[channel10.id] = {channel_id: channel10.id, user_id: user.id};
    myMembers[channel11.id] = {channel_id: channel11.id, user_id: user.id};

    const myPreferences = {
        [`${Preferences.CATEGORY_FAVORITE_CHANNEL}--${channel1.id}`]: {
            name: channel1.id,
            category: Preferences.CATEGORY_FAVORITE_CHANNEL,
            value: 'true',
        },
        [`${Preferences.CATEGORY_FAVORITE_CHANNEL}--${channel9.id}`]: {
            name: channel9.id,
            category: Preferences.CATEGORY_FAVORITE_CHANNEL,
            value: 'true',
        },
    };

    const testState = deepFreezeAndThrowOnMutation({
        entities: {
            users: {
                currentUserId: user.id,
                profiles,
                profilesInChannel: {[channel7.id]: [user.id]},
            },
            teams: {
                currentTeamId: team1.id,
            },
            channels: {
                currentChannelId: channel1.id,
                channels,
                channelsInTeam,
                membersInChannel,
                myMembers,
            },
            posts: {
                posts: {},
            },
            preferences: {
                myPreferences,
            },
            general: {
                config: {},
            },
        },
    });

    it('should return channels in current team', () => {
        const channelsInCurrentTeam = [channel1, channel2, channel5, channel6, channel8, channel10, channel11].sort(sortChannelsByDisplayName.bind(null, []));
        assert.deepEqual(Selectors.getChannelsInCurrentTeam(testState), channelsInCurrentTeam);
    });

    it('get my channels in current team and DMs', () => {
        const channelsInCurrentTeam = [channel1, channel2, channel5, channel8, channel10, channel11].sort(sortChannelsByDisplayName.bind(null, []));
        assert.deepEqual(Selectors.getMyChannels(testState), [...channelsInCurrentTeam, channel4, channel7, channel9]);
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

    it('get channel map for current team', () => {
        const channelMap = {
            [channel1.name]: channel1,
            [channel2.name]: channel2,
            [channel5.name]: channel5,
            [channel6.name]: channel6,
            [channel8.name]: channel8,
            [channel10.name]: channel10,
            [channel11.name]: channel11,
        };
        assert.deepEqual(Selectors.getChannelsNameMapInCurrentTeam(testState), channelMap);
    });

    it('get channels by category', () => {
        const categories = Selectors.getChannelsByCategory(testState);
        const {
            favoriteChannels,
            publicChannels,
            privateChannels,
            directAndGroupChannels,
        } = categories;

        assert.equal(favoriteChannels.length, 2);
        assert.equal(publicChannels.length, 4);
        assert.equal(privateChannels.length, 2);
        assert.equal(directAndGroupChannels.length, 0);
    });

    it('get channels by category including unreads', () => {
        const categories = Selectors.getChannelsWithUnreadSection(testState);
        const {
            unreadChannels,
            favoriteChannels,
            publicChannels,
            privateChannels,
            directAndGroupChannels,
        } = categories;

        assert.equal(unreadChannels.length, 1);
        assert.equal(favoriteChannels.length, 2);
        assert.equal(publicChannels.length, 2);
        assert.equal(privateChannels.length, 2);
        assert.equal(directAndGroupChannels.length, 0);
    });

    it('get group channels', () => {
        assert.deepEqual(Selectors.getGroupChannels(testState), [channel7]);
    });

    it('get direct channel ids strict equal', () => {
        const chan1 = {...testState.entities.channels.channels[channel1.id]};
        chan1.total_msg_count += 1; // no reason to set it to 1, this is just to make sure the state changed

        const modifiedState = {
            ...testState,
            entities: {
                ...testState.entities,
                channels: {
                    ...testState.entities.channels,
                    channels: {
                        ...testState.entities.channels.channels,
                        [channel1.id]: chan1,
                    },
                },
            },
        };

        const fromOriginalState = Selectors.getDirectChannelIds(testState);
        const fromModifiedState = Selectors.getDirectChannelIds(modifiedState);

        assert.ok(fromOriginalState === fromModifiedState);

        // it should't have a channel that belongs to a team
        assert.ifError(fromModifiedState.includes(channel1.id));
    });

    it('get channel ids in current team strict equal', () => {
        const newChannel = TestHelper.fakeChannelWithId(team2.id);
        const modifiedState = {
            ...testState,
            entities: {
                ...testState.entities,
                channels: {
                    ...testState.entities.channels,
                    channels: {
                        ...testState.entities.channels.channels,
                        [newChannel.id]: newChannel,
                    },
                    channelsInTeam: {
                        ...testState.entities.channels.channelsInTeam,
                        [team2.id]: [
                            ...testState.entities.channels.channelsInTeam[team2.id],
                            newChannel.id,
                        ],
                    },
                },
            },
        };

        const fromOriginalState = Selectors.getChannelIdsInCurrentTeam(testState);
        const fromModifiedState = Selectors.getChannelIdsInCurrentTeam(modifiedState);

        assert.ok(fromOriginalState === fromModifiedState);

        // it should't have a direct channel
        assert.ifError(fromModifiedState.includes(channel7.id));
    });

    it('get channel ids for current team strict equal', () => {
        const anotherChannel = TestHelper.fakeChannelWithId(team2.id);
        const modifiedState = {
            ...testState,
            entities: {
                ...testState.entities,
                channels: {
                    ...testState.entities.channels,
                    channels: {
                        ...testState.entities.channels.channels,
                        [anotherChannel.id]: anotherChannel,
                    },
                    channelsInTeam: {
                        ...testState.entities.channels.channelsInTeam,
                        [team2.id]: [
                            ...testState.entities.channels.channelsInTeam[team2.id],
                            anotherChannel.id,
                        ],
                    },
                },
            },
        };

        const fromOriginalState = Selectors.getChannelIdsForCurrentTeam(testState);
        const fromModifiedState = Selectors.getChannelIdsForCurrentTeam(modifiedState);

        assert.ok(fromOriginalState === fromModifiedState);

        // it should have a direct channel
        assert.ok(fromModifiedState.includes(channel7.id));
    });

    it('get unread channel ids in current team strict equal', () => {
        const chan2 = {...testState.entities.channels.channels[channel2.id]};
        chan2.total_msg_count = 10;

        const modifiedState = {
            ...testState,
            entities: {
                ...testState.entities,
                channels: {
                    ...testState.entities.channels,
                    channels: {
                        ...testState.entities.channels.channels,
                        [channel2.id]: chan2,
                    },
                },
            },
        };

        const fromOriginalState = Selectors.getUnreadChannelIds(testState);
        const fromModifiedState = Selectors.getUnreadChannelIds(modifiedState);

        assert.ok(fromOriginalState === fromModifiedState);
    });

    it('get unread channel ids in current team and keep specified channel as unread', () => {
        const chan2 = {...testState.entities.channels.channels[channel2.id]};
        chan2.total_msg_count = 10;

        const modifiedState = {
            ...testState,
            entities: {
                ...testState.entities,
                channels: {
                    ...testState.entities.channels,
                    channels: {
                        ...testState.entities.channels.channels,
                        [channel2.id]: chan2,
                    },
                },
            },
        };

        const fromOriginalState = Selectors.getUnreadChannelIds(testState);
        const fromModifiedState = Selectors.getUnreadChannelIds(modifiedState, {id: channel1.id});

        assert.ok(fromOriginalState !== fromModifiedState);
        assert.ok(fromModifiedState.includes(channel1.id));
    });

    it('get sorted unread channel ids in current team strict equal', () => {
        const chan2 = {...testState.entities.channels.channels[channel2.id]};
        chan2.total_msg_count = 10;

        const modifiedState = {
            ...testState,
            entities: {
                ...testState.entities,
                channels: {
                    ...testState.entities.channels,
                    channels: {
                        ...testState.entities.channels.channels,
                        [channel2.id]: chan2,
                    },
                },
            },
        };

        // When adding a mention to channel8 with display_name 'ABC' states are !== and channel8 is above all others
        const mentionState = {
            ...modifiedState,
            entities: {
                ...modifiedState.entities,
                channels: {
                    ...modifiedState.entities.channels,
                    myMembers: {
                        ...modifiedState.entities.channels.myMembers,
                        [channel8.id]: {
                            ...modifiedState.entities.channels.myMembers[channel8.id],
                            mention_count: 1,
                        },
                    },
                },
            },
        };

        const fromOriginalState = Selectors.getSortedUnreadChannelIds(testState);
        const fromModifiedState = Selectors.getSortedUnreadChannelIds(modifiedState);
        const fromMentionState = Selectors.getSortedUnreadChannelIds(mentionState);

        assert.ok(fromOriginalState === fromModifiedState);
        assert.ok(fromMentionState !== fromModifiedState);

        // Channel 2 with display_name 'DEF' is above all others
        assert.ok(fromModifiedState[0] === channel2.id);

        // Channel 8 with display_name 'ABC' is above all others
        assert.ok(fromMentionState[0] === channel8.id);
    });

    it('get sorted favorite channel ids in current team strict equal', () => {
        const chan1 = {...testState.entities.channels.channels[channel1.id]};
        chan1.total_msg_count = 10;

        const modifiedState = {
            ...testState,
            entities: {
                ...testState.entities,
                channels: {
                    ...testState.entities.channels,
                    channels: {
                        ...testState.entities.channels.channels,
                        [channel1.id]: chan1,
                    },
                },
            },
        };

        const fromOriginalState = Selectors.getSortedFavoriteChannelIds(testState);
        const fromModifiedState = Selectors.getSortedFavoriteChannelIds(modifiedState);

        assert.ok(fromOriginalState === fromModifiedState);
        assert.ok(fromModifiedState[0] === channel1.id);

        const chan9 = {...testState.entities.channels.channels[channel9.id]};
        chan9.display_name = 'abc';

        const updateState = {
            ...modifiedState,
            entities: {
                ...modifiedState.entities,
                channels: {
                    ...modifiedState.entities.channels,
                    channels: {
                        ...modifiedState.entities.channels.channels,
                        [channel9.id]: chan9,
                    },
                },
            },
        };

        const fromUpdateState = Selectors.getSortedFavoriteChannelIds(updateState);
        assert.ok(fromModifiedState !== fromUpdateState);
        assert.ok(fromUpdateState[0] === channel9.id);
    });

    it('get sorted public channel ids in current team strict equal', () => {
        const chan10 = {...testState.entities.channels.channels[channel10.id]};
        chan10.header = 'This should not change the results';

        const modifiedState = {
            ...testState,
            entities: {
                ...testState.entities,
                channels: {
                    ...testState.entities.channels,
                    channels: {
                        ...testState.entities.channels.channels,
                        [channel10.id]: chan10,
                    },
                },
            },
        };

        const fromOriginalState = Selectors.getSortedPublicChannelIds(testState);
        const fromModifiedState = Selectors.getSortedPublicChannelIds(modifiedState);

        assert.ok(fromOriginalState === fromModifiedState);
        assert.ok(fromModifiedState[0] === channel4.id);

        chan10.display_name = 'abc';
        const updateState = {
            ...modifiedState,
            entities: {
                ...modifiedState.entities,
                channels: {
                    ...modifiedState.entities.channels,
                    channels: {
                        ...modifiedState.entities.channels.channels,
                        [channel10.id]: chan10,
                    },
                },
            },
        };

        const fromUpdateState = Selectors.getSortedPublicChannelIds(updateState);
        assert.ok(fromModifiedState !== fromUpdateState);
        assert.ok(fromUpdateState[0] === channel10.id);
    });

    it('get sorted private channel ids in current team strict equal', () => {
        const chan11 = {...testState.entities.channels.channels[channel11.id]};
        chan11.header = 'This should not change the results';

        const modifiedState = {
            ...testState,
            entities: {
                ...testState.entities,
                channels: {
                    ...testState.entities.channels,
                    channels: {
                        ...testState.entities.channels.channels,
                        [channel11.id]: chan11,
                    },
                },
            },
        };

        const fromOriginalState = Selectors.getSortedPrivateChannelIds(testState);
        const fromModifiedState = Selectors.getSortedPrivateChannelIds(modifiedState);

        assert.ok(fromOriginalState === fromModifiedState);
        assert.ok(fromModifiedState[0] === channel5.id);

        chan11.display_name = 'abc';
        const updateState = {
            ...modifiedState,
            entities: {
                ...modifiedState.entities,
                channels: {
                    ...modifiedState.entities.channels,
                    channels: {
                        ...modifiedState.entities.channels.channels,
                        [channel11.id]: chan11,
                    },
                },
            },
        };

        const fromUpdateState = Selectors.getSortedPrivateChannelIds(updateState);
        assert.ok(fromModifiedState !== fromUpdateState);
        assert.ok(fromUpdateState[0] === channel11.id);
    });
});
