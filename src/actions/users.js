// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
// @flow

import type {ActionFunc, ActionResult, DispatchFunc, GetStateFunc} from 'types/actions';
import type {UserProfile} from 'types/users';
import type {TeamMembership} from 'types/teams';

import {batchActions} from 'redux-batched-actions';
import {Client4} from 'client';
import {General} from 'constants';
import {UserTypes, TeamTypes, AdminTypes} from 'action_types';
import {getAllCustomEmojis} from 'actions/emojis';
import {getClientConfig} from 'actions/general';
import {getMyTeams, getMyTeamMembers, getMyTeamUnreads} from 'actions/teams';
import {loadRolesIfNeeded} from 'actions/roles';

import {
    getUserIdFromChannelName,
    isDirectChannel,
    isDirectChannelVisible,
    isGroupChannel,
    isGroupChannelVisible,
} from 'utils/channel_utils';

import {removeUserFromList} from 'utils/user_utils';
import {isMinimumServerVersion} from 'utils/helpers';

import {logError} from './errors';
import {bindClientFunc, forceLogoutIfNecessary, debounce} from './helpers';
import {
    getMyPreferences,
    makeDirectChannelVisibleIfNecessary,
    makeGroupMessageVisibleIfNecessary,
} from './preferences';

import {getConfig} from 'selectors/entities/general';
import {getCurrentUser, getCurrentUserId} from 'selectors/entities/users';

export function checkMfa(loginId: string): ActionFunc {
    return async (dispatch: DispatchFunc, getState: GetStateFunc) => {
        dispatch({type: UserTypes.CHECK_MFA_REQUEST, data: null}, getState);
        try {
            const data = await Client4.checkUserMfa(loginId);
            dispatch({type: UserTypes.CHECK_MFA_SUCCESS, data: null}, getState);
            return {data: data.mfa_required};
        } catch (error) {
            dispatch(batchActions([
                {type: UserTypes.CHECK_MFA_FAILURE, error},
                logError(error),
            ]), getState);
            return {error};
        }
    };
}

export function generateMfaSecret(userId: string): ActionFunc {
    return bindClientFunc(
        Client4.generateMfaSecret,
        UserTypes.MFA_SECRET_REQUEST,
        UserTypes.MFA_SECRET_SUCCESS,
        UserTypes.MFA_SECRET_FAILURE,
        userId
    );
}

export function createUser(user: UserProfile, token: string, inviteId: string): ActionFunc {
    return async (dispatch: DispatchFunc, getState: GetStateFunc) => {
        dispatch({type: UserTypes.CREATE_USER_REQUEST, data: null}, getState);

        let created = null;
        try {
            created = await Client4.createUser(user, token, inviteId);
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch, getState);
            dispatch(batchActions([
                {
                    type: UserTypes.CREATE_USER_FAILURE,
                    error,
                },
                logError(error),
            ]), getState);
            return {error};
        }

        const profiles: { [userId: string]: UserProfile } = {
            [created.id]: created,
        };
        dispatch({type: UserTypes.RECEIVED_PROFILES, data: profiles});

        return {data: created};
    };
}

export function login(loginId: string, password: string, mfaToken: string = '', ldapOnly: boolean = false): ActionFunc {
    return async (dispatch: DispatchFunc, getState: GetStateFunc) => {
        dispatch({type: UserTypes.LOGIN_REQUEST, data: null}, getState);

        const deviceId = getState().entities.general.deviceToken;

        let data = null;
        try {
            data = await Client4.login(loginId, password, mfaToken, deviceId, ldapOnly);
        } catch (error) {
            dispatch(batchActions([
                {
                    type: UserTypes.LOGIN_FAILURE,
                    error,
                },
                logError(error),
            ]), getState);
            return {error};
        }

        return completeLogin(data)(dispatch, getState);
    };
}

export function loginById(id: string, password: string, mfaToken: string = ''): ActionFunc {
    return async (dispatch: DispatchFunc, getState: GetStateFunc) => {
        dispatch({type: UserTypes.LOGIN_REQUEST, data: null}, getState);

        const deviceId = getState().entities.general.deviceToken;

        let data = null;
        try {
            data = await Client4.loginById(id, password, mfaToken, deviceId);
        } catch (error) {
            dispatch(batchActions([
                {
                    type: UserTypes.LOGIN_FAILURE,
                    error,
                },
                logError(error),
            ]), getState);
            return {error};
        }

        return completeLogin(data)(dispatch, getState);
    };
}

function completeLogin(data: UserProfile): ActionFunc {
    return async (dispatch: DispatchFunc, getState: GetStateFunc) => {
        dispatch({
            type: UserTypes.RECEIVED_ME,
            data,
        });

        Client4.setUserId(data.id);

        let teamMembers = null;
        try {
            const membersRequest: Promise<Array<TeamMembership>> = Client4.getMyTeamMembers();
            const unreadsRequest = Client4.getMyTeamUnreads();

            teamMembers = await membersRequest;
            const teamUnreads = await unreadsRequest;

            if (teamUnreads) {
                for (const u of teamUnreads) {
                    const index = teamMembers.findIndex((m) => m.team_id === u.team_id);
                    const member = teamMembers[index];
                    member.mention_count = u.mention_count;
                    member.msg_count = u.msg_count;
                }
            }
        } catch (error) {
            dispatch(batchActions([
                {type: UserTypes.LOGIN_FAILURE, error},
                logError(error),
            ]), getState);
            return {error};
        }

        const promises = [
            dispatch(getMyPreferences()),
            dispatch(getMyTeams()),
            dispatch(getClientConfig()),
        ];

        const serverVersion = Client4.getServerVersion();
        if (!isMinimumServerVersion(serverVersion, 4, 7) && getConfig(getState()).EnableCustomEmoji === 'true') {
            dispatch(getAllCustomEmojis());
        }

        try {
            await Promise.all(promises);
        } catch (error) {
            dispatch(batchActions([
                {type: UserTypes.LOGIN_FAILURE, error},
                logError(error),
            ]));
            return {error};
        }

        dispatch(batchActions([
            {
                type: TeamTypes.RECEIVED_MY_TEAM_MEMBERS,
                data: teamMembers,
            },
            {
                type: UserTypes.LOGIN_SUCCESS,
            },
        ]));

        const roles = new Set();
        for (const teamMember of teamMembers) {
            for (const role of teamMember.roles.split(' ')) {
                roles.add(role);
            }
            for (const role of data.roles.split(' ')) {
                roles.add(role);
            }
        }
        if (roles.size > 0) {
            dispatch(loadRolesIfNeeded(roles));
        }

        return {data: true};
    };
}

