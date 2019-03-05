// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import assert from 'assert';

import {Posts, Preferences} from 'constants';
import deepFreeze from 'utils/deep_freeze';
import {getPreferenceKey} from 'utils/preference_utils';

import {
    COMBINED_USER_ACTIVITY,
    DATE_LINE,
    makeCombineUserActivityPosts,
    makePreparePostIdsForPostList,
    START_OF_NEW_MESSAGES,
} from './post_list';

describe('makePreparePostIdsForPostList', () => {
    it('filter join/leave posts', () => {
        const preparePostIdsForPostList = makePreparePostIdsForPostList();
        const time = Date.now();
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        let state = {
            entities: {
                posts: {
                    posts: {
                        1001: {id: '1001', create_at: time, type: ''},
                        1002: {id: '1002', create_at: time + 1, type: Posts.POST_TYPES.JOIN_CHANNEL},
                    },
                },
                preferences: {
                    myPreferences: {},
                },
                users: {
                    currentUserId: '1234',
                    profiles: {
                        1234: {id: '1234', username: 'user'},
                    },
                },
            },
        };
        const lastViewedAt = Number.POSITIVE_INFINITY;
        const postIds = ['1002', '1001'];
        const indicateNewMessages = true;

        // Defaults to show post
        let now = preparePostIdsForPostList(state, {postIds, lastViewedAt, indicateNewMessages});
        assert.deepEqual(now, [
            '1002',
            '1001',
            'date-' + today.getTime(),
        ]);

        // Show join/leave posts
        state = {
            ...state,
            entities: {
                ...state.entities,
                preferences: {
                    ...state.entities.preferences,
                    myPreferences: {
                        ...state.entities.preferences.myPreferences,
                        [getPreferenceKey(Preferences.CATEGORY_ADVANCED_SETTINGS, Preferences.ADVANCED_FILTER_JOIN_LEAVE)]: {
                            category: Preferences.CATEGORY_ADVANCED_SETTINGS,
                            name: Preferences.ADVANCED_FILTER_JOIN_LEAVE,
                            value: 'true',
                        },
                    },
                },
            },
        };

        now = preparePostIdsForPostList(state, {postIds, lastViewedAt, indicateNewMessages});
        assert.deepEqual(now, [
            '1002',
            '1001',
            'date-' + today.getTime(),
        ]);

        // Hide join/leave posts
        state = {
            ...state,
            entities: {
                ...state.entities,
                preferences: {
                    ...state.entities.preferences,
                    myPreferences: {
                        ...state.entities.preferences.myPreferences,
                        [getPreferenceKey(Preferences.CATEGORY_ADVANCED_SETTINGS, Preferences.ADVANCED_FILTER_JOIN_LEAVE)]: {
                            category: Preferences.CATEGORY_ADVANCED_SETTINGS,
                            name: Preferences.ADVANCED_FILTER_JOIN_LEAVE,
                            value: 'false',
                        },
                    },
                },
            },
        };

        now = preparePostIdsForPostList(state, {postIds, lastViewedAt, indicateNewMessages});
        assert.deepEqual(now, [
            '1001',
            'date-' + today.getTime(),
        ]);

        // always show join/leave posts for the current user
        state = {
            ...state,
            entities: {
                ...state.entities,
                posts: {
                    ...state.entities.posts,
                    posts: {
                        ...state.entities.posts.posts,
                        1002: {id: '1002', create_at: time + 1, type: Posts.POST_TYPES.JOIN_CHANNEL, props: {username: 'user'}},
                    },
                },
            },
        };

        now = preparePostIdsForPostList(state, {postIds, lastViewedAt, indicateNewMessages});

        assert.deepEqual(now, [
            '1002',
            '1001',
            'date-' + today.getTime(),
        ]);
    });

    it('new messages indicator', () => {
        const preparePostIdsForPostList = makePreparePostIdsForPostList();
        const time = Date.now();
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const state = {
            entities: {
                posts: {
                    posts: {
                        1000: {id: '1000', create_at: time + 1000, type: ''},
                        1005: {id: '1005', create_at: time + 1005, type: ''},
                        1010: {id: '1010', create_at: time + 1010, type: ''},
                    },
                },
                preferences: {
                    myPreferences: {},
                },
                users: {
                    currentUserId: '1234',
                    profiles: {
                        1234: {id: '1234', username: 'user'},
                    },
                },
            },
        };

        const postIds = ['1010', '1005', '1000']; // Remember that we list the posts backwards

        // Do not show new messages indicator before all posts
        let now = preparePostIdsForPostList(state, {postIds, lastViewedAt: 0, indicateNewMessages: true});
        assert.deepEqual(now, [
            '1010',
            '1005',
            '1000',
            'date-' + today.getTime(),
        ]);

        now = preparePostIdsForPostList(state, {postIds, indicateNewMessages: true});
        assert.deepEqual(now, [
            '1010',
            '1005',
            '1000',
            'date-' + today.getTime(),
        ]);

        now = preparePostIdsForPostList(state, {postIds, lastViewedAt: time + 999, indicateNewMessages: false});
        assert.deepEqual(now, [
            '1010',
            '1005',
            '1000',
            'date-' + today.getTime(),
        ]);

        // Show new messages indicator before all posts
        now = preparePostIdsForPostList(state, {postIds, lastViewedAt: time + 999, indicateNewMessages: true});
        assert.deepEqual(now, [
            '1010',
            '1005',
            '1000',
            START_OF_NEW_MESSAGES,
            'date-' + today.getTime(),
        ]);

        // Show indicator between posts
        now = preparePostIdsForPostList(state, {postIds, lastViewedAt: time + 1003, indicateNewMessages: true});
        assert.deepEqual(now, [
            '1010',
            '1005',
            START_OF_NEW_MESSAGES,
            '1000',
            'date-' + today.getTime(),
        ]);

        now = preparePostIdsForPostList(state, {postIds, lastViewedAt: time + 1006, indicateNewMessages: true});
        assert.deepEqual(now, [
            '1010',
            START_OF_NEW_MESSAGES,
            '1005',
            '1000',
            'date-' + today.getTime(),
        ]);

        // Don't show indicator when all posts are read
        now = preparePostIdsForPostList(state, {postIds, lastViewedAt: time + 1020});
        assert.deepEqual(now, [
            '1010',
            '1005',
            '1000',
            'date-' + today.getTime(),
        ]);
    });

    it('memoization', () => {
        const preparePostIdsForPostList = makePreparePostIdsForPostList();
        const time = Date.now();
        const today = new Date();
        const tomorrow = new Date((24 * 60 * 60 * 1000) + today.getTime());
        today.setHours(0, 0, 0, 0);
        tomorrow.setHours(0, 0, 0, 0);

        // Posts 7 hours apart so they should appear on multiple days
        const initialPosts = {
            1001: {id: '1001', create_at: time, type: ''},
            1002: {id: '1002', create_at: time + 5, type: ''},
            1003: {id: '1003', create_at: time + 10, type: ''},
            1004: {id: '1004', create_at: tomorrow, type: ''},
            1005: {id: '1005', create_at: tomorrow + 5, type: ''},
            1006: {id: '1006', create_at: tomorrow + 10, type: Posts.POST_TYPES.JOIN_CHANNEL},
        };
        let state = {
            entities: {
                posts: {
                    posts: initialPosts,
                },
                preferences: {
                    myPreferences: {
                        [getPreferenceKey(Preferences.CATEGORY_ADVANCED_SETTINGS, Preferences.ADVANCED_FILTER_JOIN_LEAVE)]: {
                            category: Preferences.CATEGORY_ADVANCED_SETTINGS,
                            name: Preferences.ADVANCED_FILTER_JOIN_LEAVE,
                            value: 'true',
                        },
                    },
                },
                users: {
                    currentUserId: '1234',
                    profiles: {
                        1234: {id: '1234', username: 'user'},
                    },
                },
            },
        };

        let postIds = [
            '1006',
            '1004',
            '1003',
            '1001',
        ];
        let lastViewedAt = initialPosts['1001'].create_at + 1;

        let now = preparePostIdsForPostList(state, {postIds, lastViewedAt, indicateNewMessages: true});
        assert.deepEqual(now, [
            '1006',
            '1004',
            'date-' + tomorrow.getTime(),
            '1003',
            START_OF_NEW_MESSAGES,
            '1001',
            'date-' + today.getTime(),
        ]);

        // No changes
        let prev = now;
        now = preparePostIdsForPostList(state, {postIds, lastViewedAt, indicateNewMessages: true});
        assert.equal(now, prev);
        assert.deepEqual(now, [
            '1006',
            '1004',
            'date-' + tomorrow.getTime(),
            '1003',
            START_OF_NEW_MESSAGES,
            '1001',
            'date-' + today.getTime(),
        ]);

        // lastViewedAt changed slightly
        lastViewedAt = initialPosts['1001'].create_at + 2;

        prev = now;
        now = preparePostIdsForPostList(state, {postIds, lastViewedAt, indicateNewMessages: true});
        assert.equal(now, prev);
        assert.deepEqual(now, [
            '1006',
            '1004',
            'date-' + tomorrow.getTime(),
            '1003',
            START_OF_NEW_MESSAGES,
            '1001',
            'date-' + today.getTime(),
        ]);

        // lastViewedAt changed a lot
        lastViewedAt = initialPosts['1003'].create_at + 1;

        prev = now;
        now = preparePostIdsForPostList(state, {postIds, lastViewedAt, indicateNewMessages: true});
        assert.notEqual(now, prev);
        assert.deepEqual(now, [
            '1006',
            '1004',
            START_OF_NEW_MESSAGES,
            'date-' + tomorrow.getTime(),
            '1003',
            '1001',
            'date-' + today.getTime(),
        ]);

        prev = now;
        now = preparePostIdsForPostList(state, {postIds, lastViewedAt, indicateNewMessages: true});
        assert.equal(now, prev);
        assert.deepEqual(now, [
            '1006',
            '1004',
            START_OF_NEW_MESSAGES,
            'date-' + tomorrow.getTime(),
            '1003',
            '1001',
            'date-' + today.getTime(),
        ]);

        // postIds changed, but still shallowly equal
        postIds = [...postIds];

        prev = now;
        now = preparePostIdsForPostList(state, {postIds, lastViewedAt, indicateNewMessages: true});
        assert.equal(now, prev);
        assert.deepEqual(now, [
            '1006',
            '1004',
            START_OF_NEW_MESSAGES,
            'date-' + tomorrow.getTime(),
            '1003',
            '1001',
            'date-' + today.getTime(),
        ]);

        // Post changed, not in postIds
        state = {
            ...state,
            entities: {
                ...state.entities,
                posts: {
                    ...state.entities.posts,
                    posts: {
                        ...state.entities.posts.posts,
                        1007: {id: '1007', create_at: 7 * 60 * 60 * 7 * 1000},
                    },
                },
            },
        };

        prev = now;
        now = preparePostIdsForPostList(state, {postIds, lastViewedAt, indicateNewMessages: true});
        assert.equal(now, prev);
        assert.deepEqual(now, [
            '1006',
            '1004',
            START_OF_NEW_MESSAGES,
            'date-' + tomorrow.getTime(),
            '1003',
            '1001',
            'date-' + today.getTime(),
        ]);

        // Post changed, in postIds
        state = {
            ...state,
            entities: {
                ...state.entities,
                posts: {
                    ...state.entities.posts,
                    posts: {
                        ...state.entities.posts.posts,
                        1006: {...state.entities.posts.posts['1006'], message: 'abcd'},
                    },
                },
            },
        };

        prev = now;
        now = preparePostIdsForPostList(state, {postIds, lastViewedAt, indicateNewMessages: true});
        assert.equal(now, prev);
        assert.deepEqual(now, [
            '1006',
            '1004',
            START_OF_NEW_MESSAGES,
            'date-' + tomorrow.getTime(),
            '1003',
            '1001',
            'date-' + today.getTime(),
        ]);

        // Filter changed
        state = {
            ...state,
            entities: {
                ...state.entities,
                preferences: {
                    ...state.entities.preferences,
                    myPreferences: {
                        ...state.entities.preferences.myPreferences,
                        [getPreferenceKey(Preferences.CATEGORY_ADVANCED_SETTINGS, Preferences.ADVANCED_FILTER_JOIN_LEAVE)]: {
                            category: Preferences.CATEGORY_ADVANCED_SETTINGS,
                            name: Preferences.ADVANCED_FILTER_JOIN_LEAVE,
                            value: 'false',
                        },
                    },
                },
            },
        };

        prev = now;
        now = preparePostIdsForPostList(state, {postIds, lastViewedAt, indicateNewMessages: true});
        assert.notEqual(now, prev);
        assert.deepEqual(now, [
            '1004',
            START_OF_NEW_MESSAGES,
            'date-' + tomorrow.getTime(),
            '1003',
            '1001',
            'date-' + today.getTime(),
        ]);

        prev = now;
        now = preparePostIdsForPostList(state, {postIds, lastViewedAt, indicateNewMessages: true});
        assert.equal(now, prev);
        assert.deepEqual(now, [
            '1004',
            START_OF_NEW_MESSAGES,
            'date-' + tomorrow.getTime(),
            '1003',
            '1001',
            'date-' + today.getTime(),
        ]);
    });
});

