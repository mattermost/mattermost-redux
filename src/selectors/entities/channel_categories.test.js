// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {General, Preferences} from '../../constants';
import {CategoryTypes} from '../../constants/channel_categories';

import {getCurrentChannelId, getMyChannelMemberships} from 'selectors/entities/channels';
import {getConfig} from 'selectors/entities/general';
import {getLastPostPerChannel} from 'selectors/entities/posts';
import {getMyPreferences} from 'selectors/entities/preferences';
import {getCurrentUserId} from 'selectors/entities/users';

import mergeObjects from 'test/merge_objects';

import {isGroupOrDirectChannelVisible} from 'utils/channel_utils';
import {getPreferenceKey} from 'utils/preference_utils';

import * as Selectors from './channel_categories';

describe('makeGetCategoriesForTeam', () => {
    const category1 = {id: 'category1', display_name: 'Category One', type: CategoryTypes.CUSTOM};
    const category2 = {id: 'category2', display_name: 'Category Two', type: CategoryTypes.CUSTOM};

    const state = {
        entities: {
            channelCategories: {
                byId: {
                    category1,
                    category2,
                },
                orderByTeam: {
                    team1: [category2.id, category1.id],
                },
            },
        },
    };

    test('should return categories for team in order', () => {
        const getCategoriesForTeam = Selectors.makeGetCategoriesForTeam();

        expect(getCategoriesForTeam(state, 'team1')).toEqual([
            state.entities.channelCategories.byId.category2,
            state.entities.channelCategories.byId.category1,
        ]);
    });

    test('should memoize properly', () => {
        const getCategoriesForTeam = Selectors.makeGetCategoriesForTeam();

        const result = getCategoriesForTeam(state, 'team1');

        // Repeat calls should return the same array
        expect(getCategoriesForTeam(state, 'team1')).toBe(result);

        // Calls to a difference instance of the selector won't return the same array
        expect(result).not.toBe(Selectors.makeGetCategoriesForTeam()(state, 'team1'));

        // Calls with different arguments won't return the same array
        expect(getCategoriesForTeam(state, 'team2')).not.toBe(result);

        // Calls after different argumetns won't return the same array
        expect(getCategoriesForTeam(state, 'team1')).not.toBe(result);
    });
});

describe('makeGetChannelsForAllCategories', () => {
    const channel1 = {id: 'channel1', team_id: 'team1'};
    const channel2 = {id: 'channel2', team_id: 'team1'};
    const channel3 = {id: 'channel3', team_id: 'team2'};
    const dmChannel1 = {id: 'dmChannel1', team_id: ''};
    const gmChannel1 = {id: 'gmChannel1', team_id: ''};

    const state = {
        entities: {
            channels: {
                channels: {
                    channel1,
                    channel2,
                    channel3,
                    dmChannel1,
                    gmChannel1,
                },
            },
        },
    };

    test('should return channels on the team and DMs/GMs', () => {
        const getChannelsForAllCategories = Selectors.makeGetChannelsForAllCategories();

        expect(getChannelsForAllCategories(state, 'team1')).toMatchObject([channel1, channel2, dmChannel1, gmChannel1]);

        expect(getChannelsForAllCategories(state, 'team2')).toMatchObject([channel3, dmChannel1, gmChannel1]);
    });

    test('should memoize properly', () => {
        const getChannelsForAllCategories = Selectors.makeGetChannelsForAllCategories();

        const result = getChannelsForAllCategories(state, 'team1');

        // Repeat calls should return the same array
        expect(getChannelsForAllCategories(state, 'team1')).toBe(result);

        // Calls to a difference instance of the selector won't return the same array
        expect(result).not.toBe(Selectors.makeGetChannelsForAllCategories()(state, 'team1'));

        // Calls with different arguments won't return the same array
        expect(getChannelsForAllCategories(state, 'team2')).not.toBe(result);

        // Calls after different argumetns won't return the same array
        expect(getChannelsForAllCategories(state, 'team1')).not.toBe(result);
    });
});

