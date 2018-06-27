// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {combineReducers} from 'redux';
import {GifTypes} from 'action_types';

const SEARCH_SELECTORS = {
    [GifTypes.SELECT_SEARCH_TEXT]: (state, action) => ({
        ...state,
        searchText: action.searchText,
    }),
    [GifTypes.INVALIDATE_SEARCH_TEXT]: (state, action) => ({
        ...state,
        resultsByTerm: {
            ...state.resultsByTerm[action.searchText],
            didInvalidate: true,
        },
    }),
    [GifTypes.REQUEST_SEARCH]: (state, action) => ({
        ...state,
        resultsByTerm: TERM_SELECTOR[action.type](state.resultsByTerm, action),
    }),
    [GifTypes.RECEIVE_SEARCH]: (state, action) => ({
        ...state,
        searchText: action.searchText,
        resultsByTerm: TERM_SELECTOR[action.type](state.resultsByTerm, action),
    }),
    [GifTypes.RECEIVE_SEARCH_END]: (state, action) => ({
        ...state,
        searchText: action.searchText,
        resultsByTerm: TERM_SELECTOR[action.type](state.resultsByTerm, action),
    }),
    [GifTypes.RECEIVE_CATEGORY_SEARCH]: (state, action) => ({
        ...state,
        searchText: action.searchText,
        resultsByTerm: TERM_SELECTOR[action.type](state.resultsByTerm, action),
    }),
    [GifTypes.SEARCH_FAILURE]: (state, action) => ({
        ...state,
        searchText: action.searchText,
        resultsByTerm: TERM_SELECTOR[action.type](state.resultsByTerm, action),
    }),
    [GifTypes.CLEAR_SEARCH_RESULTS]: (state) => ({
        ...state,
        searchText: '',
        resultsByTerm: {},
    }),
    [GifTypes.SAVE_SEARCH_SCROLL_POSITION]: (state, action) => ({
        ...state,
        scrollPosition: action.scrollPosition,
    }),
    [GifTypes.SAVE_SEARCH_PRIOR_LOCATION]: (state, action) => ({
        ...state,
        priorLocation: action.priorLocation,
    }),
    [GifTypes.UPDATE_SEARCH_TEXT]: (state, action) => ({
        ...state,
        searchText: action.searchText,
    }),
    [GifTypes.SAVE_SEARCH_BAR_TEXT]: (state, action) => ({
        ...state,
        searchBarText: action.searchBarText,
    }),
};

const CATEGORIES_SELECTORS = {
    [GifTypes.REQUEST_CATEGORIES_LIST]: (state) => ({
        ...state,
        isFetching: true,
    }),
    [GifTypes.CATEGORIES_LIST_RECEIVED]: (state, action) => {
        const {cursor, tags} = action;
        const {tagsList: oldTagsList = []} = state;
        const tagsDict = {};
        const newTagsList = tags.filter((item) => {
            return Boolean(item && item.gfycats[0] && item.gfycats[0].width);
        }).map((item) => {
            tagsDict[item.tag] = true;
            return {
                tagName: item.tag,
                gfyId: item.gfycats[0].gfyId,
            };
        });
        const tagsList = [...oldTagsList, ...newTagsList];
        return {
            ...state,
            cursor,
            hasMore: Boolean(cursor),
            isFetching: false,
            tagsList,
            tagsDict,
        };
    },
    [GifTypes.CATEGORIES_LIST_FAILURE]: (state) => ({
        ...state,
        isFetching: false,
    }),
};

