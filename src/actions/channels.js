// Copyright (c) 2016-present Mattermost, Inc. All Rights Reserved.
// See License.txt for license information.

import {batchActions} from 'redux-batched-actions';

import {Client4} from 'client';
import {General, Preferences} from 'constants';
import {ChannelTypes, PreferenceTypes, TeamTypes, UserTypes} from 'action_types';
import {savePreferences, deletePreferences} from 'actions/preferences';
import {getChannelsIdForTeam} from 'utils/channel_utils';

import {logError} from './errors';
import {bindClientFunc, forceLogoutIfNecessary} from './helpers';
import {getMissingProfilesByIds} from './users';

export function selectChannel(channelId) {
    return async (dispatch, getState) => {
        try {
            dispatch({
                type: ChannelTypes.SELECT_CHANNEL,
                data: channelId
            }, getState);
        } catch (error) {
            logError(error)(dispatch);
            return {error};
        }

        return {data: true};
    };
}

export function createChannel(channel, userId) {
    return async (dispatch, getState) => {
        dispatch(batchActions([
            {
                type: ChannelTypes.CREATE_CHANNEL_REQUEST
            },
            {
                type: ChannelTypes.CHANNEL_MEMBERS_REQUEST
            }
        ]), getState);

        let created;
        try {
            created = await Client4.createChannel(channel);
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch);
            dispatch(batchActions([
                {
                    type: ChannelTypes.CREATE_CHANNEL_FAILURE,
                    error
                },
                {
                    type: ChannelTypes.CHANNEL_MEMBERS_FAILURE,
                    error
                },
                logError(error)(dispatch)
            ]), getState);
            return {error};
        }

        const member = {
            channel_id: created.id,
            user_id: userId,
            roles: `${General.CHANNEL_USER_ROLE} ${General.CHANNEL_ADMIN_ROLE}`,
            last_viewed_at: 0,
            msg_count: 0,
            mention_count: 0,
            notify_props: {desktop: 'default', mark_unread: 'all'},
            last_update_at: created.create_at
        };

        const actions = [];
        const {channels, myMembers} = getState().entities.channels;

        if (!channels[created.id]) {
            actions.push({type: ChannelTypes.RECEIVED_CHANNEL, data: created});
        }

        if (!myMembers[created.id]) {
            actions.push({type: ChannelTypes.RECEIVED_MY_CHANNEL_MEMBER, data: member});
        }

        dispatch(batchActions([
            ...actions,
            {
                type: ChannelTypes.CREATE_CHANNEL_SUCCESS
            },
            {
                type: ChannelTypes.CHANNEL_MEMBERS_SUCCESS
            }
        ]), getState);

        return {data: created};
    };
}

export function createDirectChannel(userId, otherUserId) {
    return async (dispatch, getState) => {
        dispatch({type: ChannelTypes.CREATE_CHANNEL_REQUEST}, getState);

        let created;
        try {
            created = await Client4.createDirectChannel([userId, otherUserId]);
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch);
            dispatch(batchActions([
                {type: ChannelTypes.CREATE_CHANNEL_FAILURE, error},
                logError(error)(dispatch)
            ]), getState);
            return {error};
        }

        const member = {
            channel_id: created.id,
            user_id: userId,
            roles: `${General.CHANNEL_USER_ROLE}`,
            last_viewed_at: 0,
            msg_count: 0,
            mention_count: 0,
            notify_props: {desktop: 'default', mark_unread: 'all'},
            last_update_at: created.create_at
        };

        const preferences = [
            {user_id: userId, category: Preferences.CATEGORY_DIRECT_CHANNEL_SHOW, name: otherUserId, value: 'true'},
            {user_id: userId, category: Preferences.CATEGORY_CHANNEL_OPEN_TIME, name: created.id, value: new Date().getTime().toString()}
        ];

        savePreferences(userId, preferences)(dispatch, getState);

        dispatch(batchActions([
            {
                type: ChannelTypes.RECEIVED_CHANNEL,
                data: created
            },
            {
                type: ChannelTypes.RECEIVED_MY_CHANNEL_MEMBER,
                data: member
            },
            {
                type: PreferenceTypes.RECEIVED_PREFERENCES,
                data: preferences
            },
            {
                type: ChannelTypes.CREATE_CHANNEL_SUCCESS
            },
            {
                type: UserTypes.RECEIVED_PROFILES_LIST_IN_CHANNEL,
                id: created.id,
                data: [{id: userId}, {id: otherUserId}]
            }
        ]), getState);

        return {data: created};
    };
}

