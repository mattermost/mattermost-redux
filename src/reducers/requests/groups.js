// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
// @flow

import {combineReducers} from 'redux';
import {GroupTypes} from 'action_types';

import {handleRequest, initialRequestState} from './helpers';

import type {GenericAction} from '../../types/actions';
import type {RequestStatusType, GroupsRequestsStatuses} from '../../types/requests';

function linkGroupSyncable(state: RequestStatusType = initialRequestState(), action: GenericAction): RequestStatusType {
    return handleRequest(
        GroupTypes.LINK_GROUP_SYNCABLE_REQUEST,
        GroupTypes.LINK_GROUP_SYNCABLE_SUCCESS,
        GroupTypes.LINK_GROUP_SYNCABLE_FAILURE,
        state,
        action
    );
}

function unlinkGroupSyncable(state: RequestStatusType = initialRequestState(), action: GenericAction): RequestStatusType {
    return handleRequest(
        GroupTypes.UNLINK_GROUP_SYNCABLE_REQUEST,
        GroupTypes.UNLINK_GROUP_SYNCABLE_SUCCESS,
        GroupTypes.UNLINK_GROUP_SYNCABLE_FAILURE,
        state,
        action
    );
}

function getGroupSyncables(state: RequestStatusType = initialRequestState(), action: GenericAction): RequestStatusType {
    return handleRequest(
        GroupTypes.GET_GROUP_SYNCABLES_REQUEST,
        GroupTypes.GET_GROUP_SYNCABLES_SUCCESS,
        GroupTypes.GET_GROUP_SYNCABLES_FAILURE,
        state,
        action
    );
}

function getGroupMembers(state: RequestStatusType = initialRequestState(), action: GenericAction): RequestStatusType {
    return handleRequest(
        GroupTypes.GET_GROUP_MEMBERS_REQUEST,
        GroupTypes.GET_GROUP_MEMBERS_SUCCESS,
        GroupTypes.GET_GROUP_MEMBERS_FAILURE,
        state,
        action
    );
}

function getGroup(state: RequestStatusType = initialRequestState(), action: GenericAction): RequestStatusType {
    return handleRequest(
        GroupTypes.GET_GROUP_REQUEST,
        GroupTypes.GET_GROUP_SUCCESS,
        GroupTypes.GET_GROUP_FAILURE,
        state,
        action
    );
}

export default (combineReducers({
    linkGroupSyncable,
    unlinkGroupSyncable,
    getGroupSyncables,
    getGroupMembers,
    getGroup,
}): (GroupsRequestsStatuses, GenericAction) => GroupsRequestsStatuses);

