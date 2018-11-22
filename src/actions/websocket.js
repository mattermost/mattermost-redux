// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {batchActions} from 'redux-batched-actions';

import {Client4} from 'client';
import websocketClient from 'client/websocket_client';
import {
    getMe,
    getProfilesByIds,
    getStatusesByIds,
    loadProfilesForDirect,
} from './users';
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
    IntegrationTypes,
} from 'action_types';
import {General, WebsocketEvents, Preferences, Posts} from 'constants';

import {getAllChannels, getChannel, getChannelsInTeam, getCurrentChannelId, getCurrentChannelStats} from 'selectors/entities/channels';
import {getConfig} from 'selectors/entities/general';
import {getAllPosts, getPostIdsInChannel} from 'selectors/entities/posts';
import {getCurrentTeamId, getTeamMemberships, getTeams as getTeamsSelector} from 'selectors/entities/teams';
import {getCurrentUser, getCurrentUserId, getUsers, getUserStatuses, getStatusForUserId} from 'selectors/entities/users';
import {getUserIdFromChannelName} from 'utils/channel_utils';
import {isFromWebhook, isSystemMessage, getLastCreateAt, shouldIgnorePost} from 'utils/post_utils';
import EventEmitter from 'utils/event_emitter';

let doDispatch;

export function init(platform, siteUrl, token, optionalWebSocket, additionalOptions = {}) {
    return async (dispatch, getState) => {
        const config = getConfig(getState());
        let connUrl = siteUrl || config.WebsocketURL || Client4.getUrl();
        const authToken = token || Client4.getToken();

        // Set the dispatch and getState globally
        doDispatch = dispatch;

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

        return websocketClient.initialize(authToken, websocketOpts);
    };
}

let reconnect = false;
export function close(shouldReconnect = false) {
    return async (dispatch) => {
        reconnect = shouldReconnect;
        websocketClient.close(true);
        if (dispatch) {
            dispatch({type: GeneralTypes.WEBSOCKET_CLOSED});
        }
    };
}

function doReconnect() {
    return (dispatch, getState) => {
        const state = getState();
        const currentTeamId = getCurrentTeamId(state);
        const currentChannelId = getCurrentChannelId(state);
        const currentUserId = getCurrentUserId(state);

        // We try and get the posts for the current channel as soon as possible
        if (currentChannelId) {
            dispatch(markChannelAsRead(currentChannelId));
            dispatch(loadPostsHelper(currentChannelId));
        }

        dispatch(getLicenseConfig());
        dispatch(getClientConfig());
        dispatch(getMyTeams());
        dispatch(getMyTeamMembers());
        dispatch(getMyTeamUnreads());
        dispatch(getMyPreferences());
        dispatch(loadProfilesForDirect());
        dispatch(getTeams());

        if (currentTeamId) {
            dispatch(fetchMyChannelsAndMembers(currentTeamId)).then(({data}) => {
                if (data && currentChannelId) {
                    const {channels, members} = data;
                    const stillMemberOfCurrentChannel = members.find((m) => m.channel_id === currentChannelId);

                    if (!stillMemberOfCurrentChannel) {
                        const defaultChannel = channels.find((c) => c.team_id === currentTeamId && c.name === General.DEFAULT_CHANNEL);
                        if (defaultChannel) {
                            EventEmitter.emit(General.DEFAULT_CHANNEL, defaultChannel.display_name);
                            selectChannel(defaultChannel.id)(dispatch, getState);
                        }
                    }
                }
            });

            const myTeamMembers = getTeamMemberships(getState());
            if (!myTeamMembers[currentTeamId]) {
                // If the user is no longer a member of this team when reconnecting
                const newMsg = {
                    data: {
                        user_id: currentUserId,
                        team_id: currentTeamId,
                    },
                };
                handleLeaveTeamEvent(newMsg, dispatch, getState);
            }
        }

        dispatch({type: GeneralTypes.WEBSOCKET_SUCCESS});
    };
}

function handleConnecting() {
    doDispatch({type: GeneralTypes.WEBSOCKET_REQUEST});
}