export function createGroupChannel(userIds) {
    return async (dispatch, getState) => {
        dispatch({type: ChannelTypes.CREATE_CHANNEL_REQUEST}, getState);

        const {currentUserId} = getState().entities.users;

        let created;
        try {
            created = await Client4.createGroupChannel(userIds);
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch);
            dispatch(batchActions([
                {type: ChannelTypes.CREATE_CHANNEL_FAILURE, error},
                logError(error)(dispatch)
            ]), getState);
            return {error};
        }

        const member = {
            channel_id: created.id,
            user_id: currentUserId,
            roles: `${General.CHANNEL_USER_ROLE}`,
            last_viewed_at: 0,
            msg_count: 0,
            mention_count: 0,
            notify_props: {desktop: 'default', mark_unread: 'all'},
            last_update_at: created.create_at
        };

        const preferences = [
            {user_id: currentUserId, category: Preferences.CATEGORY_GROUP_CHANNEL_SHOW, name: created.id, value: 'true'},
            {user_id: currentUserId, category: Preferences.CATEGORY_CHANNEL_OPEN_TIME, name: created.id, value: new Date().getTime().toString()}
        ];

        savePreferences(currentUserId, preferences)(dispatch, getState);

        const profilesInChannel = userIds.map((id) => {
            return {id};
        });
        profilesInChannel.push({id: currentUserId}); // currentUserId is optionally in userIds, but the reducer will get rid of a duplicate

        dispatch(batchActions([
            {
                type: ChannelTypes.RECEIVED_CHANNEL,
                data: created
            },
            {
                type: ChannelTypes.RECEIVED_MY_CHANNEL_MEMBER,
                data: member
            },
            {
                type: PreferenceTypes.RECEIVED_PREFERENCES,
                data: preferences
            },
            {
                type: ChannelTypes.CREATE_CHANNEL_SUCCESS
            },
            {
                type: UserTypes.RECEIVED_PROFILES_LIST_IN_CHANNEL,
                id: created.id,
                data: profilesInChannel
            }
        ]), getState);

        return {data: created};
    };
}

export function patchChannel(channelId, patch) {
    return async (dispatch, getState) => {
        dispatch({type: ChannelTypes.UPDATE_CHANNEL_REQUEST}, getState);

        let updated;
        try {
            updated = await Client4.patchChannel(channelId, patch);
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch);

            dispatch(batchActions([
                {type: ChannelTypes.UPDATE_CHANNEL_FAILURE, error},
                logError(error)(dispatch)
            ]), getState);
            return {error};
        }

        dispatch(batchActions([
            {
                type: ChannelTypes.RECEIVED_CHANNEL,
                data: updated
            },
            {
                type: ChannelTypes.UPDATE_CHANNEL_SUCCESS
            }
        ]), getState);

        return {data: updated};
    };
}

export function updateChannel(channel) {
    return async (dispatch, getState) => {
        dispatch({type: ChannelTypes.UPDATE_CHANNEL_REQUEST}, getState);

        let updated;
        try {
            updated = await Client4.updateChannel(channel);
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch);

            dispatch(batchActions([
                {type: ChannelTypes.UPDATE_CHANNEL_FAILURE, error},
                logError(error)(dispatch)
            ]), getState);
            return {error};
        }

        dispatch(batchActions([
            {
                type: ChannelTypes.RECEIVED_CHANNEL,
                data: updated
            },
            {
                type: ChannelTypes.UPDATE_CHANNEL_SUCCESS
            }
        ]), getState);

        return {data: updated};
    };
}

