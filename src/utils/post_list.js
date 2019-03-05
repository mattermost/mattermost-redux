// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {Posts, Preferences} from 'constants';

import {makeGetPostsForIds} from 'selectors/entities/posts';
import {getBool} from 'selectors/entities/preferences';
import {getCurrentUser} from 'selectors/entities/users';

import {createIdsSelector} from 'utils/helpers';
import {shouldFilterJoinLeavePost} from 'utils/post_utils';

export const DATE_LINE = 'date-';
export const START_OF_NEW_MESSAGES = 'start-of-new-messages';

function shouldShowJoinLeaveMessages(state) {
    // This setting is true or not set if join/leave messages are to be displayed
    return getBool(state, Preferences.CATEGORY_ADVANCED_SETTINGS, Preferences.ADVANCED_FILTER_JOIN_LEAVE, true);
}

// Returns a selector that, given the state and an object containing an array of postIds and an optional
// timestamp of when the channel was last read, returns a memoized array of postIds interspersed with
// day indicators and an optional new message indicator.
export function makePreparePostIdsForPostList() {
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