describe('makeFilterChannelsByFavorites', () => {
    const channel1 = {id: 'channel1'};
    const channel2 = {id: 'channel2'};

    const state = {
        entities: {
            channels: {
                channels: {
                    channel1,
                    channel2,
                },
            },
            preferences: {
                myPreferences: {
                    [getPreferenceKey(Preferences.CATEGORY_FAVORITE_CHANNEL, channel1.id)]: {value: 'true'},
                    [getPreferenceKey(Preferences.CATEGORY_FAVORITE_CHANNEL, channel2.id)]: {value: 'false'},
                },
            },
        },
    };

    const channels = [channel1, channel2];

    test('should return only favorited channels for the favorites category', () => {
        const filterChanneldByFavorites = Selectors.makeFilterChannelsByFavorites();

        expect(filterChanneldByFavorites(state, channels, CategoryTypes.FAVORITES)).toMatchObject([channel1]);
    });

    test('should not return favorited channels for other categories', () => {
        const filterChanneldByFavorites = Selectors.makeFilterChannelsByFavorites();

        expect(filterChanneldByFavorites(state, channels, CategoryTypes.CUSTOM)).toMatchObject([channel2]);
    });

    test('should memoize properly', () => {
        const filterChanneldByFavorites = Selectors.makeFilterChannelsByFavorites();

        const result = filterChanneldByFavorites(state, channels, CategoryTypes.CUSTOM);

        // Repeat calls should return the same array
        expect(filterChanneldByFavorites(state, channels, CategoryTypes.CUSTOM)).toBe(result);

        // Calls to a difference instance of the selector won't return the same array
        expect(result).not.toBe(Selectors.makeFilterChannelsByFavorites()(state, channels, CategoryTypes.CUSTOM));

        // Calls with different arguments won't return the same array
        expect(filterChanneldByFavorites(state, [channel1], CategoryTypes.CUSTOM)).not.toBe(result);

        // Calls after different argumetns won't return the same array
        expect(filterChanneldByFavorites(state, channels, CategoryTypes.CUSTOM)).not.toBe(result);
    });
});

describe('makeFilterChannelsByType', () => {
    const channel1 = {id: 'channel1', type: General.OPEN_CHANNEL};
    const channel2 = {id: 'channel2', type: General.PRIVATE_CHANNEL};
    const dmChannel1 = {id: 'dmChannel1', type: General.DM_CHANNEL};
    const gmChannel1 = {id: 'gmChannel1', type: General.GM_CHANNEL};

    const state = {};

    const channels = [channel1, channel2, dmChannel1, gmChannel1];

    test('should filter out non-public channels for public category', () => {
        const filterChannelsByType = Selectors.makeFilterChannelsByType();

        expect(filterChannelsByType(state, channels, CategoryTypes.PUBLIC)).toMatchObject([channel1]);
    });

    test('should filter out non-private channels for private category', () => {
        const filterChannelsByType = Selectors.makeFilterChannelsByType();

        expect(filterChannelsByType(state, channels, CategoryTypes.PRIVATE)).toMatchObject([channel2]);
    });

    test('should filter out non-DM/GM channels for direct messages category', () => {
        const filterChannelsByType = Selectors.makeFilterChannelsByType();

        expect(filterChannelsByType(state, channels, CategoryTypes.DIRECT_MESSAGES)).toMatchObject([dmChannel1, gmChannel1]);
    });

    test('should not filter out channels for favorites category', () => {
        const filterChannelsByType = Selectors.makeFilterChannelsByType();

        expect(filterChannelsByType(state, channels, CategoryTypes.FAVORITES)).toBe(channels);
    });
});