export function updateChannelNotifyProps(userId, channelId, props) {
    return async (dispatch, getState) => {
        dispatch({type: ChannelTypes.NOTIFY_PROPS_REQUEST}, getState);

        const notifyProps = {
            user_id: userId,
            channel_id: channelId,
            ...props
        };

        try {
            await Client4.updateChannelNotifyProps(notifyProps);
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch);

            dispatch(batchActions([
                {type: ChannelTypes.NOTIFY_PROPS_FAILURE, error},
                logError(error)(dispatch)
            ]), getState);
            return {error};
        }

        const member = getState().entities.channels.myMembers[channelId] || {};
        const currentNotifyProps = member.notify_props || {};

        dispatch(batchActions([
            {
                type: ChannelTypes.RECEIVED_CHANNEL_PROPS,
                data: {
                    channel_id: channelId,
                    notifyProps: {...currentNotifyProps, ...notifyProps}
                }
            },
            {
                type: ChannelTypes.NOTIFY_PROPS_SUCCESS
            }
        ]), getState);

        return {data: true};
    };
}

export function getChannel(channelId) {
    return async (dispatch, getState) => {
        dispatch({type: ChannelTypes.CHANNEL_REQUEST}, getState);

        let data;
        try {
            data = await Client4.getChannel(channelId);
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch);
            dispatch(batchActions([
                {type: ChannelTypes.CHANNELS_FAILURE, error},
                logError(error)(dispatch)
            ]), getState);
            return {error};
        }

        dispatch(batchActions([
            {
                type: ChannelTypes.RECEIVED_CHANNEL,
                data
            },
            {
                type: ChannelTypes.CHANNEL_SUCCESS
            }
        ]), getState);

        return {data};
    };
}

export function getChannelAndMyMember(channelId) {
    return async (dispatch, getState) => {
        dispatch({type: ChannelTypes.CHANNEL_REQUEST}, getState);

        let channel;
        let member;
        try {
            channel = await Client4.getChannel(channelId);
            member = await Client4.getMyChannelMember(channelId);
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch);
            dispatch(batchActions([
                {type: ChannelTypes.CHANNELS_FAILURE, error},
                logError(error)(dispatch)
            ]), getState);
            return {error};
        }

        dispatch(batchActions([
            {
                type: ChannelTypes.RECEIVED_CHANNEL,
                data: channel
            },
            {
                type: ChannelTypes.CHANNEL_SUCCESS
            },
            {
                type: ChannelTypes.RECEIVED_MY_CHANNEL_MEMBER,
                data: member
            }
        ]), getState);

        return {data: {channel, member}};
    };
}

export function fetchMyChannelsAndMembers(teamId) {
    return async (dispatch, getState) => {
        dispatch(batchActions([
            {
                type: ChannelTypes.CHANNELS_REQUEST
            },
            {
                type: ChannelTypes.CHANNEL_MEMBERS_REQUEST
            }
        ]), getState);

        let channels;
        let channelMembers;
        try {
            channels = await Client4.getMyChannels(teamId);
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch);
            dispatch(batchActions([
                {type: ChannelTypes.CHANNELS_FAILURE, error},
                {type: ChannelTypes.CHANNEL_MEMBERS_FAILURE, error},
                logError(error)(dispatch)
            ]), getState);
            return {error};
        }

        try {
            channelMembers = await Client4.getMyChannelMembers(teamId);
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch);
            dispatch(batchActions([
                {type: ChannelTypes.CHANNELS_FAILURE, error},
                {type: ChannelTypes.CHANNEL_MEMBERS_FAILURE, error},
                logError(error)(dispatch)
            ]), getState);
            return {error};
        }

        const {currentUserId} = getState().entities.users;

        dispatch(batchActions([
            {
                type: ChannelTypes.RECEIVED_CHANNELS,
                teamId,
                data: channels
            },
            {
                type: ChannelTypes.CHANNELS_SUCCESS
            },
            {
                type: ChannelTypes.RECEIVED_MY_CHANNEL_MEMBERS,
                data: channelMembers,
                remove: getChannelsIdForTeam(getState(), teamId),
                currentUserId
            },
            {
                type: ChannelTypes.CHANNEL_MEMBERS_SUCCESS
            }
        ]), getState);

        return {data: {channels, members: channelMembers}};
    };
}