export function loadMe(): ActionFunc {
    return async (dispatch: DispatchFunc, getState: GetStateFunc) => {
        const state = getState();

        const deviceId = state.entities.general.deviceToken;
        if (deviceId) {
            Client4.attachDevice(deviceId);
        }

        const promises = [
            getMe()(dispatch, getState),
            getMyPreferences()(dispatch, getState),
            getMyTeams()(dispatch, getState),
            getMyTeamMembers()(dispatch, getState),
            getMyTeamUnreads()(dispatch, getState),
        ];

        // Sometimes the server version is set in one or the other
        const serverVersion = Client4.getServerVersion() || getState().entities.general.serverVersion;
        if (!isMinimumServerVersion(serverVersion, 4, 7) && getConfig(state).EnableCustomEmoji === 'true') {
            dispatch(getAllCustomEmojis());
        }

        await Promise.all(promises);

        const {currentUserId} = getState().entities.users;
        Client4.setUserId(currentUserId);

        return {data: true};
    };
}

export function logout(): ActionFunc {
    return async (dispatch: DispatchFunc, getState: GetStateFunc) => {
        dispatch({type: UserTypes.LOGOUT_REQUEST, data: null}, getState);

        try {
            await Client4.logout();
        } catch (error) {
            // nothing to do here
        }

        dispatch({type: UserTypes.LOGOUT_SUCCESS, data: null}, getState);

        return {data: true};
    };
}

export function getTotalUsersStats(): ActionFunc {
    return bindClientFunc(
        Client4.getTotalUsersStats,
        UserTypes.USER_STATS_REQUEST,
        [UserTypes.RECEIVED_USER_STATS, UserTypes.USER_STATS_SUCCESS],
        UserTypes.USER_STATS_FAILURE,
    );
}

export function getProfiles(page: number = 0, perPage: number = General.PROFILE_CHUNK_SIZE): ActionFunc {
    return async (dispatch: DispatchFunc, getState: GetStateFunc) => {
        dispatch({type: UserTypes.PROFILES_REQUEST, data: null}, getState);

        const {currentUserId} = getState().entities.users;

        let profiles = null;
        try {
            profiles = await Client4.getProfiles(page, perPage);
            removeUserFromList(currentUserId, profiles);
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch, getState);
            dispatch(batchActions([
                {type: UserTypes.PROFILES_FAILURE, error},
                logError(error),
            ]), getState);
            return {error};
        }

        dispatch(batchActions([
            {
                type: UserTypes.RECEIVED_PROFILES_LIST,
                data: profiles,
            },
            {
                type: UserTypes.PROFILES_SUCCESS,
            },
        ]), getState);

        return {data: profiles};
    };
}

export function getMissingProfilesByIds(userIds: Array<string>): ActionFunc {
    return async (dispatch: DispatchFunc, getState: GetStateFunc) => {
        const {profiles} = getState().entities.users;

        const missingIds = [];
        userIds.forEach((id) => {
            if (!profiles[id]) {
                missingIds.push(id);
            }
        });

        if (missingIds.length > 0) {
            getStatusesByIds(missingIds)(dispatch, getState);
            return getProfilesByIds(missingIds)(dispatch, getState);
        }

        return {data: []};
    };
}

export function getMissingProfilesByUsernames(usernames: Array<string>): ActionFunc {
    return async (dispatch: DispatchFunc, getState: GetStateFunc) => {
        const {profiles} = getState().entities.users;

        const usernameProfiles = Object.values(profiles).reduce((acc, profile: any) => {
            acc[profile.username] = profile;
            return acc;
        }, {});

        const missingUsernames = [];
        usernames.forEach((username) => {
            if (!usernameProfiles[username]) {
                missingUsernames.push(username);
            }
        });

        if (missingUsernames.length > 0) {
            return getProfilesByUsernames(missingUsernames)(dispatch, getState);
        }

        return {data: []};
    };
}

export function getProfilesByIds(userIds: Array<string>): ActionFunc {
    return async (dispatch: DispatchFunc, getState: GetStateFunc) => {
        dispatch({type: UserTypes.PROFILES_REQUEST, data: null}, getState);

        const {currentUserId} = getState().entities.users;

        let profiles = null;
        try {
            profiles = await Client4.getProfilesByIds(userIds);
            removeUserFromList(currentUserId, profiles);
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch, getState);
            dispatch(batchActions([
                {type: UserTypes.PROFILES_FAILURE, error},
                logError(error),
            ]), getState);
            return {error};
        }

        dispatch(batchActions([
            {
                type: UserTypes.RECEIVED_PROFILES_LIST,
                data: profiles,
            },
            {
                type: UserTypes.PROFILES_SUCCESS,
            },
        ]), getState);

        return {data: profiles};
    };
}

export function getProfilesByUsernames(usernames: Array<string>): ActionFunc {
    return async (dispatch: DispatchFunc, getState: GetStateFunc) => {
        dispatch({type: UserTypes.PROFILES_REQUEST, data: null}, getState);

        const {currentUserId} = getState().entities.users;

        let profiles = null;
        try {
            profiles = await Client4.getProfilesByUsernames(usernames);
            removeUserFromList(currentUserId, profiles);
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch, getState);
            dispatch(batchActions([
                {type: UserTypes.PROFILES_FAILURE, error},
                logError(error),
            ]), getState);
            return {error};
        }

        dispatch(batchActions([
            {
                type: UserTypes.RECEIVED_PROFILES_LIST,
                data: profiles,
            },
            {
                type: UserTypes.PROFILES_SUCCESS,
            },
        ]), getState);

        return {data: profiles};
    };
}

