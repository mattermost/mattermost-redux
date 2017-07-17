// Copyright (c) 2016-present Mattermost, Inc. All Rights Reserved.
// See License.txt for license information.

import {combineReducers} from 'redux';
import {SearchTypes, UserTypes} from 'action_types';

function handleReceivedSearch(data) {
    const newPosts = data.posts;
    const postsForSearch = Object.values(newPosts);

    // Sort to ensure that the most recent posts are first
    postsForSearch.sort((a, b) => {
        if (a.create_at > b.create_at) {
            return -1;
        } else if (a.create_at < b.create_at) {
            return 1;
        }

        return 0;
    });

    return postsForSearch.map((post) => post.id);
}

function results(state = [], action) {
    switch (action.type) {
    case SearchTypes.RECEIVED_SEARCH_POSTS: {
        return handleReceivedSearch(action.data);
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
        const team = {
            ...nextState[data.teamId] || {},
            [data.terms]: data.isOrSearch
        };

        return {
            ...nextState,
            [data.teamId]: team
        };
    }
    case SearchTypes.REMOVE_SEARCH_TERM: {
        const team = {...nextState[data.teamId]} || {};
        const key = data.terms;

        if (team.hasOwnProperty(key)) {
            Reflect.deleteProperty(team, key);
        }

        return {
            ...nextState,
            [data.teamId]: team
        };
    }
    case UserTypes.LOGOUT_SUCCESS:
        return {};

    default:
        return state;
    }
}

export default combineReducers({

    // An ordered array with posts ids from the search results
    results,

    // Object where every key is a team composed with
    // an object where the key is the term and the value indicates is "or" search
    recent
});