export function getMyChannelMembers(teamId) {
    return async (dispatch, getState) => {
        dispatch({type: ChannelTypes.CHANNEL_MY_MEMBERS_REQUEST}, getState);

        let channelMembers;
        try {
            const channelMembersRequest = Client4.getMyChannelMembers(teamId);

            channelMembers = await channelMembersRequest;
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch);
            dispatch(batchActions([
                {type: ChannelTypes.CHANNEL_MY_MEMBERS_FAILURE, error},
                logError(error)(dispatch)
            ]), getState);
            return {error};
        }

        const {currentUserId} = getState().entities.users;

        dispatch(batchActions([
            {
                type: ChannelTypes.RECEIVED_MY_CHANNEL_MEMBERS,
                data: channelMembers,
                remove: getChannelsIdForTeam(getState(), teamId),
                currentUserId
            },
            {
                type: ChannelTypes.CHANNEL_MY_MEMBERS_SUCCESS
            }
        ]), getState);

        return {data: channelMembers};
    };
}

export function getChannelMembers(channelId, page = 0, perPage = General.CHANNELS_CHUNK_SIZE) {
    return async (dispatch, getState) => {
        dispatch({type: ChannelTypes.CHANNEL_MEMBERS_REQUEST}, getState);

        let channelMembers;
        try {
            const channelMembersRequest = Client4.getChannelMembers(channelId, page, perPage);

            channelMembers = await channelMembersRequest;
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch);
            dispatch(batchActions([
                {type: ChannelTypes.CHANNEL_MEMBERS_FAILURE, error},
                logError(error)(dispatch)
            ]), getState);
            return {error};
        }

        const userIds = channelMembers.map((cm) => cm.user_id);
        getMissingProfilesByIds(userIds)(dispatch, getState);

        dispatch(batchActions([
            {
                type: ChannelTypes.RECEIVED_CHANNEL_MEMBERS,
                data: channelMembers
            },
            {
                type: ChannelTypes.CHANNEL_MEMBERS_SUCCESS
            }
        ]), getState);

        return {data: channelMembers};
    };
}

export function leaveChannel(channelId) {
    return async (dispatch, getState) => {
        const state = getState();
        const {currentUserId} = state.entities.users;
        const {channels, myMembers} = state.entities.channels;
        const channel = channels[channelId];
        const member = myMembers[channelId];

        Client4.trackEvent('action', 'action_channels_leave', {channel_id: channelId});

        dispatch({
            type: ChannelTypes.LEAVE_CHANNEL,
            data: {
                id: channelId,
                user_id: currentUserId,
                team_id: channel.team_id,
                type: channel.type
            },
            meta: {
                offline: {
                    effect: () => Client4.removeFromChannel(currentUserId, channelId),
                    commit: {type: ChannelTypes.LEAVE_CHANNEL},
                    rollback: () => {
                        dispatch(batchActions([
                            {
                                type: ChannelTypes.RECEIVED_CHANNEL,
                                data: channel
                            },
                            {
                                type: ChannelTypes.RECEIVED_MY_CHANNEL_MEMBER,
                                data: member
                            }
                        ]));
                    }
                }
            }
        });

        return {data: true};
    };
}

export function joinChannel(userId, teamId, channelId, channelName) {
    return async (dispatch, getState) => {
        dispatch({type: ChannelTypes.JOIN_CHANNEL_REQUEST}, getState);

        let member;
        let channel;
        try {
            if (channelId) {
                member = await Client4.addToChannel(userId, channelId);
                channel = await Client4.getChannel(channelId);
            } else if (channelName) {
                channel = await Client4.getChannelByName(teamId, channelName);
                member = await Client4.addToChannel(userId, channel.id);
            }
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch);
            dispatch(batchActions([
                {type: ChannelTypes.JOIN_CHANNEL_FAILURE, error},
                logError(error)(dispatch)
            ]), getState);
            return {error};
        }

        Client4.trackEvent('action', 'action_channels_join', {channel_id: channelId});

        dispatch(batchActions([
            {
                type: ChannelTypes.RECEIVED_CHANNEL,
                data: channel
            },
            {
                type: ChannelTypes.RECEIVED_MY_CHANNEL_MEMBER,
                data: member
            },
            {
                type: ChannelTypes.JOIN_CHANNEL_SUCCESS
            }
        ]), getState);

        return {data: {channel, member}};
    };
}

