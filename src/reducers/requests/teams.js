// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
// @flow

import {combineReducers} from 'redux';
import {TeamTypes} from 'action_types';

import {handleRequest, initialRequestState} from './helpers';

import type {GenericAction} from '../../types/actions';
import type {TeamsRequestsStatuses, RequestStatusType} from '../../types/requests';

function getMyTeams(state: RequestStatusType = initialRequestState(), action: GenericAction): RequestStatusType {
    return handleRequest(
        TeamTypes.MY_TEAMS_REQUEST,
        TeamTypes.MY_TEAMS_SUCCESS,
        TeamTypes.MY_TEAMS_FAILURE,
        state,
        action
    );
}

function getTeams(state: RequestStatusType = initialRequestState(), action: GenericAction): RequestStatusType {
    return handleRequest(
        TeamTypes.GET_TEAMS_REQUEST,
        TeamTypes.GET_TEAMS_SUCCESS,
        TeamTypes.GET_TEAMS_FAILURE,
        state,
        action
    );
}

function getTeam(state: RequestStatusType = initialRequestState(), action: GenericAction): RequestStatusType {
    return handleRequest(
        TeamTypes.GET_TEAM_REQUEST,
        TeamTypes.GET_TEAM_SUCCESS,
        TeamTypes.GET_TEAM_FAILURE,
        state,
        action
    );
}

function createTeam(state: RequestStatusType = initialRequestState(), action: GenericAction): RequestStatusType {
    return handleRequest(
        TeamTypes.CREATE_TEAM_REQUEST,
        TeamTypes.CREATE_TEAM_SUCCESS,
        TeamTypes.CREATE_TEAM_FAILURE,
        state,
        action
    );
}

function deleteTeam(state: RequestStatusType = initialRequestState(), action: GenericAction): RequestStatusType {
    return handleRequest(
        TeamTypes.DELETE_TEAM_REQUEST,
        TeamTypes.DELETE_TEAM_SUCCESS,
        TeamTypes.DELETE_TEAM_FAILURE,
        state,
        action
    );
}

function updateTeam(state: RequestStatusType = initialRequestState(), action: GenericAction): RequestStatusType {
    return handleRequest(
        TeamTypes.UPDATE_TEAM_REQUEST,
        TeamTypes.UPDATE_TEAM_SUCCESS,
        TeamTypes.UPDATE_TEAM_FAILURE,
        state,
        action
    );
}

function patchTeam(state: RequestStatusType = initialRequestState(), action: GenericAction): RequestStatusType {
    return handleRequest(
        TeamTypes.PATCH_TEAM_REQUEST,
        TeamTypes.PATCH_TEAM_SUCCESS,
        TeamTypes.PATCH_TEAM_FAILURE,
        state,
        action
    );
}

function updateTeamScheme(state: RequestStatusType = initialRequestState(), action: GenericAction): RequestStatusType {
    return handleRequest(
        TeamTypes.UPDATE_TEAM_SCHEME_REQUEST,
        TeamTypes.UPDATE_TEAM_SCHEME_SUCCESS,
        TeamTypes.UPDATE_TEAM_SCHEME_FAILURE,
        state,
        action
    );
}

function getMyTeamMembers(state: RequestStatusType = initialRequestState(), action: GenericAction): RequestStatusType {
    return handleRequest(
        TeamTypes.MY_TEAM_MEMBERS_REQUEST,
        TeamTypes.MY_TEAM_MEMBERS_SUCCESS,
        TeamTypes.MY_TEAM_MEMBERS_FAILURE,
        state,
        action
    );
}

function getMyTeamUnreads(state: RequestStatusType = initialRequestState(), action: GenericAction): RequestStatusType {
    return handleRequest(
        TeamTypes.MY_TEAM_UNREADS_REQUEST,
        TeamTypes.MY_TEAM_UNREADS_SUCCESS,
        TeamTypes.MY_TEAM_UNREADS_FAILURE,
        state,
        action
    );
}

function getTeamMembers(state: RequestStatusType = initialRequestState(), action: GenericAction): RequestStatusType {
    return handleRequest(
        TeamTypes.TEAM_MEMBERS_REQUEST,
        TeamTypes.TEAM_MEMBERS_SUCCESS,
        TeamTypes.TEAM_MEMBERS_FAILURE,
        state,
        action
    );
}

