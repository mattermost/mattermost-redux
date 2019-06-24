// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import assert from 'assert';

import deepFreezeAndThrowOnMutation from 'utils/deep_freeze';
import TestHelper from 'test/test_helper';
import {sortChannelsByDisplayName, getDirectChannelName} from 'utils/channel_utils';
import * as Selectors from 'selectors/entities/channels';
import {General, Preferences} from 'constants';

describe('Selectors.Channels', () => {
    const team1 = TestHelper.fakeTeamWithId();
    const team2 = TestHelper.fakeTeamWithId();
    const user = TestHelper.fakeUserWithId();
    const user2 = TestHelper.fakeUserWithId();
    const user3 = TestHelper.fakeUserWithId();
    const profiles = {};
    profiles[user.id] = user;
    profiles[user2.id] = user2;
    profiles[user3.id] = user3;
    profiles.fakeUserId = TestHelper.fakeUserWithId('fakeUserId');

    const channel1 = TestHelper.fakeChannelWithId(team1.id);
    channel1.display_name = 'Channel Name';
    channel1.name = 'Name';
    channel1.last_post_at = Date.now();

    const channel2 = TestHelper.fakeChannelWithId(team1.id);
    channel2.total_msg_count = 2;
    channel2.display_name = 'DEF';
    channel2.last_post_at = Date.now();

    const channel3 = TestHelper.fakeChannelWithId(team2.id);
    channel3.total_msg_count = 2;
    channel3.last_post_at = Date.now();

    const channel4 = TestHelper.fakeChannelWithId('');
    channel4.display_name = 'Channel 4';
    channel4.last_post_at = Date.now();

    const channel5 = TestHelper.fakeChannelWithId(team1.id);
    channel5.type = General.PRIVATE_CHANNEL;
    channel5.display_name = 'Channel 5';
    channel5.last_post_at = Date.now();

    const channel5Del = TestHelper.fakeChannelWithId('');
    channel5Del.type = General.PRIVATE_CHANNEL;
    channel5Del.display_name = 'Channel 5 Archived';
    channel5Del.last_post_at = Date.now();
    channel5Del.delete_at = 555;

    const channel6 = TestHelper.fakeChannelWithId(team1.id);
    channel6.last_post_at = Date.now();

    const channel6Del = TestHelper.fakeChannelWithId(team1.id);
    channel6Del.last_post_at = Date.now();
    channel6Del.delete_at = 444;

    const channel7 = TestHelper.fakeChannelWithId('');
    channel7.display_name = [user.username, user2.username, user3.username].join(', ');
    channel7.type = General.GM_CHANNEL;
    channel7.total_msg_count = 1;
    channel7.last_post_at = Date.now();

    const channel8 = TestHelper.fakeChannelWithId(team1.id);
    channel8.display_name = 'ABC';
    channel8.total_msg_count = 1;
    channel8.last_post_at = Date.now();

    const channel9 = TestHelper.fakeChannelWithId(team1.id);
    channel9.last_post_at = Date.now();

    const channel10 = TestHelper.fakeChannelWithId(team1.id);
    channel10.last_post_at = Date.now();

    const channel11 = TestHelper.fakeChannelWithId(team1.id);
    channel11.type = General.PRIVATE_CHANNEL;
    channel11.last_post_at = Date.now();

    const channel12 = TestHelper.fakeChannelWithId(team1.id);
    channel12.type = General.DM_CHANNEL;
    channel12.last_post_at = Date.now();
    channel12.name = getDirectChannelName(user.id, user2.id);
    channel12.display_name = 'dm_test';

    const channel13 = TestHelper.fakeDmChannel(user.id, 'fakeUserId');
    channel13.total_msg_count = 3;
    channel13.display_name = 'test';

    const channels = {};
    channels[channel1.id] = channel1;
    channels[channel2.id] = channel2;
    channels[channel3.id] = channel3;
    channels[channel4.id] = channel4;
    channels[channel5.id] = channel5;
    channels[channel5Del.id] = channel5Del;
    channels[channel6.id] = channel6;
    channels[channel6Del.id] = channel6Del;
    channels[channel7.id] = channel7;
    channels[channel8.id] = channel8;
    channels[channel9.id] = channel9;
    channels[channel10.id] = channel10;
    channels[channel11.id] = channel11;
    channels[channel12.id] = channel12;
    channels[channel13.id] = channel13;

    const channelsInTeam = {};
    channelsInTeam[team1.id] = [channel1.id, channel2.id, channel5.id, channel5Del.id, channel6.id, channel6Del.id, channel8.id, channel10.id, channel11.id];
    channelsInTeam[team2.id] = [channel3.id];
    channelsInTeam[''] = [channel4.id, channel7.id, channel9.id, channel13.id];

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
    membersInChannel[channel5Del.id] = {};
    membersInChannel[channel5Del.id][user.id] = {channel_id: channel5Del.id, user_id: user.id};
    membersInChannel[channel6.id] = {};
    membersInChannel[channel6Del.id] = {};
    membersInChannel[channel7.id] = {};
    membersInChannel[channel7.id][user.id] = {channel_id: channel7.id, user_id: user.id};
    membersInChannel[channel7.id][user2.id] = {channel_id: channel7.id, user_id: user2.id};
    membersInChannel[channel7.id][user3.id] = {channel_id: channel7.id, user_id: user3.id};
    membersInChannel[channel8.id] = {};
    membersInChannel[channel8.id][user.id] = {channel_id: channel8.id, user_id: user.id};
    membersInChannel[channel9.id] = {};
    membersInChannel[channel9.id][user.id] = {channel_id: channel9.id, user_id: user.id};
    membersInChannel[channel10.id] = {};
    membersInChannel[channel10.id][user.id] = {channel_id: channel10.id, user_id: user.id};
    membersInChannel[channel11.id] = {};
    membersInChannel[channel11.id][user.id] = {channel_id: channel11.id, user_id: user.id};
    membersInChannel[channel12.id] = {};
    membersInChannel[channel12.id][user.id] = {channel_id: channel12.id, user_id: user.id};
    membersInChannel[channel12.id][user2.id] = {channel_id: channel12.id, user_id: user2.id};
    membersInChannel[channel13.id] = {};
    membersInChannel[channel13.id][user.id] = {channel_id: channel13.id, user_id: user.id};
    membersInChannel[channel13.id][user2.id] = {channel_id: channel13.id, user_id: user2.id};

    const myMembers = {};
    myMembers[channel1.id] = {channel_id: channel1.id, user_id: user.id};
    myMembers[channel2.id] = {channel_id: channel2.id, user_id: user.id, msg_count: 1, mention_count: 1, notify_props: {}};
    myMembers[channel3.id] = {channel_id: channel3.id, user_id: user.id, msg_count: 1, mention_count: 1, notify_props: {}};
    myMembers[channel4.id] = {channel_id: channel4.id, user_id: user.id};
    myMembers[channel5.id] = {channel_id: channel5.id, user_id: user.id};
    myMembers[channel5Del.id] = {channel_id: channel5Del.id, user_id: user.id};
    myMembers[channel7.id] = {channel_id: channel7.id, user_id: user.id, msg_count: 0, notify_props: {}};
    myMembers[channel8.id] = {channel_id: channel8.id, user_id: user.id, msg_count: 0, notify_props: {}};
    myMembers[channel9.id] = {channel_id: channel9.id, user_id: user.id};
    myMembers[channel10.id] = {channel_id: channel10.id, user_id: user.id};
    myMembers[channel11.id] = {channel_id: channel11.id, user_id: user.id};
    myMembers[channel12.id] = {channel_id: channel12.id, user_id: user.id, msg_count: 0, notifyProps: {}};
    myMembers[channel13.id] = {channel_id: channel13.id, user_id: user.id, msg_count: 1, notifyProps: {}};

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
                profilesInChannel: {
                    [channel7.id]: new Set([user.id, user2.id, user3.id]),
                    [channel12.id]: new Set([user.id, user2.id]),
                    [channel13.id]: null,
                },
                statuses: {},
            },
            teams: {
                currentTeamId: team1.id,
                teams: {
                    [team1.id]: {
                        id: team1.id,
                    },
                    [team2.id]: {
                        id: team2.id,
                    },
                },
                myMembers: {
                    [team1.id]: {
                        mention_count: 2,
                        msg_count: 10,
                    },
                    [team2.id]: {
                        id: team2.id,
                        mention_count: 1,
                        msg_count: 1,
                    },
                },
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
                postsInChannel: {},
            },
            preferences: {
                myPreferences,
            },
            general: {
                config: {},
            },
        },
    });

    const sortUsernames = (a, b) => a.localeCompare(b, General.DEFAULT_LOCALE, {numeric: true});

    it('should return channels in current team', () => {
        const channelsInCurrentTeam = [channel1, channel2, channel5, channel5Del, channel6, channel6Del, channel8, channel10, channel11].sort(sortChannelsByDisplayName.bind(null, []));
        assert.deepEqual(Selectors.getChannelsInCurrentTeam(testState), channelsInCurrentTeam);
    });

    it('get my channels in current team and DMs', () => {
        const channelsInCurrentTeam = [channel1, channel2, channel5, channel5Del, channel8, channel10, channel11].sort(sortChannelsByDisplayName.bind(null, []));
        assert.deepEqual(Selectors.getMyChannels(testState), [
            ...channelsInCurrentTeam,
            channel4,
            {...channel7, display_name: [user2.username, user3.username].sort(sortUsernames).join(', ')},
            channel9,
            {...channel13, display_name: profiles.fakeUserId.username},
        ]);
    });

    it('should return members in current channel', () => {
        assert.deepEqual(Selectors.getMembersInCurrentChannel(testState), membersInChannel[channel1.id]);
    });

    it('get public channels not member of', () => {
        assert.deepEqual(Selectors.getOtherChannels(testState), [channel6, channel6Del].sort(sortChannelsByDisplayName.bind(null, [])));
    });

    it('get public, unarchived channels not member of', () => {
        assert.deepEqual(Selectors.getOtherChannels(testState, false), [channel6]);
    });

    it('get archived channels that user is member of', () => {
        assert.deepEqual(Selectors.getArchivedChannels(testState), [channel5Del]);
    });

    it('get channel', () => {
        assert.deepEqual(Selectors.getChannel(testState, channel1.id), channel1);
    });

    it('get first channel that matches by name', () => {
        assert.deepEqual(Selectors.getChannelByName(testState, channel1.name), channel1);
    });

    it('get unreads for current team', () => {
        assert.equal(Selectors.getUnreadsInCurrentTeam(testState).mentionCount, 3);
    });

    it('get unreads', () => {
        assert.deepEqual(Selectors.getUnreads(testState), {messageCount: 4, mentionCount: 4});
    });

    it('get unreads with a missing profile entity', () => {
        const newProfiles = {
            ...testState.entities.users.profiles,
        };
        Reflect.deleteProperty(newProfiles, 'fakeUserId');
        const newState = {
            ...testState,
            entities: {
                ...testState.entities,
                users: {
                    ...testState.entities.users,
                    profiles: newProfiles,
                },
            },
        };

        assert.deepEqual(Selectors.getUnreads(newState), {messageCount: 4, mentionCount: 2});
        assert.deepEqual(Selectors.getUnreadsInCurrentTeam(newState), {messageCount: 3, mentionCount: 1});
    });

    it('get unreads with a deactivated user', () => {
        const newProfiles = {
            ...testState.entities.users.profiles,
            fakeUserId: {
                ...testState.entities.users.profiles.fakeUserId,
                delete_at: 100,
            },
        };

        const newState = {
            ...testState,
            entities: {
                ...testState.entities,
                users: {
                    ...testState.entities.users,
                    profiles: newProfiles,
                },
            },
        };
        assert.deepEqual(Selectors.getUnreads(newState), {messageCount: 4, mentionCount: 2});
        assert.deepEqual(Selectors.getUnreadsInCurrentTeam(newState), {messageCount: 3, mentionCount: 1});
    });

    it('get unreads with a deactivated channel', () => {
        const newChannels = {
            ...testState.entities.channels.channels,
            [channel2.id]: {
                ...testState.entities.channels.channels[channel2.id],
                delete_at: 100,
            },
        };

        const newState = {
            ...testState,
            entities: {
                ...testState.entities,
                channels: {
                    ...testState.entities.channels,
                    channels: newChannels,
                },
            },
        };

        assert.deepEqual(Selectors.getUnreads(newState), {messageCount: 3, mentionCount: 3});
        assert.deepEqual(Selectors.getUnreadsInCurrentTeam(newState), {messageCount: 2, mentionCount: 2});
    });

    it('get channel map for current team', () => {
        const channelMap = {
            [channel1.name]: channel1,
            [channel2.name]: channel2,
            [channel5.name]: channel5,
            [channel5Del.name]: channel5Del,
            [channel6.name]: channel6,
            [channel6Del.name]: channel6Del,
            [channel8.name]: channel8,
            [channel10.name]: channel10,
            [channel11.name]: channel11,
        };
        assert.deepEqual(Selectors.getChannelsNameMapInCurrentTeam(testState), channelMap);
    });

    it('get channel map for team', () => {
        const channelMap = {
            [channel1.name]: channel1,
            [channel2.name]: channel2,
            [channel5.name]: channel5,
            [channel5Del.name]: channel5Del,
            [channel6.name]: channel6,
            [channel6Del.name]: channel6Del,
            [channel8.name]: channel8,
            [channel10.name]: channel10,
            [channel11.name]: channel11,
        };
        assert.deepEqual(Selectors.getChannelsNameMapInTeam(testState, team1.id), channelMap);
        assert.deepEqual(Selectors.getChannelsNameMapInTeam(testState, 'junk'), {});
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
        assert.deepEqual(Selectors.getGroupChannels(testState), [
            {...channel7, display_name: [user2.username, user3.username].sort(sortUsernames).join(', ')},
        ]);
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
        assert.equal(fromModifiedState.includes(channel1.id), false, 'should not have a channel that belongs to a team');
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
        assert.equal(fromModifiedState.includes(channel7.id), false, 'should not have direct channel on a team');
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

        // mentions should be prioritized to the top
        assert.ok(fromOriginalState === fromModifiedState);
        assert.ok(fromMentionState !== fromModifiedState);

        // channel8 and channel2 are above all others
        // since default order is "alpha", channel8 with display_name "ABC" should come first
        assert.ok(fromMentionState[0] === channel8.id);

        // followed by channel2 with display_name "DEF"
        assert.ok(fromMentionState[1] === channel2.id);

        const hasMentionMutedChannelState = {
            ...mentionState,
            entities: {
                ...mentionState.entities,
                channels: {
                    ...mentionState.entities.channels,
                    myMembers: {
                        ...mentionState.entities.channels.myMembers,
                        [channel8.id]: {
                            mention_count: 1,
                            notify_props: {
                                mark_unread: 'mention',
                            },
                        },
                    },
                },
            },
        };

        const fromHasMentionMutedChannelState = Selectors.getSortedUnreadChannelIds(hasMentionMutedChannelState);

        // For channels with mentions, non-muted channel2 should come first before muted channel8.
        assert.ok(fromHasMentionMutedChannelState[0] === channel2.id);
        assert.ok(fromHasMentionMutedChannelState[1] === channel8.id);
        assert.ok(fromHasMentionMutedChannelState[2] === channel7.id);
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

    it('filters post IDs by the given condition', () => {
        const posts = {
            a: {id: 'a', channel_id: channel1.id, create_at: 1, user_id: user.id},
            b: {id: 'b', channel_id: channel2.id, create_at: 2, user_id: user.id},
            c: {id: 'c', root_id: 'a', channel_id: channel1.id, create_at: 3, user_id: 'b'},
        };
        const testStateC = JSON.parse(JSON.stringify(testState));
        testStateC.entities.posts.posts = posts;
        testStateC.entities.channels.channels[channel2.id].delete_at = 1;

        const filterPostIDsByArchived = Selectors.filterPostIds((channel) => channel.delete_at !== 0);
        const filterPostIDsByUserB = Selectors.filterPostIds((channel, post) => post.user_id === 'b');

        const filterPostIDsInvalid = Selectors.filterPostIds((channel, post) => foo === 'b'); // eslint-disable-line
        let filterErrorMessage;
        try {
            const result = ['bar'].filter((item) => foo === 'b'); // eslint-disable-line
        } catch (e) {
            filterErrorMessage = e.message;
        }

        const postIDs = Object.keys(posts);

        assert.deepEqual(filterPostIDsByArchived(testStateC, postIDs), ['b']);
        assert.deepEqual(filterPostIDsByUserB(testStateC, postIDs), ['c']);

        assert.throws(() => Selectors.filterPostIds(), TypeError);

        assert.throws(() => filterPostIDsInvalid(testStateC, postIDs), ReferenceError, filterErrorMessage);
    });

    it('isCurrentChannelFavorite', () => {
        assert.ok(Selectors.isCurrentChannelFavorite(testState) === true);

        const newState = {
            entities: {
                channels: {
                    currentChannelId: channel1.id,
                },
                preferences: {
                    myPreferences: [],
                },
            },
        };
        assert.ok(Selectors.isCurrentChannelFavorite(newState) === false);
    });

    it('isCurrentChannelMuted', () => {
        assert.ok(Selectors.isCurrentChannelMuted(testState) === false);

        const newState = {
            entities: {
                channels: {
                    ...testState.entities.channels,
                    myMembers: {
                        [channel1.id]: {
                            notify_props: {
                                mark_unread: 'mention',
                            },
                        },
                    },
                },
            },
        };
        assert.ok(Selectors.isCurrentChannelMuted(newState) === true);
    });

    it('isCurrentChannelArchived', () => {
        assert.ok(Selectors.isCurrentChannelArchived(testState) === false);

        const newState = {
            entities: {
                ...testState.entities,
                channels: {
                    ...testState.entities.channels,
                    channels: {
                        [channel1.id]: {
                            delete_at: 1,
                        },
                    },
                },
            },
        };
        assert.ok(Selectors.isCurrentChannelArchived(newState) === true);
    });

    it('isCurrentChannelDefault', () => {
        assert.ok(Selectors.isCurrentChannelDefault(testState) === false);

        const newState = {
            entities: {
                ...testState.entities,
                channels: {
                    ...testState.entities.channels,
                    channels: {
                        [channel1.id]: {
                            display_name: 'Town Square',
                            name: 'town-square',
                        },
                    },
                },
            },
        };
        assert.ok(Selectors.isCurrentChannelDefault(newState) === true);
    });

    describe('getDirectAndGroupChannels', () => {
        const getDirectAndGroupChannels = Selectors.getDirectAndGroupChannels;

        it('will return no channels if there is no active user', () => {
            const state = {
                ...testState,
                entities: {
                    ...testState.entities,
                    users: {
                        ...testState.entities.users,
                        currentUserId: null,
                    },
                },
            };

            assert.deepEqual(getDirectAndGroupChannels(state), []);
        });

        it('will return only direct and group message channels', () => {
            const state = {
                ...testState,
                entities: {
                    ...testState.entities,
                    users: {
                        ...testState.entities.users,
                    },
                },
            };

            assert.deepEqual(getDirectAndGroupChannels(state), [
                {...channel7, display_name: [user2.username, user3.username].sort(sortUsernames).join(', ')},
                {...channel12, display_name: user2.username},
                {...channel13, display_name: profiles.fakeUserId.username},
            ]);
        });

        it('will not error out on undefined channels', () => {
            const state = {
                ...testState,
                entities: {
                    ...testState.entities,
                    users: {
                        ...testState.entities.users,
                    },
                    channels: {
                        ...testState.entities.channels,
                        channels: {
                            ...testState.entities.channels.channels,
                            ['undefined']: undefined, //eslint-disable-line no-useless-computed-key
                        },
                    },
                },
            };

            assert.deepEqual(getDirectAndGroupChannels(state), [
                {...channel7, display_name: [user2.username, user3.username].sort(sortUsernames).join(', ')},
                {...channel12, display_name: user2.username},
                {...channel13, display_name: profiles.fakeUserId.username},
            ]);
        });

        it('Should not include deleted users in favorites', () => {
            const newDmChannel = TestHelper.fakeDmChannel(user.id, 'newfakeId');
            newDmChannel.total_msg_count = 1;
            newDmChannel.display_name = '';
            newDmChannel.name = getDirectChannelName(user.id, 'newfakeId');

            const newState = {
                ...testState,
                entities: {
                    ...testState.entities,
                    channels: {
                        ...testState.entities.channels,
                        channels: {
                            ...testState.entities.channels.channels,
                            [newDmChannel.id]: newDmChannel,
                        },
                        channelsInTeam: {
                            ...testState.entities.channels.channelsInTeam,
                            '': [
                                ...testState.entities.channels.channelsInTeam[''],
                                newDmChannel.id,
                            ],
                        },
                        myMembers: {
                            ...testState.entities.channels.myMembers,
                            [newDmChannel.id]: {channel_id: newDmChannel.id, user_id: user.id, msg_count: 1, mention_count: 0, notifyProps: {}},
                        },
                    },
                    preferences: {
                        myPreferences: {
                            ...testState.entities.preferences.myPreferences,
                            [`${Preferences.CATEGORY_FAVORITE_CHANNEL}--${newDmChannel.id}`]: {
                                name: newDmChannel.id,
                                category: Preferences.CATEGORY_FAVORITE_CHANNEL,
                                value: 'true',
                            },
                            [`${Preferences.CATEGORY_DIRECT_CHANNEL_SHOW}--newfakeId`]: {
                                category: Preferences.CATEGORY_DIRECT_CHANNEL_SHOW,
                                name: 'newfakeId',
                                value: 'true',
                            },
                        },
                    },
                },

            };
            const fromOriginalState = Selectors.getSortedFavoriteChannelWithUnreadsIds(testState);
            const fromModifiedState = Selectors.getSortedFavoriteChannelWithUnreadsIds(newState);
            assert.ok(fromOriginalState.length === 2);
            assert.ok(fromModifiedState.length === 2);
        });

        it('get ordered channel ids by_type in current team strict equal', () => {
            const chan11 = {...testState.entities.channels.channels[channel11.id]};
            chan11.header = 'This should not change the results';

            const sidebarPrefs = {
                grouping: 'by_type',
                sorting: 'alpha',
                unreads_at_top: 'true',
                favorite_at_top: 'true',
            };

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

            const fromOriginalState = Selectors.getOrderedChannelIds(
                testState,
                null,
                sidebarPrefs.grouping,
                sidebarPrefs.sorting,
                sidebarPrefs.unreads_at_top === 'true',
                sidebarPrefs.favorite_at_top === 'true',
            );

            const fromModifiedState = Selectors.getOrderedChannelIds(
                modifiedState,
                null,
                sidebarPrefs.grouping,
                sidebarPrefs.sorting,
                sidebarPrefs.unreads_at_top === 'true',
                sidebarPrefs.favorite_at_top === 'true',
            );

            assert.deepEqual(fromOriginalState, fromModifiedState);

            chan11.total_msg_count = 10;

            const unreadChannelState = {
                ...modifiedState,
                entities: {
                    ...modifiedState.entities,
                    channels: {
                        ...modifiedState.entities.channels,
                        channels: {
                            ...modifiedState.entities.channels.channels,
                            [channel11.id]: chan11,
                        },
                        myMembers: {
                            ...modifiedState.entities.channels.myMembers,
                            [channel11.id]: {
                                ...modifiedState.entities.channels.myMembers[channel11.id],
                                mention_count: 1,
                            },
                        },
                    },
                },
            };

            const fromUnreadState = Selectors.getOrderedChannelIds(
                unreadChannelState,
                null,
                sidebarPrefs.grouping,
                sidebarPrefs.sorting,
                sidebarPrefs.unreads_at_top === 'true',
                sidebarPrefs.favorite_at_top === 'true',
            );

            assert.notDeepEqual(fromModifiedState, fromUnreadState);

            const favoriteChannelState = {
                ...modifiedState,
                entities: {
                    ...modifiedState.entities,
                    preferences: {
                        ...modifiedState.entities.preferences,
                        [`${Preferences.CATEGORY_FAVORITE_CHANNEL}--${channel10.id}`]: {
                            name: channel10.id,
                            category: Preferences.CATEGORY_FAVORITE_CHANNEL,
                            value: 'true',
                        },
                    },
                },
            };

            const fromFavoriteState = Selectors.getOrderedChannelIds(
                favoriteChannelState,
                null,
                sidebarPrefs.grouping,
                sidebarPrefs.sorting,
                sidebarPrefs.unreads_at_top === 'true',
                sidebarPrefs.favorite_at_top === 'true',
            );

            assert.notDeepEqual(fromUnreadState, fromFavoriteState);
        });

        it('get ordered channel ids by recency order in current team strict equal', () => {
            const chan5 = {...testState.entities.channels.channels[channel5.id]};
            chan5.header = 'This should not change the results';

            const sidebarPrefs = {
                grouping: 'never',
                sorting: 'recent',
                unreads_at_top: 'false',
                favorite_at_top: 'false',
            };

            const modifiedState = {
                ...testState,
                entities: {
                    ...testState.entities,
                    channels: {
                        ...testState.entities.channels,
                        channels: {
                            ...testState.entities.channels.channels,
                            [channel5.id]: chan5,
                        },
                    },
                },
            };

            const fromOriginalState = Selectors.getOrderedChannelIds(
                testState,
                null,
                sidebarPrefs.grouping,
                sidebarPrefs.sorting,
                sidebarPrefs.unreads_at_top === 'true',
                sidebarPrefs.favorite_at_top === 'true',
            );

            const fromModifiedState = Selectors.getOrderedChannelIds(
                modifiedState,
                null,
                sidebarPrefs.grouping,
                sidebarPrefs.sorting,
                sidebarPrefs.unreads_at_top === 'true',
                sidebarPrefs.favorite_at_top === 'true',
            );

            assert.deepEqual(fromOriginalState, fromModifiedState);

            chan5.last_post_at = (new Date()).getTime() + 500;
            const recencyInChan5State = {
                ...modifiedState,
                entities: {
                    ...modifiedState.entities,
                    channels: {
                        ...modifiedState.entities.channels,
                        channels: {
                            ...modifiedState.entities.channels.channels,
                            [chan5.id]: chan5,
                        },
                    },
                },
            };

            const fromRecencyInChan5State = Selectors.getOrderedChannelIds(
                recencyInChan5State,
                null,
                sidebarPrefs.grouping,
                sidebarPrefs.sorting,
                sidebarPrefs.unreads_at_top === 'true',
                sidebarPrefs.favorite_at_top === 'true',
            );
            assert.notDeepEqual(fromModifiedState, fromRecencyInChan5State);
            assert.ok(fromRecencyInChan5State[0].items[0] === chan5.id);

            const chan6 = {...testState.entities.channels.channels[channel6.id]};
            chan6.last_post_at = (new Date()).getTime() + 500;
            const recencyInChan6State = {
                ...modifiedState,
                entities: {
                    ...modifiedState.entities,
                    channels: {
                        ...modifiedState.entities.channels,
                        channels: {
                            ...modifiedState.entities.channels.channels,
                            [channel4.id]: chan6,
                        },
                    },
                },
            };

            const fromRecencyInChan6State = Selectors.getOrderedChannelIds(
                recencyInChan6State,
                null,
                sidebarPrefs.grouping,
                sidebarPrefs.sorting,
                sidebarPrefs.unreads_at_top === 'true',
                sidebarPrefs.favorite_at_top === 'true',
            );

            assert.notDeepEqual(fromRecencyInChan5State, fromRecencyInChan6State);
            assert.ok(fromRecencyInChan6State[0].items[0] === chan6.id);
        });
    });

    describe('more_direct_channels selector', () => {
        it('getChannelsWithUserProfiles', () => {
            const channelWithUserProfiles = Selectors.getChannelsWithUserProfiles(testState);
            assert.equal(channelWithUserProfiles.length, 1);
            assert.equal(channelWithUserProfiles[0].profiles.length, 2);
        });
    });

    describe('get_redirect_channel_name_for_team selector', () => {
        it('getRedirectChannelNameForTeam without advanced permissions', () => {
            const modifiedState = {
                ...testState,
                entities: {
                    ...testState.entities,
                    general: {
                        ...testState.entities.general,
                        serverVersion: '4.8.0',
                    },
                },
            };
            assert.equal(Selectors.getRedirectChannelNameForTeam(modifiedState, team1.id), General.DEFAULT_CHANNEL);
        });

        it('getRedirectChannelNameForTeam with advanced permissions but without JOIN_PUBLIC_CHANNELS permission', () => {
            const modifiedState = {
                ...testState,
                entities: {
                    ...testState.entities,
                    channels: {
                        ...testState.entities.channels,
                        channels: {
                            ...testState.entities.channels.channels,
                            'new-not-member-channel': {
                                id: 'new-not-member-channel',
                                display_name: '111111',
                                name: 'new-not-member-channel',
                                team_id: team1.id,
                            },
                            [channel1.id]: {
                                id: channel1.id,
                                display_name: 'aaaaaa',
                                name: 'test-channel',
                                team_id: team1.id,
                            },
                        },
                    },
                    roles: {
                        roles: {
                            system_user: {permissions: []},
                        },
                    },
                    general: {
                        ...testState.entities.general,
                        serverVersion: '5.12.0',
                    },
                },
            };
            assert.equal(Selectors.getRedirectChannelNameForTeam(modifiedState, team1.id), 'test-channel');
        });

        it('getRedirectChannelNameForTeam with advanced permissions and with JOIN_PUBLIC_CHANNELS permission', () => {
            const modifiedState = {
                ...testState,
                entities: {
                    ...testState.entities,
                    roles: {
                        roles: {
                            system_user: {permissions: ['join_public_channels']},
                        },
                    },
                    general: {
                        ...testState.entities.general,
                        serverVersion: '5.12.0',
                    },
                },
            };
            assert.equal(Selectors.getRedirectChannelNameForTeam(modifiedState, team1.id), General.DEFAULT_CHANNEL);
        });

        it('getRedirectChannelNameForTeam with advanced permissions but without JOIN_PUBLIC_CHANNELS permission but being member of town-square', () => {
            const modifiedState = {
                ...testState,
                entities: {
                    ...testState.entities,
                    channels: {
                        ...testState.entities.channels,
                        channels: {
                            ...testState.entities.channels.channels,
                            'new-not-member-channel': {
                                id: 'new-not-member-channel',
                                display_name: '111111',
                                name: 'new-not-member-channel',
                                team_id: team1.id,
                            },
                            [channel1.id]: {
                                id: channel1.id,
                                display_name: 'Town Square',
                                name: 'town-square',
                                team_id: team1.id,
                            },
                        },
                    },
                    roles: {
                        roles: {
                            system_user: {permissions: []},
                        },
                    },
                    general: {
                        ...testState.entities.general,
                        serverVersion: '5.12.0',
                    },
                },
            };
            assert.equal(Selectors.getRedirectChannelNameForTeam(modifiedState, team1.id), General.DEFAULT_CHANNEL);
        });

        it('getRedirectChannelNameForTeam without advanced permissions in not current team', () => {
            const modifiedState = {
                ...testState,
                entities: {
                    ...testState.entities,
                    general: {
                        ...testState.entities.general,
                        serverVersion: '4.8.0',
                    },
                },
            };
            assert.equal(Selectors.getRedirectChannelNameForTeam(modifiedState, team2.id), General.DEFAULT_CHANNEL);
        });

        it('getRedirectChannelNameForTeam with advanced permissions but without JOIN_PUBLIC_CHANNELS permission in not current team', () => {
            const modifiedState = {
                ...testState,
                entities: {
                    ...testState.entities,
                    channels: {
                        ...testState.entities.channels,
                        channels: {
                            ...testState.entities.channels.channels,
                            'new-not-member-channel': {
                                id: 'new-not-member-channel',
                                display_name: '111111',
                                name: 'new-not-member-channel',
                                team_id: team2.id,
                            },
                            [channel3.id]: {
                                id: channel3.id,
                                display_name: 'aaaaaa',
                                name: 'test-channel',
                                team_id: team2.id,
                            },
                        },
                    },
                    roles: {
                        roles: {
                            system_user: {permissions: []},
                        },
                    },
                    general: {
                        ...testState.entities.general,
                        serverVersion: '5.12.0',
                    },
                },
            };
            assert.equal(Selectors.getRedirectChannelNameForTeam(modifiedState, team2.id), 'test-channel');
        });

        it('getRedirectChannelNameForTeam with advanced permissions and with JOIN_PUBLIC_CHANNELS permission in not current team', () => {
            const modifiedState = {
                ...testState,
                entities: {
                    ...testState.entities,
                    roles: {
                        roles: {
                            system_user: {permissions: ['join_public_channels']},
                        },
                    },
                    general: {
                        ...testState.entities.general,
                        serverVersion: '5.12.0',
                    },
                },
            };
            assert.equal(Selectors.getRedirectChannelNameForTeam(modifiedState, team2.id), General.DEFAULT_CHANNEL);
        });

        it('getRedirectChannelNameForTeam with advanced permissions but without JOIN_PUBLIC_CHANNELS permission but being member of town-square in not current team', () => {
            const modifiedState = {
                ...testState,
                entities: {
                    ...testState.entities,
                    channels: {
                        ...testState.entities.channels,
                        channels: {
                            ...testState.entities.channels.channels,
                            'new-not-member-channel': {
                                id: 'new-not-member-channel',
                                display_name: '111111',
                                name: 'new-not-member-channel',
                                team_id: team2.id,
                            },
                            [channel3.id]: {
                                id: channel3.id,
                                display_name: 'Town Square',
                                name: 'town-square',
                                team_id: team2.id,
                            },
                        },
                    },
                    roles: {
                        roles: {
                            system_user: {permissions: []},
                        },
                    },
                    general: {
                        ...testState.entities.general,
                        serverVersion: '5.12.0',
                    },
                },
            };
            assert.equal(Selectors.getRedirectChannelNameForTeam(modifiedState, team2.id), General.DEFAULT_CHANNEL);
        });
    });

    describe('canManageAnyChannelMembersInCurrentTeam', () => {
        it('will return false if channel_user does not have permissions to manage channel members', () => {
            const newState = {
                entities: {
                    ...testState.entities,
                    roles: {
                        roles: {
                            channel_user: {
                                permissions: [],
                            },
                        },
                    },
                    channels: {
                        ...testState.entities.channels,
                        myMembers: {
                            ...testState.entities.channels.myMembers,
                            [channel1.id]: {
                                ...testState.entities.channels.myMembers[channel1.id],
                                roles: 'channel_user',
                            },
                            [channel5.id]: {
                                ...testState.entities.channels.myMembers[channel5.id],
                                roles: 'channel_user',
                            },
                        },
                    },
                },
            };

            assert.ok(Selectors.canManageAnyChannelMembersInCurrentTeam(newState) === false);
        });

        it('will return true if channel_user has permissions to manage public channel members', () => {
            const newState = {
                entities: {
                    ...testState.entities,
                    roles: {
                        roles: {
                            channel_user: {
                                permissions: ['manage_public_channel_members'],
                            },
                        },
                    },
                    channels: {
                        ...testState.entities.channels,
                        myMembers: {
                            ...testState.entities.channels.myMembers,
                            [channel1.id]: {
                                ...testState.entities.channels.myMembers[channel1.id],
                                roles: 'channel_user',
                            },
                            [channel5.id]: {
                                ...testState.entities.channels.myMembers[channel5.id],
                                roles: 'channel_user',
                            },
                        },
                    },
                },
            };

            assert.ok(Selectors.canManageAnyChannelMembersInCurrentTeam(newState) === true);
        });

        it('will return true if channel_user has permissions to manage private channel members', () => {
            const newState = {
                entities: {
                    ...testState.entities,
                    roles: {
                        roles: {
                            channel_user: {
                                permissions: ['manage_private_channel_members'],
                            },
                        },
                    },
                    channels: {
                        ...testState.entities.channels,
                        myMembers: {
                            ...testState.entities.channels.myMembers,
                            [channel1.id]: {
                                ...testState.entities.channels.myMembers[channel1.id],
                                roles: 'channel_user',
                            },
                            [channel5.id]: {
                                ...testState.entities.channels.myMembers[channel5.id],
                                roles: 'channel_user',
                            },
                        },
                    },
                },
            };

            assert.ok(Selectors.canManageAnyChannelMembersInCurrentTeam(newState) === true);
        });

        it('will return false if channel admins have permissions, but the user is not a channel admin of any channel', () => {
            const newState = {
                entities: {
                    ...testState.entities,
                    roles: {
                        roles: {
                            channel_admin: {
                                permissions: ['manage_public_channel_members'],
                            },
                        },
                    },
                    channels: {
                        ...testState.entities.channels,
                        myMembers: {
                            ...testState.entities.channels.myMembers,
                            [channel1.id]: {
                                ...testState.entities.channels.myMembers[channel1.id],
                                roles: 'channel_user',
                            },
                            [channel5.id]: {
                                ...testState.entities.channels.myMembers[channel5.id],
                                roles: 'channel_user',
                            },
                        },
                    },
                },
            };

            assert.ok(Selectors.canManageAnyChannelMembersInCurrentTeam(newState) === false);
        });

        it('will return true if channel admins have permission, and the user is a channel admin of some channel', () => {
            const newState = {
                entities: {
                    ...testState.entities,
                    roles: {
                        roles: {
                            channel_admin: {
                                permissions: ['manage_public_channel_members'],
                            },
                        },
                    },
                    channels: {
                        ...testState.entities.channels,
                        myMembers: {
                            ...testState.entities.channels.myMembers,
                            [channel1.id]: {
                                ...testState.entities.channels.myMembers[channel1.id],
                                roles: 'channel_user channel_admin',
                            },
                            [channel5.id]: {
                                ...testState.entities.channels.myMembers[channel5.id],
                                roles: 'channel_user',
                            },
                        },
                    },
                },
            };

            assert.ok(Selectors.canManageAnyChannelMembersInCurrentTeam(newState) === true);
        });

        it('will return true if team admins have permission, and the user is a team admin', () => {
            const newState = {
                entities: {
                    ...testState.entities,
                    roles: {
                        roles: {
                            team_admin: {
                                permissions: ['manage_public_channel_members'],
                            },
                        },
                    },
                    users: {
                        ...testState.entities.users,
                        profiles: {
                            ...testState.entities.users.profiles,
                            [user.id]: {
                                ...testState.entities.users.profiles[user.id],
                                roles: 'team_admin',
                            },
                        },
                    },
                },
            };

            assert.ok(Selectors.canManageAnyChannelMembersInCurrentTeam(newState) === true);
        });
    });
});