export function deleteChannel(channelId) {
    return async (dispatch, getState) => {
        dispatch({type: ChannelTypes.DELETE_CHANNEL_REQUEST}, getState);

        try {
            await Client4.deleteChannel(channelId);
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch);
            dispatch(batchActions([
                {type: ChannelTypes.DELETE_CHANNEL_FAILURE, error},
                logError(error)(dispatch)
            ]), getState);
            return {error};
        }

        const entities = getState().entities;
        const {channels, currentChannelId} = entities.channels;
        if (channelId === currentChannelId) {
            const channel = Object.keys(channels).filter((key) => channels[key].name === General.DEFAULT_CHANNEL);
            let defaultChannelId = '';
            if (channel.length) {
                defaultChannelId = channel[0];
            }

            dispatch({type: ChannelTypes.SELECT_CHANNEL, data: defaultChannelId}, getState);
        }

        const teamId = channels[channelId] ? channels[channelId].team_id : '';

        dispatch(batchActions([
            {
                type: ChannelTypes.RECEIVED_CHANNEL_DELETED,
                data: {id: channelId, team_id: teamId}
            },
            {
                type: ChannelTypes.DELETE_CHANNEL_SUCCESS
            }
        ]), getState);

        return {data: true};
    };
}

export function viewChannel(channelId, prevChannelId = '') {
    return async (dispatch, getState) => {
        dispatch({type: ChannelTypes.UPDATE_LAST_VIEWED_REQUEST}, getState);

        try {
            await Client4.viewMyChannel(channelId, prevChannelId);
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch);
            dispatch(batchActions([
                {type: ChannelTypes.UPDATE_LAST_VIEWED_FAILURE, error},
                logError(error)(dispatch)
            ]), getState);
            return {error};
        }

        const actions = [{type: ChannelTypes.UPDATE_LAST_VIEWED_SUCCESS}];

        const {myMembers} = getState().entities.channels;
        const member = myMembers[channelId];
        if (member) {
            actions.push({
                type: ChannelTypes.RECEIVED_MY_CHANNEL_MEMBER,
                data: {...member, last_viewed_at: new Date().getTime()}
            });
        }

        const prevMember = myMembers[prevChannelId];
        if (prevMember) {
            actions.push({
                type: ChannelTypes.RECEIVED_MY_CHANNEL_MEMBER,
                data: {...prevMember, last_viewed_at: new Date().getTime()}
            });
        }

        dispatch(batchActions(actions), getState);

        return {data: true};
    };
}

export function getChannels(teamId, page = 0, perPage = General.CHANNELS_CHUNK_SIZE) {
    return async (dispatch, getState) => {
        dispatch({type: ChannelTypes.GET_CHANNELS_REQUEST}, getState);

        let channels;
        try {
            channels = await Client4.getChannels(teamId, page, perPage);
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch);
            dispatch(batchActions([
                {type: ChannelTypes.GET_CHANNELS_FAILURE, error},
                logError(error)(dispatch)
            ]), getState);
            return {error};
        }

        dispatch(batchActions([
            {
                type: ChannelTypes.RECEIVED_CHANNELS,
                teamId,
                data: await channels
            },
            {
                type: ChannelTypes.GET_CHANNELS_SUCCESS
            }
        ]), getState);

        return {data: channels};
    };
}

export function searchChannels(teamId, term) {
    return async (dispatch, getState) => {
        dispatch({type: ChannelTypes.GET_CHANNELS_REQUEST}, getState);

        let channels;
        try {
            channels = await Client4.searchChannels(teamId, term);
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch);
            dispatch(batchActions([
                {type: ChannelTypes.GET_CHANNELS_FAILURE, error},
                logError(error)(dispatch)
            ]), getState);
            return {error};
        }

        dispatch(batchActions([
            {
                type: ChannelTypes.RECEIVED_CHANNELS,
                teamId,
                data: await channels
            },
            {
                type: ChannelTypes.GET_CHANNELS_SUCCESS
            }
        ]), getState);

        return {data: channels};
    };
}

