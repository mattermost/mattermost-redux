// Copyright (c) 2018-present Mattermost, Inc. All Rights Reserved.
// See License.txt for license information.

import {combineReducers} from 'redux';
import {RoleTypes} from 'action_types';

import {handleRequest, initialRequestState} from './helpers';

function getRolesByNames(state = initialRequestState(), action) {
    return handleRequest(
        RoleTypes.ROLES_BY_NAMES_REQUEST,
        RoleTypes.ROLES_BY_NAMES_SUCCESS,
        RoleTypes.ROLES_BY_NAMES_FAILURE,
        state,
        action
    );
}

function getRoleByName(state = initialRequestState(), action) {
    return handleRequest(
        RoleTypes.ROLE_BY_NAME_REQUEST,
        RoleTypes.ROLE_BY_NAME_SUCCESS,
        RoleTypes.ROLE_BY_NAME_FAILURE,
        state,
        action
    );
}

function getRole(state = initialRequestState(), action) {
    return handleRequest(
        RoleTypes.ROLE_BY_ID_REQUEST,
        RoleTypes.ROLE_BY_ID_SUCCESS,
        RoleTypes.ROLE_BY_ID_FAILURE,
        state,
        action
    );
}

function editRole(state = initialRequestState(), action) {
    return handleRequest(
        RoleTypes.EDIT_ROLE_REQUEST,
        RoleTypes.EDIT_ROLE_SUCCESS,
        RoleTypes.EDIT_ROLE_FAILURE,
        state,
        action
    );
}

export default combineReducers({
    getRolesByNames,
    getRoleByName,
    getRole,
    editRole
});
