// Copyright (c) 2016-present Mattermost, Inc. All Rights Reserved.
// See License.txt for license information.

import {General, Posts, Preferences} from 'constants';

import {getPreferenceKey} from './preference_utils';

export function isPostFlagged(postId, myPreferences) {
    const key = getPreferenceKey(Preferences.CATEGORY_FLAGGED_POST, postId);
    return myPreferences.hasOwnProperty(key);
}

export function isSystemMessage(post) {
    return post.type !== '' && post.type && post.type.startsWith(Posts.SYSTEM_MESSAGE_PREFIX);
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

    if ('showJoinLeave' in options && !options.showJoinLeave) {
        const joinLeaveTypes = [postTypes.JOIN_LEAVE, postTypes.JOIN_CHANNEL, postTypes.LEAVE_CHANNEL, postTypes.ADD_REMOVE, postTypes.ADD_TO_CHANNEL, postTypes.REMOVE_FROM_CHANNEL];
        if (joinLeaveTypes.includes(post.type)) {
            return true;
        }
    }

    return false;
}

export function isPostPendingOrFailed(post) {
    return post.failed || post.id === post.pending_post_id;
}

export function comparePosts(a, b) {
    const aIsPendingOrFailed = isPostPendingOrFailed(a);
    const bIsPendingOrFailed = isPostPendingOrFailed(b);
    if (aIsPendingOrFailed && !bIsPendingOrFailed) {
        return -1;
    } else if (!aIsPendingOrFailed && bIsPendingOrFailed) {
        return 1;
    }

    if (a.create_at > b.create_at) {
        return -1;
    } else if (a.create_at < b.create_at) {
        return 1;
    }

    return 0;
}
