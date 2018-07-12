// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {GifTypes} from 'action_types';
import {Client4} from 'client';
import gfycatSdk from 'utils/gfycat_sdk';

// APP PROPS

export function saveAppPropsRequest(props) {
    return {
        type: GifTypes.SAVE_APP_PROPS,
        props,
    };
}

export function saveAppProps(appProps) {
    return (dispatch, getState) => {
        const {GfycatApiKey, GfycatApiSecret} = getState().entities.general.config;
        gfycatSdk(GfycatApiKey, GfycatApiSecret).authenticate();
        dispatch(saveAppPropsRequest(appProps));
    };
}

// SEARCH

export function selectSearchText(searchText) {
    return {
        type: GifTypes.SELECT_SEARCH_TEXT,
        searchText,
    };
}

export function updateSearchText(searchText) {
    return {
        type: GifTypes.UPDATE_SEARCH_TEXT,
        searchText,
    };
}

export function searchBarTextSave(searchBarText) {
    return {
        type: GifTypes.SAVE_SEARCH_BAR_TEXT,
        searchBarText,
    };
}

export function invalidateSearchText(searchText) {
    return {
        type: GifTypes.INVALIDATE_SEARCH_TEXT,
        searchText,
    };
}

export function requestSearch(searchText) {
    return {
        type: GifTypes.REQUEST_SEARCH,
        searchText,
    };
}

export function receiveSearch({searchText, count, start, json}) {
    return {
        type: GifTypes.RECEIVE_SEARCH,
        searchText,
        ...json,
        count,
        start,
        currentPage: start / count,
        receivedAt: Date.now(),
    };
}

export function receiveSearchEnd(searchText) {
    return {
        type: GifTypes.RECEIVE_SEARCH_END,
        searchText,
    };
}

export function errorSearching(err, searchText) {
    return {
        type: GifTypes.SEARCH_FAILURE,
        searchText,
        err,
    };
}

export function receiveCategorySearch({tagName, json}) {
    return {
        type: GifTypes.RECEIVE_CATEGORY_SEARCH,
        searchText: tagName,
        ...json,
        receiveAt: Date.now(),
    };
}

export function clearSearchResults() {
    return {
        type: GifTypes.CLEAR_SEARCH_RESULTS,
    };
}

export function requestSearchById(gfyId) {
    return {
        type: GifTypes.SEARCH_BY_ID_REQUEST,
        payload: {
            gfyId,
        },
    };
}

export function receiveSearchById(gfyId, gfyItem) {
    return {
        type: GifTypes.SEARCH_BY_ID_SUCCESS,
        payload: {
            gfyId,
            gfyItem,
        },
    };
}

export function errorSearchById(err, gfyId) {
    return {
        type: GifTypes.SEARCH_BY_ID_FAILURE,
        err,
        gfyId,
    };
}

export function searchScrollPosition(scrollPosition) {
    return {
        type: GifTypes.SAVE_SEARCH_SCROLL_POSITION,
        scrollPosition,
    };
}

export function searchPriorLocation(priorLocation) {
    return {
        type: GifTypes.SAVE_SEARCH_PRIOR_LOCATION,
        priorLocation,
    };
}

export function searchGfycat({searchText, count = 30, startIndex = 0}) {
    var start = startIndex;
    return (dispatch, getState) => {
        const {GfycatApiKey, GfycatApiSecret} = getState().entities.general.config;
        const {resultsByTerm} = getState().entities.gifs.search;
        if (resultsByTerm[searchText]) {
            start = resultsByTerm[searchText].start + count;
        }
        dispatch(requestSearch(searchText, count, start));
        gfycatSdk(GfycatApiKey, GfycatApiSecret).authenticate();
        return gfycatSdk(GfycatApiKey, GfycatApiSecret).search({search_text: searchText, count, start}).then((json) => {
            if (json.errorMessage) {
                // There was no results before
                if (resultsByTerm[searchText].items) {
                    dispatch(receiveSearchEnd(searchText));
                } else {
                    dispatch(errorSearching(json, searchText));
                }
            } else {
                dispatch(updateSearchText(searchText));
                dispatch(cacheGifsRequest(json.gfycats));
                dispatch(receiveSearch({searchText, count, start, json}));

                const context = getState().entities.gifs.categories.tagsDict[searchText] ?
                    'category' :
                    'search';
                Client4.trackEvent(
                    'gfycat',
                    'views',
                    {context, count: json.gfycats.length, keyword: searchText}
                );
            }
        }).catch(
            (err) => dispatch(errorSearching(err, searchText))
        );
    };
}

export function searchCategory({tagName = '', gfyCount = 30, cursorPos}) {
    var cursor = cursorPos;
    return (dispatch, getState) => {
        const {GfycatApiKey, GfycatApiSecret} = getState().entities.general.config;
        const {resultsByTerm} = getState().entities.gifs.search;
        if (resultsByTerm[tagName]) {
            cursor = resultsByTerm[tagName].cursor;
        }
        dispatch(requestSearch(tagName));
        return gfycatSdk(GfycatApiKey, GfycatApiSecret).getTrendingCategories({tagName, gfyCount, cursor}).then(
            (json) => {
                if (json.errorMessage) {
                    if (resultsByTerm[tagName].gfycats) {
                        dispatch(receiveSearchEnd(tagName));
                    } else {
                        dispatch(errorSearching(json, tagName));
                    }
                } else {
                    dispatch(updateSearchText(tagName));
                    dispatch(cacheGifsRequest(json.gfycats));
                    dispatch(receiveCategorySearch({tagName, json}));

                    Client4.trackEvent(
                        'gfycat',
                        'views',
                        {context: 'category', count: json.gfycats.length, keyword: tagName}
                    );

                    // preload categories list
                    if (tagName === 'trending') {
                        dispatch(requestCategoriesListIfNeeded());
                    }
                }
            }
        ).catch((err) => dispatch(errorSearching(err, tagName)));
    };
}

