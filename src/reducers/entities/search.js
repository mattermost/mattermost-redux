// Copyright (c) 2016-present Mattermost, Inc. All Rights Reserved.
// See License.txt for license information.

import {combineReducers} from 'redux';
import {SearchTypes, UserTypes} from 'action_types';

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
    const {data, type} = action;

    switch (type) {
    case SearchTypes.RECEIVED_SEARCH_TERM: {
        const nextState = {...state};
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
        const nextState = {...state};
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

export default combineReducers({

    // An ordered array with posts ids from the search results
    results,

    // Object where every key is a team composed with
    // an object where the key is the term and the value indicates is "or" search
    recent
});