export function getChannelStats(channelId) {
    return async (dispatch, getState) => {
        dispatch({type: ChannelTypes.CHANNEL_STATS_REQUEST}, getState);

        let stat;
        try {
            stat = await Client4.getChannelStats(channelId);
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch);
            dispatch(batchActions([
                {type: ChannelTypes.CHANNEL_STATS_FAILURE, error},
                logError(error)(dispatch)
            ]), getState);
            return {error};
        }

        dispatch(batchActions([
            {
                type: ChannelTypes.RECEIVED_CHANNEL_STATS,
                data: stat
            },
            {
                type: ChannelTypes.CHANNEL_STATS_SUCCESS
            }
        ]), getState);

        return {data: stat};
    };
}

export function addChannelMember(channelId, userId, postRootId = '') {
    return async (dispatch, getState) => {
        dispatch({type: ChannelTypes.ADD_CHANNEL_MEMBER_REQUEST}, getState);

        let member;
        try {
            member = await Client4.addToChannel(userId, channelId, postRootId);
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch);
            dispatch(batchActions([
                {type: ChannelTypes.ADD_CHANNEL_MEMBER_FAILURE, error},
                logError(error)(dispatch)
            ]), getState);
            return {error};
        }

        Client4.trackEvent('action', 'action_channels_add_member', {channel_id: channelId});

        dispatch(batchActions([
            {
                type: UserTypes.RECEIVED_PROFILE_IN_CHANNEL,
                data: {user_id: userId},
                id: channelId
            },
            {
                type: ChannelTypes.RECEIVED_CHANNEL_MEMBER,
                data: member
            },
            {
                type: ChannelTypes.ADD_CHANNEL_MEMBER_SUCCESS,
                id: channelId
            }
        ], 'ADD_CHANNEL_MEMBER.BATCH'), getState);

        return {data: member};
    };
}

export function removeChannelMember(channelId, userId) {
    return async (dispatch, getState) => {
        dispatch({type: ChannelTypes.REMOVE_CHANNEL_MEMBER_REQUEST}, getState);

        try {
            await Client4.removeFromChannel(userId, channelId);
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch);
            dispatch(batchActions([
                {type: ChannelTypes.REMOVE_CHANNEL_MEMBER_FAILURE, error},
                logError(error)(dispatch)
            ]), getState);
            return {error};
        }

        Client4.trackEvent('action', 'action_channels_remove_member', {channel_id: channelId});

        dispatch(batchActions([
            {
                type: UserTypes.RECEIVED_PROFILE_NOT_IN_CHANNEL,
                data: {user_id: userId},
                id: channelId
            },
            {
                type: ChannelTypes.REMOVE_CHANNEL_MEMBER_SUCCESS,
                id: channelId
            }
        ], 'REMOVE_CHANNEL_MEMBER.BATCH'), getState);

        return {data: true};
    };
}

export function updateChannelMemberRoles(channelId, userId, roles) {
    return async (dispatch, getState) => {
        dispatch({type: ChannelTypes.UPDATE_CHANNEL_MEMBER_REQUEST}, getState);

        try {
            await Client4.updateChannelMemberRoles(channelId, userId, roles);
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch);
            dispatch(batchActions([
                {type: ChannelTypes.UPDATE_CHANNEL_MEMBER_FAILURE, error},
                logError(error)(dispatch)
            ]), getState);
            return {error};
        }

        const actions = [
            {
                type: ChannelTypes.UPDATE_CHANNEL_MEMBER_SUCCESS
            }
        ];

        const membersInChannel = getState().entities.channels.membersInChannel[channelId];
        if (membersInChannel && membersInChannel[userId]) {
            actions.push(
                {
                    type: ChannelTypes.RECEIVED_CHANNEL_MEMBER,
                    data: {...membersInChannel[userId], roles}
                }
            );
        }

        dispatch(batchActions(actions), getState);

        return {data: true};
    };
}

