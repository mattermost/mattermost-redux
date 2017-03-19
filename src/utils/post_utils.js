// Copyright (c) 2016 Mattermost, Inc. All Rights Reserved.
// See License.txt for license information.

import {General, Posts, Preferences} from 'constants';

import {getPreferenceKey} from './preference_utils';

export function addDatesToPostList(posts, options = {}) {
    const {indicateNewMessages, currentUserId, lastViewedAt} = options;

    const out = [];

    let lastDate = null;
    let subsequentPostIsUnread = false;
    let subsequentPostUserId;
    let postIsUnread;
    for (const post of posts) {
        if (post.state === Posts.POST_DELETED && post.user_id === currentUserId) {
            continue;
        }
        postIsUnread = post.create_at > lastViewedAt;
        if (indicateNewMessages && subsequentPostIsUnread && !postIsUnread && subsequentPostUserId !== currentUserId) {
            out.push(General.START_OF_NEW_MESSAGES);
        }
        subsequentPostIsUnread = postIsUnread;
        subsequentPostUserId = post.user_id;

        const postDate = new Date(post.create_at);

        // Push on a date header if the last post was on a different day than the current one
        if (lastDate && lastDate.toDateString() !== postDate.toDateString()) {
            out.push(lastDate);
        }

        lastDate = postDate;
        out.push(post);
    }

    // Push on the date header for the oldest post
    if (lastDate) {
        out.push(lastDate);
    }

    return out;
}

export function isPostFlagged(postId, myPreferences) {
    const key = getPreferenceKey(Preferences.CATEGORY_FLAGGED_POST, postId);
    return myPreferences.hasOwnProperty(key);
}

export function isSystemMessage(post) {
    return post.type && post.type.startsWith(Posts.SYSTEM_MESSAGE_PREFIX);
}

export function shouldIgnorePost(post) {
    return Posts.IGNORE_POST_TYPES.includes(post.type);
}