export function shouldSearch(state, searchText) {
    const resultsByTerm = state.search.resultsByTerm[searchText];
    if (!resultsByTerm) {
        return true;
    } else if (resultsByTerm.isFetching) {
        return false;
    } else if (resultsByTerm.moreRemaining) {
        return true;
    }
    return resultsByTerm.didInvalidate;
}

export function searchIfNeeded(searchText) {
    return (dispatch, getState) => {
        if (shouldSearch(getState(), searchText)) {
            if (searchText.toLowerCase() === 'trending') {
                return dispatch(searchCategory({tagName: searchText}));
            }
            return dispatch(searchGfycat({searchText}));
        }
        return Promise.resolve();
    };
}

export function searchIfNeededInitial(searchText) {
    return (dispatch, getState) => {
        dispatch(updateSearchText(searchText));
        if (shouldSearchInitial(getState(), searchText)) {
            if (searchText.toLowerCase() === 'trending') {
                return dispatch(searchCategory({tagName: searchText}));
            }
            return dispatch(searchGfycat({searchText}));
        }
        return Promise.resolve();
    };
}

export function shouldSearchInitial(state, searchText) {
    const resultsByTerm = state.entities.gifs.search.resultsByTerm[searchText];
    if (!resultsByTerm) {
        return true;
    } else if (resultsByTerm.isFetching) {
        return false;
    }
    return false;
}

export function searchById(gfyId) {
    return (dispatch, getState) => {
        const {GfycatApiKey, GfycatApiSecret} = getState().entities.general.config;
        dispatch(requestSearchById(gfyId));
        return gfycatSdk(GfycatApiKey, GfycatApiSecret).searchById({id: gfyId}).then(
            (response) => {
                dispatch(receiveSearchById(gfyId, response.gfyItem));
                dispatch(cacheGifsRequest([response.gfyItem]));
            }
        ).catch((err) => dispatch(errorSearchById(err, gfyId)));
    };
}

export function shouldSearchById(state, gfyId) {
    return !state.cache.gifs[gfyId];
}

export function searchByIdIfNeeded(gfyId) {
    return (dispatch, getState) => {
        if (shouldSearchById(getState(), gfyId)) {
            return dispatch(searchById(gfyId));
        }
        return Promise.resolve(getState().cache.gifs[gfyId]);
    };
}

export function saveSearchScrollPosition(scrollPosition) {
    return (dispatch) => {
        dispatch(searchScrollPosition(scrollPosition));
    };
}

export function saveSearchPriorLocation(priorLocation) {
    return (dispatch) => {
        dispatch(searchPriorLocation(priorLocation));
    };
}

export function searchTextUpdate(searchText) {
    return (dispatch) => {
        dispatch(updateSearchText(searchText));
    };
}

export function saveSearchBarText(searchBarText) {
    return (dispatch) => {
        dispatch(searchBarTextSave(searchBarText));
    };
}

// CATEGORIES

export function categoriesListRequest() {
    return {
        type: GifTypes.REQUEST_CATEGORIES_LIST,
    };
}

export function categoriesListReceived(json) {
    return {
        type: GifTypes.CATEGORIES_LIST_RECEIVED,
        ...json,
    };
}

export function categoriesListFailure(err) {
    return {
        type: GifTypes.CATEGORIES_LIST_FAILURE,
        err,
    };
}

export function requestCategoriesList({count = 60} = {}) {
    return (dispatch, getState) => {
        const {GfycatApiKey, GfycatApiSecret} = getState().entities.general.config;
        const state = getState().entities.gifs.categories;
        if (!shouldRequestCategoriesList(state)) {
            return Promise.resolve();
        }
        dispatch(categoriesListRequest());
        const {cursor} = state;
        const options = {
            ...(count && {count}),
            ...(cursor && {cursor}),
        };
        return gfycatSdk(GfycatApiKey, GfycatApiSecret).getCategories(options).then((json) => {
            const newGfycats = json.tags.reduce((gfycats, tag) => {
                if (tag.gfycats[0] && tag.gfycats[0].width) {
                    return [...gfycats, ...tag.gfycats];
                }
                return gfycats;
            }, []);
            dispatch(cacheGifsRequest(newGfycats));
            dispatch(categoriesListReceived(json));
        }).catch(
            (err) => {
                dispatch(categoriesListFailure(err));
            }
        );
    };
}

export function requestCategoriesListIfNeeded({count} = {}) {
    return (dispatch, getState) => {
        const state = getState().entities.gifs.categories;
        if (state.tagsList && state.tagsList.length) {
            return Promise.resolve();
        }
        return dispatch(requestCategoriesList({count}));
    };
}

export function shouldRequestCategoriesList(state) {
    const {hasMore, isFetching, tagsList} = state;
    if (!tagsList || !tagsList.length) {
        return true;
    } else if (isFetching) {
        return false;
    } else if (hasMore) {
        return true;
    }
    return false;
}

// CACHE

export function cacheRequest() {
    return {
        type: GifTypes.CACHE_REQUEST,
        payload: {
            updating: true,
        },
    };
}

export function cacheGifs(gifs) {
    return {
        type: GifTypes.CACHE_GIFS,
        gifs,
    };
}

export function cacheGifsRequest(gifs) {
    return (dispatch) => {
        dispatch(cacheRequest());
        dispatch(cacheGifs(gifs));
    };
}