describe('makeFilterAutoclosedDMs', () => {
    const currentUser = {id: 'currentUser'};

    const baseState = {
        entities: {
            channels: {
                currentChannelId: 'channel1',
                myMembers: {
                    channel1: {},
                },
            },
            general: {
                config: {
                    CloseUnusedDirectMessages: 'true',
                },
            },
            posts: {
                posts: {},
                postsInChannel: {
                    channel1: [],
                },
            },
            preferences: {
                myPreferences: {
                    [getPreferenceKey(Preferences.CATEGORY_SIDEBAR_SETTINGS, Preferences.CHANNEL_SIDEBAR_AUTOCLOSE_DMS)]: {value: Preferences.AUTOCLOSE_DMS_ENABLED},
                },
            },
            users: {
                currentUserId: currentUser.id,
                profiles: {
                    currentUser,
                },
            },
        },
    };

    const now = Date.now();
    const cutoff = now - 7 * 24 * 60 * 60 * 1000;

    function isChannelVisiblePrecondition(state, channel) {
        return isGroupOrDirectChannelVisible(
            channel,
            getMyChannelMemberships(state),
            getConfig(state),
            getMyPreferences(state),
            getCurrentUserId(state),
            state.entities.users.profiles,
            getLastPostPerChannel(state),
            getCurrentChannelId(state),
            now,
        );
    }

    test('should hide an inactive GM channel', () => {
        const filterAutoclosedDMs = Selectors.makeFilterAutoclosedDMs(() => cutoff);

        const channel1 = {id: 'channel1', type: General.GM_CHANNEL};

        const state = mergeObjects(baseState, {
            entities: {
                preferences: {
                    myPreferences: {
                        [getPreferenceKey(Preferences.CATEGORY_GROUP_CHANNEL_SHOW, channel1.id)]: {value: 'true'},
                        [getPreferenceKey(Preferences.CATEGORY_CHANNEL_OPEN_TIME, channel1.id)]: {value: `${cutoff - 1}`},
                        [getPreferenceKey(Preferences.CATEGORY_CHANNEL_APPROXIMATE_VIEW_TIME, channel1.id)]: {value: `${cutoff - 1}`},
                    },
                },
            },
        });

        expect(isChannelVisiblePrecondition(state, channel1)).toBe(false);

        expect(filterAutoclosedDMs(state, [channel1], CategoryTypes.DIRECT_MESSAGES)).toEqual([]);
    });

    test('should show a GM channel if it was opened recently', () => {
        const filterAutoclosedDMs = Selectors.makeFilterAutoclosedDMs(() => cutoff);

        const channel1 = {id: 'channel1', type: General.GM_CHANNEL};

        const state = mergeObjects(baseState, {
            entities: {
                preferences: {
                    myPreferences: {
                        [getPreferenceKey(Preferences.CATEGORY_GROUP_CHANNEL_SHOW, channel1.id)]: {value: 'true'},
                        [getPreferenceKey(Preferences.CATEGORY_CHANNEL_OPEN_TIME, channel1.id)]: {value: `${cutoff + 1}`},
                        [getPreferenceKey(Preferences.CATEGORY_CHANNEL_APPROXIMATE_VIEW_TIME, channel1.id)]: {value: `${cutoff - 1}`},
                    },
                },
            },
        });

        expect(isChannelVisiblePrecondition(state, channel1)).toBe(true);

        expect(filterAutoclosedDMs(state, [channel1], CategoryTypes.DIRECT_MESSAGES)).toEqual([channel1]);
    });

    test('should show a GM channel if it was viewed recently', () => {
        const filterAutoclosedDMs = Selectors.makeFilterAutoclosedDMs(() => cutoff);

        const channel1 = {id: 'channel1', type: General.GM_CHANNEL};

        const state = mergeObjects(baseState, {
            entities: {
                preferences: {
                    myPreferences: {
                        [getPreferenceKey(Preferences.CATEGORY_GROUP_CHANNEL_SHOW, channel1.id)]: {value: 'true'},
                        [getPreferenceKey(Preferences.CATEGORY_CHANNEL_OPEN_TIME, channel1.id)]: {value: `${cutoff - 1}`},
                        [getPreferenceKey(Preferences.CATEGORY_CHANNEL_APPROXIMATE_VIEW_TIME, channel1.id)]: {value: `${cutoff + 1}`},
                    },
                },
            },
        });

        expect(isChannelVisiblePrecondition(state, channel1)).toBe(true);

        expect(filterAutoclosedDMs(state, [channel1], CategoryTypes.DIRECT_MESSAGES)).toEqual([channel1]);
    });

    test('should show a GM channel if it had an unloaded post made recently', () => {
        const filterAutoclosedDMs = Selectors.makeFilterAutoclosedDMs(() => cutoff);

        const channel1 = {id: 'channel1', type: General.GM_CHANNEL, last_post_at: cutoff + 1};

        const state = mergeObjects(baseState, {
            entities: {
                preferences: {
                    myPreferences: {
                        [getPreferenceKey(Preferences.CATEGORY_GROUP_CHANNEL_SHOW, channel1.id)]: {value: 'true'},
                        [getPreferenceKey(Preferences.CATEGORY_CHANNEL_OPEN_TIME, channel1.id)]: {value: `${cutoff - 1}`},
                        [getPreferenceKey(Preferences.CATEGORY_CHANNEL_APPROXIMATE_VIEW_TIME, channel1.id)]: {value: `${cutoff - 1}`},
                    },
                },
            },
        });

        expect(isChannelVisiblePrecondition(state, channel1)).toBe(true);

        expect(filterAutoclosedDMs(state, [channel1], CategoryTypes.DIRECT_MESSAGES)).toEqual([channel1]);
    });

    test('should show a GM channel if it had a loaded post made recently', () => {
        const filterAutoclosedDMs = Selectors.makeFilterAutoclosedDMs(() => cutoff);

        const channel1 = {id: 'channel1', type: General.GM_CHANNEL};

        const state = mergeObjects(baseState, {
            entities: {
                posts: {
                    posts: {
                        post1: {id: 'post1', channel_id: channel1, create_at: cutoff + 1},
                    },
                    postsInChannel: {
                        channel1: [{order: ['post1'], recent: true}],
                    },
                },
                preferences: {
                    myPreferences: {
                        [getPreferenceKey(Preferences.CATEGORY_GROUP_CHANNEL_SHOW, channel1.id)]: {value: 'true'},
                        [getPreferenceKey(Preferences.CATEGORY_CHANNEL_OPEN_TIME, channel1.id)]: {value: `${cutoff - 1}`},
                        [getPreferenceKey(Preferences.CATEGORY_CHANNEL_APPROXIMATE_VIEW_TIME, channel1.id)]: {value: `${cutoff - 1}`},
                    },
                },
            },
        });

        expect(isChannelVisiblePrecondition(state, channel1)).toBe(true);

        expect(filterAutoclosedDMs(state, [channel1], CategoryTypes.DIRECT_MESSAGES)).toEqual([channel1]);
    });

    test('should show an inactive GM channel if autoclosing DMs is disabled for the user', () => {
        const filterAutoclosedDMs = Selectors.makeFilterAutoclosedDMs(() => cutoff);

        const channel1 = {id: 'channel1', type: General.GM_CHANNEL};

        const state = mergeObjects(baseState, {
            entities: {
                preferences: {
                    myPreferences: {
                        [getPreferenceKey(Preferences.CATEGORY_SIDEBAR_SETTINGS, Preferences.CHANNEL_SIDEBAR_AUTOCLOSE_DMS)]: {value: ''},
                        [getPreferenceKey(Preferences.CATEGORY_GROUP_CHANNEL_SHOW, channel1.id)]: {value: 'true'},
                        [getPreferenceKey(Preferences.CATEGORY_CHANNEL_OPEN_TIME, channel1.id)]: {value: `${cutoff - 1}`},
                        [getPreferenceKey(Preferences.CATEGORY_CHANNEL_APPROXIMATE_VIEW_TIME, channel1.id)]: {value: `${cutoff - 1}`},
                    },
                },
            },
        });

        expect(isChannelVisiblePrecondition(state, channel1)).toBe(true);

        expect(filterAutoclosedDMs(state, [channel1], CategoryTypes.DIRECT_MESSAGES)).toEqual([channel1]);
    });

    test('should show an inactive GM channel if autoclosing DMs is disabled for the server', () => {
        const filterAutoclosedDMs = Selectors.makeFilterAutoclosedDMs(() => cutoff);

        const channel1 = {id: 'channel1', type: General.GM_CHANNEL};

        const state = mergeObjects(baseState, {
            entities: {
                general: {
                    config: {
                        CloseUnusedDirectMessages: 'false',
                    },
                },
                preferences: {
                    myPreferences: {
                        [getPreferenceKey(Preferences.CATEGORY_SIDEBAR_SETTINGS, Preferences.CHANNEL_SIDEBAR_AUTOCLOSE_DMS)]: {value: Preferences.AUTOCLOSE_DMS_ENABLED},
                        [getPreferenceKey(Preferences.CATEGORY_GROUP_CHANNEL_SHOW, channel1.id)]: {value: 'true'},
                        [getPreferenceKey(Preferences.CATEGORY_CHANNEL_OPEN_TIME, channel1.id)]: {value: `${cutoff - 1}`},
                        [getPreferenceKey(Preferences.CATEGORY_CHANNEL_APPROXIMATE_VIEW_TIME, channel1.id)]: {value: `${cutoff - 1}`},
                    },
                },
            },
        });

        expect(isChannelVisiblePrecondition(state, channel1)).toBe(true);

        expect(filterAutoclosedDMs(state, [channel1], CategoryTypes.DIRECT_MESSAGES)).toEqual([channel1]);
    });

    test('should show a GM channel if it has unread messages', () => {
        const filterAutoclosedDMs = Selectors.makeFilterAutoclosedDMs(() => cutoff);

        const channel1 = {id: 'channel1', type: General.GM_CHANNEL, total_msg_count: 1};

        const state = mergeObjects(baseState, {
            entities: {
                channels: {
                    currentChannelId: 'channel1',
                    myMembers: {
                        channel1: {msg_count: 0},
                    },
                },
                preferences: {
                    myPreferences: {
                        [getPreferenceKey(Preferences.CATEGORY_GROUP_CHANNEL_SHOW, channel1.id)]: {value: 'true'},
                        [getPreferenceKey(Preferences.CATEGORY_CHANNEL_OPEN_TIME, channel1.id)]: {value: `${cutoff - 1}`},
                        [getPreferenceKey(Preferences.CATEGORY_CHANNEL_APPROXIMATE_VIEW_TIME, channel1.id)]: {value: `${cutoff - 1}`},
                    },
                },
            },
        });

        expect(isChannelVisiblePrecondition(state, channel1)).toBe(true);

        expect(filterAutoclosedDMs(state, [channel1], CategoryTypes.DIRECT_MESSAGES)).toEqual([channel1]);
    });

    test('should hide an inactive DM channel', () => {
        const filterAutoclosedDMs = Selectors.makeFilterAutoclosedDMs(() => cutoff);

        const otherUser = {id: 'otherUser', delete_at: 0};
        const channel1 = {id: 'channel1', name: `${currentUser.id}__${otherUser.id}`, type: General.DM_CHANNEL};

        const state = mergeObjects(baseState, {
            entities: {
                preferences: {
                    myPreferences: {
                        [getPreferenceKey(Preferences.CATEGORY_DIRECT_CHANNEL_SHOW, otherUser.id)]: {value: 'true'},
                        [getPreferenceKey(Preferences.CATEGORY_CHANNEL_OPEN_TIME, channel1.id)]: {value: `${cutoff - 1}`},
                        [getPreferenceKey(Preferences.CATEGORY_CHANNEL_APPROXIMATE_VIEW_TIME, channel1.id)]: {value: `${cutoff - 1}`},
                    },
                },
                users: {
                    profiles: {
                        otherUser,
                    },
                },
            },
        });

        expect(isChannelVisiblePrecondition(state, channel1)).toBe(false);

        expect(filterAutoclosedDMs(state, [channel1], CategoryTypes.DIRECT_MESSAGES)).toEqual([]);
    });

    test('should show a DM channel if it was opened recently', () => {
        const filterAutoclosedDMs = Selectors.makeFilterAutoclosedDMs(() => cutoff);

        const otherUser = {id: 'otherUser', delete_at: 0};
        const channel1 = {id: 'channel1', name: `${currentUser.id}__${otherUser.id}`, type: General.DM_CHANNEL};

        const state = mergeObjects(baseState, {
            entities: {
                preferences: {
                    myPreferences: {
                        [getPreferenceKey(Preferences.CATEGORY_DIRECT_CHANNEL_SHOW, otherUser.id)]: {value: 'true'},
                        [getPreferenceKey(Preferences.CATEGORY_CHANNEL_OPEN_TIME, channel1.id)]: {value: `${cutoff + 1}`},
                        [getPreferenceKey(Preferences.CATEGORY_CHANNEL_APPROXIMATE_VIEW_TIME, channel1.id)]: {value: `${cutoff - 1}`},
                    },
                },
                users: {
                    profiles: {
                        otherUser,
                    },
                },
            },
        });

        expect(isChannelVisiblePrecondition(state, channel1)).toBe(true);

        expect(filterAutoclosedDMs(state, [channel1], CategoryTypes.DIRECT_MESSAGES)).toEqual([channel1]);
    });

    test('should show a DM channel with a deactivated user if its the current channel', () => {
        const filterAutoclosedDMs = Selectors.makeFilterAutoclosedDMs(() => cutoff);

        const otherUser = {id: 'otherUser', delete_at: cutoff + 2};
        const channel1 = {id: 'channel1', name: `${currentUser.id}__${otherUser.id}`, type: General.DM_CHANNEL};

        const state = mergeObjects(baseState, {
            entities: {
                channels: {
                    currentChannelId: 'channel1',
                },
                preferences: {
                    myPreferences: {
                        [getPreferenceKey(Preferences.CATEGORY_DIRECT_CHANNEL_SHOW, otherUser.id)]: {value: 'true'},
                        [getPreferenceKey(Preferences.CATEGORY_CHANNEL_OPEN_TIME, channel1.id)]: {value: `${cutoff + 1}`},
                        [getPreferenceKey(Preferences.CATEGORY_CHANNEL_APPROXIMATE_VIEW_TIME, channel1.id)]: {value: `${cutoff - 1}`},
                    },
                },
                users: {
                    profiles: {
                        otherUser,
                    },
                },
            },
        });

        expect(isChannelVisiblePrecondition(state, channel1)).toBe(true);

        expect(filterAutoclosedDMs(state, [channel1], CategoryTypes.DIRECT_MESSAGES)).toEqual([channel1]);
    });

    test('should hide a DM channel with a deactivated user if it is not the current channel', () => {
        const filterAutoclosedDMs = Selectors.makeFilterAutoclosedDMs(() => cutoff);

        const otherUser = {id: 'otherUser', delete_at: cutoff + 2};
        const channel1 = {id: 'channel1', name: `${currentUser.id}__${otherUser.id}`, type: General.DM_CHANNEL};

        const state = mergeObjects(baseState, {
            entities: {
                channels: {
                    currentChannelId: 'channel2',
                },
                preferences: {
                    myPreferences: {
                        [getPreferenceKey(Preferences.CATEGORY_DIRECT_CHANNEL_SHOW, otherUser.id)]: {value: 'true'},
                        [getPreferenceKey(Preferences.CATEGORY_CHANNEL_OPEN_TIME, channel1.id)]: {value: `${cutoff + 1}`},
                        [getPreferenceKey(Preferences.CATEGORY_CHANNEL_APPROXIMATE_VIEW_TIME, channel1.id)]: {value: `${cutoff - 1}`},
                    },
                },
                users: {
                    profiles: {
                        otherUser,
                    },
                },
            },
        });

        expect(isChannelVisiblePrecondition(state, channel1)).toBe(false);

        expect(filterAutoclosedDMs(state, [channel1], CategoryTypes.DIRECT_MESSAGES)).toEqual([]);
    });

    test('should show a DM channel with a deactivated user if it is not the current channel but it has been opened since the user was deactivated', () => {
        const filterAutoclosedDMs = Selectors.makeFilterAutoclosedDMs(() => cutoff);

        const otherUser = {id: 'otherUser', delete_at: cutoff + 2};
        const channel1 = {id: 'channel1', name: `${currentUser.id}__${otherUser.id}`, type: General.DM_CHANNEL};

        const state = mergeObjects(baseState, {
            entities: {
                channels: {
                    currentChannelId: 'channel1',
                },
                preferences: {
                    myPreferences: {
                        [getPreferenceKey(Preferences.CATEGORY_DIRECT_CHANNEL_SHOW, otherUser.id)]: {value: 'true'},
                        [getPreferenceKey(Preferences.CATEGORY_CHANNEL_OPEN_TIME, channel1.id)]: {value: `${cutoff + 3}`},
                        [getPreferenceKey(Preferences.CATEGORY_CHANNEL_APPROXIMATE_VIEW_TIME, channel1.id)]: {value: `${cutoff - 1}`},
                    },
                },
                users: {
                    profiles: {
                        otherUser,
                    },
                },
            },
        });

        expect(isChannelVisiblePrecondition(state, channel1)).toBe(true);

        expect(filterAutoclosedDMs(state, [channel1], CategoryTypes.DIRECT_MESSAGES)).toEqual([channel1]);
    });

    test('should return the original array when no items are removed', () => {
        const filterAutoclosedDMs = Selectors.makeFilterAutoclosedDMs(() => cutoff);

        const channel1 = {id: 'channel1', type: General.PUBLIC_CHANNEL};

        const state = baseState;

        const channels = [channel1];

        expect(filterAutoclosedDMs(state, channels, CategoryTypes.DIRECT_MESSAGES)).toBe(channels);
    });
});

