// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {General, Posts, Preferences, Permissions} from 'constants';

import {hasNewPermissions} from 'selectors/entities/general';
import {haveIChannelPermission} from 'selectors/entities/roles';

import {generateId} from './helpers';
import {getPreferenceKey} from './preference_utils';

const MAX_COMBINED_SYSTEM_POSTS = 100;

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

export function isUserActivityPost(postType) {
    return Posts.USER_ACTIVITY_POST_TYPES.includes(postType);
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

    // Backwards compatibility with pre-advanced permissions config settings.
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

    if (hasNewPermissions(state)) {
        canEdit = canEdit && haveIChannelPermission(state, {team: teamId, channel: channelId, permission: Permissions.EDIT_POST});
        if (!isOwner) {
            canEdit = canEdit && haveIChannelPermission(state, {team: teamId, channel: channelId, permission: Permissions.EDIT_OTHERS_POSTS});
        }
        if (license.IsLicensed === 'true' && config.PostEditTimeLimit !== '-1' && config.PostEditTimeLimit !== -1) {
            const timeLeft = (post.create_at + (config.PostEditTimeLimit * 1000)) - Date.now();
            if (timeLeft <= 0) {
                canEdit = false;
            }
        }
    } else {
        // Backwards compatibility with pre-advanced permissions config settings.
        canEdit = isOwner && config.AllowEditPost !== 'never';
        if (config.AllowEditPost === General.ALLOW_EDIT_POST_TIME_LIMIT) {
            const timeLeft = (post.create_at + (config.PostEditTimeLimit * 1000)) - Date.now();
            if (timeLeft <= 0) {
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
    Posts.POST_TYPES.COMBINED_USER_ACTIVITY,
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
    return !isJoinLeavePostForUsername(post, currentUsername);
}

function isJoinLeavePostForUsername(post, currentUsername) {
    if (!post.props) {
        return false;
    }

    if (post.user_activity_posts) {
        for (const childPost of post.user_activity_posts) {
            if (isJoinLeavePostForUsername(childPost, currentUsername)) {
                // If any of the contained posts are for this user, the client will
                // need to figure out how to render the post
                return true;
            }
        }
    }

    return post.props.username === currentUsername ||
        post.props.addedUsername === currentUsername ||
        post.props.removedUsername === currentUsername;
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

export const postTypePriority = {
    [Posts.POST_TYPES.JOIN_TEAM]: 0,
    [Posts.POST_TYPES.ADD_TO_TEAM]: 1,
    [Posts.POST_TYPES.LEAVE_TEAM]: 2,
    [Posts.POST_TYPES.REMOVE_FROM_TEAM]: 3,
    [Posts.POST_TYPES.JOIN_CHANNEL]: 4,
    [Posts.POST_TYPES.ADD_TO_CHANNEL]: 5,
    [Posts.POST_TYPES.LEAVE_CHANNEL]: 6,
    [Posts.POST_TYPES.REMOVE_FROM_CHANNEL]: 7,
};

export function comparePostTypes(a, b) {
    return postTypePriority[a.postType] - postTypePriority[b.postType];
}

function extractUserActivityData(userActivities) {
    const messageData = [];
    const allUserIds = [];
    const allUsernames = [];

    Object.entries(userActivities).forEach(([postType, values]) => {
        if (
            postType === Posts.POST_TYPES.ADD_TO_TEAM ||
            postType === Posts.POST_TYPES.ADD_TO_CHANNEL ||
            postType === Posts.POST_TYPES.REMOVE_FROM_CHANNEL
        ) {
            Object.entries(values).forEach(([actorId, users]) => {
                const {ids, usernames} = users;
                messageData.push({postType, userIds: [...usernames, ...ids], actorId});
                if (ids.length > 0) {
                    allUserIds.push(...ids);
                }

                if (usernames.length > 0) {
                    allUsernames.push(...usernames);
                }
                allUserIds.push(actorId);
            });
        } else {
            messageData.push({postType, userIds: values});
            allUserIds.push(...values);
        }
    });

    messageData.sort(comparePostTypes);

    function reduceUsers(acc, curr) {
        if (!acc.includes(curr)) {
            acc.push(curr);
        }
        return acc;
    }

    return {
        allUserIds: allUserIds.reduce(reduceUsers, []),
        allUsernames: allUsernames.reduce(reduceUsers, []),
        messageData,
    };
}

export function combineUserActivitySystemPost(systemPosts = []) {
    if (systemPosts.length === 0) {
        return null;
    }

    const userActivities = systemPosts.reduce((acc, post) => {
        const postType = post.type;
        let userActivityProps = acc;
        const combinedPostType = userActivityProps[postType];

        if (
            postType === Posts.POST_TYPES.ADD_TO_TEAM ||
            postType === Posts.POST_TYPES.ADD_TO_CHANNEL ||
            postType === Posts.POST_TYPES.REMOVE_FROM_CHANNEL
        ) {
            const userId = post.props.addedUserId || post.props.removedUserId;
            const username = post.props.addedUsername || post.props.removedUsername;
            if (combinedPostType) {
                const users = combinedPostType[post.user_id] || {ids: [], usernames: []};
                if (userId) {
                    if (!users.ids.includes(userId)) {
                        users.ids.push(userId);
                    }
                } else if (username && !users.usernames.includes(username)) {
                    users.usernames.push(username);
                }
                combinedPostType[post.user_id] = users;
            } else {
                const users = {ids: [], usernames: []};
                if (userId) {
                    users.ids.push(userId);
                } else if (username) {
                    users.usernames.push(username);
                }
                userActivityProps[postType] = {
                    [post.user_id]: users,
                };
            }
        } else {
            const propsUserId = post.user_id;

            if (combinedPostType) {
                if (!combinedPostType.includes(propsUserId)) {
                    userActivityProps[postType] = [...combinedPostType, propsUserId];
                }
            } else {
                userActivityProps = {...userActivityProps, [postType]: [propsUserId]};
            }
        }

        return userActivityProps;
    }, {});

    return extractUserActivityData(userActivities);
}

export function combineSystemPosts(postsIds = [], posts = {}, channelId) {
    if (postsIds.length === 0) {
        return {postsForChannel: postsIds, nextPosts: posts};
    }

    const postsForChannel = [];
    const nextPosts = {...posts};

    let userActivitySystemPosts = [];
    let systemPostIds = [];
    let messages = [];
    let createAt;
    let combinedPostId;

    postsIds.forEach((p, i) => {
        const channelPost = posts[p];
        const combinedOrUserActivityPost = isUserActivityPost(channelPost.type) || channelPost.type === Posts.POST_TYPES.COMBINED_USER_ACTIVITY;
        if (channelPost.delete_at === 0 && combinedOrUserActivityPost) {
            if (!createAt || createAt > channelPost.create_at) {
                createAt = channelPost.create_at;
            }

            if (isUserActivityPost(channelPost.type)) {
                userActivitySystemPosts.push(channelPost);
                systemPostIds.push(channelPost.id);
                messages.push(channelPost.message);

                if (nextPosts[channelPost.id]) {
                    nextPosts[channelPost.id] = {...channelPost, state: Posts.POST_DELETED, delete_at: 1};
                }
            } else if (channelPost.type === Posts.POST_TYPES.COMBINED_USER_ACTIVITY) {
                userActivitySystemPosts.push(...channelPost.user_activity_posts);
                systemPostIds.push(...channelPost.system_post_ids);
                messages.push(...channelPost.props.messages);

                combinedPostId = channelPost.id;
            }
        }
        if (
            (!combinedOrUserActivityPost && userActivitySystemPosts.length > 0) ||
            userActivitySystemPosts.length === MAX_COMBINED_SYSTEM_POSTS ||
            (userActivitySystemPosts.length > 0 && i === postsIds.length - 1)
        ) {
            const combinedPost = {
                id: combinedPostId || generateId(),
                root_id: '',
                channel_id: channelId,
                create_at: createAt,
                delete_at: 0,
                message: messages.join('\n'),
                props: {
                    messages,
                    user_activity: combineUserActivitySystemPost(userActivitySystemPosts),
                },
                state: '',
                system_post_ids: systemPostIds,
                type: Posts.POST_TYPES.COMBINED_USER_ACTIVITY,
                user_activity_posts: userActivitySystemPosts,
                user_id: '',
            };

            nextPosts[combinedPost.id] = combinedPost;
            postsForChannel.push(combinedPost.id);

            userActivitySystemPosts = [];
            systemPostIds = [];
            messages = [];
            createAt = null;
            combinedPostId = null;

            if (!combinedOrUserActivityPost) {
                postsForChannel.push(channelPost.id);
            }
        } else if (!combinedOrUserActivityPost) {
            postsForChannel.push(channelPost.id);
        }
    });

    postsForChannel.sort((a, b) => {
        return comparePosts(nextPosts[a], nextPosts[b]);
    });

    return {postsForChannel, nextPosts};
}