function handleFirstConnect() {
    if (reconnect) {
        reconnect = false;
        doDispatch(doReconnect());
    } else {
        doDispatch({type: GeneralTypes.WEBSOCKET_SUCCESS});
    }
}

function handleReconnect() {
    doDispatch(doReconnect());
}

function handleClose(connectFailCount) {
    doDispatch({
        type: GeneralTypes.WEBSOCKET_FAILURE,
        error: connectFailCount,
    });
}

function handleEvent(msg) {
    switch (msg.event) {
    case WebsocketEvents.POSTED:
    case WebsocketEvents.EPHEMERAL_MESSAGE:
        doDispatch(handleNewPostEvent(msg));
        break;
    case WebsocketEvents.POST_EDITED:
        doDispatch(handlePostEdited(msg));
        break;
    case WebsocketEvents.POST_DELETED:
        doDispatch(handlePostDeleted(msg));
        break;
    case WebsocketEvents.LEAVE_TEAM:
        doDispatch(handleLeaveTeamEvent(msg));
        break;
    case WebsocketEvents.UPDATE_TEAM:
        doDispatch(handleUpdateTeamEvent(msg));
        break;
    case WebsocketEvents.PATCH_TEAM:
        doDispatch(handlePatchTeamEvent(msg));
        break;
    case WebsocketEvents.ADDED_TO_TEAM:
        doDispatch(handleTeamAddedEvent(msg));
        break;
    case WebsocketEvents.USER_ADDED:
        doDispatch(handleUserAddedEvent(msg));
        break;
    case WebsocketEvents.USER_REMOVED:
        doDispatch(handleUserRemovedEvent(msg));
        break;
    case WebsocketEvents.USER_UPDATED:
        doDispatch(handleUserUpdatedEvent(msg));
        break;
    case WebsocketEvents.ROLE_ADDED:
        doDispatch(handleRoleAddedEvent(msg));
        break;
    case WebsocketEvents.ROLE_REMOVED:
        doDispatch(handleRoleRemovedEvent(msg));
        break;
    case WebsocketEvents.ROLE_UPDATED:
        doDispatch(handleRoleUpdatedEvent(msg));
        break;
    case WebsocketEvents.CHANNEL_CREATED:
        doDispatch(handleChannelCreatedEvent(msg));
        break;
    case WebsocketEvents.CHANNEL_DELETED:
        doDispatch(handleChannelDeletedEvent(msg));
        break;
    case WebsocketEvents.CHANNEL_UPDATED:
        doDispatch(handleChannelUpdatedEvent(msg));
        break;
    case WebsocketEvents.CHANNEL_CONVERTED:
        doDispatch(handleChannelConvertedEvent(msg));
        break;
    case WebsocketEvents.CHANNEL_VIEWED:
        doDispatch(handleChannelViewedEvent(msg));
        break;
    case WebsocketEvents.CHANNEL_MEMBER_UPDATED:
        doDispatch(handleChannelMemberUpdatedEvent(msg));
        break;
    case WebsocketEvents.DIRECT_ADDED:
        doDispatch(handleDirectAddedEvent(msg));
        break;
    case WebsocketEvents.PREFERENCE_CHANGED:
        doDispatch(handlePreferenceChangedEvent(msg));
        break;
    case WebsocketEvents.PREFERENCES_CHANGED:
        doDispatch(handlePreferencesChangedEvent(msg));
        break;
    case WebsocketEvents.PREFERENCES_DELETED:
        doDispatch(handlePreferencesDeletedEvent(msg));
        break;
    case WebsocketEvents.STATUS_CHANGED:
        doDispatch(handleStatusChangedEvent(msg));
        break;
    case WebsocketEvents.TYPING:
        doDispatch(handleUserTypingEvent(msg));
        break;
    case WebsocketEvents.HELLO:
        handleHelloEvent(msg);
        break;
    case WebsocketEvents.REACTION_ADDED:
        doDispatch(handleReactionAddedEvent(msg));
        break;
    case WebsocketEvents.REACTION_REMOVED:
        doDispatch(handleReactionRemovedEvent(msg));
        break;
    case WebsocketEvents.EMOJI_ADDED:
        doDispatch(handleAddEmoji(msg));
        break;
    case WebsocketEvents.LICENSE_CHANGED:
        doDispatch(handleLicenseChangedEvent(msg));
        break;
    case WebsocketEvents.CONFIG_CHANGED:
        doDispatch(handleConfigChangedEvent(msg));
        break;
    case WebsocketEvents.PLUGIN_STATUSES_CHANGED:
        doDispatch(handlePluginStatusesChangedEvent(msg));
        break;
    case WebsocketEvents.OPEN_DIALOG:
        doDispatch(handleOpenDialogEvent(msg));
        break;
    }
}