describe('makeFilterManuallyClosedDMs', () => {
    const currentUser = {id: 'currentUser'};
    const otherUser1 = {id: 'otherUser1'};
    const otherUser2 = {id: 'otherUser2'};
    const otherUser3 = {id: 'otherUser3'};

    test('should filter DMs based on preferences', () => {
        const filterManuallyClosedDMs = Selectors.makeFilterManuallyClosedDMs();

        const dmChannel1 = {id: 'dmChannel1', type: General.DM_CHANNEL, name: `${currentUser.id}__${otherUser1.id}`};
        const dmChannel2 = {id: 'dmChannel2', type: General.DM_CHANNEL, name: `${currentUser.id}__${otherUser2.id}`};

        const state = {
            entities: {
                preferences: {
                    myPreferences: {
                        [getPreferenceKey(Preferences.CATEGORY_DIRECT_CHANNEL_SHOW, otherUser1.id)]: {value: 'false'},
                        [getPreferenceKey(Preferences.CATEGORY_DIRECT_CHANNEL_SHOW, otherUser2.id)]: {value: 'true'},
                    },
                },
                users: {
                    currentUserId: currentUser.id,
                },
            },
        };

        expect(filterManuallyClosedDMs(state, [dmChannel1, dmChannel2])).toMatchObject([dmChannel2]);
    });

    test('should filter DMs based on preferences', () => {
        const filterManuallyClosedDMs = Selectors.makeFilterManuallyClosedDMs();

        const gmChannel1 = {id: 'gmChannel1', type: General.GM_CHANNEL};
        const gmChannel2 = {id: 'gmChannel2', type: General.GM_CHANNEL};

        const state = {
            entities: {
                preferences: {
                    myPreferences: {
                        [getPreferenceKey(Preferences.CATEGORY_GROUP_CHANNEL_SHOW, gmChannel1.id)]: {value: 'true'},
                        [getPreferenceKey(Preferences.CATEGORY_GROUP_CHANNEL_SHOW, gmChannel2.id)]: {value: 'false'},
                    },
                },
                users: {
                    currentUserId: currentUser.id,
                },
            },
        };

        expect(filterManuallyClosedDMs(state, [gmChannel1, gmChannel2])).toMatchObject([gmChannel1]);
    });

    test('should not filter other channels', () => {
        const filterManuallyClosedDMs = Selectors.makeFilterManuallyClosedDMs();

        const channel1 = {id: 'channel1', type: General.OPEN_CHANNEL};
        const channel2 = {id: 'channel2', type: General.PRIVATE_CHANNEL};

        const state = {
            entities: {
                preferences: {
                    myPreferences: {},
                },
                users: {
                    currentUserId: currentUser.id,
                },
            },
        };

        const channels = [channel1, channel2];

        expect(filterManuallyClosedDMs(state, channels)).toBe(channels);
    });
});

