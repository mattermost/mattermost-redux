// Copyright (c) 2016-present Mattermost, Inc. All Rights Reserved.
// See License.txt for license information.

import {combineReducers} from 'redux';
import {RequestStatus} from 'constants';
import {UserTypes} from 'action_types';

import {handleRequest, initialRequestState} from './helpers';

function checkMfa(state = initialRequestState(), action) {
    switch (action.type) {
    case UserTypes.CHECK_MFA_REQUEST:
        return {...state, status: RequestStatus.STARTED};

    case UserTypes.CHECK_MFA_SUCCESS:
        return {...state, status: RequestStatus.SUCCESS, error: null};

    case UserTypes.CHECK_MFA_FAILURE:
        return {...state, status: RequestStatus.FAILURE, error: action.error};

    case UserTypes.LOGOUT_SUCCESS:
        return {...state, status: RequestStatus.NOT_STARTED, error: null};

    default:
        return state;
    }
}

function login(state = initialRequestState(), action) {
    switch (action.type) {
    case UserTypes.LOGIN_REQUEST:
        return {...state, status: RequestStatus.STARTED};

    case UserTypes.LOGIN_SUCCESS:
        return {...state, status: RequestStatus.SUCCESS, error: null};

    case UserTypes.LOGIN_FAILURE:
        return {...state, status: RequestStatus.FAILURE, error: action.error};

    case UserTypes.LOGOUT_SUCCESS:
        return {...state, status: RequestStatus.NOT_STARTED, error: null};

    default:
        return state;
    }
}

function generateMfaSecret(state = initialRequestState(), action) {
    return handleRequest(
        UserTypes.MFA_SECRET_REQUEST,
        UserTypes.MFA_SECRET_SUCCESS,
        UserTypes.MFA_SECRET_FAILURE,
        state,
        action
    );
}

function logout(state = initialRequestState(), action) {
    switch (action.type) {
    case UserTypes.LOGOUT_REQUEST:
        return {...state, status: RequestStatus.STARTED};

    case UserTypes.LOGOUT_SUCCESS:
        return {...state, status: RequestStatus.SUCCESS, error: null};

    case UserTypes.LOGOUT_FAILURE:
        return {...state, status: RequestStatus.FAILURE, error: action.error};

    case UserTypes.RESET_LOGOUT_STATE:
        return initialRequestState();

    default:
        return state;
    }
}

function getProfiles(state = initialRequestState(), action) {
    return handleRequest(
        UserTypes.PROFILES_REQUEST,
        UserTypes.PROFILES_SUCCESS,
        UserTypes.PROFILES_FAILURE,
        state,
        action
    );
}

function getProfilesInTeam(state = initialRequestState(), action) {
    return handleRequest(
        UserTypes.PROFILES_IN_TEAM_REQUEST,
        UserTypes.PROFILES_IN_TEAM_SUCCESS,
        UserTypes.PROFILES_IN_TEAM_FAILURE,
        state,
        action
    );
}

function getProfilesNotInTeam(state = initialRequestState(), action) {
    return handleRequest(
        UserTypes.PROFILES_NOT_IN_TEAM_REQUEST,
        UserTypes.PROFILES_NOT_IN_TEAM_SUCCESS,
        UserTypes.PROFILES_NOT_IN_TEAM_FAILURE,
        state,
        action
    );
}

function getProfilesWithoutTeam(state = initialRequestState(), action) {
    return handleRequest(
        UserTypes.PROFILES_WITHOUT_TEAM_REQUEST,
        UserTypes.PROFILES_WITHOUT_TEAM_SUCCESS,
        UserTypes.PROFILES_WITHOUT_TEAM_FAILURE,
        state,
        action
    );
}

function getProfilesInChannel(state = initialRequestState(), action) {
    return handleRequest(
        UserTypes.PROFILES_IN_CHANNEL_REQUEST,
        UserTypes.PROFILES_IN_CHANNEL_SUCCESS,
        UserTypes.PROFILES_IN_CHANNEL_FAILURE,
        state,
        action
    );
}

function getProfilesNotInChannel(state = initialRequestState(), action) {
    return handleRequest(
        UserTypes.PROFILES_NOT_IN_CHANNEL_REQUEST,
        UserTypes.PROFILES_NOT_IN_CHANNEL_SUCCESS,
        UserTypes.PROFILES_NOT_IN_CHANNEL_FAILURE,
        state,
        action
    );
}

