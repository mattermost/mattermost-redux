// Copyright (c) 2016-present Mattermost, Inc. All Rights Reserved.
// See License.txt for license information.

import {General, Posts, Preferences, Permissions} from 'constants';

import {getPreferenceKey} from './preference_utils';
import {hasNewPermissions} from 'selectors/entities/general';
import {haveIChannelPermission} from 'selectors/entities/roles';

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
    return post.type === Posts.POST_TYPES.EPHEMERAL || post.type === Posts.POST_TYPES.EPHEMERAL_ADD_TO_CHANNEL || post.state === Posts.POST_DELETED;
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

export function canDeletePost(state, config, license, teamId, channelId, userId, post, isAdmin, isSystemAdmin) {
    if (!post) {
        return false;
    }

    const isOwner = isPostOwner(userId, post);

    if (hasNewPermissions(state)) {
        const canDelete = haveIChannelPermission(state, {team: teamId, channel: channelId, permission: Permissions.DELETE_POST});
        if (!isOwner) {
            return canDelete && haveIChannelPermission(state, {team: teamId, channel: channelId, permission: Permissions.DELETE_OTHERS_POSTS});
        }
        return canDelete;
    }

    if (license.IsLicensed === 'true') {
        return (config.RestrictPostDelete === General.PERMISSIONS_ALL && (isOwner || isAdmin)) ||
            (config.RestrictPostDelete === General.PERMISSIONS_TEAM_ADMIN && isAdmin) ||
            (config.RestrictPostDelete === General.PERMISSIONS_SYSTEM_ADMIN && isSystemAdmin);
    }
    return isOwner || isAdmin;
}

export function canEditPost(state, config, license, teamId, channelId, userId, post) {
    if (!post || isSystemMessage(post)) {
        return false;
    }

    const isOwner = isPostOwner(userId, post);

    let canEdit = true;

    if (canEdit && license.IsLicensed === 'true') {
        if (hasNewPermissions(state)) {
            canEdit = canEdit && haveIChannelPermission(state, {team: teamId, channel: channelId, permission: Permissions.EDIT_POST});
            if (!isOwner) {
                canEdit = canEdit && haveIChannelPermission(state, {team: teamId, channel: channelId, permission: Permissions.EDIT_OTHERS_POSTS});
            }
            if (config.PostEditTimeLimit !== '-1' && config.PostEditTimeLimit !== -1) {
                const timeLeft = (post.create_at + (config.PostEditTimeLimit * 1000)) - Date.now();
                if (timeLeft <= 0) {
                    canEdit = false;
                }
            }
        } else {
            canEdit = isOwner && config.AllowEditPost !== 'never';
            if (config.AllowEditPost === General.ALLOW_EDIT_POST_TIME_LIMIT) {
                const timeLeft = (post.create_at + (config.PostEditTimeLimit * 1000)) - Date.now();
                if (timeLeft <= 0) {
                    canEdit = false;
                }
            }
        }
    } else {
        canEdit = canEdit && isOwner;
    }
    return canEdit;
}

export function editDisable(state, config, license, teamId, channelId, userId, post, editDisableAction) {
    const canEdit = canEditPost(state, config, license, teamId, channelId, userId, post);

    if (canEdit && license.IsLicensed === 'true') {
        if (config.AllowEditPost === General.ALLOW_EDIT_POST_TIME_LIMIT || (config.PostEditTimeLimit !== -1 && config.PostEditTimeLimit !== '-1')) {
            const timeLeft = (post.create_at + (config.PostEditTimeLimit * 1000)) - Date.now();
            if (timeLeft > 0) {
                editDisableAction.fireAfter(timeLeft + 1000);
            }
        }
    }
}

export function getLastCreateAt(postsArray) {
    const createAt = postsArray.map((p) => p.create_at);

    if (createAt.length) {
        return Reflect.apply(Math.max, null, createAt);
    }

    return 0;
}

const joinLeavePostTypes = [
    Posts.POST_TYPES.JOIN_LEAVE,
    Posts.POST_TYPES.JOIN_CHANNEL,
    Posts.POST_TYPES.LEAVE_CHANNEL,
    Posts.POST_TYPES.ADD_REMOVE,
    Posts.POST_TYPES.ADD_TO_CHANNEL,
    Posts.POST_TYPES.REMOVE_FROM_CHANNEL,
    Posts.POST_TYPES.JOIN_TEAM,
    Posts.POST_TYPES.LEAVE_TEAM,
    Posts.POST_TYPES.ADD_TO_TEAM,
    Posts.POST_TYPES.REMOVE_FROM_TEAM,
];

// Returns true if a post should be hidden when the user has Show Join/Leave Messages disabled
export function shouldFilterJoinLeavePost(post, showJoinLeave, currentUsername) {
    if (showJoinLeave) {
        return false;
    }

    // Don't filter out non-join/leave messages
    if (joinLeavePostTypes.indexOf(post.type) === -1) {
        return false;
    }

    // Don't filter out join/leave messages about the current user
    if (post.props) {
        if (post.props.username === currentUsername ||
            post.props.addedUsername === currentUsername ||
            post.props.removedUsername === currentUsername) {
            return false;
        }
    }

    return true;
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