describe('getMyFirstChannelForTeams', () => {
    test('should return the first channel in each team', () => {
        const state = {
            entities: {
                channels: {
                    channels: {
                        channelA: {id: 'channelA', name: 'channelA', team_id: 'team1'},
                        channelB: {id: 'channelB', name: 'channelB', team_id: 'team2'},
                        channelC: {id: 'channelC', name: 'channelC', team_id: 'team1'},
                    },
                    myMembers: {
                        channelA: {},
                        channelB: {},
                        channelC: {},
                    },
                },
                teams: {
                    myMembers: {
                        team1: {},
                        team2: {},
                    },
                    teams: {
                        team1: {id: 'team1'},
                        team2: {id: 'team2'},
                    },
                },
                users: {
                    currentUserId: 'user',
                    profiles: {
                        user: {},
                    },
                },
            },
        };

        expect(Selectors.getMyFirstChannelForTeams(state)).toEqual({
            team1: state.entities.channels.channels.channelA,
            team2: state.entities.channels.channels.channelB,
        });
    });

    test('should only return channels that the current user is a member of', () => {
        const state = {
            entities: {
                channels: {
                    channels: {
                        channelA: {id: 'channelA', name: 'channelA', team_id: 'team1'},
                        channelB: {id: 'channelB', name: 'channelB', team_id: 'team1'},
                    },
                    myMembers: {
                        channelB: {},
                    },
                },
                teams: {
                    myMembers: {
                        team1: {},
                    },
                    teams: {
                        team1: {id: 'team1'},
                    },
                },
                users: {
                    currentUserId: 'user',
                    profiles: {
                        user: {},
                    },
                },
            },
        };

        expect(Selectors.getMyFirstChannelForTeams(state)).toEqual({
            team1: state.entities.channels.channels.channelB,
        });
    });

    test('should only return teams that the current user is a member of', () => {
        const state = {
            entities: {
                channels: {
                    channels: {
                        channelA: {id: 'channelA', name: 'channelA', team_id: 'team1'},
                        channelB: {id: 'channelB', name: 'channelB', team_id: 'team2'},
                    },
                    myMembers: {
                        channelA: {},
                        channelB: {},
                    },
                },
                teams: {
                    myMembers: {
                        team1: {},
                    },
                    teams: {
                        team1: {id: 'team1'},
                        team2: {id: 'team2'},
                    },
                },
                users: {
                    currentUserId: 'user',
                    profiles: {
                        user: {},
                    },
                },
            },
        };

        expect(Selectors.getMyFirstChannelForTeams(state)).toEqual({
            team1: state.entities.channels.channels.channelA,
        });
    });
});
