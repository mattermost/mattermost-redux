// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import assert from 'assert';

import {isMinimumServerVersion} from 'utils/helpers';

describe('Helpers', () => {
    it('isMinimumServerVersion', () => {
        assert.ok(isMinimumServerVersion('1.0.0', 1, 0, 0));
        assert.ok(isMinimumServerVersion('1.1.1', 1, 1, 1));
        assert.ok(!isMinimumServerVersion('1.0.0', 2, 0, 0));
        assert.ok(isMinimumServerVersion('4.6', 2, 0, 0));
        assert.ok(!isMinimumServerVersion('4.6', 4, 7, 0));
        assert.ok(isMinimumServerVersion('4.6.1', 2, 0, 0));
        assert.ok(isMinimumServerVersion('4.7.1', 4, 6, 2));
        assert.ok(!isMinimumServerVersion('4.6.1', 4, 6, 2));
        assert.ok(!isMinimumServerVersion('3.6.1', 4, 6, 2));
        assert.ok(isMinimumServerVersion('4.6.1', 3, 7, 2));
        assert.ok(isMinimumServerVersion('5', 4, 6, 2));
        assert.ok(isMinimumServerVersion('5', 5));
        assert.ok(isMinimumServerVersion('5.1', 5));
        assert.ok(isMinimumServerVersion('5.1', 5, 1));
        assert.ok(!isMinimumServerVersion('5.1', 5, 2));
        assert.ok(isMinimumServerVersion('5.1.0', 5));
        assert.ok(isMinimumServerVersion('5.1.1', 5, 1, 1));
        assert.ok(!isMinimumServerVersion('5.1.1', 5, 1, 2));
        assert.ok(isMinimumServerVersion('4.6.2.sakjdgaksfg', 4, 6, 2));
        assert.ok(!isMinimumServerVersion());
    });
});