export function updateChannelHeader(channelId, header) {
    return async (dispatch, getState) => {
        Client4.trackEvent('action', 'action_channels_update_header', {channel_id: channelId});

        dispatch({
            type: ChannelTypes.UPDATE_CHANNEL_HEADER,
            data: {
                channelId,
                header
            }
        }, getState);

        return {data: true};
    };
}

export function updateChannelPurpose(channelId, purpose) {
    return async (dispatch, getState) => {
        Client4.trackEvent('action', 'action_channels_update_purpose', {channel_id: channelId});

        dispatch({
            type: ChannelTypes.UPDATE_CHANNEL_PURPOSE,
            data: {
                channelId,
                purpose
            }
        }, getState);

        return {data: true};
    };
}

export function markChannelAsRead(channelId, prevChannelId, updateLastViewedAt = false) {
    return async (dispatch, getState) => {
        const state = getState();
        const channelState = state.entities.channels;
        const teamState = state.entities.teams;

        const actions = [];

        // Update channel member objects to set all mentions and posts as viewed
        const channel = channelState.channels[channelId];
        const prevChannel = channelState.channels[prevChannelId]; // May be null since prevChannelId is optional

        // Update team member objects to set mentions and posts in channel as viewed
        const channelMember = channelState.myMembers[channelId];
        const prevChannelMember = channelState.myMembers[prevChannelId]; // May also be null

        if (channel && channelMember) {
            if (updateLastViewedAt) {
                actions.push({
                    type: ChannelTypes.RECEIVED_LAST_VIEWED_AT,
                    data: {
                        channel_id: channelId,
                        last_viewed_at: Date.now()
                    }
                });
            }

            actions.push({
                type: ChannelTypes.RECEIVED_MSG_AND_MENTION_COUNT,
                data: {
                    channel_id: channelId,
                    msg_count: channel.total_msg_count,
                    mention_count: 0
                }
            });
        }

        if (prevChannel && prevChannelMember && channelId !== prevChannelId) {
            actions.push({
                type: ChannelTypes.RECEIVED_MSG_AND_MENTION_COUNT,
                data: {
                    channel_id: prevChannelId,
                    msg_count: prevChannel.total_msg_count,
                    mention_count: 0
                }
            });
        }

        const teamUnreads = [];

        if (channel && channel.team_id) {
            const teamMember = teamState.myMembers[channel.team_id];

            // Decrement mention_count and msg_count by the number that was read in the channel.
            // Note that this works because the values in channelMember are what was unread before this.
            if (teamMember && channelMember) {
                const teamUnread = {
                    team_id: channel.team_id,
                    mention_count: teamMember.mention_count - channelMember.mention_count,
                    msg_count: teamMember.msg_count - (channel.total_msg_count - channelMember.msg_count)
                };

                if (prevChannel && prevChannelMember && channel.team_id === prevChannel.team_id) {
                    teamUnread.mention_count -= prevChannelMember.mention_count;
                    teamUnread.msg_count -= (prevChannel.total_msg_count - prevChannelMember.msg_count);
                }

                teamUnreads.push(teamUnread);
            }
        }

        if (channel && prevChannel && prevChannel.team_id && channel.team_id !== prevChannel.team_id) {
            const prevTeamMember = teamState.myMembers[prevChannel.team_id];

            // We need to make sure that the user hasn't left the team
            if (prevTeamMember) {
                teamUnreads.push({
                    team_id: prevChannel.team_id,
                    mention_count: prevTeamMember.mention_count - prevChannelMember.mention_count,
                    msg_count: prevTeamMember.msg_count - (prevChannel.total_msg_count - prevChannelMember.msg_count)
                });
            }
        }

        if (teamUnreads.length > 0) {
            actions.push({
                type: TeamTypes.RECEIVED_MY_TEAM_UNREADS,
                data: teamUnreads
            });
        }

        if (actions.length > 0) {
            dispatch(batchActions(actions), getState);
        }

        return {data: true};
    };
}

