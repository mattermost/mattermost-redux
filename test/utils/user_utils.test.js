// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import assert from 'assert';

import {Preferences} from 'constants';
import {displayUsername} from 'utils/user_utils';

describe('user utils', () => {
    const userObj = {
        id: 100,
        username: 'testUser',
        nickname: 'nick',
        first_name: 'test',
        last_name: 'user',
    };
    it('should return username', () => {
        assert.equal(displayUsername(userObj, 'UNKNOWN_PREFERENCE'), 'testUser');
    });

    it('should return nickname', () => {
        assert.equal(displayUsername(userObj, Preferences.DISPLAY_PREFER_NICKNAME), 'nick');
    });

    it('should return fullname when no nick name', () => {
        assert.equal(displayUsername({...userObj, nickname: ''}, Preferences.DISPLAY_PREFER_NICKNAME), 'test user');
    });

    it('should return username when no nick name and no full name', () => {
        assert.equal(displayUsername({...userObj, nickname: '', first_name: '', last_name: ''}, Preferences.DISPLAY_PREFER_NICKNAME), 'testUser');
    });

    it('should return fullname', () => {
        assert.equal(displayUsername(userObj, Preferences.DISPLAY_PREFER_FULL_NAME), 'test user');
    });

    it('should return username when no full name', () => {
        assert.equal(displayUsername({...userObj, first_name: '', last_name: ''}, Preferences.DISPLAY_PREFER_FULL_NAME), 'testUser');
    });

    it('should return default username string', () => {
        let noUserObj;
        assert.equal(displayUsername(noUserObj, 'UNKNOWN_PREFERENCE'), 'Someone');
    });
});
