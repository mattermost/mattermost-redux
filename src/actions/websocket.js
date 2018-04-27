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
    markChannelAsRead,
    selectChannel,
    markChannelAsViewed,
} from './channels';
import {
    getPost,
    getPosts,
    getPostsSince,
    getProfilesAndStatusesForPosts,
    getCustomEmojiForReaction,
} from './posts';
import {
    getMyPreferences,
    makeDirectChannelVisibleIfNecessary,
    makeGroupMessageVisibleIfNecessary,
} from './preferences';
import {
    getLicenseConfig,
    getClientConfig,
} from './general';

import {getTeam, getTeams, getMyTeams, getMyTeamMembers, getMyTeamUnreads} from './teams';

import {
    ChannelTypes,
    GeneralTypes,
    EmojiTypes,
    PostTypes,
    PreferenceTypes,
    TeamTypes,
    UserTypes,
    RoleTypes,
    AdminTypes,
} from 'action_types';
import {General, WebsocketEvents, Preferences, Posts} from 'constants';

import {getCurrentChannelStats} from 'selectors/entities/channels';
import {getCurrentUser} from 'selectors/entities/users';
import {getUserIdFromChannelName} from 'utils/channel_utils';
import {isFromWebhook, isSystemMessage, getLastCreateAt, shouldIgnorePost} from 'utils/post_utils';
import EventEmitter from 'utils/event_emitter';

