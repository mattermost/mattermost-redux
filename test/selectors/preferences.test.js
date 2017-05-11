// Copyright (c) 2017 Mattermost, Inc. All Rights Reserved.
// See License.txt for license information.

import assert from 'assert';

import deepFreezeAndThrowOnMutation from 'utils/deep_freeze';
import * as Selectors from 'selectors/entities/preferences';

describe('Selectors.Preferences', () => {
    const category1 = 'testcategory1';
    const name1 = 'testname1';
    const value1 = 'true';
    const pref1 = {category: category1, name: name1, value: value1};

    const myPreferences = {};
    myPreferences[`${category1}--${name1}`] = pref1;

    const testState = deepFreezeAndThrowOnMutation({
        entities: {
            preferences: {
                myPreferences
            }
        }
    });

    it('get preference', () => {
        assert.deepEqual(Selectors.get(testState, category1, name1), value1);
    });

    it('get bool preference', () => {
        assert.deepEqual(Selectors.getBool(testState, category1, name1), value1 === 'true');
    });
});