describe('makeSortChannelsByName', () => {
    const currentUser = {id: 'currentUser', locale: 'en'};

    const baseState = {
        entities: {
            users: {
                currentUserId: currentUser.id,
                profiles: {
                    currentUser,
                },
            },
        },
    };

    test('should sort channels by display name', () => {
        const sortChannelsByName = Selectors.makeSortChannelsByName();

        const channel1 = {id: 'channel1', display_name: 'Carrot'};
        const channel2 = {id: 'channel2', display_name: 'Apple'};
        const channel3 = {id: 'channel3', display_name: 'Banana'};
        const channels = [channel1, channel2, channel3];

        expect(sortChannelsByName(baseState, channels)).toEqual([channel2, channel3, channel1]);
    });

    test('should sort channels by display name with numbers', () => {
        const sortChannelsByName = Selectors.makeSortChannelsByName();

        const channel1 = {id: 'channel1', display_name: 'Channel 10'};
        const channel2 = {id: 'channel2', display_name: 'Channel 1'};
        const channel3 = {id: 'channel3', display_name: 'Channel 11'};
        const channel4 = {id: 'channel4', display_name: 'Channel 1a'};
        const channels = [channel1, channel2, channel3, channel4];

        expect(sortChannelsByName(baseState, channels)).toEqual([channel2, channel4, channel1, channel3]);
    });
});