export function getProfilesInTeam(teamId: string, page: number, perPage: number = General.PROFILE_CHUNK_SIZE, sort: string = ''): ActionFunc {
    return async (dispatch: DispatchFunc, getState: GetStateFunc) => {
        dispatch({type: UserTypes.PROFILES_IN_TEAM_REQUEST, data: null}, getState);

        const {currentUserId} = getState().entities.users;

        let profiles: null;
        try {
            profiles = await Client4.getProfilesInTeam(teamId, page, perPage, sort);
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch, getState);
            dispatch(batchActions([
                {type: UserTypes.PROFILES_IN_TEAM_FAILURE, error},
                logError(error),
            ]), getState);
            return {error};
        }

        dispatch(batchActions([
            {
                type: UserTypes.RECEIVED_PROFILES_LIST_IN_TEAM,
                data: profiles,
                id: teamId,
            },
            {
                type: UserTypes.RECEIVED_PROFILES_LIST,
                data: removeUserFromList(currentUserId, [...profiles]),
            },
            {
                type: UserTypes.PROFILES_IN_TEAM_SUCCESS,
            },
        ]), getState);

        return {data: profiles};
    };
}

export function getProfilesNotInTeam(teamId: string, page: number, perPage: number = General.PROFILE_CHUNK_SIZE): ActionFunc {
    return async (dispatch: DispatchFunc, getState: GetStateFunc) => {
        dispatch({type: UserTypes.PROFILES_NOT_IN_TEAM_REQUEST, data: null}, getState);

        let profiles: null;
        try {
            profiles = await Client4.getProfilesNotInTeam(teamId, page, perPage);
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch, getState);
            dispatch(batchActions([
                {type: UserTypes.PROFILES_NOT_IN_TEAM_FAILURE, error},
                logError(error),
            ]), getState);
            return {error};
        }

        dispatch(batchActions([
            {
                type: UserTypes.RECEIVED_PROFILES_LIST_NOT_IN_TEAM,
                data: profiles,
                id: teamId,
            },
            {
                type: UserTypes.RECEIVED_PROFILES_LIST,
                data: profiles,
            },
            {
                type: UserTypes.PROFILES_NOT_IN_TEAM_SUCCESS,
            },
        ]), getState);

        return {data: profiles};
    };
}

export function getProfilesWithoutTeam(page: number, perPage: number = General.PROFILE_CHUNK_SIZE): ActionFunc {
    return async (dispatch: DispatchFunc, getState: GetStateFunc) => {
        dispatch({type: UserTypes.PROFILES_WITHOUT_TEAM_REQUEST, data: null}, getState);

        let profiles = null;
        try {
            profiles = await Client4.getProfilesWithoutTeam(page, perPage);
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch, getState);
            dispatch(batchActions([
                {type: UserTypes.PROFILES_WITHOUT_TEAM_FAILURE, error},
                logError(error),
            ]), getState);
            return {error};
        }

        dispatch(batchActions([
            {
                type: UserTypes.RECEIVED_PROFILES_LIST_WITHOUT_TEAM,
                data: profiles,
            },
            {
                type: UserTypes.RECEIVED_PROFILES_LIST,
                data: profiles,
            },
            {
                type: UserTypes.PROFILES_WITHOUT_TEAM_SUCCESS,
            },
        ]), getState);

        return {data: profiles};
    };
}

export function getProfilesInChannel(channelId: string, page: number, perPage: number = General.PROFILE_CHUNK_SIZE, sort: string = ''): ActionFunc {
    return async (dispatch: DispatchFunc, getState: GetStateFunc) => {
        dispatch({type: UserTypes.PROFILES_IN_CHANNEL_REQUEST, data: null}, getState);

        const {currentUserId} = getState().entities.users;

        let profiles = null;
        try {
            profiles = await Client4.getProfilesInChannel(channelId, page, perPage, sort);
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch, getState);
            dispatch(batchActions([
                {type: UserTypes.PROFILES_IN_CHANNEL_FAILURE, error},
                logError(error),
            ]), getState);
            return {error};
        }

        dispatch(batchActions([
            {
                type: UserTypes.RECEIVED_PROFILES_LIST_IN_CHANNEL,
                data: profiles,
                id: channelId,
            },
            {
                type: UserTypes.RECEIVED_PROFILES_LIST,
                data: removeUserFromList(currentUserId, [...profiles]),
            },
            {
                type: UserTypes.PROFILES_IN_CHANNEL_SUCCESS,
            },
        ]), getState);

        return {data: profiles};
    };
}

export function getProfilesNotInChannel(teamId: string, channelId: string, page: number, perPage: number = General.PROFILE_CHUNK_SIZE): ActionFunc {
    return async (dispatch: DispatchFunc, getState: GetStateFunc) => {
        dispatch({type: UserTypes.PROFILES_NOT_IN_CHANNEL_REQUEST, data: null}, getState);

        const {currentUserId} = getState().entities.users;

        let profiles = null;
        try {
            profiles = await Client4.getProfilesNotInChannel(teamId, channelId, page, perPage);
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch, getState);
            dispatch(batchActions([
                {type: UserTypes.PROFILES_NOT_IN_CHANNEL_FAILURE, error},
                logError(error),
            ]), getState);
            return {error};
        }

        dispatch(batchActions([
            {
                type: UserTypes.RECEIVED_PROFILES_LIST_NOT_IN_CHANNEL,
                data: profiles,
                id: channelId,
            },
            {
                type: UserTypes.RECEIVED_PROFILES_LIST,
                data: removeUserFromList(currentUserId, [...profiles]),
            },
            {
                type: UserTypes.PROFILES_NOT_IN_CHANNEL_SUCCESS,
            },
        ]), getState);

        return {data: profiles};
    };
}

export function getMe(): ActionFunc {
    return async (dispatch: DispatchFunc, getState: GetStateFunc) => {
        const getMeFunc = bindClientFunc(
            Client4.getMe,
            UserTypes.USER_REQUEST,
            [UserTypes.RECEIVED_ME, UserTypes.USER_SUCCESS],
            UserTypes.USER_FAILURE
        );
        const me: $Subtype<ActionResult> = await getMeFunc(dispatch, getState);
        if (me.error) {
            return me;
        }
        dispatch(loadRolesIfNeeded(me.data.roles.split(' ')));
        return me;
    };
}

