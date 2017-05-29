// Copyright (c) 2016-present Mattermost, Inc. All Rights Reserved.
// See License.txt for license information.

import {combineReducers} from 'redux';
import {TeamTypes} from 'action_types';

import {handleRequest, initialRequestState} from './helpers';

function getMyTeams(state = initialRequestState(), action) {
    return handleRequest(
        TeamTypes.MY_TEAMS_REQUEST,
        TeamTypes.MY_TEAMS_SUCCESS,
        TeamTypes.MY_TEAMS_FAILURE,
        state,
        action
    );
}

function getTeams(state = initialRequestState(), action) {
    return handleRequest(
        TeamTypes.GET_TEAMS_REQUEST,
        TeamTypes.GET_TEAMS_SUCCESS,
        TeamTypes.GET_TEAMS_FAILURE,
        state,
        action
    );
}

function getTeam(state = initialRequestState(), action) {
    return handleRequest(
        TeamTypes.GET_TEAM_REQUEST,
        TeamTypes.GET_TEAM_SUCCESS,
        TeamTypes.GET_TEAM_FAILURE,
        state,
        action
    );
}

function createTeam(state = initialRequestState(), action) {
    return handleRequest(
        TeamTypes.CREATE_TEAM_REQUEST,
        TeamTypes.CREATE_TEAM_SUCCESS,
        TeamTypes.CREATE_TEAM_FAILURE,
        state,
        action
    );
}

function updateTeam(state = initialRequestState(), action) {
    return handleRequest(
        TeamTypes.UPDATE_TEAM_REQUEST,
        TeamTypes.UPDATE_TEAM_SUCCESS,
        TeamTypes.UPDATE_TEAM_FAILURE,
        state,
        action
    );
}

function getMyTeamMembers(state = initialRequestState(), action) {
    return handleRequest(
        TeamTypes.MY_TEAM_MEMBERS_REQUEST,
        TeamTypes.MY_TEAM_MEMBERS_SUCCESS,
        TeamTypes.MY_TEAM_MEMBERS_FAILURE,
        state,
        action
    );
}

function getMyTeamUnreads(state = initialRequestState(), action) {
    return handleRequest(
        TeamTypes.MY_TEAM_UNREADS_REQUEST,
        TeamTypes.MY_TEAM_UNREADS_SUCCESS,
        TeamTypes.MY_TEAM_UNREADS_FAILURE,
        state,
        action
    );
}

function getTeamMembers(state = initialRequestState(), action) {
    return handleRequest(
        TeamTypes.TEAM_MEMBERS_REQUEST,
        TeamTypes.TEAM_MEMBERS_SUCCESS,
        TeamTypes.TEAM_MEMBERS_FAILURE,
        state,
        action
    );
}

function getTeamStats(state = initialRequestState(), action) {
    return handleRequest(
        TeamTypes.TEAM_STATS_REQUEST,
        TeamTypes.TEAM_STATS_SUCCESS,
        TeamTypes.TEAM_STATS_FAILURE,
        state,
        action
    );
}

function addUserToTeam(state = initialRequestState(), action) {
    return handleRequest(
        TeamTypes.ADD_TEAM_MEMBER_REQUEST,
        TeamTypes.ADD_TEAM_MEMBER_SUCCESS,
        TeamTypes.ADD_TEAM_MEMBER_FAILURE,
        state,
        action
    );
}

function removeUserFromTeam(state = initialRequestState(), action) {
    return handleRequest(
        TeamTypes.REMOVE_TEAM_MEMBER_REQUEST,
        TeamTypes.REMOVE_TEAM_MEMBER_SUCCESS,
        TeamTypes.REMOVE_TEAM_MEMBER_FAILURE,
        state,
        action
    );
}

function updateTeamMember(state = initialRequestState(), action) {
    return handleRequest(
        TeamTypes.UPDATE_TEAM_MEMBER_REQUEST,
        TeamTypes.UPDATE_TEAM_MEMBER_SUCCESS,
        TeamTypes.UPDATE_TEAM_MEMBER_FAILURE,
        state,
        action
    );
}

function emailInvite(state = initialRequestState(), action) {
    return handleRequest(
        TeamTypes.TEAM_EMAIL_INVITE_REQUEST,
        TeamTypes.TEAM_EMAIL_INVITE_SUCCESS,
        TeamTypes.TEAM_EMAIL_INVITE_FAILURE,
        state,
        action
    );
}

export default combineReducers({
    getMyTeams,
    getTeams,
    getTeam,
    createTeam,
    updateTeam,
    getMyTeamMembers,
    getMyTeamUnreads,
    getTeamMembers,
    getTeamStats,
    addUserToTeam,
    removeUserFromTeam,
    updateTeamMember,
    emailInvite
});
