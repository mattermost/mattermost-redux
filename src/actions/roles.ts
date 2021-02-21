// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import {Client4} from 'client';
import {RoleTypes} from 'action_types';
import {getRoles} from 'selectors/entities/roles_helpers';
import {hasNewPermissions} from 'selectors/entities/general';

import {DispatchFunc, GetStateFunc, ActionFunc} from 'types/actions';
import {Role} from 'types/roles';

import {bindClientFunc} from './helpers';
export function getRolesByNames(rolesNames: string[]) {
    return bindClientFunc({
        clientFunc: Client4.getRolesByNames,
        params: [
            rolesNames,
        ],
    });
}

export function getRoleByName(roleName: string) {
    return bindClientFunc({
        clientFunc: Client4.getRoleByName,
        params: [
            roleName,
        ],
    });
}

export function getRole(roleId: string) {
    return bindClientFunc({
        clientFunc: Client4.getRole,
        params: [
            roleId,
        ],
    });
}

export function editRole(role: Role) {
    return bindClientFunc({
        clientFunc: Client4.patchRole,
        params: [
            role.id,
            role,
        ],
    });
}

export function setPendingRoles(roles: string[]) {
    return async (dispatch: DispatchFunc) => {
        dispatch({type: RoleTypes.SET_PENDING_ROLES, data: roles});
        return {data: roles};
    };
}

export function loadRolesIfNeeded(roles: Iterable<string>): ActionFunc {
    return async (dispatch: DispatchFunc, getState: GetStateFunc) => {
        const state = getState();
        let pendingRoles = new Set<string>();

        try {
            pendingRoles = new Set<string>(state.entities.roles.pending);
        } catch (e) {// eslint-disable-line
        }

        for (const role of roles) {
            pendingRoles.add(role);
        }
        if (!state.entities.general.serverVersion) {
            dispatch(setPendingRoles(Array.from(pendingRoles)));
            setTimeout(() => dispatch(loadRolesIfNeeded([])), 500);
            return {data: []};
        }
        if (!hasNewPermissions(state)) {
            if (state.entities.roles.pending) {
                await dispatch(setPendingRoles([]));
            }
            return {data: []};
        }
        const loadedRoles = getRoles(state);
        const newRoles = new Set<string>();

        for (const role of pendingRoles) {
            if (!loadedRoles[role] && role.trim() !== '') {
                newRoles.add(role);
            }
        }

        if (state.entities.roles.pending) {
            await dispatch(setPendingRoles([]));
        }
        if (newRoles.size > 0) {
            return getRolesByNames(Array.from(newRoles))(dispatch, getState);
        }
        return {data: state.entities.roles.roles};
    };
}