export function updateTermsOfServiceStatus(termsOfServiceId: string, accepted: boolean): ActionFunc {
    return async (dispatch: DispatchFunc, getState: GetStateFunc) => {
        const response: $Subtype<ActionResult> = await dispatch(bindClientFunc(
            Client4.updateTermsOfServiceStatus,
            UserTypes.UPDATE_TERMS_OF_SERVICE_STATUS_REQUEST,
            UserTypes.UPDATE_TERMS_OF_SERVICE_STATUS_SUCCESS,
            UserTypes.UPDATE_TERMS_OF_SERVICE_STATUS_FAILURE,
            termsOfServiceId,
            accepted
        ));
        const {data, error} = response;
        if (data) {
            const currentUser = getCurrentUser(getState());
            dispatch({
                type: UserTypes.RECEIVED_ME,
                data: {
                    ...currentUser,
                    accepted_terms_of_service_id: accepted ? termsOfServiceId : null,
                },
            });
            return {data};
        }
        return {error};
    };
}

export function getTermsOfService(): ActionFunc {
    return bindClientFunc(
        Client4.getTermsOfService,
        UserTypes.GET_TERMS_OF_SERVICE_REQUEST,
        UserTypes.GET_TERMS_OF_SERVICE_SUCCESS,
        UserTypes.GET_TERMS_OF_SERVICE_FAILURE,
    );
}

export function createTermsOfService(text: string): ActionFunc {
    return bindClientFunc(
        Client4.createTermsOfService,
        UserTypes.CREATE_TERMS_OF_SERVICE_REQUEST,
        UserTypes.CREATE_TERMS_OF_SERVICE_SUCCESS,
        UserTypes.CREATE_TERMS_OF_SERVICE_FAILURE,
        text,
    );
}

export function getUser(id: string): ActionFunc {
    return bindClientFunc(
        Client4.getUser,
        UserTypes.USER_REQUEST,
        [UserTypes.RECEIVED_PROFILE, UserTypes.USER_SUCCESS],
        UserTypes.USER_FAILURE,
        id
    );
}

export function getUserByUsername(username: string): ActionFunc {
    return bindClientFunc(
        Client4.getUserByUsername,
        UserTypes.USER_BY_USERNAME_REQUEST,
        [UserTypes.RECEIVED_PROFILE, UserTypes.USER_BY_USERNAME_SUCCESS],
        UserTypes.USER_BY_USERNAME_FAILURE,
        username
    );
}

export function getUserByEmail(email: string): ActionFunc {
    return bindClientFunc(
        Client4.getUserByEmail,
        UserTypes.USER_REQUEST,
        [UserTypes.RECEIVED_PROFILE, UserTypes.USER_SUCCESS],
        UserTypes.USER_FAILURE,
        email
    );
}

// We create an array to hold the id's that we want to get a status for. We build our
// debounced function that will get called after a set period of idle time in which
// the array of id's will be passed to the getStatusesByIds with a cb that clears out
// the array. Helps with performance because instead of making 75 different calls for
// statuses, we are only making one call for 75 ids.
// We could maybe clean it up somewhat by storing the array of ids in redux state possbily?
let ids: Array<string> = [];
const debouncedGetStatusesByIds = debounce(async (dispatch: DispatchFunc, getState: GetStateFunc) => {
    getStatusesByIds([...new Set(ids)])(dispatch, getState);
}, 20, false, () => {
    ids = [];
});
export function getStatusesByIdsBatchedDebounced(id: string) {
    ids = [...ids, id];
    return debouncedGetStatusesByIds;
}

export function getStatusesByIds(userIds: Array<string>): ActionFunc {
    return bindClientFunc(
        Client4.getStatusesByIds,
        UserTypes.PROFILES_STATUSES_REQUEST,
        [UserTypes.RECEIVED_STATUSES, UserTypes.PROFILES_STATUSES_SUCCESS],
        UserTypes.PROFILES_STATUSES_FAILURE,
        userIds
    );
}

export function getStatus(userId: string): ActionFunc {
    return bindClientFunc(
        Client4.getStatus,
        UserTypes.PROFILE_STATUS_REQUEST,
        [UserTypes.RECEIVED_STATUS, UserTypes.PROFILE_STATUS_SUCCESS],
        UserTypes.PROFILE_STATUS_FAILURE,
        userId
    );
}

export function setStatus(status: string): ActionFunc {
    return async (dispatch: DispatchFunc, getState: GetStateFunc) => {
        dispatch({type: UserTypes.SET_STATUS_REQUEST, data: null}, getState);

        try {
            await Client4.updateStatus(status);
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch, getState);
            dispatch(batchActions([
                {type: UserTypes.SET_STATUS_FAILURE, error},
                logError(error),
            ]), getState);
            return {error};
        }

        dispatch(batchActions([
            {
                type: UserTypes.RECEIVED_STATUS,
                data: status,
            },
            {
                type: UserTypes.SET_STATUS_SUCCESS,
            },
        ]), getState);

        return {data: status};
    };
}

export function getSessions(userId: string): ActionFunc {
    return bindClientFunc(
        Client4.getSessions,
        UserTypes.SESSIONS_REQUEST,
        [UserTypes.RECEIVED_SESSIONS, UserTypes.SESSIONS_SUCCESS],
        UserTypes.SESSIONS_FAILURE,
        userId
    );
}

export function revokeSession(userId: string, sessionId: string): ActionFunc {
    return async (dispatch: DispatchFunc, getState: GetStateFunc) => {
        dispatch({type: UserTypes.REVOKE_SESSION_REQUEST, data: null}, getState);

        try {
            await Client4.revokeSession(userId, sessionId);
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch, getState);
            dispatch(batchActions([
                {type: UserTypes.REVOKE_SESSION_FAILURE, error},
                logError(error),
            ]), getState);
            return {error};
        }

        dispatch(batchActions([
            {
                type: UserTypes.RECEIVED_REVOKED_SESSION,
                sessionId,
            },
            {
                type: UserTypes.REVOKE_SESSION_SUCCESS,
            },
        ]), getState);

        return {data: true};
    };
}

