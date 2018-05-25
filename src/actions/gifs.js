import {GifTypes} from 'action_types';
import gfycatSdk from 'utils/gfycatSdk';
import {generateUUID, readCookie, setCookie} from 'utils/gif_utils';

// ANALYTICS

export const BATCH_MAX_LENGTH = 30;

export function viewCount({gfyId, params}) {
    return {
        type: GifTypes.SEND_VIEW_COUNT,
        payload: {
            gfyId,
            params,
        },
    };
}

export function analyticsEvent({event, params}) {
    return {
        type: GifTypes.SEND_EVENT,
        payload: {
            event,
            params,
        },
    };
}

export function setUserIdCookie(utc) {
    return {
        type: GifTypes.SET_USER_COOKIE,
        payload: {
            utc,
        },
    };
}

export function setSessionIdCookie(stc) {
    return {
        type: GifTypes.SET_SESSION_COOKIE,
        payload: {
            stc,
        },
    };
}

export function sendViewCount({gfyId, params}) {
    return (dispatch, getState) => {
        if (typeof document === 'undefined') {
            return;
        }
        if (!params.app_id) {
            params.add_id = 'com.gfycat.website';
        }

        dispatch(viewCount({gfyId, params}));
        const {utc, stc} = getUserAndSessionIds({dispatch, getState});
        const encodedUtc = encodeURIComponent(utc);
        const encodedStc = encodeURIComponent(stc);
        const deviceType = 'unknown';

        const extendedParams = {
            gfyid: gfyId,
            ...params,
            device_type: deviceType,
            utc: encodedUtc,
            stc: encodedStc,
            rand: Math.random() * 100000,
        };

        const queryString = queryParamsString(extendedParams);
        const url = `https://px.gfycat.com/px.gif?${queryString}`;
        fetch(url);
    };
}

export function sendViewCountBatch({gfycats, params}) {
    return (dispatch, getState) => {
        if (typeof document === 'undefined') {
            return;
        }
        if (!params.app_id) {
            params.add_id = 'com.gfycat.website';
        }

        const {utc, stc} = getUserAndSessionIds({dispatch, getState});
        const encodedUtc = encodeURIComponent(utc);
        const encodedStc = encodeURIComponent(stc);

        if (gfycats.length > BATCH_MAX_LENGTH) {
            const chunks = [];
            while (gfycats.length) {
                chunks.push(gfycats.splice(0, BATCH_MAX_LENGTH));
            }
            for (let i = 0; i < chunks.length; i++) {
                dispatch(sendViewCountBatch({gfycats: chunks[i], params}));
            }
            return;
        }

        const gfyIds = gfycats.reduce((ids, gfyItem, index) => {
            const key = index === 0 ? 'gfyid' : `gfyid_${index}`;
            ids[key] = gfyItem.gfyId;
            return ids;
        }, {});

        const extendedParams = {
            ...params,
            ...gfyIds,
            utc: encodedUtc,
            stc: encodedStc,
        };

        const queryString = queryParamsString(extendedParams);

        const url = `https://px.gfycat.com/px.gif?${queryString}`;
        fetch(url);
    };
}

export function splitBatchRequest({gfycats, params, dispatch}) {
    dispatch(sendViewCountBatch({gfycats, params}));
}

export function sendEvent({event, params}) {
    return (dispatch, getState) => {
        if (typeof document === 'undefined') {
            return;
        }
        dispatch(analyticsEvent({event, params}));
        const {utc, stc} = getUserAndSessionIds({dispatch, getState});
        const encodedUtc = encodeURIComponent(utc);
        const encodedStc = encodeURIComponent(stc);
        const ref = typeof document.referrer !== 'undefined' && document.referrer.length ?
            document.referrer : 'https://gfycat.com';
        const deviceType = 'unknown';

        const extendedParams = {
            ...params,
            event,
            utc: encodedUtc,
            stc: encodedStc,
            ref,
            device_type: deviceType,
        };

        const queryString = queryParamsString(extendedParams);

        const url = `https://metrics.gfycat.com/pix.gif?${queryString}`;
        fetch(url);
    };
}

function queryParamsString(params) {
    return params ? Object.keys(params).map((key) => {
        if (params[key]) {
            return `&${key}=${params[key]}`;
        }
        return '';
    }).join('') : '';
}

function getUserAndSessionIds({dispatch, getState}) {
    const {utc, stc} = getState().entities.gifs.analytics;

    let userId = utc;
    let sessionId = stc;

    if (!utc) {
        userId = readCookie('_utc');
        if (!userId) {
            userId = generateUUID();
            setCookie({name: '_utc', value: userId, exseconds: 2 * 365 * 24 * 60 * 60});
        }
        dispatch(setUserIdCookie(userId));
    }

    if (!stc) {
        sessionId = readCookie('_stc');
        if (!sessionId) {
            sessionId = generateUUID();
            setCookie({name: '_stc', value: sessionId, exseconds: 30 * 60});
        }
        dispatch(setSessionIdCookie(sessionId));
    }

    return {utc: userId, stc: sessionId};
}

// APP PROPS

export function saveAppPropsRequest(props) {
    return {
        type: GifTypes.SAVE_APP_PROPS,
        props,
    };
}

export function saveAppProps(appProps) {
    return (dispatch) => {
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
        const {resultsByTerm} = getState().entities.gifs.search;
        if (resultsByTerm[searchText]) {
            start = resultsByTerm[searchText].start + count;
        }
        dispatch(requestSearch(searchText, count, start));
        return gfycatSdk.search({search_text: searchText, count, start}).then((json) => {
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

                dispatch(sendViewCountBatch({
                    gfycats: json.gfycats,
                    params: {
                        context,
                        keyword: searchText,
                        app_id: getState().entities.gifs.app.appId,
                    },
                }));
            }
        }).catch(
            (err) => dispatch(errorSearching(err, searchText))
        );
    };
}

export function searchCategory({tagName = '', gfyCount = 30, cursorPos}) {
    var cursor = cursorPos;
    return (dispatch, getState) => {
        const {resultsByTerm} = getState().entities.gifs.search;
        if (resultsByTerm[tagName]) {
            cursor = resultsByTerm[tagName].cursor;
        }
        dispatch(requestSearch(tagName));
        return gfycatSdk.getTrendingCategories({tagName, gfyCount, cursor}).then(
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

                    dispatch(sendViewCountBatch({
                        gfycats: json.gfycats,
                        params: {
                            context: 'category',
                            keyword: tagName,
                            app_id: getState().entities.gifs.app.appId,
                        },
                    }));

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
    return (dispatch) => {
        dispatch(requestSearchById(gfyId));
        return gfycatSdk.searchById({id: gfyId}).then(
            (response) => {
                dispatch(receiveSearchById(gfyId, response.gfyItem));
                dispatch(cacheGifsRequest([response.gfyItem]));
            }
        ).catch((err) => dispatch(errorSearchById(err, gfyId)));
    };
}

export function shouldSearchById(state, gfyId) {
    const gif = state.cache.gifs[gfyId];
    if (!gif) {
        return true;
    }
    return false;
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
        return gfycatSdk.getCategories(options).then((json) => {
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
