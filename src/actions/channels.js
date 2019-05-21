// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
// @flow

import {batchActions} from 'redux-batched-actions';

import {Client4} from 'client';
import {General, Preferences} from 'constants';
import {ChannelTypes, PreferenceTypes, UserTypes} from 'action_types';
import {savePreferences, deletePreferences} from 'actions/preferences';
import {getChannelsIdForTeam, getChannelByName} from 'utils/channel_utils';
import {getChannelsNameMapInTeam, getMyChannelMember as getMyChannelMemberSelector, getRedirectChannelNameForTeam} from 'selectors/entities/channels';
import {getCurrentTeamId} from 'selectors/entities/teams';

import {logError} from './errors';
import {bindClientFunc, forceLogoutIfNecessary} from './helpers';
import {getMissingProfilesByIds} from './users';
import {loadRolesIfNeeded} from './roles';

import type {ActionFunc, DispatchFunc, GetStateFunc} from 'types/actions';
import type {Channel, ChannelNotifyProps, ChannelMembership} from 'types/channels';
import type {PreferenceType} from 'types/preferences';

export function selectChannel(channelId: string) {
    return {
        type: ChannelTypes.SELECT_CHANNEL,
        data: channelId,
    };
}

export function createChannel(channel: Channel, userId: string): ActionFunc {
    return async (dispatch, getState) => {
        let created;
        try {
            created = await Client4.createChannel(channel);
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch, getState);
            dispatch(batchActions([
                {
                    type: ChannelTypes.CREATE_CHANNEL_FAILURE,
                    error,
                },
                logError(error),
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
            last_update_at: created.create_at,
        };

        const actions = [];
        const {channels, myMembers} = getState().entities.channels;

        if (!channels[created.id]) {
            actions.push({type: ChannelTypes.RECEIVED_CHANNEL, data: created});
        }

        if (!myMembers[created.id]) {
            actions.push({type: ChannelTypes.RECEIVED_MY_CHANNEL_MEMBER, data: member});
            dispatch(loadRolesIfNeeded(member.roles.split(' ')));
        }

        dispatch(batchActions([
            ...actions,
            {
                type: ChannelTypes.CREATE_CHANNEL_SUCCESS,
            },
        ]), getState);

        return {data: created};
    };
}

export function createDirectChannel(userId: string, otherUserId: string): ActionFunc {
    return async (dispatch, getState) => {
        dispatch({type: ChannelTypes.CREATE_CHANNEL_REQUEST, data: null}, getState);

        let created;
        try {
            created = await Client4.createDirectChannel([userId, otherUserId]);
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch, getState);
            dispatch(batchActions([
                {type: ChannelTypes.CREATE_CHANNEL_FAILURE, error},
                logError(error),
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
            last_update_at: created.create_at,
        };

        const preferences = [
            {user_id: userId, category: Preferences.CATEGORY_DIRECT_CHANNEL_SHOW, name: otherUserId, value: 'true'},
            {user_id: userId, category: Preferences.CATEGORY_CHANNEL_OPEN_TIME, name: created.id, value: new Date().getTime().toString()},
        ];

        savePreferences(userId, preferences)(dispatch);

        dispatch(batchActions([
            {
                type: ChannelTypes.RECEIVED_CHANNEL,
                data: created,
            },
            {
                type: ChannelTypes.RECEIVED_MY_CHANNEL_MEMBER,
                data: member,
            },
            {
                type: PreferenceTypes.RECEIVED_PREFERENCES,
                data: preferences,
            },
            {
                type: ChannelTypes.CREATE_CHANNEL_SUCCESS,
            },
            {
                type: UserTypes.RECEIVED_PROFILES_LIST_IN_CHANNEL,
                id: created.id,
                data: [{id: userId}, {id: otherUserId}],
            },
        ]), getState);
        dispatch(loadRolesIfNeeded(member.roles.split(' ')));

        return {data: created};
    };
}

export function markGroupChannelOpen(channelId: string): ActionFunc {
    return async (dispatch: DispatchFunc, getState: GetStateFunc) => {
        const {currentUserId} = getState().entities.users;

        const preferences: Array<PreferenceType> = [
            {user_id: currentUserId, category: Preferences.CATEGORY_GROUP_CHANNEL_SHOW, name: channelId, value: 'true'},
            {user_id: currentUserId, category: Preferences.CATEGORY_CHANNEL_OPEN_TIME, name: channelId, value: new Date().getTime().toString()},
        ];

        return dispatch(savePreferences(currentUserId, preferences));
    };
}

export function createGroupChannel(userIds: Array<string>): ActionFunc {
    return async (dispatch, getState) => {
        dispatch({type: ChannelTypes.CREATE_CHANNEL_REQUEST, data: null}, getState);

        const {currentUserId} = getState().entities.users;

        let created;
        try {
            created = await Client4.createGroupChannel(userIds);
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch, getState);
            dispatch(batchActions([
                {type: ChannelTypes.CREATE_CHANNEL_FAILURE, error},
                logError(error),
            ]), getState);
            return {error};
        }

        let member = {
            channel_id: created.id,
            user_id: currentUserId,
            roles: `${General.CHANNEL_USER_ROLE}`,
            last_viewed_at: 0,
            msg_count: 0,
            mention_count: 0,
            notify_props: {desktop: 'default', mark_unread: 'all'},
            last_update_at: created.create_at,
        };

        // Check the channel previous existency: if the channel already have
        // posts is because it existed before.
        if (created.total_msg_count > 0) {
            const storeMember = getMyChannelMemberSelector(getState(), created.id);
            if (storeMember === null) {
                try {
                    member = await Client4.getMyChannelMember(created.id);
                } catch (error) {
                    // Log the error and keep going with the generated membership.
                    dispatch(logError(error));
                }
            } else {
                member = storeMember;
            }
        }

        dispatch(markGroupChannelOpen(created.id));

        const profilesInChannel = userIds.map((id) => {
            return {id};
        });
        profilesInChannel.push({id: currentUserId}); // currentUserId is optionally in userIds, but the reducer will get rid of a duplicate

        dispatch(batchActions([
            {
                type: ChannelTypes.RECEIVED_CHANNEL,
                data: created,
            },
            {
                type: ChannelTypes.RECEIVED_MY_CHANNEL_MEMBER,
                data: member,
            },
            {
                type: ChannelTypes.CREATE_CHANNEL_SUCCESS,
            },
            {
                type: UserTypes.RECEIVED_PROFILES_LIST_IN_CHANNEL,
                id: created.id,
                data: profilesInChannel,
            },
        ]), getState);
        dispatch(loadRolesIfNeeded((member && member.roles.split(' ')) || []));

        return {data: created};
    };
}

export function patchChannel(channelId: string, patch: Channel): ActionFunc {
    return async (dispatch, getState) => {
        dispatch({type: ChannelTypes.UPDATE_CHANNEL_REQUEST, data: null}, getState);

        let updated;
        try {
            updated = await Client4.patchChannel(channelId, patch);
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch, getState);

            dispatch(batchActions([
                {type: ChannelTypes.UPDATE_CHANNEL_FAILURE, error},
                logError(error),
            ]), getState);
            return {error};
        }

        dispatch(batchActions([
            {
                type: ChannelTypes.RECEIVED_CHANNEL,
                data: updated,
            },
            {
                type: ChannelTypes.UPDATE_CHANNEL_SUCCESS,
            },
        ]), getState);

        return {data: updated};
    };
}

export function updateChannel(channel: Channel): ActionFunc {
    return async (dispatch, getState) => {
        dispatch({type: ChannelTypes.UPDATE_CHANNEL_REQUEST, data: null}, getState);

        let updated;
        try {
            updated = await Client4.updateChannel(channel);
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch, getState);

            dispatch(batchActions([
                {type: ChannelTypes.UPDATE_CHANNEL_FAILURE, error},
                logError(error),
            ]), getState);
            return {error};
        }

        dispatch(batchActions([
            {
                type: ChannelTypes.RECEIVED_CHANNEL,
                data: updated,
            },
            {
                type: ChannelTypes.UPDATE_CHANNEL_SUCCESS,
            },
        ]), getState);

        return {data: updated};
    };
}

export function convertChannelToPrivate(channelId: string): ActionFunc {
    return async (dispatch, getState) => {
        dispatch({type: ChannelTypes.UPDATE_CHANNEL_REQUEST, data: null}, getState);

        let convertedChannel;
        try {
            convertedChannel = await Client4.convertChannelToPrivate(channelId);
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch, getState);

            dispatch(batchActions([
                {type: ChannelTypes.UPDATE_CHANNEL_FAILURE, error},
                logError(error),
            ]), getState);
            return {error};
        }

        dispatch(batchActions([
            {
                type: ChannelTypes.RECEIVED_CHANNEL,
                data: convertedChannel,
            },
            {
                type: ChannelTypes.UPDATE_CHANNEL_SUCCESS,
            },
        ]), getState);

        return {data: convertedChannel};
    };
}

