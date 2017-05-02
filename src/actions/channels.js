// Copyright (c) 2016-present Mattermost, Inc. All Rights Reserved.
// See License.txt for license information.

import {General, Preferences} from 'constants';
import {ChannelTypes, PreferenceTypes, UserTypes} from 'action_types';
import {savePreferences} from 'actions/preferences';
import {batchActions} from 'redux-batched-actions';

import {Client4} from 'client';

import {logError, getLogErrorAction} from './errors';
import {bindClientFunc, forceLogoutIfNecessary} from './helpers';

export function selectChannel(channelId) {
    return async (dispatch, getState) => {
        try {
            dispatch({
                type: ChannelTypes.SELECT_CHANNEL,
                data: channelId
            }, getState);
        } catch (error) {
            logError(error)(dispatch);
        }
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
                getLogErrorAction(error)
            ]), getState);
            return null;
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

        return created;
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
                getLogErrorAction(error)
            ]), getState);
            return null;
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

        const preferences = [{user_id: userId, category: Preferences.CATEGORY_DIRECT_CHANNEL_SHOW, name: otherUserId, value: 'true'}];

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
            }
        ]), getState);

        return created;
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
                getLogErrorAction(error)
            ]), getState);
            return null;
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

        return updated;
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
                getLogErrorAction(error)
            ]), getState);
            return null;
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

        return updated;
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
                getLogErrorAction(error)
            ]), getState);
            return null;
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

        return true;
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
                getLogErrorAction(error)
            ]), getState);
            return null;
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

        return data;
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
                getLogErrorAction(error)
            ]), getState);
            return null;
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

        return {channel, member};
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
            const channelsRequest = Client4.getMyChannels(teamId);
            const channelMembersRequest = Client4.getMyChannelMembers(teamId);

            channels = await channelsRequest;
            channelMembers = await channelMembersRequest;
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch);
            dispatch(batchActions([
                {type: ChannelTypes.CHANNELS_FAILURE, error},
                {type: ChannelTypes.CHANNEL_MEMBERS_FAILURE, error},
                getLogErrorAction(error)
            ]), getState);
            return null;
        }

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
                data: channelMembers
            },
            {
                type: ChannelTypes.CHANNEL_MEMBERS_SUCCESS
            }
        ]), getState);

        return {channels, members: channelMembers};
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
                getLogErrorAction(error)
            ]), getState);
            return null;
        }

        dispatch(batchActions([
            {
                type: ChannelTypes.RECEIVED_MY_CHANNEL_MEMBERS,
                data: channelMembers
            },
            {
                type: ChannelTypes.CHANNEL_MY_MEMBERS_SUCCESS
            }
        ]), getState);

        return channelMembers;
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
                getLogErrorAction(error)
            ]), getState);
            return null;
        }

        dispatch(batchActions([
            {
                type: ChannelTypes.RECEIVED_CHANNEL_MEMBERS,
                data: channelMembers
            },
            {
                type: ChannelTypes.CHANNEL_MEMBERS_SUCCESS
            }
        ]), getState);

        return channelMembers;
    };
}

export function leaveChannel(channelId) {
    return async (dispatch, getState) => {
        const state = getState();
        const {currentUserId} = state.entities.users;
        const {channels, myMembers} = state.entities.channels;
        const channel = channels[channelId];
        const member = myMembers[channelId];

        dispatch({
            type: ChannelTypes.LEAVE_CHANNEL,
            data: {id: channelId, user_id: currentUserId},
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
                getLogErrorAction(error)
            ]), getState);
            return null;
        }

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

        return {channel, member};
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
                getLogErrorAction(error)
            ]), getState);
            return null;
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

        return true;
    };
}