export function revokeAllSessionsForUser(userId: string): ActionFunc {
    return async (dispatch: DispatchFunc, getState: GetStateFunc) => {
        dispatch({type: UserTypes.REVOKE_ALL_USER_SESSIONS_REQUEST, data: null}, getState);

        try {
            await Client4.revokeAllSessionsForUser(userId);
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch, getState);
            dispatch(batchActions([
                {type: UserTypes.REVOKE_ALL_USER_SESSIONS_FAILURE, error},
                logError(error),
            ]), getState);
            return {error};
        }
        const data = {isCurrentUser: userId === getCurrentUserId(getState())};
        dispatch(batchActions([
            {
                type: UserTypes.REVOKE_ALL_USER_SESSIONS_SUCCESS,
                data,
            },
        ]), getState);

        return {data: true};
    };
}

export function loadProfilesForDirect(): ActionFunc {
    return async (dispatch: DispatchFunc, getState: GetStateFunc) => {
        const state = getState();
        const config = state.entities.general.config;
        const {channels, myMembers} = state.entities.channels;
        const {myPreferences} = state.entities.preferences;
        const {currentUserId, profiles} = state.entities.users;

        const values = Object.values(channels);
        for (let i = 0; i < values.length; i++) {
            const channel: any = values[i];
            const member = myMembers[channel.id];
            if (!isDirectChannel(channel) && !isGroupChannel(channel)) {
                continue;
            }

            if (member) {
                if (member.mention_count > 0 && isDirectChannel(channel)) {
                    const otherUserId = getUserIdFromChannelName(currentUserId, channel.name);
                    if (!isDirectChannelVisible(profiles[otherUserId] || otherUserId, config, myPreferences, channel)) {
                        makeDirectChannelVisibleIfNecessary(otherUserId)(dispatch, getState);
                    }
                } else if ((member.mention_count > 0 || member.msg_count < channel.total_msg_count) &&
                    isGroupChannel(channel) && !isGroupChannelVisible(config, myPreferences, channel)) {
                    makeGroupMessageVisibleIfNecessary(channel.id)(dispatch, getState);
                }
            }
        }

        return {data: true};
    };
}

export function getUserAudits(userId: string, page: number = 0, perPage: number = General.AUDITS_CHUNK_SIZE): ActionFunc {
    return bindClientFunc(
        Client4.getUserAudits,
        UserTypes.AUDITS_REQUEST,
        [UserTypes.RECEIVED_AUDITS, UserTypes.AUDITS_SUCCESS],
        UserTypes.AUDITS_FAILURE,
        userId,
        page,
        perPage
    );
}

export function autocompleteUsers(term: string, teamId: string = '', channelId: string = '', options: {|limit: number|} = {limit: General.AUTOCOMPLETE_LIMIT_DEFAULT}): ActionFunc {
    return async (dispatch: DispatchFunc, getState: GetStateFunc) => {
        dispatch({type: UserTypes.AUTOCOMPLETE_USERS_REQUEST, data: null}, getState);

        const {currentUserId} = getState().entities.users;

        let data;
        try {
            data = await Client4.autocompleteUsers(term, teamId, channelId, options);
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch, getState);
            dispatch(batchActions([
                {type: UserTypes.AUTOCOMPLETE_USERS_FAILURE, error},
                logError(error),
            ]), getState);
            return {error};
        }

        let users = [...data.users];
        if (data.out_of_channel) {
            users = [...users, ...data.out_of_channel];
        }
        removeUserFromList(currentUserId, users);

        const actions = [
            {
                type: UserTypes.RECEIVED_PROFILES_LIST,
                data: users,
            },
            {
                type: UserTypes.AUTOCOMPLETE_USERS_SUCCESS,
            },
        ];

        if (channelId) {
            actions.push(
                {
                    type: UserTypes.RECEIVED_PROFILES_LIST_IN_CHANNEL,
                    data: data.users,
                    id: channelId,
                }
            );
            actions.push(
                {
                    type: UserTypes.RECEIVED_PROFILES_LIST_NOT_IN_CHANNEL,
                    data: data.out_of_channel,
                    id: channelId,
                }
            );
        }

        if (teamId) {
            actions.push(
                {
                    type: UserTypes.RECEIVED_PROFILES_LIST_IN_TEAM,
                    data: users,
                    id: teamId,
                }
            );
        }

        dispatch(batchActions(actions), getState);

        return {data};
    };
}

export function searchProfiles(term: string, options: Object = {}): ActionFunc {
    return async (dispatch: DispatchFunc, getState: GetStateFunc) => {
        dispatch({type: UserTypes.SEARCH_PROFILES_REQUEST, data: null}, getState);

        const {currentUserId} = getState().entities.users;

        let profiles;
        try {
            profiles = await Client4.searchUsers(term, options);
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch, getState);
            dispatch(batchActions([
                {type: UserTypes.SEARCH_PROFILES_FAILURE, error},
                logError(error),
            ]), getState);
            return {error};
        }

        const actions = [{type: UserTypes.RECEIVED_PROFILES_LIST, data: removeUserFromList(currentUserId, [...profiles])}];

        if (options.in_channel_id) {
            actions.push({
                type: UserTypes.RECEIVED_PROFILES_LIST_IN_CHANNEL,
                data: profiles,
                id: options.in_channel_id,
            });
        }

        if (options.not_in_channel_id) {
            actions.push({
                type: UserTypes.RECEIVED_PROFILES_LIST_NOT_IN_CHANNEL,
                data: profiles,
                id: options.not_in_channel_id,
            });
        }

        if (options.team_id) {
            actions.push({
                type: UserTypes.RECEIVED_PROFILES_LIST_IN_TEAM,
                data: profiles,
                id: options.team_id,
            });
        }

        if (options.not_in_team_id) {
            actions.push({
                type: UserTypes.RECEIVED_PROFILES_LIST_NOT_IN_TEAM,
                data: profiles,
                id: options.not_in_team_id,
            });
        }

        dispatch(batchActions([
            ...actions,
            {
                type: UserTypes.SEARCH_PROFILES_SUCCESS,
            },
        ]), getState);

        return {data: profiles};
    };
}

let statusIntervalId = null;
export function startPeriodicStatusUpdates(): ActionFunc {
    return async (dispatch: DispatchFunc, getState: GetStateFunc) => {
        if (statusIntervalId) {
            clearInterval(statusIntervalId);
        }

        statusIntervalId = setInterval(
            () => {
                const {statuses} = getState().entities.users;

                if (!statuses) {
                    return;
                }

                const userIds = Object.keys(statuses);
                if (!userIds.length) {
                    return;
                }

                getStatusesByIds(userIds)(dispatch, getState);
            },
            General.STATUS_INTERVAL
        );

        return {data: true};
    };
}