export function updateChannelNotifyProps(userId: string, channelId: string, props: ChannelNotifyProps): ActionFunc {
    return async (dispatch, getState) => {
        const notifyProps = {
            user_id: userId,
            channel_id: channelId,
            ...props,
        };

        try {
            await Client4.updateChannelNotifyProps(notifyProps);
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch, getState);
            dispatch(logError(error));

            return {error};
        }

        const member = getState().entities.channels.myMembers[channelId] || {};
        const currentNotifyProps = member.notify_props || {};

        dispatch({
            type: ChannelTypes.RECEIVED_CHANNEL_PROPS,
            data: {
                channel_id: channelId,
                notifyProps: {...currentNotifyProps, ...notifyProps},
            },
        });

        return {data: true};
    };
}

export function getChannelByNameAndTeamName(teamName: string, channelName: string, includeDeleted: boolean = false): ActionFunc {
    return async (dispatch, getState) => {
        let data;
        try {
            data = await Client4.getChannelByNameAndTeamName(teamName, channelName, includeDeleted);
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch, getState);
            dispatch(batchActions([
                {type: ChannelTypes.CHANNELS_FAILURE, error},
                logError(error),
            ]), getState);
            return {error};
        }

        dispatch({
            type: ChannelTypes.RECEIVED_CHANNEL,
            data,
        });

        return {data};
    };
}