function getUser(state = initialRequestState(), action) {
    return handleRequest(
        UserTypes.USER_REQUEST,
        UserTypes.USER_SUCCESS,
        UserTypes.USER_FAILURE,
        state,
        action
    );
}

function getUserByUsername(state = initialRequestState(), action) {
    return handleRequest(
        UserTypes.USER_BY_USERNAME_REQUEST,
        UserTypes.USER_BY_USERNAME_SUCCESS,
        UserTypes.USER_BY_USERNAME_FAILURE,
        state,
        action
    );
}

function getStatusesByIds(state = initialRequestState(), action) {
    return handleRequest(
        UserTypes.PROFILES_STATUSES_REQUEST,
        UserTypes.PROFILES_STATUSES_SUCCESS,
        UserTypes.PROFILES_STATUSES_FAILURE,
        state,
        action
    );
}

function getStatus(state = initialRequestState(), action) {
    return handleRequest(
        UserTypes.PROFILE_STATUS_REQUEST,
        UserTypes.PROFILE_STATUS_SUCCESS,
        UserTypes.PROFILE_STATUS_FAILURE,
        state,
        action
    );
}

function setStatus(state = initialRequestState(), action) {
    return handleRequest(
        UserTypes.SET_STATUS_REQUEST,
        UserTypes.SET_STATUS_SUCCESS,
        UserTypes.SET_STATUS_FAILURE,
        state,
        action
    );
}

function getSessions(state = initialRequestState(), action) {
    return handleRequest(
        UserTypes.SESSIONS_REQUEST,
        UserTypes.SESSIONS_SUCCESS,
        UserTypes.SESSIONS_FAILURE,
        state,
        action
    );
}

function revokeSession(state = initialRequestState(), action) {
    return handleRequest(
        UserTypes.REVOKE_SESSION_REQUEST,
        UserTypes.REVOKE_SESSION_SUCCESS,
        UserTypes.REVOKE_SESSION_FAILURE,
        state,
        action
    );
}

function getAudits(state = initialRequestState(), action) {
    return handleRequest(
        UserTypes.AUDITS_REQUEST,
        UserTypes.AUDITS_SUCCESS,
        UserTypes.AUDITS_FAILURE,
        state,
        action
    );
}

function autocompleteUsers(state = initialRequestState(), action) {
    return handleRequest(
        UserTypes.AUTOCOMPLETE_USERS_REQUEST,
        UserTypes.AUTOCOMPLETE_USERS_SUCCESS,
        UserTypes.AUTOCOMPLETE_USERS_FAILURE,
        state,
        action
    );
}

function searchProfiles(state = initialRequestState(), action) {
    return handleRequest(
        UserTypes.SEARCH_PROFILES_REQUEST,
        UserTypes.SEARCH_PROFILES_SUCCESS,
        UserTypes.SEARCH_PROFILES_FAILURE,
        state,
        action
    );
}

function updateMe(state = initialRequestState(), action) {
    return handleRequest(
        UserTypes.UPDATE_ME_REQUEST,
        UserTypes.UPDATE_ME_SUCCESS,
        UserTypes.UPDATE_ME_FAILURE,
        state,
        action
    );
}

function updateUser(state = initialRequestState(), action) {
    return handleRequest(
        UserTypes.UPDATE_USER_REQUEST,
        UserTypes.UPDATE_USER_SUCCESS,
        UserTypes.UPDATE_USER_FAILURE,
        state,
        action
    );
}

function create(state = initialRequestState(), action) {
    return handleRequest(
        UserTypes.CREATE_USER_REQUEST,
        UserTypes.CREATE_USER_SUCCESS,
        UserTypes.CREATE_USER_FAILURE,
        state,
        action
    );
}

export default combineReducers({
    checkMfa,
    generateMfaSecret,
    login,
    logout,
    create,
    getProfiles,
    getProfilesInTeam,
    getProfilesNotInTeam,
    getProfilesWithoutTeam,
    getProfilesInChannel,
    getProfilesNotInChannel,
    getUser,
    getUserByUsername,
    getStatusesByIds,
    getStatus,
    setStatus,
    getSessions,
    revokeSession,
    getAudits,
    autocompleteUsers,
    searchProfiles,
    updateMe,
    updateUser
});
