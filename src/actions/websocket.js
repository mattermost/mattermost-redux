// Copyright (c) 2016-present Mattermost, Inc. All Rights Reserved.
// See License.txt for license information.

import {batchActions} from 'redux-batched-actions';

import {Client4} from 'client';
import websocketClient from 'client/websocket_client';
import {getProfilesByIds, getStatusesByIds, loadProfilesForDirect} from './users';
import {
    fetchMyChannelsAndMembers,
    getChannelAndMyMember,
    getChannelStats,
    updateChannelHeader,
    updateChannelPurpose,
    markChannelAsUnread,
    markChannelAsRead
} from './channels';
import {
    getPosts,
    getPostsSince
} from './posts';

import {
    getMyPreferences,
    makeDirectChannelVisibleIfNecessary,
    makeGroupMessageVisibleIfNecessary
} from './preferences';

import {
    ChannelTypes,
    GeneralTypes,
    PostTypes,
    PreferenceTypes,
    TeamTypes,
    UserTypes
} from 'action_types';
import {General, WebsocketEvents, Preferences, Posts} from 'constants';

import {getCurrentChannelStats} from 'selectors/entities/channels';
import {getUserIdFromChannelName} from 'utils/channel_utils';
import {isFromWebhook, isSystemMessage, getLastUpdateAt, shouldIgnorePost} from 'utils/post_utils';
import EventEmitter from 'utils/event_emitter';

export function init(platform, siteUrl, token, optionalWebSocket) {
    return async (dispatch, getState) => {
        const config = getState().entities.general.config;
        let connUrl = siteUrl || Client4.getUrl();
        const authToken = token || Client4.getToken();

        // replace the protocol with a websocket one
        if (connUrl.startsWith('https:')) {
            connUrl = connUrl.replace(/^https:/, 'wss:');
        } else {
            connUrl = connUrl.replace(/^http:/, 'ws:');
        }

        // append a port number if one isn't already specified
        if (!(/:\d+$/).test(connUrl)) {
            if (connUrl.startsWith('wss:')) {
                connUrl += ':' + (config.WebsocketSecurePort || 443);
            } else {
                connUrl += ':' + (config.WebsocketPort || 80);
            }
        }

        connUrl += `${Client4.getUrlVersion()}/websocket`;
        websocketClient.setFirstConnectCallback(handleFirstConnect);
        websocketClient.setEventCallback(handleEvent);
        websocketClient.setReconnectCallback(handleReconnect);
        websocketClient.setCloseCallback(handleClose);
        websocketClient.setConnectingCallback(handleConnecting);

        const websocketOpts = {
            connectionUrl: connUrl,
            platform
        };

        if (optionalWebSocket) {
            websocketOpts.webSocketConnector = optionalWebSocket;
        }

        return websocketClient.initialize(authToken, dispatch, getState, websocketOpts);
    };
}

let reconnect = false;
export function close(shouldReconnect = false) {
    return async (dispatch, getState) => {
        reconnect = shouldReconnect;
        websocketClient.close(true);
        if (dispatch) {
            dispatch({type: GeneralTypes.WEBSOCKET_CLOSED}, getState);
        }
    };
}

function handleConnecting(dispatch, getState) {
    dispatch({type: GeneralTypes.WEBSOCKET_REQUEST}, getState);
}

function handleFirstConnect(dispatch, getState) {
    dispatch({type: GeneralTypes.WEBSOCKET_SUCCESS}, getState);
    if (reconnect) {
        reconnect = false;

        handleReconnect(dispatch, getState).catch(() => {
            //just do nothing
        });
    }
}

async function handleReconnect(dispatch, getState) {
    const entities = getState().entities;
    const {currentTeamId} = entities.teams;
    const {currentChannelId} = entities.channels;

    await getMyPreferences()(dispatch, getState);

    if (currentTeamId) {
        await fetchMyChannelsAndMembers(currentTeamId)(dispatch, getState);
        loadProfilesForDirect()(dispatch, getState);
        if (currentChannelId) {
            loadPostsHelper(currentChannelId, dispatch, getState);
        }
    }

    dispatch({type: GeneralTypes.WEBSOCKET_SUCCESS}, getState);
}

function handleClose(connectFailCount, dispatch, getState) {
    dispatch({type: GeneralTypes.WEBSOCKET_FAILURE, error: connectFailCount}, getState);
}

