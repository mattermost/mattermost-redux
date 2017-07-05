// Copyright (c) 2017 Mattermost, Inc. All Rights Reserved.
// See License.txt for license information.

import assert from 'assert';

import {General, Preferences} from 'constants';

import * as Selectors from 'selectors/entities/preferences';

import deepFreezeAndThrowOnMutation from 'utils/deep_freeze';

describe('Selectors.Preferences', () => {
    const category1 = 'testcategory1';
    const name1 = 'testname1';
    const value1 = 'true';
    const pref1 = {category: category1, name: name1, value: value1};
    const category2 = Preferences.CATEGORY_DIRECT_CHANNEL_SHOW;
    const name2 = 'testname2';
    const pref2 = {category: category2, name: name2, value: 'true'};
    const category3 = Preferences.CATEGORY_GROUP_CHANNEL_SHOW;
    const name3 = 'testname3';
    const pref3 = {category: category3, name: name3, value: 'true'};

    const myPreferences = {};
    myPreferences[`${category1}--${name1}`] = pref1;
    myPreferences[`${category2}--${name2}`] = pref2;
    myPreferences[`${category3}--${name3}`] = pref3;

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

    it('get preferences by category', () => {
        const getCategory = Selectors.makeGetCategory();
        assert.deepEqual(getCategory(testState, category1), [pref1]);
    });

    it('get direct channel show preferences', () => {
        assert.deepEqual(Selectors.getDirectShowPreferences(testState), [pref2]);
    });

    it('get group channel show preferences', () => {
        assert.deepEqual(Selectors.getGroupShowPreferences(testState), [pref3]);
    });

    it('getTeammateNameDisplaySetting', () => {
        it('only preference set (3.10 and lower)', () => {
            assert.equal(
                Selectors.getTeammateNameDisplaySetting({
                    entities: {
                        general: {
                            config: {}
                        },
                        preferences: {
                            preferences: {
                                [`${Preferences.CATEGORY_DISPLAY_SETTINGS}--${Preferences.NAME_NAME_FORMAT}`]: General.TEAMMATE_NAME_DISPLAY.SHOW_FULLNAME
                            }
                        }
                    }
                }),
                General.TEAMMATE_NAME_DISPLAY.SHOW_NICKNAME_FULLNAME
            );
        });

        it('both preference and config set (server created before 4.0)', () => {
            assert.equal(
                Selectors.getTeammateNameDisplaySetting({
                    entities: {
                        general: {
                            config: {
                                TeammateNameDisplay: General.TEAMMATE_NAME_DISPLAY.SHOW_NICKNAME_FULLNAME
                            }
                        },
                        preferences: {
                            preferences: {
                                [`${Preferences.CATEGORY_DISPLAY_SETTINGS}--${Preferences.NAME_NAME_FORMAT}`]: General.TEAMMATE_NAME_DISPLAY.SHOW_FULLNAME
                            }
                        }
                    }
                }),
                General.TEAMMATE_NAME_DISPLAY.SHOW_NICKNAME_FULLNAME
            );
        });

        it('only config set (server created after or at 4.0)', () => {
            assert.equal(
                Selectors.getTeammateNameDisplaySetting({
                    entities: {
                        general: {
                            config: {
                                TeammateNameDisplay: General.TEAMMATE_NAME_DISPLAY.SHOW_NICKNAME_FULLNAME
                            }
                        },
                        preferences: {
                            preferences: {}
                        }
                    }
                }),
                General.TEAMMATE_NAME_DISPLAY.SHOW_NICKNAME_FULLNAME
            );
        });
    });
});

