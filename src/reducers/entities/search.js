// Copyright (c) 2016-present Mattermost, Inc. All Rights Reserved.
// See License.txt for license information.

import {combineReducers} from 'redux';
import {SearchTypes, UserTypes, PostTypes} from 'action_types';

function results(state = [], action) {
    switch (action.type) {
    case SearchTypes.RECEIVED_SEARCH_POSTS: {
        return action.data.order;
    }
    case SearchTypes.REMOVE_SEARCH_POSTS:
    case UserTypes.LOGOUT_SUCCESS:
        return [];

    default:
        return state;
    }
}

function recent(state = {}, action) {
    const nextState = {...state};
    const {data, type} = action;

    switch (type) {
    case SearchTypes.RECEIVED_SEARCH_TERM: {
        const {teamId, terms, isOrSearch} = data;
        const team = [...(nextState[teamId] || [])];
        const index = team.findIndex((r) => r.terms === terms);
        if (index === -1) {
            team.push({terms, isOrSearch});
        } else {
            team[index] = {terms, isOrSearch};
        }
        return {
            ...nextState,
            [teamId]: team
        };
    }
    case SearchTypes.REMOVE_SEARCH_TERM: {
        const {teamId, terms} = data;
        const team = [...(nextState[teamId] || [])];
        const index = team.findIndex((r) => r.terms === terms);

        if (index !== -1) {
            team.splice(index, 1);

            return {
                ...nextState,
                [teamId]: team
            };
        }

        return nextState;
    }
    case UserTypes.LOGOUT_SUCCESS:
        return {};

    default:
        return state;
    }
}

/*
 * Search reducer for mattermost-webapp will replace `SearchStore`
 * Structure is:
 * {
 *     term: string on null - searching terms,
 *     searchResults: array or null - list of searched posts
 *     isMentionSearch: boolean - is searched be mentions
 *     isFlaggedPosts: boolean - is searched flagged posts
 *     isPinnedPosts: boolean - is searched boolean posts
 * }
 */
function search(
    state = {
        term: '',
        searchResults: false,
        isMentionSearch: false,
        isFlaggedPosts: false,
        isPinnedPosts: false
    },
    action
) {
    const {type, data} = action;

    switch (type) {
    case SearchTypes.RECEIVED_SEARCH: {
        const {
            results: searchResults,
            is_mention_search: isMentionSearch,
            is_flagged_posts: isFlaggedPosts,
            is_pinned_posts: isPinnedPosts
        } = data;
        return {
            ...state,
            searchResults,
            isMentionSearch,
            isFlaggedPosts,
            isPinnedPosts
        };
    }
    case SearchTypes.RECEIVED_SEARCH_TERM: {
        let updatedState = state;
        const {do_search: doSearch, term} = data;
        if (doSearch) {
            updatedState = {
                ...state,
                searchResults: null,
                isMentionSearch: false,
                isFlaggedPosts: false,
                isPinnedPosts: false,
            };
        }
        updatedState = {...updatedState, term};
        return updatedState;
    }
    case PostTypes.POST_DELETED:
    case PostTypes.REMOVE_POST: {
        const {searchResults} = state;

        if (!searchResults) {
            return state;
        }

        const {posts, order} = searchResults;

        if (posts[data.id]) {
            const updatedPosts = {...posts};
            Reflect.deleteProperty(updatedPosts, data.id);
            const updatedOrder = order.filter((item) => item.id !== data.id);
            return {
                ...state,
                searchResults: {
                    posts: updatedPosts,
                    order: updatedOrder,
                }
            };
        }
        return state;
    }
    case PostTypes.RECEIVED_POST: {
        const {searchResults} = state;

        if (!searchResults) {
            return state;
        }

        const {posts} = searchResults;
        if (!posts[data.id]) {
            return state;
        }

        const updatedPosts = {
            ...posts,
            [data.id]: data
        };
        return {
            ...state,
            searchResults: {
                ...searchResults,
                posts: updatedPosts
            }
        };
    }
    default:
        return state;
    }
}

export default combineReducers({

    // An ordered array with posts ids from the search results
    results,

    // Object where every key is a team composed with
    // an object where the key is the term and the value indicates is "or" search
    recent,

    //Reducer that will store information like StoreSearch in mattermost-webapp
    search
});