export function getChannel(channelId: string): ActionFunc {
    return async (dispatch, getState) => {
        let data;
        try {
            data = await Client4.getChannel(channelId);
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch, getState);
            dispatch(batchActions([
                {type: ChannelTypes.CHANNELS_FAILURE, error},
                logError(error),
            ]), getState);
            return {error};
        }

        dispatch({
            type: ChannelTypes.RECEIVED_CHANNEL,
            data,
        });

        return {data};
    };
}

export function getChannelAndMyMember(channelId: string): ActionFunc {
    return async (dispatch, getState) => {
        let channel;
        let member;
        try {
            const channelRequest = Client4.getChannel(channelId);
            const memberRequest = Client4.getMyChannelMember(channelId);

            channel = await channelRequest;
            member = await memberRequest;
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch, getState);
            dispatch(batchActions([
                {type: ChannelTypes.CHANNELS_FAILURE, error},
                logError(error),
            ]), getState);
            return {error};
        }

        dispatch(batchActions([
            {
                type: ChannelTypes.RECEIVED_CHANNEL,
                data: channel,
            },
            {
                type: ChannelTypes.RECEIVED_MY_CHANNEL_MEMBER,
                data: member,
            },
        ]), getState);
        dispatch(loadRolesIfNeeded(member.roles.split(' ')));

        return {data: {channel, member}};
    };
}

export function getChannelTimezones(channelId: string): ActionFunc {
    return async (dispatch, getState) => {
        let channelTimezones;
        try {
            const channelTimezonesRequest = Client4.getChannelTimezones(channelId);

            channelTimezones = await channelTimezonesRequest;
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch, getState);
            dispatch(logError(error));
            return {error};
        }

        return {data: channelTimezones};
    };
}

export function fetchMyChannelsAndMembers(teamId: string): ActionFunc {
    return async (dispatch, getState) => {
        dispatch({
            type: ChannelTypes.CHANNELS_REQUEST,
            data: null,
        });

        let channels;
        let channelMembers;
        try {
            const channelRequest = Client4.getMyChannels(teamId);
            const memberRequest = Client4.getMyChannelMembers(teamId);
            channels = await channelRequest;
            channelMembers = await memberRequest;
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch, getState);
            dispatch(batchActions([
                {type: ChannelTypes.CHANNELS_FAILURE, error},
                logError(error),
            ]), getState);
            return {error};
        }

        const {currentUserId} = getState().entities.users;

        dispatch(batchActions([
            {
                type: ChannelTypes.RECEIVED_CHANNELS,
                teamId,
                data: channels,
            },
            {
                type: ChannelTypes.CHANNELS_SUCCESS,
            },
            {
                type: ChannelTypes.RECEIVED_MY_CHANNEL_MEMBERS,
                data: channelMembers,
                remove: getChannelsIdForTeam(getState(), teamId),
                currentUserId,
            },
        ]), getState);
        const roles = new Set();
        for (const member of channelMembers) {
            for (const role of member.roles.split(' ')) {
                roles.add(role);
            }
        }
        if (roles.size > 0) {
            dispatch(loadRolesIfNeeded(roles));
        }

        return {data: {channels, members: channelMembers}};
    };
}

