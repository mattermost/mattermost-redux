// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
// @flow
import {Client4} from 'client';
import {RoleTypes} from 'action_types';

import {getRoles} from 'selectors/entities/roles';
import {hasNewPermissions} from 'selectors/entities/general';

import {bindClientFunc} from './helpers';
import type {DispatchFunc, GetStateFunc, ActionFunc} from 'types/actions';
import type {Role} from 'types/roles';

export function getRolesByNames(rolesNames: Array<string>) {
    return bindClientFunc({
        clientFunc: Client4.getRolesByNames,
        onRequest: RoleTypes.ROLES_BY_NAMES_REQUEST,
        onSuccess: [RoleTypes.RECEIVED_ROLES, RoleTypes.ROLES_BY_NAMES_SUCCESS],
        onFailure: RoleTypes.ROLES_BY_NAMES_FAILURE,
        params: [
            rolesNames,
        ],
    });
}

export function getRoleByName(roleName: string) {
    return bindClientFunc({
        clientFunc: Client4.getRoleByName,
        onRequest: RoleTypes.ROLE_BY_NAME_REQUEST,
        onSuccess: [RoleTypes.RECEIVED_ROLE, RoleTypes.ROLE_BY_NAME_SUCCESS],
        onFailure: RoleTypes.ROLE_BY_NAME_FAILURE,
        params: [
            roleName,
        ],
    });
}

export function getRole(roleId: string) {
    return bindClientFunc({
        clientFunc: Client4.getRole,
        onRequest: RoleTypes.ROLE_BY_ID_REQUEST,
        onSuccess: [RoleTypes.RECEIVED_ROLE, RoleTypes.ROLE_BY_ID_SUCCESS],
        onFailure: RoleTypes.ROLE_BY_ID_FAILURE,
        params: [
            roleId,
        ],
    });
}

export function editRole(role: Role) {
    return bindClientFunc({
        clientFunc: Client4.patchRole,
        onRequest: RoleTypes.EDIT_ROLE_REQUEST,
        onSuccess: [RoleTypes.RECEIVED_ROLE, RoleTypes.EDIT_ROLE_SUCCESS],
        onFailure: RoleTypes.EDIT_ROLE_FAILURE,
        params: [
            role.id,
            role,
        ],
    });
}

export function setPendingRoles(roles: Array<string>) {
    return async (dispatch: DispatchFunc, getState: GetStateFunc) => {
        dispatch({type: RoleTypes.SET_PENDING_ROLES, data: roles}, getState);
        return {data: roles};
    };
}

export function loadRolesIfNeeded(roles: Iterable<string>): ActionFunc {
    return async (dispatch: DispatchFunc, getState: GetStateFunc) => {
        const state = getState();
        let pendingRoles = new Set();
        try {
            pendingRoles = new Set(state.entities.roles.pending);
        } catch (e) {
            // eslint-disable-line
        }
        for (const role of roles) {
            pendingRoles.add(role);
        }
        if (!state.entities.general.serverVersion) {
            setPendingRoles(Array.from(pendingRoles))(dispatch, getState);
            setTimeout(() => dispatch(loadRolesIfNeeded([])), 500);
            return {data: []};
        }
        if (!hasNewPermissions(state)) {
            if (state.entities.roles.pending) {
                await setPendingRoles([])(dispatch, getState);
            }
            return {data: []};
        }
        const loadedRoles = getRoles(state);
        const newRoles = new Set();
        for (const role of pendingRoles) {
            if (!loadedRoles[role] && role.trim() !== '') {
                newRoles.add(role);
            }
        }

        if (state.entities.roles.pending) {
            await setPendingRoles([])(dispatch, getState);
        }
        if (newRoles.size > 0) {
            return getRolesByNames(Array.from(newRoles))(dispatch, getState);
        }
        return {data: state.entities.roles.roles};
    };
}
