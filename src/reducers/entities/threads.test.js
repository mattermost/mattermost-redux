// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {TeamTypes, ThreadTypes} from 'action_types';
import deepFreeze from 'utils/deep_freeze';
import threadsReducer from './threads';

describe('threads', () => {
    describe('RECEIVED_THREADS', () => {
        test('should update the state', () => {
            const state = deepFreeze({
                threadsInTeam: {},
                threads: {},
                counts: {},
            });

            const nextState = threadsReducer(state, {
                type: ThreadTypes.RECEIVED_THREADS,
                data: {
                    team_id: 'a',
                    threads: [
                        {id: 't1'},
                    ],
                    total: 3,
                    total_unread_threads: 0,
                    total_unread_mentions: 1,
                },
            });

            expect(nextState).not.toBe(state);
            expect(nextState.threads.t1).toEqual({
                id: 't1',
            });
            expect(nextState.counts.a).toEqual({
                total: 3,
                total_unread_threads: 0,
                total_unread_mentions: 1,
            });
            expect(nextState.threadsInTeam.a).toContain('t1');
        });
    });
    describe('LEAVE_TEAM', () => {
        test('should clean the state', () => {
            const state = deepFreeze({
                threadsInTeam: {},
                threads: {},
                counts: {},
            });

            let nextState = threadsReducer(state, {
                type: ThreadTypes.RECEIVED_THREADS,
                data: {
                    team_id: 'a',
                    threads: [
                        {id: 't1'},
                    ],
                    total: 3,
                    total_unread_threads: 0,
                    total_unread_mentions: 1,
                },
            });

            expect(nextState).not.toBe(state);

            // leave team
            nextState = threadsReducer(state, {
                type: TeamTypes.LEAVE_TEAM,
                data: {
                    id: 'a',
                },
            });

            expect(nextState.threads.t1).toBe(undefined);
            expect(nextState.counts.a).toBe(undefined);
            expect(nextState.threadsInTeam.a).toBe(undefined);
        });
    });
});