export function getMyChannelMembers(teamId: string): ActionFunc {
    return async (dispatch, getState) => {
        let channelMembers;
        try {
            const channelMembersRequest = Client4.getMyChannelMembers(teamId);

            channelMembers = await channelMembersRequest;
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch, getState);
            dispatch(logError(error));
            return {error};
        }

        const {currentUserId} = getState().entities.users;

        dispatch({
            type: ChannelTypes.RECEIVED_MY_CHANNEL_MEMBERS,
            data: channelMembers,
            remove: getChannelsIdForTeam(getState(), teamId),
            currentUserId,
        });

        const roles = new Set();
        for (const member of channelMembers) {
            for (const role of member.roles.split(' ')) {
                roles.add(role);
            }
        }
        if (roles.size > 0) {
            dispatch(loadRolesIfNeeded(roles));
        }

        return {data: channelMembers};
    };
}

export function getChannelMembers(channelId: string, page: number = 0, perPage: number = General.CHANNELS_CHUNK_SIZE): ActionFunc {
    return async (dispatch, getState) => {
        let channelMembers;
        try {
            const channelMembersRequest = Client4.getChannelMembers(channelId, page, perPage);

            channelMembers = await channelMembersRequest;
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch, getState);
            dispatch(logError(error));
            return {error};
        }

        const userIds = channelMembers.map((cm) => cm.user_id);
        getMissingProfilesByIds(userIds)(dispatch, getState);

        dispatch({
            type: ChannelTypes.RECEIVED_CHANNEL_MEMBERS,
            data: channelMembers,
        });

        return {data: channelMembers};
    };
}

export function leaveChannel(channelId: string): ActionFunc {
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
                type: channel.type,
            },
            meta: {
                offline: {
                    effect: () => Client4.removeFromChannel(currentUserId, channelId),
                    commit: {type: 'do_nothing'}, // redux-offline always needs to dispatch something on commit
                    rollback: () => {
                        dispatch(batchActions([
                            {
                                type: ChannelTypes.RECEIVED_CHANNEL,
                                data: channel,
                            },
                            {
                                type: ChannelTypes.RECEIVED_MY_CHANNEL_MEMBER,
                                data: member,
                            },
                        ]));
                    },
                },
            },
        });

        return {data: true};
    };
}

export function joinChannel(userId: string, teamId: string, channelId: string, channelName: string): ActionFunc {
    return async (dispatch, getState) => {
        let member: ?ChannelMembership;
        let channel;
        try {
            if (channelId) {
                member = await Client4.addToChannel(userId, channelId);
                channel = await Client4.getChannel(channelId);
            } else if (channelName) {
                channel = await Client4.getChannelByName(teamId, channelName, true);
                if ((channel.type === General.GM_CHANNEL) || (channel.type === General.DM_CHANNEL)) {
                    member = await Client4.getChannelMember(channel.id, userId);
                } else {
                    member = await Client4.addToChannel(userId, channel.id);
                }
            }
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch, getState);
            dispatch(logError(error));
            return {error};
        }

        Client4.trackEvent('action', 'action_channels_join', {channel_id: channelId});

        dispatch(batchActions([
            {
                type: ChannelTypes.RECEIVED_CHANNEL,
                data: channel,
            },
            {
                type: ChannelTypes.RECEIVED_MY_CHANNEL_MEMBER,
                data: member,
            },
        ]), getState);
        if (member) {
            dispatch(loadRolesIfNeeded(member.roles.split(' ')));
        }

        return {data: {channel, member}};
    };
}

export function deleteChannel(channelId: string): ActionFunc {
    return async (dispatch, getState) => {
        let state = getState();
        const viewArchivedChannels = state.entities.general.config.ExperimentalViewArchivedChannels === 'true';

        try {
            await Client4.deleteChannel(channelId);
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch, getState);
            dispatch(logError(error));
            return {error};
        }

        state = getState();
        const {currentChannelId} = state.entities.channels;
        if (channelId === currentChannelId && !viewArchivedChannels) {
            const teamId = getCurrentTeamId(state);
            const channelsInTeam = getChannelsNameMapInTeam(state, teamId);
            const channel = getChannelByName(channelsInTeam, getRedirectChannelNameForTeam(state, teamId));
            if (channel && channel.id) {
                dispatch({type: ChannelTypes.SELECT_CHANNEL, data: channel.id}, getState);
            }
        }

        dispatch({type: ChannelTypes.DELETE_CHANNEL_SUCCESS, data: {id: channelId, viewArchivedChannels}}, getState);

        return {data: true};
    };
}

