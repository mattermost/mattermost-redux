// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {Posts, Preferences} from 'constants';

import {makeGetPostsForIds} from 'selectors/entities/posts';
import {getBool} from 'selectors/entities/preferences';
import {getCurrentUser} from 'selectors/entities/users';

import {createIdsSelector} from 'utils/helpers';
import {isUserActivityPost, shouldFilterJoinLeavePost} from 'utils/post_utils';

export const COMBINED_USER_ACTIVITY = 'user-activity-';
export const DATE_LINE = 'date-';
export const START_OF_NEW_MESSAGES = 'start-of-new-messages';

const MAX_COMBINED_SYSTEM_POSTS = 100;

function shouldShowJoinLeaveMessages(state) {
    // This setting is true or not set if join/leave messages are to be displayed
    return getBool(state, Preferences.CATEGORY_ADVANCED_SETTINGS, Preferences.ADVANCED_FILTER_JOIN_LEAVE, true);
}

export function makePreparePostIdsForPostList() {
    const filterPostsAndAddSeparators = makeFilterPostsAndAddSeparators();
    const combineUserActivityPosts = makeCombineUserActivityPosts();

    return (state, options) => {
        let postIds = filterPostsAndAddSeparators(state, options);
        postIds = combineUserActivityPosts(state, postIds);

        return postIds;
    };
}

// Returns a selector that, given the state and an object containing an array of postIds and an optional
// timestamp of when the channel was last read, returns a memoized array of postIds interspersed with
// day indicators and an optional new message indicator.
export function makeFilterPostsAndAddSeparators() {
    const getPostsForIds = makeGetPostsForIds();

    return createIdsSelector(
        (state, {postIds}) => getPostsForIds(state, postIds),
        (state, {lastViewedAt}) => lastViewedAt,
        (state, {indicateNewMessages}) => indicateNewMessages,
        (state) => state.entities.posts.selectedPostId,
        getCurrentUser,
        shouldShowJoinLeaveMessages,
        (posts, lastViewedAt, indicateNewMessages, selectedPostId, currentUser, showJoinLeave) => {
            if (posts.length === 0 || !currentUser) {
                return [];
            }

            const out = [];

            let lastDate = null;
            let addedNewMessagesIndicator = false;

            // Iterating through the posts from oldest to newest
            for (let i = posts.length - 1; i >= 0; i--) {
                const post = posts[i];

                if (
                    !post ||
                    (post.type === Posts.POST_TYPES.EPHEMERAL_ADD_TO_CHANNEL && !selectedPostId)
                ) {
                    continue;
                }

                // Filter out join/leave messages if necessary
                if (shouldFilterJoinLeavePost(post, showJoinLeave, currentUser.username)) {
                    continue;
                }

                // Push on a date header if the last post was on a different day than the current one
                const postDate = new Date(post.create_at);
                postDate.setHours(0, 0, 0, 0);

                if (!lastDate || lastDate.toDateString() !== postDate.toDateString()) {
                    out.push(DATE_LINE + postDate.getTime());

                    lastDate = postDate;
                }

                if (
                    lastViewedAt &&
                    post.create_at > lastViewedAt &&
                    post.user_id !== currentUser.id &&
                    !addedNewMessagesIndicator &&
                    indicateNewMessages
                ) {
                    out.push(START_OF_NEW_MESSAGES);
                    addedNewMessagesIndicator = true;
                }

                out.push(post.id);
            }

            // Flip it back to newest to oldest
            return out.reverse();
        }
    );
}

export function makeCombineUserActivityPosts() {
    return createIdsSelector(
        (state, postIds) => postIds,
        (state) => state.entities.posts.posts,
        (postIds, posts) => {
            let lastPostIsUserActivity = false;
            let combinedCount = 0;

            const out = [];

            for (let i = 0; i < postIds.length; i++) {
                const postId = postIds[i];

                if (postId === START_OF_NEW_MESSAGES || postId.startsWith(DATE_LINE)) {
                    // Not a post, so it won't be combined
                    out.push(postId);

                    lastPostIsUserActivity = false;
                    combinedCount = 0;

                    continue;
                }

                const post = posts[postId];
                const postIsUserActivity = isUserActivityPost(post.type);

                if (postIsUserActivity && lastPostIsUserActivity && combinedCount < MAX_COMBINED_SYSTEM_POSTS) {
                    // Ensure the previous item has the prefix and then add the new post ID to the end of it
                    if (!out[out.length - 1].startsWith(COMBINED_USER_ACTIVITY)) {
                        out[out.length - 1] = COMBINED_USER_ACTIVITY + out[out.length - 1];
                    }

                    out[out.length - 1] += '_' + postId;

                    combinedCount += 1;
                } else {
                    out.push(postId);

                    combinedCount = 0;
                }

                lastPostIsUserActivity = postIsUserActivity;
            }

            if (postIds.length === out.length) {
                // Nothing was combined, so return the original array
                return postIds;
            }

            return out;
        },
    );
}