const TERM_SELECTOR = {
    [GifTypes.REQUEST_SEARCH]: (state, action) => ({
        ...state,
        [action.searchText]: {
            ...state[action.searchText],
            isFetching: true,
            didInvalidate: false,
            pages: PAGE_SELECTOR[action.type](state[action.searchText], action),
        },
    }),
    [GifTypes.RECEIVE_SEARCH]: (state, action) => {
        const gfycats = action.gfycats.filter((item) => {
            return Boolean(item.gfyId && item.width && item.height);
        });
        const newItems = gfycats.map((gfycat) => gfycat.gfyId);
        return {
            ...state,
            [action.searchText]: {
                ...state[action.searchText],
                isFetching: false,
                items: typeof state[action.searchText] !== 'undefined' &&
                    state[action.searchText].items ?
                    [...state[action.searchText].items, ...newItems] :
                    newItems,
                moreRemaining:
                    typeof state[action.searchText] !== 'undefined' &&
                    state[action.searchText].items ?
                        [
                            ...state[action.searchText].items,
                            ...action.gfycats,
                        ].length < action.found :
                        action.gfycats.length < action.found,
                count: action.count,
                found: action.found,
                start: action.start,
                currentPage: action.currentPage,
                pages: PAGE_SELECTOR[action.type](state[action.searchText], action),
                cursor: action.cursor,
            },
        };
    },
    [GifTypes.RECEIVE_CATEGORY_SEARCH]: (state, action) => {
        const gfycats = action.gfycats.filter((item) => {
            return Boolean(item.gfyId && item.width && item.height);
        });
        const newItems = gfycats.map((gfycat) => gfycat.gfyId);
        return {
            ...state,
            [action.searchText]: {
                ...state[action.searchText],
                isFetching: false,
                items: typeof state[action.searchText] !== 'undefined' &&
                    state[action.searchText].items ?
                    [...state[action.searchText].items, ...newItems] :
                    newItems,
                cursor: action.cursor,
                moreRemaining: Boolean(action.cursor),
            },
        };
    },
    [GifTypes.RECEIVE_SEARCH_END]: (state, action) => ({
        ...state,
        [action.searchText]: {
            ...state[action.searchText],
            isFetching: false,
            moreRemaining: false,
        },
    }),
    [GifTypes.SEARCH_FAILURE]: (state, action) => ({
        ...state,
        [action.searchText]: {
            ...state[action.searchText],
            isFetching: false,
            items: [],
            moreRemaining: false,
            count: 0,
            found: 0,
            start: 0,
            isEmpty: true,
        },
    }),
};

const PAGE_SELECTOR = {
    [GifTypes.REQUEST_SEARCH]: ((state) = {}) => {
        if (typeof state.pages == 'undefined') {
            return {};
        }
        return {...state.pages};
    },
    [GifTypes.RECEIVE_SEARCH]: (state, action) => ({
        ...state.pages,
        [action.currentPage]: action.gfycats.map((gfycat) => gfycat.gfyId),
    }),
};

const CACHE_SELECTORS = {
    [GifTypes.CACHE_GIFS]: (state, action) => ({
        ...state,
        gifs: CACHE_GIF_SELECTOR[action.type](state.gifs, action),
        updating: false,
    }),
    [GifTypes.CACHE_REQUEST]: (state, action) => ({
        ...state,
        ...action.payload,
    }),
};

const CACHE_GIF_SELECTOR = {
    [GifTypes.CACHE_GIFS]: (state, action) => ({
        ...state,
        ...action.gifs.reduce((map, obj) => {
            map[obj.gfyId] = obj;
            return map;
        }, {}),
    }),
};

function appReducer(state = {}, action) {
    const nextState = {...state};
    switch (action.type) {
    case GifTypes.SAVE_APP_PROPS:
        return {...nextState, ...action.props};
    default:
        return state;
    }
}

function categoriesReducer(state = {}, action) {
    const selector = CATEGORIES_SELECTORS[action.type];
    return selector ? selector(state, action) : state;
}

function searchReducer(state = {}, action) {
    const selector = SEARCH_SELECTORS[action.type];
    return selector ? selector(state, action) : state;
}

function cacheReducer(state = {}, action) {
    const selector = CACHE_SELECTORS[action.type];
    return selector ? selector(state, action) : state;
}

export default combineReducers({
    app: appReducer,
    categories: categoriesReducer,
    search: searchReducer,
    cache: cacheReducer,
});