function handleNewPostEvent(msg) {
    return async (dispatch, getState) => {
        const state = getState();
        const currentChannelId = getCurrentChannelId(state);
        const users = getUsers(state);
        const posts = getAllPosts(state);
        const post = JSON.parse(msg.data.post);
        const userId = post.user_id;
        const currentUserId = getCurrentChannelId(state);
        const status = getStatusForUserId(state, userId);

        getProfilesAndStatusesForPosts([post], dispatch, getState);

        // getProfilesAndStatusesForPosts only gets the status if it doesn't exist, but we
        // also want it if the user does not appear to be online
        if (userId !== currentUserId && status && status !== General.ONLINE) {
            dispatch(getStatusesByIds([userId]));
        }

        switch (post.type) {
        case Posts.POST_TYPES.HEADER_CHANGE:
            dispatch(updateChannelHeader(post.channel_id, post.props.new_header));
            break;
        case Posts.POST_TYPES.PURPOSE_CHANGE:
            dispatch(updateChannelPurpose(post.channel_id, post.props.new_purpose));
            break;
        }

        if (post.root_id && !posts[post.root_id]) {
            let data;
            try {
                data = await Client4.getPostThread(post.root_id);
            } catch (e) {
                console.warn('failed to get thread for new post event', e); // eslint-disable-line no-console
            }

            if (data) {
                const rootUserId = data.posts[post.root_id].user_id;
                const rootStatus = users.statuses[rootUserId];
                if (!users.profiles[rootUserId] && rootUserId !== currentUserId) {
                    dispatch(getProfilesByIds([rootUserId]));
                }

                if (rootStatus !== General.ONLINE) {
                    dispatch(getStatusesByIds([rootUserId]));
                }

                dispatch({
                    type: PostTypes.RECEIVED_POSTS,
                    data,
                    channelId: post.channel_id,
                }, getState);
            }
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
                dispatch(makeDirectChannelVisibleIfNecessary(otherUserId));
            } else if (msg.data.channel_type === General.GM_CHANNEL) {
                dispatch(makeGroupMessageVisibleIfNecessary(post.channel_id));
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

        dispatch(batchActions(actions));

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
            dispatch(markChannelAsRead(post.channel_id, null, markAsReadOnServer));
            dispatch(markChannelAsViewed(post.channel_id));
        } else {
            dispatch(markChannelAsUnread(msg.data.team_id, post.channel_id, msg.data.mentions));
        }
    };
}

function handlePostEdited(msg) {
    return (dispatch, getState) => {
        const data = JSON.parse(msg.data.post);

        getProfilesAndStatusesForPosts([data], dispatch, getState);
        dispatch({type: PostTypes.RECEIVED_POST, data});
    };
}

function handlePostDeleted(msg) {
    const data = JSON.parse(msg.data.post);

    return {type: PostTypes.POST_DELETED, data};
}

function handleLeaveTeamEvent(msg) {
    return (dispatch, getState) => {
        const state = getState();
        const teams = getTeamsSelector(state);
        const currentTeamId = getCurrentTeamId(state);
        const currentUserId = getCurrentUserId(state);

        if (currentUserId === msg.data.user_id) {
            dispatch({type: TeamTypes.LEAVE_TEAM, data: teams[msg.data.team_id]});

            // if they are on the team being removed deselect the current team and channel
            if (currentTeamId === msg.data.team_id) {
                EventEmitter.emit('leave_team');
            }
        }
    };
}

function handleUpdateTeamEvent(msg) {
    return {
        type: TeamTypes.UPDATED_TEAM,
        data: JSON.parse(msg.data.team),
    };
}