describe('makeSortChannelsByNameWithDMs', () => {
    const currentUser = {id: 'currentUser', username: 'currentUser', first_name: 'Current', last_name: 'User', locale: 'en'};
    const otherUser1 = {id: 'otherUser1', username: 'otherUser1', first_name: 'Other', last_name: 'User', locale: 'en'};
    const otherUser2 = {id: 'otherUser2', username: 'otherUser2', first_name: 'Another', last_name: 'User', locale: 'en'};

    const channel1 = {id: 'channel1', type: General.OPEN_CHANNEL, display_name: 'Zebra'};
    const channel2 = {id: 'channel2', type: General.PRIVATE_CHANNEL, display_name: 'Aardvark'};
    const channel3 = {id: 'channel3', type: General.OPEN_CHANNEL, display_name: 'Bear'};
    const dmChannel1 = {id: 'dmChannel1', type: General.DM_CHANNEL, display_name: '', name: `${currentUser.id}__${otherUser1.id}`};
    const dmChannel2 = {id: 'dmChannel2', type: General.DM_CHANNEL, display_name: '', name: `${otherUser2.id}__${currentUser.id}`};
    const gmChannel1 = {id: 'gmChannel1', type: General.GM_CHANNEL, display_name: `${currentUser.username}, ${otherUser1.username}, ${otherUser2.username}`, name: 'gmChannel1'};

    const baseState = {
        entities: {
            general: {
                config: {},
            },
            preferences: {
                myPreferences: {
                    [getPreferenceKey(Preferences.CATEGORY_DISPLAY_SETTINGS, Preferences.NAME_NAME_FORMAT)]: {value: Preferences.DISPLAY_PREFER_FULL_NAME},
                },
            },
            users: {
                currentUserId: currentUser.id,
                profiles: {
                    currentUser,
                    otherUser1,
                    otherUser2,
                },
            },
        },
    };

    test('should sort regular channels by display name', () => {
        const sortChannelsByNameWithDMs = Selectors.makeSortChannelsByNameWithDMs();

        expect(sortChannelsByNameWithDMs(baseState, [
            channel1,
            channel2,
            channel3,
        ])).toMatchObject([
            channel2, // Aardvark
            channel3, // Bear
            channel1, // Zebra
        ]);
    });

    test('should sort DM channels by the display name of the other user', () => {
        const sortChannelsByNameWithDMs = Selectors.makeSortChannelsByNameWithDMs();

        expect(sortChannelsByNameWithDMs(baseState, [
            channel1,
            channel2,
            channel3,
            dmChannel1,
            dmChannel2,
        ])).toMatchObject([
            channel2, // Aardvark
            dmChannel2, // Another User
            channel3, // Bear
            dmChannel1, // Other User
            channel1, // Zebra
        ]);
    });

    test('should sort GM channels by the display name of the other users', () => {
        const sortChannelsByNameWithDMs = Selectors.makeSortChannelsByNameWithDMs();

        expect(sortChannelsByNameWithDMs(baseState, [
            channel1,
            channel2,
            channel3,
            gmChannel1,
        ])).toMatchObject([
            channel2, // Aardvark
            gmChannel1, // Another User, Other User
            channel3, // Bear
            channel1, // Zebra
        ]);

        const state = {
            ...baseState,
            entities: {
                ...baseState.entities,
                users: {
                    ...baseState.entities.users,
                    currentUserId: otherUser2.id,
                },
            },
        };

        expect(sortChannelsByNameWithDMs(state, [
            channel1,
            channel2,
            channel3,
            gmChannel1,
        ])).toMatchObject([
            channel2, // Aardvark
            channel3, // Bear
            gmChannel1, // Current User, Other User
            channel1, // Zebra
        ]);
    });
});

