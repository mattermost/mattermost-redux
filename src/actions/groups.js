// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
// @flow

import {GroupTypes} from 'action_types';
import {General, Groups} from 'constants';

import {Client4} from 'client';

import {logError} from './errors';
import {bindClientFunc, forceLogoutIfNecessary} from './helpers';
import {batchActions} from 'redux-batched-actions';

import type {ActionFunc} from '../types/actions';
import type {SyncableType, SyncablePatch} from '../types/groups';

export function linkGroupSyncable(groupID: string, syncableID: string, syncableType: SyncableType, patch: SyncablePatch): ActionFunc {
    return async (dispatch, getState) => {
        dispatch({type: GroupTypes.LINK_GROUP_SYNCABLE_REQUEST, data: {groupID, syncableID}});

        let data;
        try {
            data = await Client4.linkGroupSyncable(groupID, syncableID, syncableType, patch);
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch, getState);
            dispatch(batchActions([
                {type: GroupTypes.LINK_GROUP_SYNCABLE_FAILURE, error, data: {groupID, syncableID}},
                logError(error),
            ]));
            return {error};
        }

        let type;
        switch (syncableType) {
        case Groups.SYNCABLE_TYPE_TEAM:
            type = GroupTypes.LINKED_GROUP_TEAM;
            break;
        case Groups.SYNCABLE_TYPE_CHANNEL:
            type = GroupTypes.LINKED_GROUP_CHANNEL;
            break;
        default:
            console.warn(`unhandled syncable type ${syncableType}`); // eslint-disable-line no-console
        }

        dispatch(batchActions([
            {type: GroupTypes.LINK_GROUP_SYNCABLE_SUCCESS, data: null},
            {type, data},
        ]));

        return {data: true};
    };
}

export function unlinkGroupSyncable(groupID: string, syncableID: string, syncableType: SyncableType): ActionFunc {
    return async (dispatch, getState) => {
        dispatch({type: GroupTypes.UNLINK_GROUP_SYNCABLE_REQUEST, data: {groupID, syncableID}});

        try {
            await Client4.unlinkGroupSyncable(groupID, syncableID, syncableType);
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch, getState);
            dispatch(batchActions([
                {type: GroupTypes.UNLINK_GROUP_SYNCABLE_FAILURE, error, data: {groupID, syncableID}},
                logError(error),
            ]));
            return {error};
        }

        let type;
        const data = {group_id: groupID, syncable_id: syncableID};
        switch (syncableType) {
        case Groups.SYNCABLE_TYPE_TEAM:
            type = GroupTypes.UNLINKED_GROUP_TEAM;
            data.syncable_id = syncableID;
            break;
        case Groups.SYNCABLE_TYPE_CHANNEL:
            type = GroupTypes.UNLINKED_GROUP_CHANNEL;
            data.syncable_id = syncableID;
            break;
        default:
            console.warn(`unhandled syncable type ${syncableType}`); // eslint-disable-line no-console
        }

        dispatch(batchActions([
            {type: GroupTypes.UNLINK_GROUP_SYNCABLE_SUCCESS, data: null},
            {type, data},
        ]));

        return {data: true};
    };
}

export function getGroupSyncables(groupID: string, syncableType: SyncableType): ActionFunc {
    return async (dispatch, getState) => {
        dispatch({type: GroupTypes.GET_GROUP_SYNCABLES_REQUEST, data: {groupID}});

        let data;
        try {
            data = await Client4.getGroupSyncables(groupID, syncableType);
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch, getState);
            dispatch(batchActions([
                {type: GroupTypes.GET_GROUP_SYNCABLES_FAILURE, error, data: {groupID}},
                logError(error),
            ]));
            return {error};
        }

        let type;
        switch (syncableType) {
        case Groups.SYNCABLE_TYPE_TEAM:
            type = GroupTypes.RECEIVED_GROUP_TEAMS;
            break;
        case Groups.SYNCABLE_TYPE_CHANNEL:
            type = GroupTypes.RECEIVED_GROUP_CHANNELS;
            break;
        default:
            console.warn(`unhandled syncable type ${syncableType}`); // eslint-disable-line no-console
        }

        dispatch(batchActions([
            {type: GroupTypes.GET_GROUP_SYNCABLES_SUCCESS, data: null},
            {type, data, group_id: groupID},
        ]));

        return {data: true};
    };
}

export function getGroupMembers(groupID: string, page: number = 0, perPage: number = General.PAGE_SIZE_DEFAULT): ActionFunc {
    return async (dispatch, getState) => {
        dispatch({type: GroupTypes.GET_GROUP_MEMBERS_REQUEST, data: {groupID, page, perPage}});

        let data;
        try {
            data = await Client4.getGroupMembers(groupID, page, perPage);
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch, getState);
            dispatch(batchActions([
                {type: GroupTypes.GET_GROUP_MEMBERS_FAILURE, error, data: {groupID, page, perPage}},
                logError(error),
            ]));
            return {error};
        }

        dispatch(batchActions([
            {type: GroupTypes.GET_GROUP_MEMBERS_SUCCESS, data: null},
            {type: GroupTypes.RECEIVED_GROUP_MEMBERS, group_id: groupID, data},
        ]));

        return {data: true};
    };
}

export function getGroup(id: string): ActionFunc {
    return bindClientFunc({
        clientFunc: Client4.getGroup,
        onRequest: GroupTypes.GET_GROUP_REQUEST,
        onSuccess: [GroupTypes.RECEIVED_GROUP, GroupTypes.GET_GROUP_SUCCESS],
        onFailure: GroupTypes.GET_GROUP_FAILURE,
        params: [
            id,
        ],
    });
}