function handlePatchTeamEvent(msg) {
    return {
        type: TeamTypes.PATCHED_TEAM,
        data: JSON.parse(msg.data.team),
    };
}

function handleTeamAddedEvent(msg) {
    return async (dispatch) => {
        await Promise.all([
            dispatch(getTeam(msg.data.team_id)),
            dispatch(getMyTeamUnreads()),
        ]);
    };
}

function handleUserAddedEvent(msg) {
    return (dispatch, getState) => {
        const state = getState();
        const currentChannelId = getCurrentChannelId(state);
        const currentTeamId = getCurrentTeamId(state);
        const currentUserId = getCurrentUserId(state);
        const teamId = msg.data.team_id;

        dispatch({
            type: ChannelTypes.CHANNEL_MEMBER_ADDED,
            data: {
                channel_id: msg.broadcast.channel_id,
                user_id: msg.data.user_id,
            },
        }, getState);

        if (msg.broadcast.channel_id === currentChannelId) {
            dispatch(getChannelStats(teamId, currentChannelId));
        }

        if (teamId === currentTeamId && msg.data.user_id === currentUserId) {
            dispatch(getChannelAndMyMember(msg.broadcast.channel_id));
        }
    };
}

function handleUserRemovedEvent(msg) {
    return (dispatch, getState) => {
        const state = getState();
        const channels = getAllChannels(state);
        const currentChannelId = getCurrentChannelId(state);
        const currentTeamId = getCurrentTeamId(state);
        const currentUserId = getCurrentUserId(state);

        dispatch({
            type: ChannelTypes.CHANNEL_MEMBER_REMOVED,
            data: {
                channel_id: msg.broadcast.channel_id,
                user_id: msg.data.user_id,
            },
        }, getState);

        if (msg.broadcast.user_id === currentUserId && currentTeamId) {
            const channel = channels[currentChannelId];

            dispatch(fetchMyChannelsAndMembers(currentTeamId));

            if (channel) {
                dispatch({
                    type: ChannelTypes.LEAVE_CHANNEL,
                    data: {
                        id: msg.data.channel_id,
                        user_id: currentUserId,
                        team_id: channel.team_id,
                        type: channel.type,
                    },
                });
            }

            if (msg.data.channel_id === currentChannelId) {
                const defaultChannel = Object.values(channels).find((c) => c.team_id === currentTeamId && c.name === General.DEFAULT_CHANNEL);

                // emit the event so the client can change his own state
                EventEmitter.emit(General.DEFAULT_CHANNEL, defaultChannel.display_name);
                dispatch(selectChannel(defaultChannel.id));
            }
        } else if (msg.data.channel_id === currentChannelId) {
            dispatch(getChannelStats(currentTeamId, currentChannelId));
        }
    };
}

function handleUserUpdatedEvent(msg) {
    return (dispatch, getState) => {
        const currentUser = getCurrentUser(getState());
        const user = msg.data.user;

        if (user.id === currentUser.id) {
            if (user.update_at > currentUser.update_at) {
                // Need to request me to make sure we don't override with sanitized fields from the
                // websocket event
                dispatch(getMe());
            }
        } else {
            dispatch({
                type: UserTypes.RECEIVED_PROFILES,
                data: {
                    [user.id]: user,
                },
            });
        }
    };
}

function handleRoleAddedEvent(msg) {
    const role = JSON.parse(msg.data.role);

    return {
        type: RoleTypes.RECEIVED_ROLE,
        data: role,
    };
}

function handleRoleRemovedEvent(msg) {
    const role = JSON.parse(msg.data.role);

    return {
        type: RoleTypes.ROLE_DELETED,
        data: role,
    };
}

function handleRoleUpdatedEvent(msg) {
    const role = JSON.parse(msg.data.role);

    return {
        type: RoleTypes.RECEIVED_ROLE,
        data: role,
    };
}

function handleChannelCreatedEvent(msg) {
    return (dispatch, getState) => {
        const {channel_id: channelId, team_id: teamId} = msg.data;
        const state = getState();
        const channels = getAllChannels(state);
        const currentTeamId = getCurrentTeamId(state);

        if (teamId === currentTeamId && !channels[channelId]) {
            dispatch(getChannelAndMyMember(channelId));
        }
    };
}