function getTeamStats(state: RequestStatusType = initialRequestState(), action: GenericAction): RequestStatusType {
    return handleRequest(
        TeamTypes.TEAM_STATS_REQUEST,
        TeamTypes.TEAM_STATS_SUCCESS,
        TeamTypes.TEAM_STATS_FAILURE,
        state,
        action
    );
}

function addUserToTeam(state: RequestStatusType = initialRequestState(), action: GenericAction): RequestStatusType {
    return handleRequest(
        TeamTypes.ADD_TEAM_MEMBER_REQUEST,
        TeamTypes.ADD_TEAM_MEMBER_SUCCESS,
        TeamTypes.ADD_TEAM_MEMBER_FAILURE,
        state,
        action
    );
}

function removeUserFromTeam(state: RequestStatusType = initialRequestState(), action: GenericAction): RequestStatusType {
    return handleRequest(
        TeamTypes.REMOVE_TEAM_MEMBER_REQUEST,
        TeamTypes.REMOVE_TEAM_MEMBER_SUCCESS,
        TeamTypes.REMOVE_TEAM_MEMBER_FAILURE,
        state,
        action
    );
}

function updateTeamMember(state: RequestStatusType = initialRequestState(), action: GenericAction): RequestStatusType {
    return handleRequest(
        TeamTypes.UPDATE_TEAM_MEMBER_REQUEST,
        TeamTypes.UPDATE_TEAM_MEMBER_SUCCESS,
        TeamTypes.UPDATE_TEAM_MEMBER_FAILURE,
        state,
        action
    );
}

function emailInvite(state: RequestStatusType = initialRequestState(), action: GenericAction): RequestStatusType {
    return handleRequest(
        TeamTypes.TEAM_EMAIL_INVITE_REQUEST,
        TeamTypes.TEAM_EMAIL_INVITE_SUCCESS,
        TeamTypes.TEAM_EMAIL_INVITE_FAILURE,
        state,
        action
    );
}

function joinTeam(state: RequestStatusType = initialRequestState(), action: GenericAction): RequestStatusType {
    return handleRequest(
        TeamTypes.JOIN_TEAM_REQUEST,
        TeamTypes.JOIN_TEAM_SUCCESS,
        TeamTypes.JOIN_TEAM_FAILURE,
        state,
        action
    );
}

function setTeamIcon(state = initialRequestState(), action) {
    return handleRequest(
        TeamTypes.SET_TEAM_ICON_REQUEST,
        TeamTypes.SET_TEAM_ICON_SUCCESS,
        TeamTypes.SET_TEAM_ICON_FAILURE,
        state,
        action
    );
}

function removeTeamIcon(state = initialRequestState(), action) {
    return handleRequest(
        TeamTypes.REMOVE_TEAM_ICON_REQUEST,
        TeamTypes.REMOVE_TEAM_ICON_SUCCESS,
        TeamTypes.REMOVE_TEAM_ICON_FAILURE,
        state,
        action
    );
}

function updateTeamMemberSchemeRoles(state: RequestStatusType = initialRequestState(), action: GenericAction) {
    return handleRequest(
        TeamTypes.UPDATE_TEAM_MEMBER_SCHEME_ROLES_REQUEST,
        TeamTypes.UPDATE_TEAM_MEMBER_SCHEME_ROLES_SUCCESS,
        TeamTypes.UPDATE_TEAM_MEMBER_SCHEME_ROLES_FAILURE,
        state,
        action
    );
}

export default (combineReducers({
    getMyTeams,
    getTeams,
    getTeam,
    createTeam,
    deleteTeam,
    updateTeam,
    patchTeam,
    updateTeamScheme,
    getMyTeamMembers,
    getMyTeamUnreads,
    getTeamMembers,
    getTeamStats,
    addUserToTeam,
    removeUserFromTeam,
    updateTeamMember,
    emailInvite,
    joinTeam,
    setTeamIcon,
    removeTeamIcon,
    updateTeamMemberSchemeRoles,
}): (TeamsRequestsStatuses, GenericAction) => TeamsRequestsStatuses);
