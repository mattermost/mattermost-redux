// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
// @flow

import {combineReducers} from 'redux';
import {RequestStatus} from 'constants';
import {UserTypes} from 'action_types';

import {handleRequest, initialRequestState} from './helpers';

import type {GenericAction} from '../../types/actions';
import type {RequestStatusType} from '../../types/requests';

function checkMfa(state: RequestStatusType = initialRequestState(), action: GenericAction): RequestStatusType {
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

function login(state: RequestStatusType = initialRequestState(), action: GenericAction): RequestStatusType {
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

function generateMfaSecret(state: RequestStatusType = initialRequestState(), action: GenericAction): RequestStatusType {
    return handleRequest(
        UserTypes.MFA_SECRET_REQUEST,
        UserTypes.MFA_SECRET_SUCCESS,
        UserTypes.MFA_SECRET_FAILURE,
        state,
        action
    );
}

function logout(state: RequestStatusType = initialRequestState(), action: GenericAction): RequestStatusType {
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

function getProfiles(state: RequestStatusType = initialRequestState(), action: GenericAction): RequestStatusType {
    return handleRequest(
        UserTypes.PROFILES_REQUEST,
        UserTypes.PROFILES_SUCCESS,
        UserTypes.PROFILES_FAILURE,
        state,
        action
    );
}

function getProfilesInTeam(state: RequestStatusType = initialRequestState(), action: GenericAction): RequestStatusType {
    return handleRequest(
        UserTypes.PROFILES_IN_TEAM_REQUEST,
        UserTypes.PROFILES_IN_TEAM_SUCCESS,
        UserTypes.PROFILES_IN_TEAM_FAILURE,
        state,
        action
    );
}

function getProfilesNotInTeam(state: RequestStatusType = initialRequestState(), action: GenericAction): RequestStatusType {
    return handleRequest(
        UserTypes.PROFILES_NOT_IN_TEAM_REQUEST,
        UserTypes.PROFILES_NOT_IN_TEAM_SUCCESS,
        UserTypes.PROFILES_NOT_IN_TEAM_FAILURE,
        state,
        action
    );
}

function getProfilesWithoutTeam(state: RequestStatusType = initialRequestState(), action: GenericAction): RequestStatusType {
    return handleRequest(
        UserTypes.PROFILES_WITHOUT_TEAM_REQUEST,
        UserTypes.PROFILES_WITHOUT_TEAM_SUCCESS,
        UserTypes.PROFILES_WITHOUT_TEAM_FAILURE,
        state,
        action
    );
}

function getProfilesInChannel(state: RequestStatusType = initialRequestState(), action: GenericAction): RequestStatusType {
    return handleRequest(
        UserTypes.PROFILES_IN_CHANNEL_REQUEST,
        UserTypes.PROFILES_IN_CHANNEL_SUCCESS,
        UserTypes.PROFILES_IN_CHANNEL_FAILURE,
        state,
        action
    );
}

function getProfilesNotInChannel(state: RequestStatusType = initialRequestState(), action: GenericAction): RequestStatusType {
    return handleRequest(
        UserTypes.PROFILES_NOT_IN_CHANNEL_REQUEST,
        UserTypes.PROFILES_NOT_IN_CHANNEL_SUCCESS,
        UserTypes.PROFILES_NOT_IN_CHANNEL_FAILURE,
        state,
        action
    );
}

function getUser(state: RequestStatusType = initialRequestState(), action: GenericAction): RequestStatusType {
    return handleRequest(
        UserTypes.USER_REQUEST,
        UserTypes.USER_SUCCESS,
        UserTypes.USER_FAILURE,
        state,
        action
    );
}

function getUserByUsername(state: RequestStatusType = initialRequestState(), action: GenericAction): RequestStatusType {
    return handleRequest(
        UserTypes.USER_BY_USERNAME_REQUEST,
        UserTypes.USER_BY_USERNAME_SUCCESS,
        UserTypes.USER_BY_USERNAME_FAILURE,
        state,
        action
    );
}

function getStatusesByIds(state: RequestStatusType = initialRequestState(), action: GenericAction): RequestStatusType {
    return handleRequest(
        UserTypes.PROFILES_STATUSES_REQUEST,
        UserTypes.PROFILES_STATUSES_SUCCESS,
        UserTypes.PROFILES_STATUSES_FAILURE,
        state,
        action
    );
}

function getStatus(state: RequestStatusType = initialRequestState(), action: GenericAction): RequestStatusType {
    return handleRequest(
        UserTypes.PROFILE_STATUS_REQUEST,
        UserTypes.PROFILE_STATUS_SUCCESS,
        UserTypes.PROFILE_STATUS_FAILURE,
        state,
        action
    );
}

function getTotalUsersStats(state: RequestStatusType = initialRequestState(), action: GenericAction): RequestStatusType {
    return handleRequest(
        UserTypes.USER_STATS_REQUEST,
        UserTypes.USER_STATS_SUCCESS,
        UserTypes.USER_STATS_FAILURE,
        state,
        action
    );
}

function setStatus(state: RequestStatusType = initialRequestState(), action: GenericAction): RequestStatusType {
    return handleRequest(
        UserTypes.SET_STATUS_REQUEST,
        UserTypes.SET_STATUS_SUCCESS,
        UserTypes.SET_STATUS_FAILURE,
        state,
        action
    );
}

function getSessions(state: RequestStatusType = initialRequestState(), action: GenericAction): RequestStatusType {
    return handleRequest(
        UserTypes.SESSIONS_REQUEST,
        UserTypes.SESSIONS_SUCCESS,
        UserTypes.SESSIONS_FAILURE,
        state,
        action
    );
}

function revokeSession(state: RequestStatusType = initialRequestState(), action: GenericAction): RequestStatusType {
    return handleRequest(
        UserTypes.REVOKE_SESSION_REQUEST,
        UserTypes.REVOKE_SESSION_SUCCESS,
        UserTypes.REVOKE_SESSION_FAILURE,
        state,
        action
    );
}

function revokeAllSessionsForUser(state: RequestStatusType = initialRequestState(), action: GenericAction): RequestStatusType {
    return handleRequest(
        UserTypes.REVOKE_ALL_USER_SESSIONS_REQUEST,
        UserTypes.REVOKE_ALL_USER_SESSIONS_SUCCESS,
        UserTypes.REVOKE_ALL_USER_SESSIONS_FAILURE,
        state,
        action
    );
}

function getAudits(state: RequestStatusType = initialRequestState(), action: GenericAction): RequestStatusType {
    return handleRequest(
        UserTypes.AUDITS_REQUEST,
        UserTypes.AUDITS_SUCCESS,
        UserTypes.AUDITS_FAILURE,
        state,
        action
    );
}

function autocompleteUsers(state: RequestStatusType = initialRequestState(), action: GenericAction): RequestStatusType {
    return handleRequest(
        UserTypes.AUTOCOMPLETE_USERS_REQUEST,
        UserTypes.AUTOCOMPLETE_USERS_SUCCESS,
        UserTypes.AUTOCOMPLETE_USERS_FAILURE,
        state,
        action
    );
}

function searchProfiles(state: RequestStatusType = initialRequestState(), action: GenericAction): RequestStatusType {
    return handleRequest(
        UserTypes.SEARCH_PROFILES_REQUEST,
        UserTypes.SEARCH_PROFILES_SUCCESS,
        UserTypes.SEARCH_PROFILES_FAILURE,
        state,
        action
    );
}

function updateMe(state: RequestStatusType = initialRequestState(), action: GenericAction): RequestStatusType {
    return handleRequest(
        UserTypes.UPDATE_ME_REQUEST,
        UserTypes.UPDATE_ME_SUCCESS,
        UserTypes.UPDATE_ME_FAILURE,
        state,
        action
    );
}

function updateUser(state: RequestStatusType = initialRequestState(), action: GenericAction): RequestStatusType {
    return handleRequest(
        UserTypes.UPDATE_USER_REQUEST,
        UserTypes.UPDATE_USER_SUCCESS,
        UserTypes.UPDATE_USER_FAILURE,
        state,
        action
    );
}

function create(state: RequestStatusType = initialRequestState(), action: GenericAction): RequestStatusType {
    return handleRequest(
        UserTypes.CREATE_USER_REQUEST,
        UserTypes.CREATE_USER_SUCCESS,
        UserTypes.CREATE_USER_FAILURE,
        state,
        action
    );
}

function verifyEmail(state: RequestStatusType = initialRequestState(), action: GenericAction): RequestStatusType {
    return handleRequest(
        UserTypes.VERIFY_EMAIL_REQUEST,
        UserTypes.VERIFY_EMAIL_SUCCESS,
        UserTypes.VERIFY_EMAIL_FAILURE,
        state,
        action
    );
}

function passwordReset(state: RequestStatusType = initialRequestState(), action: GenericAction): RequestStatusType {
    return handleRequest(
        UserTypes.PASSWORD_RESET_REQUEST,
        UserTypes.PASSWORD_RESET_SUCCESS,
        UserTypes.PASSWORD_RESET_FAILURE,
        state,
        action
    );
}

function switchLogin(state: RequestStatusType = initialRequestState(), action: GenericAction): RequestStatusType {
    return handleRequest(
        UserTypes.SWITCH_LOGIN_REQUEST,
        UserTypes.SWITCH_LOGIN_SUCCESS,
        UserTypes.SWITCH_LOGIN_FAILURE,
        state,
        action
    );
}

function getMyTermsOfServiceStatus(state: RequestStatusType = initialRequestState(), action: GenericAction): RequestStatusType {
    return handleRequest(
        UserTypes.GET_MY_TERMS_OF_SERVICE_STATUS_REQUEST,
        UserTypes.GET_MY_TERMS_OF_SERVICE_STATUS_SUCCESS,
        UserTypes.GET_MY_TERMS_OF_SERVICE_STATUS_FAILURE,
        state,
        action
    );
}

function updateMyTermsOfServiceStatus(state: RequestStatusType = initialRequestState(), action: GenericAction): RequestStatusType {
    return handleRequest(
        UserTypes.UPDATE_MY_TERMS_OF_SERVICE_STATUS_REQUEST,
        UserTypes.UPDATE_MY_TERMS_OF_SERVICE_STATUS_SUCCESS,
        UserTypes.UPDATE_MY_TERMS_OF_SERVICE_STATUS_FAILURE,
        state,
        action
    );
}

function getTermsOfService(state: RequestStatusType = initialRequestState(), action: GenericAction): RequestStatusType {
    return handleRequest(
        UserTypes.GET_TERMS_OF_SERVICE_REQUEST,
        UserTypes.GET_TERMS_OF_SERVICE_SUCCESS,
        UserTypes.GET_TERMS_OF_SERVICE_FAILURE,
        state,
        action
    );
}

function createTermsOfService(state: RequestStatusType = initialRequestState(), action: GenericAction): RequestStatusType {
    return handleRequest(
        UserTypes.CREATE_TERMS_OF_SERVICE_REQUEST,
        UserTypes.CREATE_TERMS_OF_SERVICE_SUCCESS,
        UserTypes.CREATE_TERMS_OF_SERVICE_FAILURE,
        state,
        action
    );
}

function createUserAccessToken(state: RequestStatusType = initialRequestState(), action: GenericAction): RequestStatusType {
    return handleRequest(
        UserTypes.CREATE_USER_ACCESS_TOKEN_REQUEST,
        UserTypes.CREATE_USER_ACCESS_TOKEN_SUCCESS,
        UserTypes.CREATE_USER_ACCESS_TOKEN_FAILURE,
        state,
        action
    );
}

function getUserAccessToken(state: RequestStatusType = initialRequestState(), action: GenericAction): RequestStatusType {
    return handleRequest(
        UserTypes.GET_USER_ACCESS_TOKEN_REQUEST,
        UserTypes.GET_USER_ACCESS_TOKEN_SUCCESS,
        UserTypes.GET_USER_ACCESS_TOKEN_FAILURE,
        state,
        action
    );
}

function revokeUserAccessToken(state: RequestStatusType = initialRequestState(), action: GenericAction): RequestStatusType {
    return handleRequest(
        UserTypes.REVOKE_USER_ACCESS_TOKEN_REQUEST,
        UserTypes.REVOKE_USER_ACCESS_TOKEN_SUCCESS,
        UserTypes.REVOKE_USER_ACCESS_TOKEN_FAILURE,
        state,
        action
    );
}

function disableUserAccessToken(state: RequestStatusType = initialRequestState(), action: GenericAction): RequestStatusType {
    return handleRequest(
        UserTypes.DISABLE_USER_ACCESS_TOKEN_REQUEST,
        UserTypes.DISABLE_USER_ACCESS_TOKEN_SUCCESS,
        UserTypes.DISABLE_USER_ACCESS_TOKEN_FAILURE,
        state,
        action
    );
}

function enableUserAccessToken(state: RequestStatusType = initialRequestState(), action: GenericAction): RequestStatusType {
    return handleRequest(
        UserTypes.ENABLE_USER_ACCESS_TOKEN_REQUEST,
        UserTypes.ENABLE_USER_ACCESS_TOKEN_SUCCESS,
        UserTypes.ENABLE_USER_ACCESS_TOKEN_FAILURE,
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
    getTotalUsersStats,
    revokeSession,
    revokeAllSessionsForUser,
    getAudits,
    autocompleteUsers,
    searchProfiles,
    updateMe,
    updateUser,
    verifyEmail,
    passwordReset,
    switchLogin,
    getTermsOfService,
    createTermsOfService,
    getMyTermsOfServiceStatus,
    updateMyTermsOfServiceStatus,
    createUserAccessToken,
    getUserAccessToken,
    revokeUserAccessToken,
    disableUserAccessToken,
    enableUserAccessToken,
});
