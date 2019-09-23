// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
// @flow

import {Client4} from 'client';
import websocketClient from 'client/websocket_client';
import {
    checkForModifiedUsers,
    getMe,
    getProfilesByIds,
    getStatusesByIds,
    loadProfilesForDirect,
} from './users';
import {
    fetchMyChannelsAndMembers,
    getChannelAndMyMember,
    getChannelStats,
    markChannelAsRead,
} from './channels';
import {
    getPost,
    getPosts,
    getProfilesAndStatusesForPosts,
    getCustomEmojiForReaction,
    handleNewPost,
    postDeleted,
    receivedPost,
    getUnreadPostData,
} from './posts';
import {
    getTeam,
    getMyTeamUnreads,
    getMyTeams,
    getMyTeamMembers,
} from './teams';

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
import {General, WebsocketEvents, Preferences} from 'constants';

import {
    getAllChannels,
    getChannel,
    getChannelsNameMapInTeam,
    getCurrentChannelId,
    getCurrentChannelStats,
    getMyChannelMember,
    getRedirectChannelNameForTeam,
} from 'selectors/entities/channels';
import {getConfig} from 'selectors/entities/general';
import {getAllPosts} from 'selectors/entities/posts';
import {getDirectShowPreferences} from 'selectors/entities/preferences';
import {getCurrentTeamId, getCurrentTeamMembership, getTeams as getTeamsSelector} from 'selectors/entities/teams';
import {getCurrentUser, getCurrentUserId, getUsers, getUserStatuses} from 'selectors/entities/users';
import {getChannelByName} from 'utils/channel_utils';
import {fromAutoResponder} from 'utils/post_utils';
import EventEmitter from 'utils/event_emitter';
import type {
    ActionFunc,
    DispatchFunc,
    GetStateFunc,
    PlatformType,
} from '../types/actions';

let doDispatch;

export function init(platform: PlatformType, siteUrl: ?string, token: ?string, optionalWebSocket: Object, additionalOptions: Object = {}) {
    return async (dispatch: DispatchFunc, getState: GetStateFunc) => {
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
export function close(shouldReconnect: boolean = false) {
    return async (dispatch: DispatchFunc) => {
        reconnect = shouldReconnect;
        websocketClient.close(true);
        if (dispatch) {
            dispatch({
                type: GeneralTypes.WEBSOCKET_CLOSED,
                timestamp: Date.now(),
                data: null,
            });
        }
    };
}

export function doFirstConnect(now: number) {
    return async (dispatch: DispatchFunc, getState: GetStateFunc) => {
        const state = getState();

        if (state.websocket.lastDisconnectAt) {
            dispatch(checkForModifiedUsers());
        }

        dispatch({
            type: GeneralTypes.WEBSOCKET_SUCCESS,
            timestamp: now,
            data: null,
        });
        return {data: true};
    };
}

export function doReconnect(now: number) {
    return async (dispatch: DispatchFunc, getState: GetStateFunc) => {
        const state = getState();
        const currentTeamId = getCurrentTeamId(state);
        const currentChannelId = getCurrentChannelId(state);
        const currentUserId = getCurrentUserId(state);

        if (currentTeamId) {
            const dmPrefs = getDirectShowPreferences(state);
            const statusesToLoad = {
                [currentUserId]: true,
            };

            for (const pref of dmPrefs) {
                if (pref.value === 'true') {
                    statusesToLoad[pref.name] = true;
                }
            }

            dispatch(getStatusesByIds(Object.keys(statusesToLoad)));
            dispatch(getMyTeamUnreads());

            // We need to wait for these actions so that we have an
            // up-to-date state of the current user's team memberships.
            await dispatch(getMyTeams());
            await dispatch(getMyTeamMembers());
            const currentTeamMembership = getCurrentTeamMembership(getState());
            if (currentTeamMembership) {
                dispatch(getPosts(currentChannelId));
                const fethcResult = await dispatch(fetchMyChannelsAndMembers(currentTeamId));
                const data = fethcResult.data || null;
                dispatch(loadProfilesForDirect());

                if (data && data.members) {
                    const stillMemberOfCurrentChannel = data.members.find((m) => m.channel_id === currentChannelId);
                    if (!stillMemberOfCurrentChannel) {
                        EventEmitter.emit(General.SWITCH_TO_DEFAULT_CHANNEL, currentTeamId);
                    }
                }
            } else {
                // If the user is no longer a member of this team when reconnecting
                const newMsg = {
                    data: {
                        user_id: currentUserId,
                        team_id: currentTeamId,
                    },
                };
                dispatch(handleLeaveTeamEvent(newMsg));
            }
        }

        dispatch(checkForModifiedUsers());

        dispatch({
            type: GeneralTypes.WEBSOCKET_SUCCESS,
            timestamp: now,
            data: null,
        });
        return {data: true};
    };
}

function handleConnecting() {
    doDispatch({type: GeneralTypes.WEBSOCKET_REQUEST, data: null});
}

function handleFirstConnect() {
    const now = Date.now();

    if (reconnect) {
        reconnect = false;
        doDispatch(doReconnect(now));
    } else {
        doDispatch(doFirstConnect(now));
    }
}

function handleReconnect() {
    doDispatch(doReconnect(Date.now()));
}

function handleClose(connectFailCount) {
    doDispatch({
        type: GeneralTypes.WEBSOCKET_FAILURE,
        error: connectFailCount,
        data: null,
        timestamp: Date.now(),
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
    case WebsocketEvents.POST_UNREAD:
        doDispatch(handlePostUnread(msg));
        break;
    case WebsocketEvents.LEAVE_TEAM:
        doDispatch(handleLeaveTeamEvent(msg));
        break;
    case WebsocketEvents.UPDATE_TEAM:
        doDispatch(handleUpdateTeamEvent(msg));
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
    return (dispatch, getState) => {
        const post = JSON.parse(msg.data.post);

        dispatch(handleNewPost(msg));
        getProfilesAndStatusesForPosts([post], dispatch, getState);

        if (post.user_id !== getCurrentUserId(getState()) && !fromAutoResponder(post)) {
            dispatch({
                type: UserTypes.RECEIVED_STATUSES,
                data: [{user_id: post.user_id, status: General.ONLINE}],
            });
        }
        return {data: true};
    };
}

function handlePostEdited(msg) {
    return (dispatch, getState) => {
        const data = JSON.parse(msg.data.post);

        getProfilesAndStatusesForPosts([data], dispatch, getState);
        dispatch(receivedPost(data));
        return {data: true};
    };
}

function handlePostDeleted(msg) {
    const data = JSON.parse(msg.data.post);

    return postDeleted(data);
}

function handlePostUnread(msg) {
    return (dispatch, getState) => {
        const state = getState();

        const member = getMyChannelMember(state, msg.broadcast.channel_id);
        const delta = member ? member.msg_count - msg.data.msg_count : msg.data.msg_count;
        const info = {
            ...msg.data,
            user_id: msg.broadcast.user_id,
            team_id: msg.broadcast.team_id,
            channel_id: msg.broadcast.channel_id,
            deltaMsgs: delta,
        };
        const data = getUnreadPostData(info, state);
        dispatch({
            type: ChannelTypes.POST_UNREAD_SUCCESS,
            data,
        });
        return {data};
    };
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
        return {data: true};
    };
}

function handleUpdateTeamEvent(msg) {
    return {
        type: TeamTypes.UPDATED_TEAM,
        data: JSON.parse(msg.data.team),
    };
}

function handleTeamAddedEvent(msg) {
    return async (dispatch) => {
        await Promise.all([
            dispatch(getTeam(msg.data.team_id)),
            dispatch(getMyTeamUnreads()),
        ]);
        return {data: true};
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
            dispatch(getChannelStats(currentChannelId));
        }

        if (teamId === currentTeamId && msg.data.user_id === currentUserId) {
            dispatch(getChannelAndMyMember(msg.broadcast.channel_id));
        }
        return {data: true};
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
                // emit the event so the client can change his own state
                EventEmitter.emit(General.SWITCH_TO_DEFAULT_CHANNEL, currentTeamId);
            }
        } else if (msg.data.channel_id === currentChannelId) {
            dispatch(getChannelStats(currentChannelId));
        }
        return {data: true};
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
        return {data: true};
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
        return {data: true};
    };
}