export function stopPeriodicStatusUpdates(): ActionFunc {
    return async () => {
        if (statusIntervalId) {
            clearInterval(statusIntervalId);
        }

        return {data: true};
    };
}

export function updateMe(user: UserProfile): ActionFunc {
    return async (dispatch: DispatchFunc, getState: GetStateFunc) => {
        dispatch({type: UserTypes.UPDATE_ME_REQUEST, data: null}, getState);

        let data;
        try {
            data = await Client4.patchMe(user);
        } catch (error) {
            dispatch(batchActions([
                {type: UserTypes.UPDATE_ME_FAILURE, error},
                logError(error),
            ]), getState);
            return {error};
        }

        dispatch(batchActions([
            {type: UserTypes.RECEIVED_ME, data},
            {type: UserTypes.UPDATE_ME_SUCCESS},
        ]), getState);
        dispatch(loadRolesIfNeeded(data.roles.split(' ')));

        return {data};
    };
}

export function patchUser(user: UserProfile): ActionFunc {
    return async (dispatch: DispatchFunc, getState: GetStateFunc) => {
        dispatch({type: UserTypes.UPDATE_USER_REQUEST, data: null}, getState);

        let data: UserProfile;
        try {
            data = await Client4.patchUser(user);
        } catch (error) {
            dispatch(batchActions([
                {type: UserTypes.UPDATE_USER_FAILURE, error},
                logError(error),
            ]), getState);
            return {error};
        }

        dispatch(batchActions([
            {type: UserTypes.RECEIVED_PROFILE, data},
            {type: UserTypes.UPDATE_USER_SUCCESS},
        ]), getState);

        return {data};
    };
}

export function updateUserRoles(userId: string, roles: Array<string>): ActionFunc {
    return async (dispatch: DispatchFunc, getState: GetStateFunc) => {
        dispatch({type: UserTypes.UPDATE_USER_REQUEST, data: null}, getState);

        try {
            await Client4.updateUserRoles(userId, roles);
        } catch (error) {
            dispatch(batchActions([
                {type: UserTypes.UPDATE_USER_FAILURE, error},
                logError(error),
            ]), getState);
            return {error};
        }

        const actions = [
            {type: UserTypes.UPDATE_USER_SUCCESS},
        ];

        const profile = getState().entities.users.profiles[userId];
        if (profile) {
            actions.push({type: UserTypes.RECEIVED_PROFILE, data: {...profile, roles}});
        }

        dispatch(batchActions(actions), getState);

        return {data: true};
    };
}

export function updateUserMfa(userId: string, activate: boolean, code: string = ''): ActionFunc {
    return async (dispatch: DispatchFunc, getState: GetStateFunc) => {
        dispatch({type: UserTypes.UPDATE_USER_REQUEST, data: null}, getState);

        try {
            await Client4.updateUserMfa(userId, activate, code);
        } catch (error) {
            dispatch(batchActions([
                {type: UserTypes.UPDATE_USER_FAILURE, error},
                logError(error),
            ]), getState);
            return {error};
        }

        const actions = [
            {type: UserTypes.UPDATE_USER_SUCCESS},
        ];

        const profile = getState().entities.users.profiles[userId];
        if (profile) {
            actions.push({type: UserTypes.RECEIVED_PROFILE, data: {...profile, mfa_active: activate}});
        }

        dispatch(batchActions(actions), getState);

        return {data: true};
    };
}

export function updateUserPassword(userId: string, currentPassword: string, newPassword: string): ActionFunc {
    return async (dispatch: DispatchFunc, getState: GetStateFunc) => {
        dispatch({type: UserTypes.UPDATE_USER_REQUEST, data: null}, getState);

        try {
            await Client4.updateUserPassword(userId, currentPassword, newPassword);
        } catch (error) {
            dispatch(batchActions([
                {type: UserTypes.UPDATE_USER_FAILURE, error},
                logError(error),
            ]), getState);
            return {error};
        }

        const actions = [
            {type: UserTypes.UPDATE_USER_SUCCESS},
        ];

        const profile = getState().entities.users.profiles[userId];
        if (profile) {
            actions.push({type: UserTypes.RECEIVED_PROFILE, data: {...profile, last_password_update_at: new Date().getTime()}});
        }

        dispatch(batchActions(actions), getState);

        return {data: true};
    };
}

export function updateUserActive(userId: string, active: boolean): ActionFunc {
    return async (dispatch: DispatchFunc, getState: GetStateFunc) => {
        dispatch({type: UserTypes.UPDATE_USER_REQUEST, data: null}, getState);

        try {
            await Client4.updateUserActive(userId, active);
        } catch (error) {
            dispatch(batchActions([
                {type: UserTypes.UPDATE_USER_FAILURE, error},
                logError(error),
            ]), getState);
            return {error};
        }

        const actions = [
            {type: UserTypes.UPDATE_USER_SUCCESS},
        ];

        const profile = getState().entities.users.profiles[userId];
        if (profile) {
            const deleteAt = active ? 0 : new Date().getTime();
            actions.push({type: UserTypes.RECEIVED_PROFILE, data: {...profile, delete_at: deleteAt}});
        }

        dispatch(batchActions(actions), getState);

        return {data: true};
    };
}

export function verifyUserEmail(token: string): ActionFunc {
    return bindClientFunc(
        Client4.verifyUserEmail,
        UserTypes.VERIFY_EMAIL_REQUEST,
        UserTypes.VERIFY_EMAIL_SUCCESS,
        UserTypes.VERIFY_EMAIL_FAILURE,
        token
    );
}

export function sendVerificationEmail(email: string): ActionFunc {
    return bindClientFunc(
        Client4.sendVerificationEmail,
        UserTypes.VERIFY_EMAIL_REQUEST,
        UserTypes.VERIFY_EMAIL_SUCCESS,
        UserTypes.VERIFY_EMAIL_FAILURE,
        email
    );
}

