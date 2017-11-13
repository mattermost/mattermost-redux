// Copyright (c) 2017-present Mattermost, Inc. All Rights Reserved.
// See License.txt for license information.

import {batchActions} from 'redux-batched-actions';

import {Client4} from 'client';
import {SearchTypes} from 'action_types';

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

export function searchPosts(teamId, terms, isOrSearch = false) {
    return async (dispatch, getState) => {
        dispatch({type: SearchTypes.SEARCH_POSTS_REQUEST}, getState);

        let posts;
        try {
            posts = await Client4.searchPosts(teamId, terms, isOrSearch);
            await getProfilesAndStatusesForPosts(posts.posts, dispatch, getState);
            await getMissingChannelsFromPosts(posts.posts)(dispatch, getState);
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch);
            dispatch(batchActions([
                {type: SearchTypes.SEARCH_POSTS_FAILURE, error},
                logError(error)(dispatch)
            ]), getState);
            return {error};
        }

        dispatch(batchActions([
            {
                type: SearchTypes.RECEIVED_SEARCH_POSTS,
                data: posts
            },
            {
                type: SearchTypes.RECEIVED_SEARCH_TERM,
                data: {
                    teamId,
                    terms,
                    isOrSearch
                }
            },
            {
                type: SearchTypes.SEARCH_POSTS_SUCCESS
            }
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

export function removeSearchTerms(teamId, terms) {
    return async (dispatch, getState) => {
        dispatch({
            type: SearchTypes.REMOVE_SEARCH_TERM,
            data: {
                teamId,
                terms
            }
        }, getState);

        return {data: true};
    };
}

export default {
    clearSearch,
    removeSearchTerms,
    searchPosts
};