export function viewChannel(channelId: string, prevChannelId: string = ''): ActionFunc {
    return async (dispatch, getState) => {
        const {currentUserId} = getState().entities.users;

        const {myPreferences} = getState().entities.preferences;
        const viewTimePref = myPreferences[`${Preferences.CATEGORY_CHANNEL_APPROXIMATE_VIEW_TIME}--${channelId}`];
        const viewTime = viewTimePref ? parseInt(viewTimePref.value, 10) : 0;
        if (viewTime < new Date().getTime() - (3 * 60 * 60 * 1000)) {
            const preferences = [
                {user_id: currentUserId, category: Preferences.CATEGORY_CHANNEL_APPROXIMATE_VIEW_TIME, name: channelId, value: new Date().getTime().toString()},
            ];
            savePreferences(currentUserId, preferences)(dispatch);
        }

        try {
            await Client4.viewMyChannel(channelId, prevChannelId);
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch, getState);
            dispatch(logError(error));

            return {error};
        }

        const actions = [];

        const {myMembers} = getState().entities.channels;
        const member = myMembers[channelId];
        if (member) {
            actions.push({
                type: ChannelTypes.RECEIVED_MY_CHANNEL_MEMBER,
                data: {...member, last_viewed_at: new Date().getTime()},
            });
            dispatch(loadRolesIfNeeded(member.roles.split(' ')));
        }

        const prevMember = myMembers[prevChannelId];
        if (prevMember) {
            actions.push({
                type: ChannelTypes.RECEIVED_MY_CHANNEL_MEMBER,
                data: {...prevMember, last_viewed_at: new Date().getTime()},
            });
            dispatch(loadRolesIfNeeded(prevMember.roles.split(' ')));
        }

        dispatch(batchActions(actions), getState);

        return {data: true};
    };
}

export function markChannelAsViewed(channelId: string, prevChannelId: string = ''): ActionFunc {
    return async (dispatch, getState) => {
        const actions = [];

        const {myMembers} = getState().entities.channels;
        const member = myMembers[channelId];
        if (member) {
            actions.push({
                type: ChannelTypes.RECEIVED_MY_CHANNEL_MEMBER,
                data: {...member, last_viewed_at: Date.now()},
            });
            dispatch(loadRolesIfNeeded(member.roles.split(' ')));
        }

        const prevMember = myMembers[prevChannelId];
        if (prevMember) {
            actions.push({
                type: ChannelTypes.RECEIVED_MY_CHANNEL_MEMBER,
                data: {...prevMember, last_viewed_at: Date.now()},
            });
            dispatch(loadRolesIfNeeded(prevMember.roles.split(' ')));
        }

        if (actions.length) {
            dispatch(batchActions(actions), getState);
        }

        return {data: true};
    };
}

export function getChannels(teamId: string, page: number = 0, perPage: number = General.CHANNELS_CHUNK_SIZE): ActionFunc {
    return async (dispatch, getState) => {
        dispatch({type: ChannelTypes.GET_CHANNELS_REQUEST, data: null}, getState);

        let channels;
        try {
            channels = await Client4.getChannels(teamId, page, perPage);
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch, getState);
            dispatch(batchActions([
                {type: ChannelTypes.GET_CHANNELS_FAILURE, error},
                logError(error),
            ]), getState);
            return {error};
        }

        dispatch(batchActions([
            {
                type: ChannelTypes.RECEIVED_CHANNELS,
                teamId,
                data: channels,
            },
            {
                type: ChannelTypes.GET_CHANNELS_SUCCESS,
            },
        ]), getState);

        return {data: channels};
    };
}

export function getAllChannels(page: number = 0, perPage: number = General.CHANNELS_CHUNK_SIZE, notAssociatedToGroup: string = '', excludeDefaultChannels: boolean = false): ActionFunc {
    return async (dispatch, getState) => {
        dispatch({type: ChannelTypes.GET_ALL_CHANNELS_REQUEST, data: null}, getState);

        let channels;
        try {
            channels = await Client4.getAllChannels(page, perPage, notAssociatedToGroup, excludeDefaultChannels);
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch, getState);
            dispatch(batchActions([
                {type: ChannelTypes.GET_ALL_CHANNELS_FAILURE, error},
                logError(error),
            ]), getState);
            return {error};
        }

        dispatch(batchActions([
            {
                type: ChannelTypes.RECEIVED_ALL_CHANNELS,
                data: channels,
            },
            {
                type: ChannelTypes.GET_ALL_CHANNELS_SUCCESS,
            },
        ]), getState);

        return {data: channels};
    };
}