export function resetUserPassword(token: string, newPassword: string): ActionFunc {
    return bindClientFunc(
        Client4.resetUserPassword,
        UserTypes.PASSWORD_RESET_REQUEST,
        UserTypes.PASSWORD_RESET_SUCCESS,
        UserTypes.PASSWORD_RESET_FAILURE,
        token,
        newPassword
    );
}

export function sendPasswordResetEmail(email: string): ActionFunc {
    return bindClientFunc(
        Client4.sendPasswordResetEmail,
        UserTypes.PASSWORD_RESET_REQUEST,
        UserTypes.PASSWORD_RESET_SUCCESS,
        UserTypes.PASSWORD_RESET_FAILURE,
        email
    );
}

export function setDefaultProfileImage(userId: string): ActionFunc {
    return async (dispatch: DispatchFunc, getState: GetStateFunc) => {
        dispatch({type: UserTypes.UPDATE_USER_REQUEST, data: null}, getState);

        try {
            await Client4.setDefaultProfileImage(userId);
        } catch (error) {
            dispatch(batchActions([
                {type: UserTypes.UPDATE_USER_FAILURE, error},
                logError(error),
            ]), getState);
            return {error};
        }

        const actions = [
            {type: UserTypes.UPDATE_USER_SUCCESS},
        ];

        const profile = getState().entities.users.profiles[userId];
        if (profile) {
            actions.push({type: UserTypes.RECEIVED_PROFILE, data: {...profile, last_picture_update: 0}});
        }

        dispatch(batchActions(actions), getState);

        return {data: true};
    };
}

export function uploadProfileImage(userId: string, imageData: any): ActionFunc {
    return async (dispatch: DispatchFunc, getState: GetStateFunc) => {
        dispatch({type: UserTypes.UPDATE_USER_REQUEST, data: null}, getState);

        try {
            await Client4.uploadProfileImage(userId, imageData);
        } catch (error) {
            dispatch(batchActions([
                {type: UserTypes.UPDATE_USER_FAILURE, error},
            ]), getState);
            return {error};
        }

        const actions = [
            {type: UserTypes.UPDATE_USER_SUCCESS},
        ];

        const profile = getState().entities.users.profiles[userId];
        if (profile) {
            actions.push({type: UserTypes.RECEIVED_PROFILE, data: {...profile, last_picture_update: new Date().getTime()}});
        }

        dispatch(batchActions(actions), getState);

        return {data: true};
    };
}

export function switchEmailToOAuth(service: string, email: string, password: string, mfaCode: string = ''): ActionFunc {
    return bindClientFunc(
        Client4.switchEmailToOAuth,
        UserTypes.SWITCH_LOGIN_REQUEST,
        UserTypes.SWITCH_LOGIN_SUCCESS,
        UserTypes.SWITCH_LOGIN_FAILURE,
        service,
        email,
        password,
        mfaCode
    );
}

export function switchOAuthToEmail(currentService: string, email: string, password: string): ActionFunc {
    return bindClientFunc(
        Client4.switchOAuthToEmail,
        UserTypes.SWITCH_LOGIN_REQUEST,
        UserTypes.SWITCH_LOGIN_SUCCESS,
        UserTypes.SWITCH_LOGIN_FAILURE,
        currentService,
        email,
        password
    );
}

export function switchEmailToLdap(email: string, emailPassword: string, ldapId: string, ldapPassword: string, mfaCode: string = ''): ActionFunc {
    return bindClientFunc(
        Client4.switchEmailToLdap,
        UserTypes.SWITCH_LOGIN_REQUEST,
        UserTypes.SWITCH_LOGIN_SUCCESS,
        UserTypes.SWITCH_LOGIN_FAILURE,
        email,
        emailPassword,
        ldapId,
        ldapPassword,
        mfaCode
    );
}

export function switchLdapToEmail(ldapPassword: string, email: string, emailPassword: string, mfaCode: string = ''): ActionFunc {
    return bindClientFunc(
        Client4.switchLdapToEmail,
        UserTypes.SWITCH_LOGIN_REQUEST,
        UserTypes.SWITCH_LOGIN_SUCCESS,
        UserTypes.SWITCH_LOGIN_FAILURE,
        ldapPassword,
        email,
        emailPassword,
        mfaCode
    );
}

export function createUserAccessToken(userId: string, description: string): ActionFunc {
    return async (dispatch: DispatchFunc, getState: GetStateFunc) => {
        dispatch({type: UserTypes.CREATE_USER_ACCESS_TOKEN_REQUEST, data: null});

        let data;
        try {
            data = await Client4.createUserAccessToken(userId, description);
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch, getState);
            dispatch(batchActions([
                {type: UserTypes.CREATE_USER_ACCESS_TOKEN_FAILURE, error},
                logError(error),
            ]), getState);
            return {error};
        }

        const actions = [
            {
                type: UserTypes.CREATE_USER_ACCESS_TOKEN_SUCCESS,
            },
            {
                type: AdminTypes.RECEIVED_USER_ACCESS_TOKEN,
                data: {...data, token: ''},
            },
        ];

        const {currentUserId} = getState().entities.users;
        if (userId === currentUserId) {
            actions.push(
                {
                    type: UserTypes.RECEIVED_MY_USER_ACCESS_TOKEN,
                    data: {...data, token: ''},
                }
            );
        }

        dispatch(batchActions(actions));

        return {data};
    };
}

export function getUserAccessToken(tokenId: string): ActionFunc {
    return async (dispatch: DispatchFunc, getState: GetStateFunc) => {
        dispatch({type: UserTypes.GET_USER_ACCESS_TOKEN_REQUEST, data: null});

        let data;
        try {
            data = await Client4.getUserAccessToken(tokenId);
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch, getState);
            dispatch(batchActions([
                {type: UserTypes.GET_USER_ACCESS_TOKEN_FAILURE, error},
                logError(error),
            ]), getState);
            return {error};
        }

        const actions = [
            {
                type: UserTypes.GET_USER_ACCESS_TOKEN_SUCCESS,
            },
            {
                type: AdminTypes.RECEIVED_USER_ACCESS_TOKEN,
                data,
            },
        ];

        const {currentUserId} = getState().entities.users;
        if (data.user_id === currentUserId) {
            actions.push(
                {
                    type: UserTypes.RECEIVED_MY_USER_ACCESS_TOKEN,
                    data,
                }
            );
        }

        dispatch(batchActions(actions));

        return {data};
    };
}