export function viewChannel(channelId) {
    return async (dispatch, getState) => {
        const state = getState();
        const {currentChannelId} = state.entities.channels;
        let prevChannelId = '';

        if (channelId !== currentChannelId) {
            prevChannelId = currentChannelId;
        }

        dispatch({type: ChannelTypes.UPDATE_LAST_VIEWED_REQUEST}, getState);

        try {
            await Client4.viewMyChannel(channelId, prevChannelId);
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch);
            dispatch(batchActions([
                {type: ChannelTypes.UPDATE_LAST_VIEWED_FAILURE, error},
                getLogErrorAction(error)
            ]), getState);
            return null;
        }

        dispatch({type: ChannelTypes.UPDATE_LAST_VIEWED_SUCCESS}, getState);

        return true;
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
                getLogErrorAction(error)
            ]), getState);
            return null;
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

        return channels;
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
                getLogErrorAction(error)
            ]), getState);
            return null;
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

        return channels;
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
                getLogErrorAction(error)
            ]), getState);
            return null;
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

        return stat;
    };
}

export function addChannelMember(channelId, userId) {
    return async (dispatch, getState) => {
        dispatch({type: ChannelTypes.ADD_CHANNEL_MEMBER_REQUEST}, getState);

        let member;
        try {
            member = await Client4.addToChannel(userId, channelId);
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch);
            dispatch(batchActions([
                {type: ChannelTypes.ADD_CHANNEL_MEMBER_FAILURE, error},
                getLogErrorAction(error)
            ]), getState);
            return null;
        }

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
                type: ChannelTypes.ADD_CHANNEL_MEMBER_SUCCESS
            }
        ], 'ADD_CHANNEL_MEMBER.BATCH'), getState);

        return member;
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
                getLogErrorAction(error)
            ]), getState);
            return null;
        }

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

        return true;
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
                getLogErrorAction(error)
            ]), getState);
            return null;
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

        return true;
    };
}

export function updateChannelHeader(channelId, header) {
    return async (dispatch, getState) => {
        dispatch({
            type: ChannelTypes.UPDATE_CHANNEL_HEADER,
            data: {
                channelId,
                header
            }
        }, getState);
    };
}

export function updateChannelPurpose(channelId, purpose) {
    return async (dispatch, getState) => {
        dispatch({
            type: ChannelTypes.UPDATE_CHANNEL_PURPOSE,
            data: {
                channelId,
                purpose
            }
        }, getState);
    };
}

export function markChannelAsRead(channelId, prevChannelId) {
    return async (dispatch, getState) => {
        const state = getState();

        const {channels, myMembers} = state.entities.channels;
        let totalMsgCount = 0;
        if (channels[channelId]) {
            totalMsgCount = channels[channelId].total_msg_count;
        }

        const channelMember = myMembers[channelId];
        const actions = [{
            type: ChannelTypes.RECEIVED_LAST_VIEWED,
            data: {
                channel_id: channelId,
                last_viewed_at: channelMember.last_viewed_at,
                total_msg_count: totalMsgCount
            }
        }];

        if (prevChannelId) {
            let prevTotalMsgCount = 0;
            if (channels[prevChannelId]) {
                prevTotalMsgCount = channels[prevChannelId].total_msg_count;
            }
            actions.push({
                type: ChannelTypes.RECEIVED_LAST_VIEWED,
                data: {
                    channel_id: prevChannelId,
                    last_viewed_at: new Date().getTime(),
                    total_msg_count: prevTotalMsgCount
                }
            });
        }

        dispatch(batchActions([...actions]), getState);
    };
}

export function markChannelAsUnread(channelId, mentionsArray) {
    return async (dispatch, getState) => {
        const state = getState();
        const {channels, myMembers} = state.entities.channels;
        const {currentUserId} = state.entities.users;

        // if we have the channel and the channel member in the store
        if (channels[channelId] && myMembers[channelId]) {
            const channel = {...channels[channelId]};
            const member = {...myMembers[channelId]};

            channel.total_msg_count++;
            if (member.notify_props && member.notify_props.mark_unread === General.MENTION) {
                member.msg_count++;
            }

            let mentions = [];
            if (mentionsArray) {
                mentions = JSON.parse(mentionsArray);
                if (mentions.indexOf(currentUserId) !== -1) {
                    member.mention_count++;
                }
            }

            dispatch(batchActions([{
                type: ChannelTypes.RECEIVED_MY_CHANNEL_MEMBER,
                data: member
            }, {
                type: ChannelTypes.RECEIVED_CHANNEL,
                data: channel
            }]), getState);
        }
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
    markChannelAsUnread
};