export function autocompleteChannels(teamId: string, term: string): ActionFunc {
    return async (dispatch, getState) => {
        dispatch({type: ChannelTypes.GET_CHANNELS_REQUEST, data: null}, getState);

        let channels;
        try {
            channels = await Client4.autocompleteChannels(teamId, term);
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch, getState);
            dispatch(batchActions([
                {type: ChannelTypes.GET_CHANNELS_FAILURE, error},
                logError(error),
            ]), getState);
            return {error};
        }

        dispatch(batchActions([
            {
                type: ChannelTypes.RECEIVED_CHANNELS,
                teamId,
                data: channels,
            },
            {
                type: ChannelTypes.GET_CHANNELS_SUCCESS,
            },
        ]), getState);

        return {data: channels};
    };
}

export function autocompleteChannelsForSearch(teamId: string, term: string): ActionFunc {
    return async (dispatch, getState) => {
        dispatch({type: ChannelTypes.GET_CHANNELS_REQUEST, data: null}, getState);

        let channels;
        try {
            channels = await Client4.autocompleteChannelsForSearch(teamId, term);
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch, getState);
            dispatch(batchActions([
                {type: ChannelTypes.GET_CHANNELS_FAILURE, error},
                logError(error),
            ]), getState);
            return {error};
        }

        dispatch(batchActions([
            {
                type: ChannelTypes.RECEIVED_CHANNELS,
                teamId,
                data: channels,
            },
            {
                type: ChannelTypes.GET_CHANNELS_SUCCESS,
            },
        ]), getState);

        return {data: channels};
    };
}

export function searchChannels(teamId: string, term: string): ActionFunc {
    return async (dispatch, getState) => {
        dispatch({type: ChannelTypes.GET_CHANNELS_REQUEST, data: null}, getState);

        let channels;
        try {
            channels = await Client4.searchChannels(teamId, term);
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch, getState);
            dispatch(batchActions([
                {type: ChannelTypes.GET_CHANNELS_FAILURE, error},
                logError(error),
            ]), getState);
            return {error};
        }

        dispatch(batchActions([
            {
                type: ChannelTypes.RECEIVED_CHANNELS,
                teamId,
                data: channels,
            },
            {
                type: ChannelTypes.GET_CHANNELS_SUCCESS,
            },
        ]), getState);

        return {data: channels};
    };
}

export function searchAllChannels(term: string, notAssociatedToGroup: string = '', excludeDefaultChannels: boolean = false): ActionFunc {
    return async (dispatch, getState) => {
        dispatch({type: ChannelTypes.GET_ALL_CHANNELS_REQUEST, data: null}, getState);

        let channels;
        try {
            channels = await Client4.searchAllChannels(term, notAssociatedToGroup, excludeDefaultChannels);
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch, getState);
            dispatch(batchActions([
                {type: ChannelTypes.GET_ALL_CHANNELS_FAILURE, error},
                logError(error),
            ]), getState);
            return {error};
        }

        dispatch(batchActions([
            {
                type: ChannelTypes.RECEIVED_ALL_CHANNELS,
                data: channels,
            },
            {
                type: ChannelTypes.GET_ALL_CHANNELS_SUCCESS,
            },
        ]), getState);

        return {data: channels};
    };
}

export function getChannelStats(channelId: string): ActionFunc {
    return async (dispatch, getState) => {
        let stat;
        try {
            stat = await Client4.getChannelStats(channelId);
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch, getState);
            dispatch(logError(error));
            return {error};
        }

        dispatch({
            type: ChannelTypes.RECEIVED_CHANNEL_STATS,
            data: stat,
        });

        return {data: stat};
    };
}

export function addChannelMember(channelId: string, userId: string, postRootId: string = ''): ActionFunc {
    return async (dispatch, getState) => {
        let member;
        try {
            member = await Client4.addToChannel(userId, channelId, postRootId);
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch, getState);
            dispatch(logError(error));
            return {error};
        }

        Client4.trackEvent('action', 'action_channels_add_member', {channel_id: channelId});

        dispatch(batchActions([
            {
                type: UserTypes.RECEIVED_PROFILE_IN_CHANNEL,
                data: {id: channelId, user_id: userId},
            },
            {
                type: ChannelTypes.RECEIVED_CHANNEL_MEMBER,
                data: member,
            },
            {
                type: ChannelTypes.ADD_CHANNEL_MEMBER_SUCCESS,
                id: channelId,
            },
        ], 'ADD_CHANNEL_MEMBER.BATCH'), getState);

        return {data: member};
    };
}

