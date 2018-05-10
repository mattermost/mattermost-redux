// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
// @flow

import {combineReducers} from 'redux';
import {ChannelTypes} from 'action_types';

import {handleRequest, initialRequestState} from './helpers';

import type {GenericAction} from '../../types/actions';
import type {RequestStatusType} from '../../types/requests';

function getChannel(state: RequestStatusType = initialRequestState(), action: GenericAction): RequestStatusType {
    return handleRequest(
        ChannelTypes.CHANNEL_REQUEST,
        ChannelTypes.CHANNEL_SUCCESS,
        ChannelTypes.CHANNEL_FAILURE,
        state,
        action
    );
}

function myChannels(state: RequestStatusType = initialRequestState(), action: GenericAction): RequestStatusType {
    return handleRequest(
        ChannelTypes.CHANNELS_REQUEST,
        ChannelTypes.CHANNELS_SUCCESS,
        ChannelTypes.CHANNELS_FAILURE,
        state,
        action
    );
}

function myMembers(state: RequestStatusType = initialRequestState(), action: GenericAction): RequestStatusType {
    return handleRequest(
        ChannelTypes.CHANNEL_MY_MEMBERS_REQUEST,
        ChannelTypes.CHANNEL_MY_MEMBERS_SUCCESS,
        ChannelTypes.CHANNEL_MY_MEMBERS_FAILURE,
        state,
        action
    );
}

function members(state: RequestStatusType = initialRequestState(), action: GenericAction): RequestStatusType {
    return handleRequest(
        ChannelTypes.CHANNEL_MEMBERS_REQUEST,
        ChannelTypes.CHANNEL_MEMBERS_SUCCESS,
        ChannelTypes.CHANNEL_MEMBERS_FAILURE,
        state,
        action
    );
}

function createChannel(state: RequestStatusType = initialRequestState(), action: GenericAction): RequestStatusType {
    return handleRequest(
        ChannelTypes.CREATE_CHANNEL_REQUEST,
        ChannelTypes.CREATE_CHANNEL_SUCCESS,
        ChannelTypes.CREATE_CHANNEL_FAILURE,
        state,
        action
    );
}

function updateChannel(state: RequestStatusType = initialRequestState(), action: GenericAction): RequestStatusType {
    return handleRequest(
        ChannelTypes.UPDATE_CHANNEL_REQUEST,
        ChannelTypes.UPDATE_CHANNEL_SUCCESS,
        ChannelTypes.UPDATE_CHANNEL_FAILURE,
        state,
        action
    );
}

function updateChannelNotifyProps(state: RequestStatusType = initialRequestState(), action: GenericAction): RequestStatusType {
    return handleRequest(
        ChannelTypes.NOTIFY_PROPS_REQUEST,
        ChannelTypes.NOTIFY_PROPS_SUCCESS,
        ChannelTypes.NOTIFY_PROPS_FAILURE,
        state,
        action
    );
}

function joinChannel(state: RequestStatusType = initialRequestState(), action: GenericAction): RequestStatusType {
    return handleRequest(
        ChannelTypes.JOIN_CHANNEL_REQUEST,
        ChannelTypes.JOIN_CHANNEL_SUCCESS,
        ChannelTypes.JOIN_CHANNEL_FAILURE,
        state,
        action
    );
}

function deleteChannel(state: RequestStatusType = initialRequestState(), action: GenericAction): RequestStatusType {
    return handleRequest(
        ChannelTypes.DELETE_CHANNEL_REQUEST,
        ChannelTypes.DELETE_CHANNEL_SUCCESS,
        ChannelTypes.DELETE_CHANNEL_FAILURE,
        state,
        action
    );
}

function updateLastViewedAt(state: RequestStatusType = initialRequestState(), action: GenericAction): RequestStatusType {
    return handleRequest(
        ChannelTypes.UPDATE_LAST_VIEWED_REQUEST,
        ChannelTypes.UPDATE_LAST_VIEWED_SUCCESS,
        ChannelTypes.UPDATE_LAST_VIEWED_FAILURE,
        state,
        action
    );
}

function getChannels(state: RequestStatusType = initialRequestState(), action: GenericAction): RequestStatusType {
    return handleRequest(
        ChannelTypes.GET_CHANNELS_REQUEST,
        ChannelTypes.GET_CHANNELS_SUCCESS,
        ChannelTypes.GET_CHANNELS_FAILURE,
        state,
        action
    );
}

function getChannelStats(state: RequestStatusType = initialRequestState(), action: GenericAction): RequestStatusType {
    return handleRequest(
        ChannelTypes.CHANNEL_STATS_REQUEST,
        ChannelTypes.CHANNEL_STATS_SUCCESS,
        ChannelTypes.CHANNEL_STATS_FAILURE,
        state,
        action
    );
}

function addChannelMember(state: RequestStatusType = initialRequestState(), action: GenericAction): RequestStatusType {
    return handleRequest(
        ChannelTypes.ADD_CHANNEL_MEMBER_REQUEST,
        ChannelTypes.ADD_CHANNEL_MEMBER_SUCCESS,
        ChannelTypes.ADD_CHANNEL_MEMBER_FAILURE,
        state,
        action
    );
}

function removeChannelMember(state: RequestStatusType = initialRequestState(), action: GenericAction): RequestStatusType {
    return handleRequest(
        ChannelTypes.REMOVE_CHANNEL_MEMBER_REQUEST,
        ChannelTypes.REMOVE_CHANNEL_MEMBER_SUCCESS,
        ChannelTypes.REMOVE_CHANNEL_MEMBER_FAILURE,
        state,
        action
    );
}

function updateChannelMember(state: RequestStatusType = initialRequestState(), action: GenericAction): RequestStatusType {
    return handleRequest(
        ChannelTypes.UPDATE_CHANNEL_MEMBER_REQUEST,
        ChannelTypes.UPDATE_CHANNEL_MEMBER_SUCCESS,
        ChannelTypes.UPDATE_CHANNEL_MEMBER_FAILURE,
        state,
        action
    );
}

export default combineReducers({
    getChannel,
    getChannels,
    myMembers,
    members,
    myChannels,
    createChannel,
    updateChannel,
    updateChannelNotifyProps,
    joinChannel,
    deleteChannel,
    updateLastViewedAt,
    getChannelStats,
    addChannelMember,
    removeChannelMember,
    updateChannelMember,
});