export function getUserAccessTokens(page: number = 0, perPage: number = General.PROFILE_CHUNK_SIZE): ActionFunc {
    return async (dispatch: DispatchFunc, getState: GetStateFunc) => {
        dispatch({type: UserTypes.GET_USER_ACCESS_TOKEN_REQUEST, data: null});
        let data;
        try {
            data = await Client4.getUserAccessTokens(page, perPage);
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch, getState);
            dispatch(batchActions([
                {type: UserTypes.GET_USER_ACCESS_TOKEN_FAILURE, error},
                logError(error),
            ]), getState);
            return {error};
        }

        const actions = [
            {
                type: UserTypes.GET_USER_ACCESS_TOKEN_SUCCESS,
            },
            {
                type: AdminTypes.RECEIVED_USER_ACCESS_TOKENS,
                data,
            },
        ];

        dispatch(batchActions(actions));

        return {data};
    };
}

export function getUserAccessTokensForUser(userId: string, page: number = 0, perPage: number = General.PROFILE_CHUNK_SIZE): ActionFunc {
    return async (dispatch: DispatchFunc, getState: GetStateFunc) => {
        dispatch({type: UserTypes.GET_USER_ACCESS_TOKEN_REQUEST, data: null});

        let data;
        try {
            data = await Client4.getUserAccessTokensForUser(userId, page, perPage);
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch, getState);
            dispatch(batchActions([
                {type: UserTypes.GET_USER_ACCESS_TOKEN_FAILURE, error},
                logError(error),
            ]), getState);
            return {error};
        }

        const actions = [
            {
                type: UserTypes.GET_USER_ACCESS_TOKEN_SUCCESS,
            },
            {
                type: AdminTypes.RECEIVED_USER_ACCESS_TOKENS_FOR_USER,
                data,
                userId,
            },
        ];

        const {currentUserId} = getState().entities.users;
        if (userId === currentUserId) {
            actions.push(
                {
                    type: UserTypes.RECEIVED_MY_USER_ACCESS_TOKENS,
                    data,
                }
            );
        }

        dispatch(batchActions(actions));

        return {data};
    };
}

export function revokeUserAccessToken(tokenId: string): ActionFunc {
    return async (dispatch: DispatchFunc, getState: GetStateFunc) => {
        dispatch({type: UserTypes.REVOKE_USER_ACCESS_TOKEN_REQUEST, data: null});

        try {
            await Client4.revokeUserAccessToken(tokenId);
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch, getState);
            dispatch(batchActions([
                {type: UserTypes.REVOKE_USER_ACCESS_TOKEN_FAILURE, error},
                logError(error),
            ]), getState);
            return {error};
        }

        dispatch(batchActions([
            {
                type: UserTypes.REVOKE_USER_ACCESS_TOKEN_SUCCESS,
            },
            {
                type: UserTypes.REVOKED_USER_ACCESS_TOKEN,
                data: tokenId,
            },
        ]));

        return {data: true};
    };
}

export function disableUserAccessToken(tokenId: string): ActionFunc {
    return async (dispatch: DispatchFunc, getState: GetStateFunc) => {
        dispatch({type: UserTypes.DISABLE_USER_ACCESS_TOKEN_REQUEST, data: null});

        try {
            await Client4.disableUserAccessToken(tokenId);
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch, getState);
            dispatch(batchActions([
                {type: UserTypes.DISABLE_USER_ACCESS_TOKEN_FAILURE, error},
                logError(error),
            ]), getState);
            return {error};
        }

        dispatch(batchActions([
            {
                type: UserTypes.DISABLE_USER_ACCESS_TOKEN_SUCCESS,
            },
            {
                type: UserTypes.DISABLED_USER_ACCESS_TOKEN,
                data: tokenId,
            },
        ]));

        return {data: true};
    };
}

export function enableUserAccessToken(tokenId: string): ActionFunc {
    return async (dispatch: DispatchFunc, getState: GetStateFunc) => {
        dispatch({type: UserTypes.ENABLE_USER_ACCESS_TOKEN_REQUEST, data: null});

        try {
            await Client4.enableUserAccessToken(tokenId);
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch, getState);
            dispatch(batchActions([
                {type: UserTypes.ENABLE_USER_ACCESS_TOKEN_FAILURE, error},
                logError(error),
            ]), getState);
            return {error};
        }

        dispatch(batchActions([
            {
                type: UserTypes.ENABLE_USER_ACCESS_TOKEN_SUCCESS,
            },
            {
                type: UserTypes.ENABLED_USER_ACCESS_TOKEN,
                data: tokenId,
            },
        ]));

        return {data: true};
    };
}

export function clearUserAccessTokens(): ActionFunc {
    return async (dispatch) => {
        dispatch({type: UserTypes.CLEAR_MY_USER_ACCESS_TOKENS, data: null});
        return {data: true};
    };
}

export default {
    checkMfa,
    generateMfaSecret,
    login,
    logout,
    getProfiles,
    getProfilesByIds,
    getProfilesInTeam,
    getProfilesInChannel,
    getProfilesNotInChannel,
    getUser,
    getMe,
    getUserByUsername,
    getStatus,
    getStatusesByIds,
    getSessions,
    getTotalUsersStats,
    loadProfilesForDirect,
    revokeSession,
    revokeAllSessionsForUser,
    getUserAudits,
    searchProfiles,
    startPeriodicStatusUpdates,
    stopPeriodicStatusUpdates,
    updateMe,
    updateUserRoles,
    updateUserMfa,
    updateUserPassword,
    updateUserActive,
    verifyUserEmail,
    sendVerificationEmail,
    resetUserPassword,
    sendPasswordResetEmail,
    uploadProfileImage,
    switchEmailToOAuth,
    switchOAuthToEmail,
    switchEmailToLdap,
    switchLdapToEmail,
    getTermsOfService,
    createTermsOfService,
    updateTermsOfServiceStatus,
    createUserAccessToken,
    getUserAccessToken,
    getUserAccessTokensForUser,
    revokeUserAccessToken,
    disableUserAccessToken,
    enableUserAccessToken,
};