function handleEvent(msg, dispatch, getState) {
    switch (msg.event) {
    case WebsocketEvents.POSTED:
    case WebsocketEvents.EPHEMERAL_MESSAGE:
        handleNewPostEvent(msg, dispatch, getState);
        break;
    case WebsocketEvents.POST_EDITED:
        handlePostEdited(msg, dispatch, getState);
        break;
    case WebsocketEvents.POST_DELETED:
        handlePostDeleted(msg, dispatch, getState);
        break;
    case WebsocketEvents.LEAVE_TEAM:
        handleLeaveTeamEvent(msg, dispatch, getState);
        break;
    case WebsocketEvents.USER_ADDED:
        handleUserAddedEvent(msg, dispatch, getState);
        break;
    case WebsocketEvents.USER_REMOVED:
        handleUserRemovedEvent(msg, dispatch, getState);
        break;
    case WebsocketEvents.USER_UPDATED:
        handleUserUpdatedEvent(msg, dispatch, getState);
        break;
    case WebsocketEvents.CHANNEL_CREATED:
        handleChannelCreatedEvent(msg, dispatch, getState);
        break;
    case WebsocketEvents.CHANNEL_DELETED:
        handleChannelDeletedEvent(msg, dispatch, getState);
        break;
    case WebsocketEvents.DIRECT_ADDED:
        handleDirectAddedEvent(msg, dispatch, getState);
        break;
    case WebsocketEvents.PREFERENCE_CHANGED:
        handlePreferenceChangedEvent(msg, dispatch, getState);
        break;
    case WebsocketEvents.PREFERENCES_CHANGED:
        handlePreferencesChangedEvent(msg, dispatch, getState);
        break;
    case WebsocketEvents.PREFERENCES_DELETED:
        handlePreferencesDeletedEvent(msg, dispatch, getState);
        break;
    case WebsocketEvents.STATUS_CHANGED:
        handleStatusChangedEvent(msg, dispatch, getState);
        break;
    case WebsocketEvents.TYPING:
        handleUserTypingEvent(msg, dispatch, getState);
        break;
    case WebsocketEvents.HELLO:
        handleHelloEvent(msg);
        break;
    }
}

async function handleNewPostEvent(msg, dispatch, getState) {
    const state = getState();
    const {currentChannelId} = state.entities.channels;
    const users = state.entities.users;
    const {posts} = state.entities.posts;
    const post = JSON.parse(msg.data.post);
    const userId = post.user_id;
    const status = users.statuses[userId];

    if (!users.profiles[userId] && userId !== users.currentUserId) {
        getProfilesByIds([userId])(dispatch, getState);
    }

    if (status !== General.ONLINE) {
        getStatusesByIds([userId])(dispatch, getState);
    }

    switch (post.type) {
    case Posts.POST_TYPES.HEADER_CHANGE:
        updateChannelHeader(post.channel_id, post.props.new_header)(dispatch, getState);
        break;
    case Posts.POST_TYPES.PURPOSE_CHANGE:
        updateChannelPurpose(post.channel_id, post.props.new_purpose)(dispatch, getState);
        break;
    }

    if (msg.data.channel_type === General.DM_CHANNEL) {
        const otherUserId = getUserIdFromChannelName(users.currentUserId, msg.data.channel_name);
        makeDirectChannelVisibleIfNecessary(otherUserId)(dispatch, getState);
    } else if (msg.data.channel_type === General.GM_CHANNEL) {
        makeGroupMessageVisibleIfNecessary(post.channel_id)(dispatch, getState);
    }

    if (post.root_id && !posts[post.root_id]) {
        await Client4.getPostThread(post.root_id).then((data) => {
            const rootUserId = data.posts[post.root_id].user_id;
            const rootStatus = users.statuses[rootUserId];
            if (!users.profiles[rootUserId] && rootUserId !== users.currentUserId) {
                getProfilesByIds([rootUserId])(dispatch, getState);
            }

            if (rootStatus !== General.ONLINE) {
                getStatusesByIds([rootUserId])(dispatch, getState);
            }

            dispatch({
                type: PostTypes.RECEIVED_POSTS,
                data,
                channelId: post.channel_id
            }, getState);
        });
    }

    dispatch(batchActions([
        {
            type: PostTypes.RECEIVED_POSTS,
            data: {
                order: [],
                posts: {
                    [post.id]: post
                }
            },
            channelId: post.channel_id
        },
        {
            type: WebsocketEvents.STOP_TYPING,
            data: {
                id: post.channel_id + post.root_id,
                userId: post.user_id
            }
        }
    ]), getState);

    if (shouldIgnorePost(post)) {
        // if the post type is in the ignore list we'll do nothing with the read state
        return;
    }

    let markAsRead = false;
    if (userId === users.currentUserId && !isSystemMessage(post) && !isFromWebhook(post)) {
        // In case the current user posted the message and that message wasn't triggered by a system message
        markAsRead = true;
    } else if (post.channel_id === currentChannelId) {
        // if the post is for the channel that the user is currently viewing we'll mark the channel as read
        markAsRead = true;
    }

    if (markAsRead) {
        markChannelAsRead(post.channel_id)(dispatch, getState);
    } else {
        markChannelAsUnread(post.channel_id, msg.data.mentions)(dispatch, getState);
    }
}