function handleChannelDeletedEvent(msg) {
    return (dispatch, getState) => {
        const state = getState();
        const currentChannelId = getCurrentChannelId(state);
        const currentTeamId = getCurrentTeamId(state);
        const config = getConfig(state);
        const viewArchivedChannels = config.ExperimentalViewArchivedChannels === 'true';

        if (msg.broadcast.team_id === currentTeamId) {
            if (msg.data.channel_id === currentChannelId && !viewArchivedChannels) {
                const channelsInTeam = getChannelsNameMapInTeam(state, currentTeamId);
                const channel = getChannelByName(channelsInTeam, getRedirectChannelNameForTeam(state, currentTeamId));
                if (channel && channel.id) {
                    dispatch({type: ChannelTypes.SELECT_CHANNEL, data: channel.id});
                }
                EventEmitter.emit(General.DEFAULT_CHANNEL, '');
            }

            dispatch({type: ChannelTypes.RECEIVED_CHANNEL_DELETED, data: {id: msg.data.channel_id, team_id: msg.data.team_id, deleteAt: msg.data.delete_at, viewArchivedChannels}}, getState);

            dispatch(fetchMyChannelsAndMembers(currentTeamId));
        }
        return {data: true};
    };
}

function handleChannelUpdatedEvent(msg) {
    return async (dispatch, getState) => {
        let channel;
        try {
            channel = msg.data ? JSON.parse(msg.data.channel) : null;
        } catch (err) {
            return {error: err};
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
        return {data: true};
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
        return {data: true};
    };
}

function handleChannelViewedEvent(msg) {
    return (dispatch, getState) => {
        const state = getState();
        const {channel_id: channelId} = msg.data;
        const currentChannelId = getCurrentChannelId(state);
        const currentUserId = getCurrentUserId(state);

        if (channelId !== currentChannelId && currentUserId === msg.broadcast.user_id) {
            dispatch(markChannelAsRead(channelId, null, false));
        }
        return {data: true};
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
        return {data: true};
    };
}

function handlePreferenceChangedEvent(msg) {
    return (dispatch) => {
        const preference = JSON.parse(msg.data.preference);
        dispatch({type: PreferenceTypes.RECEIVED_PREFERENCES, data: [preference]});

        dispatch(getAddedDmUsersIfNecessary([preference]));
        return {data: true};
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
        return {data: true};
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
        return {data: true};
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
        return {data: true};
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
        return {data: true};
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
            return {data: true};
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
        return {data: true};
    };
}

let lastTimeTypingSent = 0;
export function userTyping(channelId: string, parentPostId: string): ActionFunc {
    return async (dispatch: DispatchFunc, getState: GetStateFunc) => {
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