export function init(platform, siteUrl, token, optionalWebSocket, additionalOptions = {}) {
    return async (dispatch, getState) => {
        const config = getState().entities.general.config;
        let connUrl = siteUrl || config.WebsocketURL || Client4.getUrl();
        const authToken = token || Client4.getToken();

        // replace the protocol with a websocket one
        if (platform !== 'ios' && platform !== 'android') {
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
        }

        connUrl += `${Client4.getUrlVersion()}/websocket`;
        websocketClient.setFirstConnectCallback(handleFirstConnect);
        websocketClient.setEventCallback(handleEvent);
        websocketClient.setReconnectCallback(handleReconnect);
        websocketClient.setCloseCallback(handleClose);
        websocketClient.setConnectingCallback(handleConnecting);

        const websocketOpts = {
            connectionUrl: connUrl,
            platform,
            ...additionalOptions,
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

        handleReconnect(dispatch, getState).catch(() => {}); //eslint-disable-line no-empty-function
    }
}

async function handleReconnect(dispatch, getState) {
    const entities = getState().entities;
    const {currentTeamId} = entities.teams;
    const {currentChannelId} = entities.channels;
    const {currentUserId} = entities.users;

    getLicenseConfig()(dispatch, getState);
    getClientConfig()(dispatch, getState);
    getMyPreferences()(dispatch, getState);

    if (currentTeamId) {
        getMyTeams()(dispatch, getState);
        getMyTeamMembers()(dispatch, getState);
        getMyTeamUnreads()(dispatch, getState).then(async () => {
            await fetchMyChannelsAndMembers(currentTeamId)(dispatch, getState);
            if (currentChannelId) {
                markChannelAsRead(currentChannelId)(dispatch, getState);
            }
        });
        loadProfilesForDirect()(dispatch, getState);
        getTeams()(dispatch, getState);

        const {myMembers: myTeamMembers} = getState().entities.teams;
        if (!myTeamMembers[currentTeamId]) {
            // If the user is no longer a member of this team when reconnecting
            const newMsg = {
                data: {
                    user_id: currentUserId,
                    team_id: currentTeamId,
                },
            };
            handleLeaveTeamEvent(newMsg, dispatch, getState);
            return dispatch({type: GeneralTypes.WEBSOCKET_SUCCESS}, getState);
        }

        const {channels, myMembers} = getState().entities.channels;
        if (!myMembers[currentChannelId]) {
            // in case the user is not a member of the channel when reconnecting
            const defaultChannel = Object.values(channels).find((c) => c.team_id === currentTeamId && c.name === General.DEFAULT_CHANNEL);

            // emit the event so the client can change his own state
            if (defaultChannel) {
                EventEmitter.emit(General.DEFAULT_CHANNEL, defaultChannel.display_name);
                selectChannel(defaultChannel.id)(dispatch, getState);
            }
            return dispatch({type: GeneralTypes.WEBSOCKET_SUCCESS}, getState);
        }

        if (currentChannelId) {
            loadPostsHelper(currentChannelId, dispatch, getState);
        }
    }

    return dispatch({type: GeneralTypes.WEBSOCKET_SUCCESS}, getState);
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
    case WebsocketEvents.UPDATE_TEAM:
        handleUpdateTeamEvent(msg, dispatch, getState);
        break;

    case WebsocketEvents.ADDED_TO_TEAM:
        handleTeamAddedEvent(msg, dispatch, getState);
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
    case WebsocketEvents.ROLE_ADDED:
        handleRoleAddedEvent(msg, dispatch, getState);
        break;
    case WebsocketEvents.ROLE_REMOVED:
        handleRoleRemovedEvent(msg, dispatch, getState);
        break;
    case WebsocketEvents.ROLE_UPDATED:
        handleRoleUpdatedEvent(msg, dispatch, getState);
        break;
    case WebsocketEvents.CHANNEL_CREATED:
        handleChannelCreatedEvent(msg, dispatch, getState);
        break;
    case WebsocketEvents.CHANNEL_DELETED:
        handleChannelDeletedEvent(msg, dispatch, getState);
        break;
    case WebsocketEvents.CHANNEL_UPDATED:
        handleChannelUpdatedEvent(msg, dispatch, getState);
        break;
    case WebsocketEvents.CHANNEL_VIEWED:
        handleChannelViewedEvent(msg, dispatch, getState);
        break;
    case WebsocketEvents.CHANNEL_MEMBER_UPDATED:
        handleChannelMemberUpdatedEvent(msg, dispatch);
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
    case WebsocketEvents.REACTION_ADDED:
        handleReactionAddedEvent(msg, dispatch, getState);
        break;
    case WebsocketEvents.REACTION_REMOVED:
        handleReactionRemovedEvent(msg, dispatch, getState);
        break;
    case WebsocketEvents.EMOJI_ADDED:
        handleAddEmoji(msg, dispatch, getState);
        break;
    case WebsocketEvents.LICENSE_CHANGED:
        handleLicenseChangedEvent(msg, dispatch, getState);
        break;
    case WebsocketEvents.CONFIG_CHANGED:
        handleConfigChangedEvent(msg, dispatch, getState);
        break;
    case WebsocketEvents.PLUGIN_STATUSES_CHANGED:
        handlePluginStatusesChangedEvent(msg, dispatch, getState);
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
    const currentUserId = users.currentUserId;
    const status = users.statuses[userId];

    getProfilesAndStatusesForPosts([post], dispatch, getState);

    // getProfilesAndStatusesForPosts only gets the status if it doesn't exist, but we
    // also want it if the user does not appear to be online
    if (userId !== currentUserId && status && status !== General.ONLINE) {
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

    if (post.root_id && !posts[post.root_id]) {
        await Client4.getPostThread(post.root_id).then((data) => {
            const rootUserId = data.posts[post.root_id].user_id;
            const rootStatus = users.statuses[rootUserId];
            if (!users.profiles[rootUserId] && rootUserId !== currentUserId) {
                getProfilesByIds([rootUserId])(dispatch, getState);
            }

            if (rootStatus !== General.ONLINE) {
                getStatusesByIds([rootUserId])(dispatch, getState);
            }

            dispatch({
                type: PostTypes.RECEIVED_POSTS,
                data,
                channelId: post.channel_id,
            }, getState);
        });
    }

    const actions = [{
        type: WebsocketEvents.STOP_TYPING,
        data: {
            id: post.channel_id + post.root_id,
            userId: post.user_id,
        },
    }];

    if (!posts[post.id]) {
        if (msg.data.channel_type === General.DM_CHANNEL) {
            const otherUserId = getUserIdFromChannelName(currentUserId, msg.data.channel_name);
            makeDirectChannelVisibleIfNecessary(otherUserId)(dispatch, getState);
        } else if (msg.data.channel_type === General.GM_CHANNEL) {
            makeGroupMessageVisibleIfNecessary(post.channel_id)(dispatch, getState);
        }

        actions.push({
            type: PostTypes.RECEIVED_POSTS,
            data: {
                order: [],
                posts: {
                    [post.id]: post,
                },
            },
            channelId: post.channel_id,
        });
    }

    dispatch(batchActions(actions), getState);

    if (shouldIgnorePost(post)) {
        // if the post type is in the ignore list we'll do nothing with the read state
        return;
    }

    let markAsRead = false;
    let markAsReadOnServer = false;
    if (userId === currentUserId && !isSystemMessage(post) && !isFromWebhook(post)) {
        // In case the current user posted the message and that message wasn't triggered by a system message
        markAsRead = true;
        markAsReadOnServer = false;
    } else if (post.channel_id === currentChannelId) {
        // if the post is for the channel that the user is currently viewing we'll mark the channel as read
        markAsRead = true;
        markAsReadOnServer = true;
    }

    if (markAsRead) {
        markChannelAsRead(post.channel_id, null, markAsReadOnServer)(dispatch, getState);
        markChannelAsViewed(post.channel_id)(dispatch, getState);
    } else {
        markChannelAsUnread(msg.data.team_id, post.channel_id, msg.data.mentions)(dispatch, getState);
    }
}

function handlePostEdited(msg, dispatch, getState) {
    const data = JSON.parse(msg.data.post);

    getProfilesAndStatusesForPosts([data], dispatch, getState);

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

function handleUpdateTeamEvent(msg, dispatch, getState) {
    dispatch({type: TeamTypes.UPDATED_TEAM, data: JSON.parse(msg.data.team)}, getState);
}

async function handleTeamAddedEvent(msg, dispatch, getState) {
    await Promise.all([
        getTeam(msg.data.team_id)(dispatch, getState),
        getMyTeamUnreads()(dispatch, getState),
    ]);
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
    const {channels, currentChannelId} = state.entities.channels;
    const {currentTeamId} = state.entities.teams;
    const {currentUserId} = state.entities.users;

    if (msg.broadcast.user_id === currentUserId && currentTeamId) {
        fetchMyChannelsAndMembers(currentTeamId)(dispatch, getState);
        const channel = channels[currentChannelId] || {};
        dispatch({
            type: ChannelTypes.LEAVE_CHANNEL,
            data: {
                id: msg.data.channel_id,
                user_id: currentUserId,
                team_id: channel.team_id,
                type: channel.type,
            },
        }, getState);

        if (msg.data.channel_id === currentChannelId) {
            const defaultChannel = Object.values(channels).find((c) => c.team_id === currentTeamId && c.name === General.DEFAULT_CHANNEL);

            // emit the event so the client can change his own state
            EventEmitter.emit(General.DEFAULT_CHANNEL, defaultChannel.display_name);
            selectChannel(defaultChannel.id)(dispatch, getState);
        }
    } else if (msg.data.channel_id === currentChannelId) {
        getChannelStats(currentTeamId, currentChannelId)(dispatch, getState);
    }
}

function handleUserUpdatedEvent(msg, dispatch, getState) {
    const currentUser = getCurrentUser(getState());
    const user = msg.data.user;

    if (user.id === currentUser.id) {
        dispatch({
            type: UserTypes.RECEIVED_ME,
            data: {
                ...currentUser,
                last_picture_update: user.last_picture_update,
            },
        });
    } else {
        dispatch({
            type: UserTypes.RECEIVED_PROFILES,
            data: {
                [user.id]: user,
            },
        }, getState);
    }
}

function handleRoleAddedEvent(msg, dispatch) {
    const role = JSON.parse(msg.data.role);

    dispatch({
        type: RoleTypes.RECEIVED_ROLE,
        data: role,
    });
}

function handleRoleRemovedEvent(msg, dispatch) {
    const role = JSON.parse(msg.data.role);

    dispatch({
        type: RoleTypes.ROLE_DELETED,
        data: role,
    });
}

function handleRoleUpdatedEvent(msg, dispatch) {
    const role = JSON.parse(msg.data.role);

    dispatch({
        type: RoleTypes.RECEIVED_ROLE,
        data: role,
    });
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
    const {channels, currentChannelId, channelsInTeam} = entities.channels;
    const {currentTeamId} = entities.teams;

    if (msg.broadcast.team_id === currentTeamId) {
        if (msg.data.channel_id === currentChannelId) {
            let channelId = '';
            const teamChannels = Array.from(channelsInTeam[currentTeamId]);
            const channel = teamChannels.filter((key) => channels[key].name === General.DEFAULT_CHANNEL);

            if (channel.length) {
                channelId = channel[0];
            }

            dispatch({type: ChannelTypes.SELECT_CHANNEL, data: channelId}, getState);
            EventEmitter.emit(General.DEFAULT_CHANNEL, '');
        }
        dispatch({type: ChannelTypes.RECEIVED_CHANNEL_DELETED, data: msg.data.channel_id}, getState);

        fetchMyChannelsAndMembers(currentTeamId)(dispatch, getState);
    }
}

function handleChannelUpdatedEvent(msg, dispatch, getState) {
    let channel;
    try {
        channel = msg.data ? JSON.parse(msg.data.channel) : null;
    } catch (err) {
        return;
    }

    const entities = getState().entities;
    const {currentChannelId} = entities.channels;
    if (channel) {
        dispatch({
            type: ChannelTypes.RECEIVED_CHANNEL,
            data: channel,
        });

        if (currentChannelId === channel.id) {
            // Emit an event with the channel received as we need to handle
            // the changes without listening to the store
            EventEmitter.emit(WebsocketEvents.CHANNEL_UPDATED, channel);
        }
    }
}

function handleChannelViewedEvent(msg, dispatch, getState) {
    const {currentChannelId} = getState().entities.channels;
    const {channel_id: channelId} = msg.data;

    if (channelId !== currentChannelId) {
        markChannelAsRead(channelId, null, false)(dispatch, getState);
        markChannelAsViewed(channelId)(dispatch, getState);
    }
}

function handleChannelMemberUpdatedEvent(msg, dispatch) {
    const channelMember = JSON.parse(msg.data.channelMember);
    dispatch({type: ChannelTypes.RECEIVED_MY_CHANNEL_MEMBER, data: channelMember});
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

    getAddedPostsIfNecessary(preferences, dispatch, getState);
    getAddedDmUsersIfNecessary(preferences, dispatch, getState);
    dispatch({type: PreferenceTypes.RECEIVED_PREFERENCES, data: preferences});
}

function getAddedPostsIfNecessary(preferences, dispatch, getState) {
    const state = getState();
    const {posts} = state.entities.posts;
    preferences.forEach((pref) => {
        if (pref.category === Preferences.CATEGORY_FLAGGED_POST && !posts[pref.name]) {
            dispatch(getPost(pref.name));
        }
    });
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
        data: [{user_id: msg.data.user_id, status: msg.data.status}],
    }, getState);
}

function handleHelloEvent(msg) {
    const serverVersion = msg.data.server_version;
    if (serverVersion && Client4.serverVersion !== serverVersion) {
        Client4.serverVersion = serverVersion;
        EventEmitter.emit(General.SERVER_VERSION_CHANGED, serverVersion);
    }
}

function handleUserTypingEvent(msg, dispatch, getState) {
    const state = getState();
    const {currentUserId, profiles, statuses} = state.entities.users;
    const {config} = state.entities.general;
    const userId = msg.data.user_id;

    const data = {
        id: msg.broadcast.channel_id + msg.data.parent_id,
        userId,
        now: Date.now(),
    };

    dispatch({
        type: WebsocketEvents.TYPING,
        data,
    }, getState);

    setTimeout(() => {
        dispatch({
            type: WebsocketEvents.STOP_TYPING,
            data,
        }, getState);
    }, parseInt(config.TimeBetweenUserTypingUpdatesMilliseconds, 10));

    if (!profiles[userId] && userId !== currentUserId) {
        getProfilesByIds([userId])(dispatch, getState);
    }

    const status = statuses[userId];
    if (status !== General.ONLINE) {
        getStatusesByIds([userId])(dispatch, getState);
    }
}

function handleReactionAddedEvent(msg, dispatch, getState) {
    const {data} = msg;
    const reaction = JSON.parse(data.reaction);

    dispatch(getCustomEmojiForReaction(reaction.emoji_name));

    dispatch({
        type: PostTypes.RECEIVED_REACTION,
        data: reaction,
    }, getState);
}

function handleReactionRemovedEvent(msg, dispatch, getState) {
    const {data} = msg;
    const reaction = JSON.parse(data.reaction);

    dispatch({
        type: PostTypes.REACTION_DELETED,
        data: reaction,
    }, getState);
}

function handleAddEmoji(msg, dispatch) {
    const data = JSON.parse(msg.data.emoji);

    dispatch({
        type: EmojiTypes.RECEIVED_CUSTOM_EMOJI,
        data,
    });
}

function handleLicenseChangedEvent(msg, dispatch) {
    const data = msg.data.license;

    dispatch({
        type: GeneralTypes.CLIENT_LICENSE_RECEIVED,
        data,
    });
}

function handleConfigChangedEvent(msg, dispatch) {
    const data = msg.data.config;

    dispatch({
        type: GeneralTypes.CLIENT_CONFIG_RECEIVED,
        data,
    });
    EventEmitter.emit(General.CONFIG_CHANGED, data);
}

function handlePluginStatusesChangedEvent(msg, dispatch) {
    const data = msg.data;

    dispatch({
        type: AdminTypes.RECEIVED_PLUGIN_STATUSES,
        data: data.plugin_statuses,
    });
}

// Helpers

function loadPostsHelper(channelId, dispatch, getState) {
    const {posts, postsInChannel} = getState().entities.posts;
    const postsIds = postsInChannel[channelId];

    let latestPostTime = 0;
    if (postsIds && postsIds.length) {
        const postsForChannel = postsIds.map((id) => posts[id]);
        latestPostTime = getLastCreateAt(postsForChannel);
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

        return {data: true};
    };
}