export function removeChannelMember(channelId: string, userId: string): ActionFunc {
    return async (dispatch, getState) => {
        try {
            await Client4.removeFromChannel(userId, channelId);
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch, getState);
            dispatch(logError(error));
            return {error};
        }

        Client4.trackEvent('action', 'action_channels_remove_member', {channel_id: channelId});

        dispatch(batchActions([
            {
                type: UserTypes.RECEIVED_PROFILE_NOT_IN_CHANNEL,
                data: {id: channelId, user_id: userId},
            },
            {
                type: ChannelTypes.REMOVE_CHANNEL_MEMBER_SUCCESS,
                id: channelId,
            },
        ], 'REMOVE_CHANNEL_MEMBER.BATCH'), getState);

        return {data: true};
    };
}

export function updateChannelMemberRoles(channelId: string, userId: string, roles: string): ActionFunc {
    return async (dispatch, getState) => {
        try {
            await Client4.updateChannelMemberRoles(channelId, userId, roles);
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch, getState);
            dispatch(logError(error));
            return {error};
        }

        const membersInChannel = getState().entities.channels.membersInChannel[channelId];
        if (membersInChannel && membersInChannel[userId]) {
            dispatch({
                type: ChannelTypes.RECEIVED_CHANNEL_MEMBER,
                data: {...membersInChannel[userId], roles},
            });
        }

        return {data: true};
    };
}

export function updateChannelHeader(channelId: string, header: string): ActionFunc {
    return async (dispatch, getState) => {
        Client4.trackEvent('action', 'action_channels_update_header', {channel_id: channelId});

        dispatch({
            type: ChannelTypes.UPDATE_CHANNEL_HEADER,
            data: {
                channelId,
                header,
            },
        }, getState);

        return {data: true};
    };
}

export function updateChannelPurpose(channelId: string, purpose: string): ActionFunc {
    return async (dispatch, getState) => {
        Client4.trackEvent('action', 'action_channels_update_purpose', {channel_id: channelId});

        dispatch({
            type: ChannelTypes.UPDATE_CHANNEL_PURPOSE,
            data: {
                channelId,
                purpose,
            },
        }, getState);

        return {data: true};
    };
}

export function markChannelAsRead(channelId: string, prevChannelId: string, updateLastViewedAt: boolean = true): ActionFunc {
    return async (dispatch, getState) => {
        // Send channel last viewed at to the server
        if (updateLastViewedAt) {
            Client4.viewMyChannel(channelId, prevChannelId).then().catch((error) => {
                forceLogoutIfNecessary(error, dispatch, getState);
                dispatch(logError(error));
                return {error};
            });
        }

        const state = getState();
        const {channels, myMembers} = state.entities.channels;

        // Update channel member objects to set all mentions and posts as viewed
        const channel = channels[channelId];
        const prevChannel = channels[prevChannelId]; // May be null since prevChannelId is optional

        // Update team member objects to set mentions and posts in channel as viewed
        const channelMember = myMembers[channelId];
        const prevChannelMember = myMembers[prevChannelId]; // May also be null

        const actions = [];

        if (channel && channelMember) {
            actions.push({
                type: ChannelTypes.DECREMENT_UNREAD_MSG_COUNT,
                data: {
                    teamId: channel.team_id,
                    channelId,
                    amount: channel.total_msg_count - channelMember.msg_count,
                },
            });

            actions.push({
                type: ChannelTypes.DECREMENT_UNREAD_MENTION_COUNT,
                data: {
                    teamId: channel.team_id,
                    channelId,
                    amount: channelMember.mention_count,
                },
            });
        }

        if (prevChannel && prevChannelMember) {
            actions.push({
                type: ChannelTypes.DECREMENT_UNREAD_MSG_COUNT,
                data: {
                    teamId: prevChannel.team_id,
                    channelId: prevChannelId,
                    amount: prevChannel.total_msg_count - prevChannelMember.msg_count,
                },
            });

            actions.push({
                type: ChannelTypes.DECREMENT_UNREAD_MENTION_COUNT,
                data: {
                    teamId: prevChannel.team_id,
                    channelId: prevChannelId,
                    amount: prevChannelMember.mention_count,
                },
            });
        }

        if (actions.length > 0) {
            dispatch(batchActions(actions), getState);
        }

        return {data: true};
    };
}

