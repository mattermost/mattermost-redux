// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {ChannelTypes} from 'action_types';
import deepFreeze from 'utils/deep_freeze';

import * as Reducers from './channels';

describe('channels', () => {
    describe('RECEIVED_CHANNEL_DELETED', () => {
        test('should mark channel as deleted', () => {
            const state = deepFreeze({
                channel1: {
                    id: 'channel1',
                },
                channel2: {
                    id: 'channel2',
                },
            });

            const nextState = Reducers.channels(state, {
                type: ChannelTypes.RECEIVED_CHANNEL_DELETED,
                data: {
                    id: 'channel1',
                    deleteAt: 1000,
                },
            });

            expect(nextState).not.toBe(state);
            expect(nextState.channel1).toEqual({
                id: 'channel1',
                delete_at: 1000,
            });
            expect(nextState.channel2).toBe(state.channel2);
        });

        test('should do nothing for a channel that is not loaded', () => {
            const state = deepFreeze({
                channel1: {
                    id: 'channel1',
                },
                channel2: {
                    id: 'channel2',
                },
            });

            const nextState = Reducers.channels(state, {
                type: ChannelTypes.RECEIVED_CHANNEL_DELETED,
                data: {
                    id: 'channel3',
                    deleteAt: 1000,
                },
            });

            expect(nextState).toBe(state);
        });
    });

    describe('UPDATE_CHANNEL_HEADER', () => {
        test('should update channel header', () => {
            const state = deepFreeze({
                channel1: {
                    id: 'channel1',
                    header: 'old',
                },
                channel2: {
                    id: 'channel2',
                },
            });

            const nextState = Reducers.channels(state, {
                type: ChannelTypes.UPDATE_CHANNEL_HEADER,
                data: {
                    channelId: 'channel1',
                    header: 'new',
                },
            });

            expect(nextState).not.toBe(state);
            expect(nextState.channel1).toEqual({
                id: 'channel1',
                header: 'new',
            });
            expect(nextState.channel2).toBe(state.channel2);
        });

        test('should do nothing for a channel that is not loaded', () => {
            const state = deepFreeze({
                channel1: {
                    id: 'channel1',
                },
                channel2: {
                    id: 'channel2',
                },
            });

            const nextState = Reducers.channels(state, {
                type: ChannelTypes.UPDATE_CHANNEL_HEADER,
                data: {
                    channelId: 'channel3',
                    header: 'new',
                },
            });

            expect(nextState).toBe(state);
        });
    });

    describe('UPDATE_CHANNEL_PURPOSE', () => {
        test('should update channel purpose', () => {
            const state = deepFreeze({
                channel1: {
                    id: 'channel1',
                    purpose: 'old',
                },
                channel2: {
                    id: 'channel2',
                },
            });

            const nextState = Reducers.channels(state, {
                type: ChannelTypes.UPDATE_CHANNEL_PURPOSE,
                data: {
                    channelId: 'channel1',
                    purpose: 'new',
                },
            });

            expect(nextState).not.toBe(state);
            expect(nextState.channel1).toEqual({
                id: 'channel1',
                purpose: 'new',
            });
            expect(nextState.channel2).toBe(state.channel2);
        });

        test('should do nothing for a channel that is not loaded', () => {
            const state = deepFreeze({
                channel1: {
                    id: 'channel1',
                },
                channel2: {
                    id: 'channel2',
                },
            });

            const nextState = Reducers.channels(state, {
                type: ChannelTypes.UPDATE_CHANNEL_PURPOSE,
                data: {
                    channelId: 'channel3',
                    purpose: 'new',
                },
            });

            expect(nextState).toBe(state);
        });
    });

    describe('REMOVE_MEMBER_FROM_CHANNEL', () => {
        test('should remove the channel member', () => {
            const state = deepFreeze({
                channel1: {
                    memberId1: 'member-data-1',
                },
                channel2: {
                    memberId2: 'member-data-2',
                },
            });

            const nextState = Reducers.membersInChannel(state, {
                type: ChannelTypes.REMOVE_MEMBER_FROM_CHANNEL,
                data: {
                    id: 'channel2',
                    user_id: 'memberId2',
                },
            });

            expect(nextState.channel2).toEqual({});
            expect(nextState.channel1).toEqual(state.channel1);
        });

        test('should work when channel member doesn\'t exist', () => {
            const state = deepFreeze({
                channel1: {
                    memberId1: 'member-data-1',
                },
                channel2: {
                    memberId2: 'member-data-2',
                },
            });

            const nextState = Reducers.membersInChannel(state, {
                type: ChannelTypes.REMOVE_MEMBER_FROM_CHANNEL,
                data: {
                    id: 'channel2',
                    user_id: 'test',
                },
            });

            expect(nextState).toEqual(state);
        });

        test('should work when channel doesn\'t exist', () => {
            const state = deepFreeze({
                channel1: {
                    memberId1: 'member-data-1',
                },
                channel2: {
                    memberId2: 'member-data-2',
                },
            });

            const nextState = Reducers.membersInChannel(state, {
                type: ChannelTypes.REMOVE_MEMBER_FROM_CHANNEL,
                data: {
                    id: 'channel3',
                    user_id: 'memberId2',
                },
            });

            expect(nextState).toEqual(state);
        });
    });
});
