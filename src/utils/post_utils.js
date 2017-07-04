// Copyright (c) 2016-present Mattermost, Inc. All Rights Reserved.
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

export function isFromWebhook(post) {
    return post.props && post.props.from_webhook;
}

export function isPostEphemeral(post) {
    return post.type === Posts.POST_TYPES.EPHEMERAL || post.state === Posts.POST_DELETED;
}

export function shouldIgnorePost(post) {
    return Posts.IGNORE_POST_TYPES.includes(post.type);
}

export function isPostOwner(userId, post) {
    return userId === post.user_id;
}

export function isEdited(post) {
    return post.edit_at > 0;
}

export function canDeletePost(config, license, userId, post, isAdmin, isSystemAdmin) {
    const isOwner = isPostOwner(userId, post);

    if (license.IsLicensed === 'true') {
        return (config.RestrictPostDelete === General.PERMISSIONS_ALL && (isOwner || isAdmin)) ||
            (config.RestrictPostDelete === General.PERMISSIONS_TEAM_ADMIN && isAdmin) ||
            (config.RestrictPostDelete === General.PERMISSIONS_SYSTEM_ADMIN && isSystemAdmin);
    }
    return isOwner || isAdmin;
}

export function canEditPost(config, license, userId, post, editDisableAction) {
    const isOwner = isPostOwner(userId, post);
    let canEdit = isOwner && !isSystemMessage(post);

    if (canEdit && license.IsLicensed === 'true') {
        if (config.AllowEditPost === General.ALLOW_EDIT_POST_NEVER) {
            canEdit = false;
        } else if (config.AllowEditPost === General.ALLOW_EDIT_POST_TIME_LIMIT) {
            const timeLeft = (post.create_at + (config.PostEditTimeLimit * 1000)) - Date.now();
            if (timeLeft > 0) {
                editDisableAction.fireAfter(timeLeft + 1000);
            } else {
                canEdit = false;
            }
        }
    }
    return canEdit;
}

export function getLastCreateAt(postsArray) {
    const createAt = postsArray.map((p) => p.create_at);

    if (createAt.length) {
        return Reflect.apply(Math.max, null, createAt);
    }

    return 0;
}

export function shouldFilterPost(post, options = {}) {
    // Add as much filters as needed here, if you want to filter the post return true
    const postTypes = Posts.POST_TYPES;

    if (options.filterJoinLeave && (post.type === postTypes.JOIN_LEAVE || post.type === postTypes.JOIN_CHANNEL || post.type === postTypes.LEAVE_CHANNEL)) {
        return true;
    }

    return false;
}

export function isPostPendingOrFailed(post) {
    return post.failed || post.id === post.pending_post_id;
}
