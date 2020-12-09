// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {ThreadTypes} from 'action_types';
import deepFreeze from 'utils/deep_freeze';
import threadsReducer from './threads';

describe('threads', () => {
    describe('RECEIVED_THREADS', () => {
        test('should update the state', () => {
            const state = deepFreeze({
                threadsInTeam: {},
                threads: {},
                selectedThreadIdInTeam: {},
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
                    total_unread_replies: 0,
                    total_unread_mentions: 1,
                },
            });

            expect(nextState).not.toBe(state);
            expect(nextState.threads.t1).toEqual({
                id: 't1',
            });
            expect(nextState.threadsInTeam.a).toContain('t1');
        });
    });
});