export function markChannelAsUnread(teamId, channelId, mentionsArray) {
    return async (dispatch, getState) => {
        const state = getState();
        const {channels, myMembers} = state.entities.channels;
        const {myMembers: teamMembers} = state.entities.teams;
        const {currentUserId} = state.entities.users;
        const actions = [];

        let wasMentioned = false;
        if (mentionsArray) {
            const mentions = JSON.parse(mentionsArray);
            if (mentions.indexOf(currentUserId) !== -1) {
                wasMentioned = true;
            }
        }

        // if we have the channel and the channel member in the store
        if (channels[channelId] && myMembers[channelId]) {
            const channel = {...channels[channelId]};
            const member = {...myMembers[channelId]};

            channel.total_msg_count++;
            if (member.notify_props && member.notify_props.mark_unread === General.MENTION) {
                member.msg_count++;
            }

            if (wasMentioned) {
                member.mention_count++;
            }

            actions.push({
                type: ChannelTypes.RECEIVED_MY_CHANNEL_MEMBER,
                data: member
            }, {
                type: ChannelTypes.RECEIVED_CHANNEL,
                data: channel
            });
        }

        if (teamId) {
            const teamMember = {...teamMembers[teamId]};
            teamMember.msg_count++;
            if (wasMentioned) {
                teamMember.mention_count++;
            }

            actions.push({
                type: TeamTypes.RECEIVED_MY_TEAM_UNREADS,
                data: [teamMember]
            });
        }

        if (actions.length) {
            dispatch(batchActions(actions), getState);
        }

        return {data: true};
    };
}

export function getChannelMembersByIds(channelId, userIds) {
    return bindClientFunc(
        Client4.getChannelMembersByIds,
        ChannelTypes.CHANNEL_MEMBERS_REQUEST,
        [ChannelTypes.RECEIVED_CHANNEL_MEMBERS, ChannelTypes.CHANNEL_MEMBERS_SUCCESS],
        ChannelTypes.CHANNEL_MEMBERS_FAILURE,
        channelId,
        userIds
    );
}

export function getChannelMember(channelId, userId) {
    return bindClientFunc(
        Client4.getChannelMember,
        ChannelTypes.CHANNEL_MEMBERS_REQUEST,
        [ChannelTypes.RECEIVED_CHANNEL_MEMBER, ChannelTypes.CHANNEL_MEMBERS_SUCCESS],
        ChannelTypes.CHANNEL_MEMBERS_FAILURE,
        channelId,
        userId
    );
}

export function getMyChannelMember(channelId) {
    return bindClientFunc(
        Client4.getMyChannelMember,
        ChannelTypes.CHANNEL_MEMBERS_REQUEST,
        [ChannelTypes.RECEIVED_MY_CHANNEL_MEMBER, ChannelTypes.CHANNEL_MEMBERS_SUCCESS],
        ChannelTypes.CHANNEL_MEMBERS_FAILURE,
        channelId
    );
}

export function favoriteChannel(channelId) {
    return async (dispatch, getState) => {
        const {currentUserId} = getState().entities.users;
        const preference = {
            user_id: currentUserId,
            category: Preferences.CATEGORY_FAVORITE_CHANNEL,
            name: channelId,
            value: 'true'
        };

        Client4.trackEvent('action', 'action_channels_favorite');

        return await savePreferences(currentUserId, [preference])(dispatch, getState);
    };
}

export function unfavoriteChannel(channelId) {
    return async (dispatch, getState) => {
        const {currentUserId} = getState().entities.users;
        const preference = {
            user_id: currentUserId,
            category: Preferences.CATEGORY_FAVORITE_CHANNEL,
            name: channelId
        };

        Client4.trackEvent('action', 'action_channels_unfavorite');

        return await deletePreferences(currentUserId, [preference])(dispatch, getState);
    };
}

export default {
    selectChannel,
    createChannel,
    createDirectChannel,
    updateChannel,
    patchChannel,
    updateChannelNotifyProps,
    getChannel,
    fetchMyChannelsAndMembers,
    getMyChannelMembers,
    getChannelMembersByIds,
    leaveChannel,
    joinChannel,
    deleteChannel,
    viewChannel,
    getChannels,
    searchChannels,
    getChannelStats,
    addChannelMember,
    removeChannelMember,
    updateChannelHeader,
    updateChannelPurpose,
    markChannelAsRead,
    markChannelAsUnread,
    favoriteChannel,
    unfavoriteChannel
};