describe('makeCombineUserActivityPosts', () => {
    test('should do nothing if no post IDs are provided', () => {
        const combineUserActivityPosts = makeCombineUserActivityPosts();

        const postIds = [];
        const state = {
            entities: {
                posts: {
                    posts: {},
                },
            },
        };

        const result = combineUserActivityPosts(state, postIds);

        expect(result).toBe(postIds);
        expect(result).toEqual([]);
    });

    test('should do nothing if there are no user activity posts', () => {
        const combineUserActivityPosts = makeCombineUserActivityPosts();

        const postIds = deepFreeze([
            'post1',
            START_OF_NEW_MESSAGES,
            'post2',
            DATE_LINE + '1001',
            'post3',
            DATE_LINE + '1000',
        ]);
        const state = {
            entities: {
                posts: {
                    posts: {
                        post1: {id: 'post1'},
                        post2: {id: 'post2'},
                        post3: {id: 'post3'},
                    },
                },
            },
        };

        const result = combineUserActivityPosts(state, postIds);

        expect(result).toBe(postIds);
    });

    test('should combine adjacent user activity posts', () => {
        const combineUserActivityPosts = makeCombineUserActivityPosts();

        const postIds = deepFreeze([
            'post1',
            'post2',
            'post3',
        ]);
        const state = {
            entities: {
                posts: {
                    posts: {
                        post1: {id: 'post1', type: Posts.POST_TYPES.JOIN_CHANNEL},
                        post2: {id: 'post2', type: Posts.POST_TYPES.LEAVE_CHANNEL},
                        post3: {id: 'post3', type: Posts.POST_TYPES.ADD_TO_CHANNEL},
                    },
                },
            },
        };

        const result = combineUserActivityPosts(state, postIds);

        expect(result).not.toBe(postIds);
        expect(result).toEqual([
            COMBINED_USER_ACTIVITY + 'post1_post2_post3',
        ]);
    });

    test('should not combine with regular messages', () => {
        const combineUserActivityPosts = makeCombineUserActivityPosts();

        const postIds = deepFreeze([
            'post1',
            'post2',
            'post3',
            'post4',
            'post5',
        ]);
        const state = {
            entities: {
                posts: {
                    posts: {
                        post1: {id: 'post1', type: Posts.POST_TYPES.JOIN_CHANNEL},
                        post2: {id: 'post2', type: Posts.POST_TYPES.JOIN_CHANNEL},
                        post3: {id: 'post3'},
                        post4: {id: 'post4', type: Posts.POST_TYPES.ADD_TO_CHANNEL},
                        post5: {id: 'post5', type: Posts.POST_TYPES.ADD_TO_CHANNEL},
                    },
                },
            },
        };

        const result = combineUserActivityPosts(state, postIds);

        expect(result).not.toBe(postIds);
        expect(result).toEqual([
            COMBINED_USER_ACTIVITY + 'post1_post2',
            'post3',
            COMBINED_USER_ACTIVITY + 'post4_post5',
        ]);
    });

    test('should not combine with other system messages', () => {
        const combineUserActivityPosts = makeCombineUserActivityPosts();

        const postIds = deepFreeze([
            'post1',
            'post2',
            'post3',
        ]);
        const state = {
            entities: {
                posts: {
                    posts: {
                        post1: {id: 'post1', type: Posts.POST_TYPES.JOIN_CHANNEL},
                        post2: {id: 'post2', type: Posts.POST_TYPES.PURPOSE_CHANGE},
                        post3: {id: 'post3', type: Posts.POST_TYPES.ADD_TO_CHANNEL},
                    },
                },
            },
        };

        const result = combineUserActivityPosts(state, postIds);

        expect(result).toBe(postIds);
    });

    test('should not combine across non-post items', () => {
        const combineUserActivityPosts = makeCombineUserActivityPosts();

        const postIds = deepFreeze([
            'post1',
            START_OF_NEW_MESSAGES,
            'post2',
            'post3',
            DATE_LINE + '1001',
            'post4',
        ]);
        const state = {
            entities: {
                posts: {
                    posts: {
                        post1: {id: 'post1', type: Posts.POST_TYPES.JOIN_CHANNEL},
                        post2: {id: 'post2', type: Posts.POST_TYPES.LEAVE_CHANNEL},
                        post3: {id: 'post3', type: Posts.POST_TYPES.ADD_TO_CHANNEL},
                        post4: {id: 'post4', type: Posts.POST_TYPES.JOIN_CHANNEL},
                    },
                },
            },
        };

        const result = combineUserActivityPosts(state, postIds);

        expect(result).not.toBe(postIds);
        expect(result).toEqual([
            'post1',
            START_OF_NEW_MESSAGES,
            COMBINED_USER_ACTIVITY + 'post2_post3',
            DATE_LINE + '1001',
            'post4',
        ]);
    });

    test('should not combine more than 100 posts', () => {
        const combineUserActivityPosts = makeCombineUserActivityPosts();

        const postIds = [];
        const posts = {};
        for (let i = 0; i < 110; i++) {
            const postId = `post${i}`;

            postIds.push(postId);
            posts[postId] = {id: postId, type: Posts.POST_TYPES.JOIN_CHANNEL};
        }

        const state = {
            entities: {
                posts: {
                    posts,
                },
            },
        };

        const result = combineUserActivityPosts(state, postIds);

        expect(result).toHaveLength(2);
    });

    describe('memoization', () => {
        const initialPostIds = ['post1', 'post2'];
        const initialState = {
            entities: {
                posts: {
                    posts: {
                        post1: {id: 'post1', type: Posts.POST_TYPES.JOIN_CHANNEL},
                        post2: {id: 'post2', type: Posts.POST_TYPES.JOIN_CHANNEL},
                    },
                },
            },
        };

        test('should not recalculate when nothing has changed', () => {
            const combineUserActivityPosts = makeCombineUserActivityPosts();

            expect(combineUserActivityPosts.recomputations()).toBe(0);

            combineUserActivityPosts(initialState, initialPostIds);

            expect(combineUserActivityPosts.recomputations()).toBe(1);

            combineUserActivityPosts(initialState, initialPostIds);

            expect(combineUserActivityPosts.recomputations()).toBe(1);
        });

        test('should recalculate when the post IDs change', () => {
            const combineUserActivityPosts = makeCombineUserActivityPosts();

            let postIds = initialPostIds;
            combineUserActivityPosts(initialState, postIds);

            expect(combineUserActivityPosts.recomputations()).toBe(1);

            postIds = ['post1'];
            combineUserActivityPosts(initialState, postIds);

            expect(combineUserActivityPosts.recomputations()).toBe(2);
        });

        test('should not recalculate when an unrelated state change occurs', () => {
            const combineUserActivityPosts = makeCombineUserActivityPosts();

            let state = initialState;
            combineUserActivityPosts(state, initialPostIds);

            expect(combineUserActivityPosts.recomputations()).toBe(1);

            state = {
                ...state,
                entities: {
                    ...state.entities,
                    posts: {
                        ...state.entities.posts,
                        selectedPostId: 'post2',
                    },
                },
            };
            combineUserActivityPosts(state, initialPostIds);

            expect(combineUserActivityPosts.recomputations()).toBe(1);
        });

        test('should recalculate if any post changes, but should return the same results if possible', () => {
            const combineUserActivityPosts = makeCombineUserActivityPosts();

            let state = initialState;
            const initialResult = combineUserActivityPosts(state, initialPostIds);

            expect(combineUserActivityPosts.recomputations()).toBe(1);

            // An unrelated post changed
            state = {
                ...state,
                entities: {
                    ...state.entities,
                    posts: {
                        ...state.entities.posts,
                        posts: {
                            ...state.entities.posts.posts,
                            post3: {id: 'post3'},
                        },
                    },
                },
            };
            let result = combineUserActivityPosts(state, initialPostIds);

            expect(combineUserActivityPosts.recomputations()).toBe(2);
            expect(result).toBe(initialResult);

            // One of the posts was updated, but post type didn't change
            state = {
                ...state,
                entities: {
                    ...state.entities,
                    posts: {
                        ...state.entities.posts,
                        posts: {
                            ...state.entities.posts.posts,
                            post2: {...state.entities.posts.posts.post2, update_at: 1234},
                        },
                    },
                },
            };
            result = combineUserActivityPosts(state, initialPostIds);

            expect(combineUserActivityPosts.recomputations()).toBe(3);
            expect(result).toBe(initialResult);

            // One of the posts changed type
            state = {
                ...state,
                entities: {
                    ...state.entities,
                    posts: {
                        ...state.entities.posts,
                        posts: {
                            ...state.entities.posts.posts,
                            post2: {...state.entities.posts.posts.post2, type: ''},
                        },
                    },
                },
            };
            result = combineUserActivityPosts(state, initialPostIds);

            expect(combineUserActivityPosts.recomputations()).toBe(4);
            expect(result).not.toBe(initialResult);
        });
    });
});