function handlePostEdited(msg, dispatch, getState) {
    const data = JSON.parse(msg.data.post);

    dispatch({type: PostTypes.RECEIVED_POST, data}, getState);
}

function handlePostDeleted(msg, dispatch, getState) {
    const data = JSON.parse(msg.data.post);
    dispatch({type: PostTypes.POST_DELETED, data}, getState);
}

function handleLeaveTeamEvent(msg, dispatch, getState) {
    const entities = getState().entities;
    const {currentTeamId, teams} = entities.teams;
    const {currentUserId} = entities.users;

    if (currentUserId === msg.data.user_id) {
        dispatch({type: TeamTypes.LEAVE_TEAM, data: teams[msg.data.team_id]}, getState);

        // if they are on the team being removed deselect the current team and channel
        if (currentTeamId === msg.data.team_id) {
            EventEmitter.emit('leave_team');
        }
    }
}

function handleUserAddedEvent(msg, dispatch, getState) {
    const state = getState();
    const {currentChannelId} = state.entities.channels;
    const {currentTeamId} = state.entities.teams;
    const {currentUserId} = state.entities.users;
    const teamId = msg.data.team_id;

    if (msg.broadcast.channel_id === currentChannelId) {
        getChannelStats(teamId, currentChannelId)(dispatch, getState);
    }

    if (teamId === currentTeamId && msg.data.user_id === currentUserId) {
        getChannelAndMyMember(msg.broadcast.channel_id)(dispatch, getState);
    }
}

function handleUserRemovedEvent(msg, dispatch, getState) {
    const state = getState();
    const {currentChannelId} = state.entities.channels;
    const {currentTeamId} = state.entities.teams;
    const {currentUserId} = state.entities.users;

    if (msg.broadcast.user_id === currentUserId && currentTeamId) {
        fetchMyChannelsAndMembers(currentTeamId)(dispatch, getState);
        dispatch({
            type: ChannelTypes.LEAVE_CHANNEL,
            data: msg.data.channel_id
        }, getState);
    } else if (msg.broadcast.channel_id === currentChannelId) {
        getChannelStats(currentTeamId, currentChannelId)(dispatch, getState);
    }
}

function handleUserUpdatedEvent(msg, dispatch, getState) {
    const entities = getState().entities;
    const {currentUserId} = entities.users;
    const user = msg.data.user;

    if (user.id !== currentUserId) {
        dispatch({
            type: UserTypes.RECEIVED_PROFILES,
            data: {
                [user.id]: user
            }
        }, getState);
    }
}

function handleChannelCreatedEvent(msg, dispatch, getState) {
    const {channel_id: channelId, team_id: teamId} = msg.data;
    const state = getState();
    const {channels} = state.entities.channels;
    const {currentTeamId} = state.entities.teams;

    if (teamId === currentTeamId && !channels[channelId]) {
        getChannelAndMyMember(channelId)(dispatch, getState);
    }
}

function handleChannelDeletedEvent(msg, dispatch, getState) {
    const entities = getState().entities;
    const {channels, currentChannelId} = entities.channels;
    const {currentTeamId} = entities.teams;

    if (msg.broadcast.team_id === currentTeamId) {
        if (msg.data.channel_id === currentChannelId) {
            let channelId = '';
            const channel = Object.keys(channels).filter((key) => channels[key].name === General.DEFAULT_CHANNEL);

            if (channel.length) {
                channelId = channel[0];
            }

            dispatch({type: ChannelTypes.SELECT_CHANNEL, data: channelId}, getState);
        }
        dispatch({type: ChannelTypes.RECEIVED_CHANNEL_DELETED, data: msg.data.channel_id}, getState);

        fetchMyChannelsAndMembers(currentTeamId)(dispatch, getState);
    }
}

function handleDirectAddedEvent(msg, dispatch, getState) {
    getChannelAndMyMember(msg.broadcast.channel_id)(dispatch, getState);
}

function handlePreferenceChangedEvent(msg, dispatch, getState) {
    const preference = JSON.parse(msg.data.preference);
    dispatch({type: PreferenceTypes.RECEIVED_PREFERENCES, data: [preference]}, getState);

    getAddedDmUsersIfNecessary([preference], dispatch, getState);
}