// Increments the number of posts in the channel by 1 and marks it as unread if necessary
export function markChannelAsUnread(teamId: string, channelId: string, mentions: Array<string>): ActionFunc {
    return async (dispatch, getState) => {
        const state = getState();
        const {myMembers} = state.entities.channels;
        const {currentUserId} = state.entities.users;

        const actions = [{
            type: ChannelTypes.INCREMENT_TOTAL_MSG_COUNT,
            data: {
                channelId,
                amount: 1,
            },
        }, {
            type: ChannelTypes.INCREMENT_UNREAD_MSG_COUNT,
            data: {
                teamId,
                channelId,
                amount: 1,
                onlyMentions: myMembers[channelId] && myMembers[channelId].notify_props &&
                    myMembers[channelId].notify_props.mark_unread === General.MENTION,
            },
        }];

        if (mentions && mentions.indexOf(currentUserId) !== -1) {
            actions.push({
                type: ChannelTypes.INCREMENT_UNREAD_MENTION_COUNT,
                data: {
                    teamId,
                    channelId,
                    amount: 1,
                },
            });
        }

        dispatch(batchActions(actions), getState);

        return {data: true};
    };
}

export function getChannelMembersByIds(channelId: string, userIds: Array<string>) {
    return bindClientFunc({
        clientFunc: Client4.getChannelMembersByIds,
        onSuccess: ChannelTypes.RECEIVED_CHANNEL_MEMBERS,
        params: [
            channelId,
            userIds,
        ],
    });
}

export function getChannelMember(channelId: string, userId: string) {
    return bindClientFunc({
        clientFunc: Client4.getChannelMember,
        onSuccess: ChannelTypes.RECEIVED_CHANNEL_MEMBER,
        params: [
            channelId,
            userId,
        ],
    });
}

export function getMyChannelMember(channelId: string) {
    return bindClientFunc({
        clientFunc: Client4.getMyChannelMember,
        onSuccess: ChannelTypes.RECEIVED_MY_CHANNEL_MEMBER,
        params: [
            channelId,
        ],
    });
}

export function favoriteChannel(channelId: string): ActionFunc {
    return async (dispatch, getState) => {
        const {currentUserId} = getState().entities.users;
        const preference: PreferenceType = {
            user_id: currentUserId,
            category: Preferences.CATEGORY_FAVORITE_CHANNEL,
            name: channelId,
            value: 'true',
        };

        Client4.trackEvent('action', 'action_channels_favorite');

        return savePreferences(currentUserId, [preference])(dispatch);
    };
}

export function unfavoriteChannel(channelId: string): ActionFunc {
    return async (dispatch, getState) => {
        const {currentUserId} = getState().entities.users;
        const preference: PreferenceType = {
            user_id: currentUserId,
            category: Preferences.CATEGORY_FAVORITE_CHANNEL,
            name: channelId,
            value: '',
        };

        Client4.trackEvent('action', 'action_channels_unfavorite');

        return deletePreferences(currentUserId, [preference])(dispatch, getState);
    };
}

export function updateChannelScheme(channelId: string, schemeId: string) {
    return bindClientFunc({
        clientFunc: async () => {
            await Client4.updateChannelScheme(channelId, schemeId);
            return {channelId, schemeId};
        },
        onSuccess: ChannelTypes.UPDATED_CHANNEL_SCHEME,
    });
}

export function updateChannelMemberSchemeRoles(channelId: string, userId: string, isSchemeUser: boolean, isSchemeAdmin: boolean) {
    return bindClientFunc({
        clientFunc: async () => {
            await Client4.updateChannelMemberSchemeRoles(channelId, userId, isSchemeUser, isSchemeAdmin);
            return {channelId, userId, isSchemeUser, isSchemeAdmin};
        },
        onSuccess: ChannelTypes.UPDATED_CHANNEL_MEMBER_SCHEME_ROLES,
    });
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
    getChannelTimezones,
    getChannelMembersByIds,
    leaveChannel,
    joinChannel,
    deleteChannel,
    viewChannel,
    markChannelAsViewed,
    getChannels,
    autocompleteChannels,
    autocompleteChannelsForSearch,
    searchChannels,
    getChannelStats,
    addChannelMember,
    removeChannelMember,
    updateChannelHeader,
    updateChannelPurpose,
    markChannelAsRead,
    markChannelAsUnread,
    favoriteChannel,
    unfavoriteChannel,
};
