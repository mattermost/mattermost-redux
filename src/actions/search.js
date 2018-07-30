// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {batchActions} from 'redux-batched-actions';

import {Client4} from 'client';
import {SearchTypes} from 'action_types';

import {getCurrentTeamId} from 'selectors/entities/teams';
import {getCurrentUserId, getCurrentUserMentionKeys} from 'selectors/entities/users';

import {getChannelAndMyMember, getChannelMembers} from './channels';
import {forceLogoutIfNecessary} from './helpers';
import {logError} from './errors';
import {getProfilesAndStatusesForPosts} from './posts';

function getMissingChannelsFromPosts(posts) {
    return async (dispatch, getState) => {
        const {channels, membersInChannel, myMembers} = getState().entities.channels;
        const promises = [];

        Object.values(posts).forEach((post) => {
            const id = post.channel_id;
            if (!channels[id] || !myMembers[id]) {
                promises.push(getChannelAndMyMember(id)(dispatch, getState));
            }

            if (!membersInChannel[id]) {
                promises.push(getChannelMembers(id)(dispatch, getState));
            }
        });

        return Promise.all(promises);
    };
}

export function searchPosts(teamId, terms, isOrSearch = false, includeDeletedChannels = false) {
    return async (dispatch, getState) => {
        dispatch({type: SearchTypes.SEARCH_POSTS_REQUEST}, getState);

        let posts;
        try {
            posts = await Client4.searchPosts(teamId, terms, isOrSearch, includeDeletedChannels);

            await Promise.all([
                getProfilesAndStatusesForPosts(posts.posts, dispatch, getState),
                getMissingChannelsFromPosts(posts.posts)(dispatch, getState),
            ]);
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch, getState);
            dispatch(batchActions([
                {type: SearchTypes.SEARCH_POSTS_FAILURE, error},
                logError(error)(dispatch),
            ]), getState);
            return {error};
        }

        dispatch(batchActions([
            {
                type: SearchTypes.RECEIVED_SEARCH_POSTS,
                data: posts,
            },
            {
                type: SearchTypes.RECEIVED_SEARCH_TERM,
                data: {
                    teamId,
                    terms,
                    isOrSearch,
                },
            },
            {
                type: SearchTypes.SEARCH_POSTS_SUCCESS,
            },
        ], 'SEARCH_POST_BATCH'), getState);

        return {data: posts};
    };
}

export function clearSearch() {
    return async (dispatch, getState) => {
        dispatch({type: SearchTypes.REMOVE_SEARCH_POSTS}, getState);

        return {data: true};
    };
}

export function getFlaggedPosts() {
    return async (dispatch, getState) => {
        const state = getState();
        const userId = getCurrentUserId(state);
        const teamId = getCurrentTeamId(state);

        dispatch({type: SearchTypes.SEARCH_FLAGGED_POSTS_REQUEST}, getState);

        let posts;
        try {
            posts = await Client4.getFlaggedPosts(userId, '', teamId);
            await Promise.all([
                getProfilesAndStatusesForPosts(posts.posts, dispatch, getState),
                getMissingChannelsFromPosts(posts.posts)(dispatch, getState),
            ]);
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch, getState);
            dispatch(batchActions([
                {type: SearchTypes.SEARCH_FLAGGED_POSTS_FAILURE, error},
                logError(error)(dispatch),
            ]), getState);
            return {error};
        }

        dispatch(batchActions([
            {
                type: SearchTypes.RECEIVED_SEARCH_FLAGGED_POSTS,
                data: posts,
            },
            {
                type: SearchTypes.SEARCH_FLAGGED_POSTS_SUCCESS,
            },
        ], 'SEARCH_FLAGGED_POSTS_BATCH'), getState);

        return {data: posts};
    };
}

export function getRecentMentions() {
    return async (dispatch, getState) => {
        const state = getState();
        const teamId = getCurrentTeamId(state);

        dispatch({type: SearchTypes.SEARCH_RECENT_MENTIONS_REQUEST}, getState);

        let posts;
        try {
            const termKeys = getCurrentUserMentionKeys(state).filter(({key}) => {
                return key !== '@channel' && key !== '@all' && key !== '@here';
            });

            const terms = termKeys.map(({key}) => key).join(' ').trim() + ' ';

            Client4.trackEvent('api', 'api_posts_search_mention');
            posts = await Client4.searchPosts(teamId, terms, true, false);

            await Promise.all([
                getProfilesAndStatusesForPosts(posts.posts, dispatch, getState),
                getMissingChannelsFromPosts(posts.posts)(dispatch, getState),
            ]);
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch, getState);
            dispatch(batchActions([
                {type: SearchTypes.SEARCH_RECENT_MENTIONS_FAILURE, error},
                logError(error)(dispatch),
            ]), getState);
            return {error};
        }

        dispatch(batchActions([
            {
                type: SearchTypes.RECEIVED_SEARCH_POSTS,
                data: posts,
            },
            {
                type: SearchTypes.SEARCH_RECENT_MENTIONS_SUCCESS,
            },
        ], 'SEARCH_RECENT_MENTIONS_BATCH'), getState);

        return {data: posts};
    };
}

export function removeSearchTerms(teamId, terms) {
    return async (dispatch, getState) => {
        dispatch({
            type: SearchTypes.REMOVE_SEARCH_TERM,
            data: {
                teamId,
                terms,
            },
        }, getState);

        return {data: true};
    };
}

export default {
    clearSearch,
    removeSearchTerms,
    searchPosts,
};