function handlePreferencesChangedEvent(msg, dispatch, getState) {
    const preferences = JSON.parse(msg.data.preferences);
    dispatch({type: PreferenceTypes.RECEIVED_PREFERENCES, data: preferences}, getState);

    getAddedDmUsersIfNecessary(preferences, dispatch, getState);
}

function getAddedDmUsersIfNecessary(preferences, dispatch, getState) {
    const userIds = [];

    for (const preference of preferences) {
        if (preference.category === Preferences.CATEGORY_DIRECT_CHANNEL_SHOW && preference.value === 'true') {
            userIds.push(preference.name);
        }
    }

    if (userIds.length === 0) {
        return;
    }

    const state = getState();
    const {currentUserId, profiles, statuses} = state.entities.users;

    const needProfiles = [];
    const needStatuses = [];

    for (const userId of userIds) {
        if (!profiles[userId] && userId !== currentUserId) {
            needProfiles.push(userId);
        }

        if (statuses[userId] !== General.ONLINE) {
            needStatuses.push(userId);
        }
    }

    if (needProfiles.length > 0) {
        getProfilesByIds(needProfiles)(dispatch, getState);
    }

    if (needStatuses.length > 0) {
        getStatusesByIds(needStatuses)(dispatch, getState);
    }
}

function handlePreferencesDeletedEvent(msg, dispatch, getState) {
    const preferences = JSON.parse(msg.data.preferences);
    dispatch({type: PreferenceTypes.DELETED_PREFERENCES, data: preferences}, getState);
}

function handleStatusChangedEvent(msg, dispatch, getState) {
    dispatch({
        type: UserTypes.RECEIVED_STATUSES,
        data: [{user_id: msg.data.user_id, status: msg.data.status}]
    }, getState);
}

function handleHelloEvent(msg) {
    const serverVersion = msg.data.server_version;
    if (serverVersion && Client4.serverVersion !== serverVersion) {
        Client4.serverVersion = serverVersion;
        EventEmitter.emit(General.CONFIG_CHANGED, serverVersion);
    }
}

const typingUsers = {};
function handleUserTypingEvent(msg, dispatch, getState) {
    const state = getState();
    const {currentUserId, profiles, statuses} = state.entities.users;
    const {config} = state.entities.general;
    const userId = msg.data.user_id;
    const id = msg.broadcast.channel_id + msg.data.parent_id;
    const data = {id, userId};

    // Create entry
    if (!typingUsers[id]) {
        typingUsers[id] = {};
    }

    // If we already have this user, clear it's timeout to be deleted
    if (typingUsers[id][userId]) {
        clearTimeout(typingUsers[id][userId].timeout);
    }

    // Set the user and a timeout to remove it
    typingUsers[id][userId] = setTimeout(() => {
        Reflect.deleteProperty(typingUsers[id], userId);
        if (typingUsers[id] === {}) {
            Reflect.deleteProperty(typingUsers, id);
        }
        dispatch({
            type: WebsocketEvents.STOP_TYPING,
            data
        }, getState);
    }, parseInt(config.TimeBetweenUserTypingUpdatesMilliseconds, 10));

    dispatch({
        type: WebsocketEvents.TYPING,
        data
    }, getState);

    if (!profiles[userId] && userId !== currentUserId) {
        getProfilesByIds([userId])(dispatch, getState);
    }

    const status = statuses[userId];
    if (status !== General.ONLINE) {
        getStatusesByIds([userId])(dispatch, getState);
    }
}

// Helpers

function loadPostsHelper(channelId, dispatch, getState) {
    const {posts, postsInChannel} = getState().entities.posts;
    const postsIds = postsInChannel[channelId];

    let latestPostTime = 0;
    if (postsIds && postsIds.length) {
        const postsForChannel = postsIds.map((id) => posts[id]);
        latestPostTime = getLastUpdateAt(postsForChannel);
    }

    if (latestPostTime === 0) {
        getPosts(channelId)(dispatch, getState);
    } else {
        getPostsSince(channelId, latestPostTime)(dispatch, getState);
    }
}

let lastTimeTypingSent = 0;
export function userTyping(channelId, parentPostId) {
    return async (dispatch, getState) => {
        const state = getState();
        const config = state.entities.general.config;
        const t = Date.now();
        const stats = getCurrentChannelStats(state);
        const membersInChannel = stats ? stats.member_count : 0;

        if (((t - lastTimeTypingSent) > config.TimeBetweenUserTypingUpdatesMilliseconds) &&
            (membersInChannel < config.MaxNotificationsPerChannel) && (config.EnableUserTypingMessages === 'true')) {
            websocketClient.userTyping(channelId, parentPostId);
            lastTimeTypingSent = t;
        }
    };
}