function handleChannelDeletedEvent(msg) {
    return (dispatch, getState) => {
        const state = getState();
        const channels = getAllChannels(state);
        const channelsInTeam = getChannelsInTeam(state);
        const currentChannelId = getCurrentChannelId(state);
        const currentTeamId = getCurrentTeamId(state);
        const config = getConfig(state);
        const viewArchivedChannels = config.ExperimentalViewArchivedChannels === 'true';

        if (msg.broadcast.team_id === currentTeamId) {
            if (msg.data.channel_id === currentChannelId && !viewArchivedChannels) {
                let channelId = '';
                const teamChannels = Array.from(channelsInTeam[currentTeamId]);
                const channel = teamChannels.filter((key) => channels[key].name === General.DEFAULT_CHANNEL);

                if (channel.length) {
                    channelId = channel[0];
                }

                dispatch({type: ChannelTypes.SELECT_CHANNEL, data: channelId});
                EventEmitter.emit(General.DEFAULT_CHANNEL, '');
            }

            dispatch({type: ChannelTypes.RECEIVED_CHANNEL_DELETED, data: {id: msg.data.channel_id, team_id: msg.data.team_id, deleteAt: msg.data.delete_at}});

            dispatch(fetchMyChannelsAndMembers(currentTeamId));
        }
    };
}

function handleChannelUpdatedEvent(msg) {
    return (dispatch, getState) => {
        let channel;
        try {
            channel = msg.data ? JSON.parse(msg.data.channel) : null;
        } catch (err) {
            return;
        }

        const currentChannelId = getCurrentChannelId(getState());
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
    };
}

// handleChannelConvertedEvent handles updating of channel which is converted from public to private
function handleChannelConvertedEvent(msg) {
    return (dispatch, getState) => {
        const channelId = msg.data.channel_id;
        if (channelId) {
            const channel = getChannel(getState(), channelId);
            if (channel) {
                dispatch({
                    type: ChannelTypes.RECEIVED_CHANNEL,
                    data: {...channel, type: General.PRIVATE_CHANNEL},
                });
            }
        }
    };
}

function handleChannelViewedEvent(msg) {
    return (dispatch, getState) => {
        const {channel_id: channelId} = msg.data;
        const currentChannelId = getCurrentChannelId(getState());

        if (channelId !== currentChannelId) {
            dispatch(markChannelAsRead(channelId, null, false));
            dispatch(markChannelAsViewed(channelId));
        }
    };
}

function handleChannelMemberUpdatedEvent(msg) {
    const channelMember = JSON.parse(msg.data.channelMember);

    return {
        type: ChannelTypes.RECEIVED_MY_CHANNEL_MEMBER,
        data: channelMember,
    };
}

function handleDirectAddedEvent(msg) {
    return (dispatch) => {
        dispatch(getChannelAndMyMember(msg.broadcast.channel_id));
    };
}

function handlePreferenceChangedEvent(msg) {
    return (dispatch) => {
        const preference = JSON.parse(msg.data.preference);
        dispatch({type: PreferenceTypes.RECEIVED_PREFERENCES, data: [preference]});

        dispatch(getAddedDmUsersIfNecessary([preference]));
    };
}

function handlePreferencesChangedEvent(msg) {
    return (dispatch, getState) => {
        const preferences = JSON.parse(msg.data.preferences);
        const posts = getAllPosts(getState());

        preferences.forEach((pref) => {
            if (pref.category === Preferences.CATEGORY_FLAGGED_POST && !posts[pref.name]) {
                dispatch(getPost(pref.name));
            }
        });

        dispatch(getAddedDmUsersIfNecessary(preferences));
        dispatch({type: PreferenceTypes.RECEIVED_PREFERENCES, data: preferences});
    };
}

function handlePreferencesDeletedEvent(msg) {
    const preferences = JSON.parse(msg.data.preferences);

    return {type: PreferenceTypes.DELETED_PREFERENCES, data: preferences};
}

function handleStatusChangedEvent(msg) {
    return {
        type: UserTypes.RECEIVED_STATUSES,
        data: [{user_id: msg.data.user_id, status: msg.data.status}],
    };
}

