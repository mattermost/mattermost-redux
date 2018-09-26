// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import assert from 'assert';

import {UserTypes} from 'action_types';
import usersReducer from 'reducers/entities/users';

describe('Reducers.users', () => {
    describe('mySession', () => {
        it('should handle initial state', () => {
            let state = {};

            state = usersReducer(state, {});
            assert.deepEqual(state.mySession, {});
        });

        it('should clear the expired bit on login', () => {
            let state = {
                mySession: {
                    expired: true,
                },
            };

            state = usersReducer(state, {type: UserTypes.LOGIN_SUCCESS});
            assert.deepEqual(state.mySession, {});
        });

        it('should transition to expired: false on a logout request', () => {
            let state = {};

            state = usersReducer(state, {type: UserTypes.LOGOUT_REQUEST});
            assert.deepEqual(state.mySession, {expired: false});
        });

        it('should transition to expired: true on session expiration', () => {
            let state = {};

            state = usersReducer(state, {type: UserTypes.SESSION_EXPIRED});
            assert.deepEqual(state.mySession, {expired: true});
        });

        it('should ignore session expiration if a logout request already occurred', () => {
            let state = {
                mySession: {
                    expired: false,
                },
            };

            state = usersReducer(state, {type: UserTypes.SESSION_EXPIRED});
            assert.deepEqual(state.mySession, {expired: false});
        });
    });
});