describe('makeGetChannelsForCategory', () => {
    const currentUser = {id: 'currentUser', username: 'currentUser', first_name: 'Current', last_name: 'User', locale: 'en'};
    const otherUser1 = {id: 'otherUser1', username: 'otherUser1', first_name: 'Other', last_name: 'User', locale: 'en'};
    const otherUser2 = {id: 'otherUser2', username: 'otherUser2', first_name: 'Another', last_name: 'User', locale: 'en'};

    const channel1 = {id: 'channel1', type: General.OPEN_CHANNEL, team_id: 'team1', display_name: 'Zebra'};
    const channel2 = {id: 'channel2', type: General.PRIVATE_CHANNEL, team_id: 'team1', display_name: 'Aardvark'};
    const channel3 = {id: 'channel3', type: General.OPEN_CHANNEL, team_id: 'team1', display_name: 'Bear'};
    const dmChannel1 = {id: 'dmChannel1', type: General.DM_CHANNEL, team_id: '', display_name: '', name: `${currentUser.id}__${otherUser1.id}`};
    const dmChannel2 = {id: 'dmChannel2', type: General.DM_CHANNEL, team_id: '', display_name: '', name: `${otherUser2.id}__${currentUser.id}`};
    const gmChannel1 = {id: 'gmChannel1', type: General.GM_CHANNEL, team_id: '', display_name: `${currentUser.username}, ${otherUser1.username}, ${otherUser2.username}`, name: 'gmChannel1'};

    const favoritesCategory = {id: 'favoritesCategory', team_id: 'team1', display_name: CategoryTypes.FAVORITES, type: CategoryTypes.FAVORITES};
    const publicCategory = {id: 'publicCategory', team_id: 'team1', display_name: 'Public Channels', type: CategoryTypes.PUBLIC};
    const privateCategory = {id: 'privateCategory', team_id: 'team1', display_name: 'Private Channels', type: CategoryTypes.PRIVATE};
    const directMessagesCategory = {id: 'directMessagesCategory', team_id: 'team1', display_name: 'Direct Messages', type: CategoryTypes.DIRECT_MESSAGES};

    const state = {
        entities: {
            channelCategories: {
                byId: {
                    favoritesCategory,
                    publicCategory,
                    privateCategory,
                    directMessagesCategory,
                },
            },
            channels: {
                channels: {
                    channel1,
                    channel2,
                    channel3,
                    dmChannel1,
                    dmChannel2,
                    gmChannel1,
                },
                myMembers: {},
            },
            general: {
                config: {},
            },
            posts: {
                posts: {},
                postsInChannel: {},
            },
            preferences: {
                myPreferences: {
                    [getPreferenceKey(Preferences.CATEGORY_DISPLAY_SETTINGS, Preferences.NAME_NAME_FORMAT)]: {value: Preferences.DISPLAY_PREFER_FULL_NAME},
                    [getPreferenceKey(Preferences.CATEGORY_DIRECT_CHANNEL_SHOW, otherUser1.id)]: {value: 'true'},
                    [getPreferenceKey(Preferences.CATEGORY_DIRECT_CHANNEL_SHOW, otherUser2.id)]: {value: 'true'},
                    [getPreferenceKey(Preferences.CATEGORY_FAVORITE_CHANNEL, channel1.id)]: {value: 'true'},
                    [getPreferenceKey(Preferences.CATEGORY_FAVORITE_CHANNEL, dmChannel2.id)]: {value: 'true'},
                    [getPreferenceKey(Preferences.CATEGORY_GROUP_CHANNEL_SHOW, gmChannel1.id)]: {value: 'true'},
                },
            },
            users: {
                currentUserId: currentUser.id,
                profiles: {
                    currentUser,
                    otherUser1,
                    otherUser2,
                },
            },
        },
    };

    test('should return sorted and filtered channels for favorites category', () => {
        const getChannelsForCategory = Selectors.makeGetChannelsForCategory();

        expect(getChannelsForCategory(state, favoritesCategory)).toMatchObject([dmChannel2, channel1]);
    });

    test('should return sorted and filtered channels for public category', () => {
        const getChannelsForCategory = Selectors.makeGetChannelsForCategory();

        expect(getChannelsForCategory(state, publicCategory)).toMatchObject([channel3]);
    });

    test('should return sorted and filtered channels for private category', () => {
        const getChannelsForCategory = Selectors.makeGetChannelsForCategory();

        expect(getChannelsForCategory(state, privateCategory)).toMatchObject([channel2]);
    });

    test('should return sorted and filtered channels for direct messages category', () => {
        const getChannelsForCategory = Selectors.makeGetChannelsForCategory();

        expect(getChannelsForCategory(state, directMessagesCategory)).toMatchObject([gmChannel1, dmChannel1]);
    });
});