function handleHelloEvent(msg) {
    const serverVersion = msg.data.server_version;
    if (serverVersion && Client4.serverVersion !== serverVersion) {
        Client4.serverVersion = serverVersion;
        EventEmitter.emit(General.SERVER_VERSION_CHANGED, serverVersion);
    }
}

function handleUserTypingEvent(msg) {
    return (dispatch, getState) => {
        const state = getState();
        const profiles = getUsers(state);
        const statuses = getUserStatuses(state);
        const currentUserId = getCurrentUserId(state);
        const config = getConfig(state);
        const userId = msg.data.user_id;

        const data = {
            id: msg.broadcast.channel_id + msg.data.parent_id,
            userId,
            now: Date.now(),
        };

        dispatch({
            type: WebsocketEvents.TYPING,
            data,
        });

        setTimeout(() => {
            dispatch({
                type: WebsocketEvents.STOP_TYPING,
                data,
            });
        }, parseInt(config.TimeBetweenUserTypingUpdatesMilliseconds, 10));

        if (!profiles[userId] && userId !== currentUserId) {
            dispatch(getProfilesByIds([userId]));
        }

        const status = statuses[userId];
        if (status !== General.ONLINE) {
            dispatch(getStatusesByIds([userId]));
        }
    };
}

function handleReactionAddedEvent(msg) {
    return (dispatch) => {
        const {data} = msg;
        const reaction = JSON.parse(data.reaction);

        dispatch(getCustomEmojiForReaction(reaction.emoji_name));

        dispatch({
            type: PostTypes.RECEIVED_REACTION,
            data: reaction,
        });
    };
}

function handleReactionRemovedEvent(msg) {
    const {data} = msg;
    const reaction = JSON.parse(data.reaction);

    return {
        type: PostTypes.REACTION_DELETED,
        data: reaction,
    };
}

function handleAddEmoji(msg) {
    const data = JSON.parse(msg.data.emoji);

    return {
        type: EmojiTypes.RECEIVED_CUSTOM_EMOJI,
        data,
    };
}

function handleLicenseChangedEvent(msg) {
    const data = msg.data.license;

    return {
        type: GeneralTypes.CLIENT_LICENSE_RECEIVED,
        data,
    };
}

function handleConfigChangedEvent(msg) {
    const data = msg.data.config;

    EventEmitter.emit(General.CONFIG_CHANGED, data);
    return {
        type: GeneralTypes.CLIENT_CONFIG_RECEIVED,
        data,
    };
}

function handlePluginStatusesChangedEvent(msg) {
    const data = msg.data;

    return {
        type: AdminTypes.RECEIVED_PLUGIN_STATUSES,
        data: data.plugin_statuses,
    };
}

function handleOpenDialogEvent(msg) {
    return (dispatch) => {
        const data = (msg.data && msg.data.dialog) || {};
        dispatch({type: IntegrationTypes.RECEIVED_DIALOG, data: JSON.parse(data)});
    };
}

// Helpers
function getAddedDmUsersIfNecessary(preferences) {
    return (dispatch, getState) => {
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
        const profiles = getUsers(state);
        const statuses = getUserStatuses(state);
        const currentUserId = getCurrentUserId(state);

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
            dispatch(getProfilesByIds(needProfiles));
        }

        if (needStatuses.length > 0) {
            dispatch(getStatusesByIds(needStatuses));
        }
    };
}

function loadPostsHelper(channelId) {
    return (dispatch, getState) => {
        const state = getState();
        const posts = getAllPosts(state);
        const postsIds = getPostIdsInChannel(state, channelId);

        let latestPostTime = 0;
        if (postsIds && postsIds.length) {
            const postsForChannel = postsIds.map((id) => posts[id]);
            latestPostTime = getLastCreateAt(postsForChannel);
        }

        if (latestPostTime === 0) {
            dispatch(getPosts(channelId));
        } else {
            dispatch(getPostsSince(channelId, latestPostTime));
        }
    };
}

let lastTimeTypingSent = 0;
export function userTyping(channelId, parentPostId) {
    return async (dispatch, getState) => {
        const state = getState();
        const config = getConfig(state);
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
