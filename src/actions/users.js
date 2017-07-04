// Copyright (c) 2016-present Mattermost, Inc. All Rights Reserved.
// See License.txt for license information.

import {batchActions} from 'redux-batched-actions';
import {Client, Client4} from 'client';
import {General} from 'constants';
import {UserTypes, TeamTypes} from 'action_types';
import {getAllCustomEmojis} from './emojis';
import {getMyTeams, getMyTeamMembers, getMyTeamUnreads} from './teams';

import {
    getUserIdFromChannelName,
    isDirectChannel,
    isDirectChannelVisible,
    isGroupChannel,
    isGroupChannelVisible
} from 'utils/channel_utils';

import {removeUserFromList} from 'utils/user_utils';

import {logError} from './errors';
import {bindClientFunc, forceLogoutIfNecessary, debounce} from './helpers';
import {
    getMyPreferences,
    makeDirectChannelVisibleIfNecessary,
    makeGroupMessageVisibleIfNecessary
} from './preferences';

import {getConfig} from 'selectors/entities/general';

export function checkMfa(loginId) {
    return async (dispatch, getState) => {
        dispatch({type: UserTypes.CHECK_MFA_REQUEST}, getState);
        try {
            const data = await Client4.checkUserMfa(loginId);
            dispatch({type: UserTypes.CHECK_MFA_SUCCESS}, getState);
            return data.mfa_required;
        } catch (error) {
            dispatch(batchActions([
                {type: UserTypes.CHECK_MFA_FAILURE, error},
                logError(error)(dispatch)
            ]), getState);
            return null;
        }
    };
}

export function generateMfaSecret(userId) {
    return bindClientFunc(
        Client4.generateMfaSecret,
        UserTypes.MFA_SECRET_REQUEST,
        UserTypes.MFA_SECRET_SUCCESS,
        UserTypes.MFA_SECRET_FAILURE,
        userId
    );
}

export function createUser(user, data, hash, inviteId) {
    return async (dispatch, getState) => {
        dispatch({type: UserTypes.CREATE_USER_REQUEST}, getState);

        let created;
        try {
            created = await Client4.createUser(user, data, hash, inviteId);
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch);
            dispatch(batchActions([
                {
                    type: UserTypes.CREATE_USER_FAILURE,
                    error
                },
                logError(error)(dispatch)
            ]), getState);
            return null;
        }

        const profiles = {};
        profiles[created.id] = created;
        dispatch({type: UserTypes.RECEIVED_PROFILES, data: profiles});

        return created;
    };
}

export function login(loginId, password, mfaToken = '', ldapOnly = false) {
    return async (dispatch, getState) => {
        dispatch({type: UserTypes.LOGIN_REQUEST}, getState);

        const deviceId = getState().entities.general.deviceToken;

        let data;
        try {
            data = await Client4.login(loginId, password, mfaToken, deviceId, ldapOnly);
            Client.setToken(Client4.getToken());
        } catch (error) {
            dispatch(batchActions([
                {
                    type: UserTypes.LOGIN_FAILURE,
                    error
                },
                logError(error)(dispatch)
            ]), getState);
            return false;
        }

        return await completeLogin(data)(dispatch, getState);
    };
}

export function loginById(id, password, mfaToken = '') {
    return async (dispatch, getState) => {
        dispatch({type: UserTypes.LOGIN_REQUEST}, getState);

        const deviceId = getState().entities.general.deviceToken;

        let data;
        try {
            data = await Client4.loginById(id, password, mfaToken, deviceId);
        } catch (error) {
            dispatch(batchActions([
                {
                    type: UserTypes.LOGIN_FAILURE,
                    error
                },
                logError(error)(dispatch)
            ]), getState);
            return null;
        }

        return await completeLogin(data)(dispatch, getState);
    };
}

function completeLogin(data) {
    return async (dispatch, getState) => {
        dispatch({
            type: UserTypes.RECEIVED_ME,
            data
        });

        let teamMembers;
        try {
            teamMembers = await Client4.getMyTeamMembers();
            const teamUnreads = await Client4.getMyTeamUnreads();

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
                logError(error)(dispatch)
            ]), getState);
            return false;
        }

        const promises = [
            getMyPreferences()(dispatch, getState),
            getMyTeams()(dispatch, getState)
        ];

        const state = getState();
        if (getConfig(state).EnableCustomEmoji === 'true') {
            promises.push(getAllCustomEmojis()(dispatch, getState));
        }

        try {
            await Promise.all(promises);
        } catch (error) {
            dispatch(batchActions([
                {type: UserTypes.LOGIN_FAILURE, error},
                logError(error)(dispatch)
            ]), getState);
            return false;
        }

        dispatch(batchActions([
            {
                type: TeamTypes.RECEIVED_MY_TEAM_MEMBERS,
                data: await teamMembers
            },
            {
                type: UserTypes.LOGIN_SUCCESS
            }
        ]), getState);

        return true;
    };
}

export function loadMe() {
    return async (dispatch, getState) => {
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
            getMyTeamUnreads()(dispatch, getState)
        ];

        if (getConfig(state).EnableCustomEmoji === 'true') {
            promises.push(getAllCustomEmojis()(dispatch, getState));
        }

        await Promise.all(promises);
    };
}

export function logout() {
    return bindClientFunc(
        Client4.logout,
        UserTypes.LOGOUT_REQUEST,
        UserTypes.LOGOUT_SUCCESS,
        UserTypes.LOGOUT_FAILURE,
    );
}

export function getProfiles(page = 0, perPage = General.PROFILE_CHUNK_SIZE) {
    return async (dispatch, getState) => {
        dispatch({type: UserTypes.PROFILES_REQUEST}, getState);

        const {currentUserId} = getState().entities.users;

        let profiles;
        try {
            profiles = await Client4.getProfiles(page, perPage);
            removeUserFromList(currentUserId, profiles);
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch);
            dispatch(batchActions([
                {type: UserTypes.PROFILES_FAILURE, error},
                logError(error)(dispatch)
            ]), getState);
            return null;
        }

        dispatch(batchActions([
            {
                type: UserTypes.RECEIVED_PROFILES_LIST,
                data: profiles
            },
            {
                type: UserTypes.PROFILES_SUCCESS
            }
        ]), getState);

        return profiles;
    };
}

export function getMissingProfilesByIds(userIds) {
    return async (dispatch, getState) => {
        const {profiles} = getState().entities.users;

        const missingIds = [];
        userIds.forEach((id) => {
            if (!profiles[id]) {
                missingIds.push(id);
            }
        });

        if (missingIds.length > 0) {
            return await getProfilesByIds(missingIds)(dispatch, getState);
        }

        return [];
    };
}

export function getProfilesByIds(userIds) {
    return bindClientFunc(
        Client4.getProfilesByIds,
        UserTypes.PROFILES_REQUEST,
        [UserTypes.RECEIVED_PROFILES_LIST, UserTypes.PROFILES_SUCCESS],
        UserTypes.PROFILES_FAILURE,
        userIds
    );
}

export function getProfilesInTeam(teamId, page, perPage = General.PROFILE_CHUNK_SIZE) {
    return async (dispatch, getState) => {
        dispatch({type: UserTypes.PROFILES_IN_TEAM_REQUEST}, getState);

        const {currentUserId} = getState().entities.users;

        let profiles;
        try {
            profiles = await Client4.getProfilesInTeam(teamId, page, perPage);
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch);
            dispatch(batchActions([
                {type: UserTypes.PROFILES_IN_TEAM_FAILURE, error},
                logError(error)(dispatch)
            ]), getState);
            return null;
        }

        dispatch(batchActions([
            {
                type: UserTypes.RECEIVED_PROFILES_LIST_IN_TEAM,
                data: profiles,
                id: teamId
            },
            {
                type: UserTypes.RECEIVED_PROFILES_LIST,
                data: removeUserFromList(currentUserId, [...profiles])
            },
            {
                type: UserTypes.PROFILES_IN_TEAM_SUCCESS
            }
        ]), getState);

        return profiles;
    };
}

export function getProfilesNotInTeam(teamId, page, perPage = General.PROFILE_CHUNK_SIZE) {
    return async (dispatch, getState) => {
        dispatch({type: UserTypes.PROFILES_NOT_IN_TEAM_REQUEST}, getState);

        let profiles;
        try {
            profiles = await Client4.getProfilesNotInTeam(teamId, page, perPage);
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch);
            dispatch(batchActions([
                {type: UserTypes.PROFILES_NOT_IN_TEAM_FAILURE, error},
                logError(error)(dispatch)
            ]), getState);
            return null;
        }

        dispatch(batchActions([
            {
                type: UserTypes.RECEIVED_PROFILES_LIST_NOT_IN_TEAM,
                data: profiles,
                id: teamId
            },
            {
                type: UserTypes.RECEIVED_PROFILES_LIST,
                data: profiles
            },
            {
                type: UserTypes.PROFILES_NOT_IN_TEAM_SUCCESS
            }
        ]), getState);

        return profiles;
    };
}

export function getProfilesWithoutTeam(page, perPage = General.PROFILE_CHUNK_SIZE) {
    return async (dispatch, getState) => {
        dispatch({type: UserTypes.PROFILES_WITHOUT_TEAM_REQUEST}, getState);

        let profiles;
        try {
            profiles = await Client4.getProfilesWithoutTeam(page, perPage);
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch);
            dispatch(batchActions([
                {type: UserTypes.PROFILES_WITHOUT_TEAM_FAILURE, error},
                logError(error)(dispatch)
            ]), getState);
            return null;
        }

        dispatch(batchActions([
            {
                type: UserTypes.RECEIVED_PROFILES_LIST_WITHOUT_TEAM,
                data: profiles
            },
            {
                type: UserTypes.RECEIVED_PROFILES_LIST,
                data: profiles
            },
            {
                type: UserTypes.PROFILES_WITHOUT_TEAM_SUCCESS
            }
        ]), getState);

        return profiles;
    };
}

export function getProfilesInChannel(channelId, page, perPage = General.PROFILE_CHUNK_SIZE) {
    return async (dispatch, getState) => {
        dispatch({type: UserTypes.PROFILES_IN_CHANNEL_REQUEST}, getState);

        const {currentUserId} = getState().entities.users;

        let profiles;
        try {
            profiles = await Client4.getProfilesInChannel(channelId, page, perPage);
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch);
            dispatch(batchActions([
                {type: UserTypes.PROFILES_IN_CHANNEL_FAILURE, error},
                logError(error)(dispatch)
            ]), getState);
            return null;
        }

        dispatch(batchActions([
            {
                type: UserTypes.RECEIVED_PROFILES_LIST_IN_CHANNEL,
                data: profiles,
                id: channelId
            },
            {
                type: UserTypes.RECEIVED_PROFILES_LIST,
                data: removeUserFromList(currentUserId, [...profiles])
            },
            {
                type: UserTypes.PROFILES_IN_CHANNEL_SUCCESS
            }
        ]), getState);

        return profiles;
    };
}

export function getProfilesNotInChannel(teamId, channelId, page, perPage = General.PROFILE_CHUNK_SIZE) {
    return async (dispatch, getState) => {
        dispatch({type: UserTypes.PROFILES_NOT_IN_CHANNEL_REQUEST}, getState);

        const {currentUserId} = getState().entities.users;

        let profiles;
        try {
            profiles = await Client4.getProfilesNotInChannel(teamId, channelId, page, perPage);
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch);
            dispatch(batchActions([
                {type: UserTypes.PROFILES_NOT_IN_CHANNEL_FAILURE, error},
                logError(error)(dispatch)
            ]), getState);
            return null;
        }

        dispatch(batchActions([
            {
                type: UserTypes.RECEIVED_PROFILES_LIST_NOT_IN_CHANNEL,
                data: profiles,
                id: channelId
            },
            {
                type: UserTypes.RECEIVED_PROFILES_LIST,
                data: removeUserFromList(currentUserId, [...profiles])
            },
            {
                type: UserTypes.PROFILES_NOT_IN_CHANNEL_SUCCESS
            }
        ]), getState);

        return profiles;
    };
}

export function getMe() {
    return bindClientFunc(
        Client4.getMe,
        UserTypes.USER_REQUEST,
        [UserTypes.RECEIVED_ME, UserTypes.USER_SUCCESS],
        UserTypes.USER_FAILURE
    );
}

export function getUser(id) {
    return bindClientFunc(
        Client4.getUser,
        UserTypes.USER_REQUEST,
        [UserTypes.RECEIVED_PROFILE, UserTypes.USER_SUCCESS],
        UserTypes.USER_FAILURE,
        id
    );
}

export function getUserByUsername(username) {
    return bindClientFunc(
        Client4.getUserByUsername,
        UserTypes.USER_BY_USERNAME_REQUEST,
        [UserTypes.RECEIVED_PROFILE, UserTypes.USER_BY_USERNAME_SUCCESS],
        UserTypes.USER_BY_USERNAME_FAILURE,
        username
    );
}

// We create an array to hold the id's that we want to get a status for. We build our
// debounced function that will get called after a set period of idle time in which
// the array of id's will be passed to the getStatusesByIds with a cb that clears out
// the array. Helps with performance because instead of making 75 different calls for
// statuses, we are only making one call for 75 ids.
// We could maybe clean it up somewhat by storing the array of ids in redux state possbily?
let ids = [];
const debouncedGetStatusesByIds = debounce(async (dispatch, getState) => {
    getStatusesByIds([...new Set(ids)])(dispatch, getState);
}, 20, false, () => {
    ids = [];
});
export function getStatusesByIdsBatchedDebounced(id) {
    ids = [...ids, id];
    return debouncedGetStatusesByIds;
}

export function getStatusesByIds(userIds) {
    return bindClientFunc(
        Client4.getStatusesByIds,
        UserTypes.PROFILES_STATUSES_REQUEST,
        [UserTypes.RECEIVED_STATUSES, UserTypes.PROFILES_STATUSES_SUCCESS],
        UserTypes.PROFILES_STATUSES_FAILURE,
        userIds
    );
}

export function getStatus(userId) {
    return bindClientFunc(
        Client4.getStatus,
        UserTypes.PROFILE_STATUS_REQUEST,
        [UserTypes.RECEIVED_STATUS, UserTypes.PROFILE_STATUS_SUCCESS],
        UserTypes.PROFILE_STATUS_FAILURE,
        userId
    );
}

export function setStatus(status) {
    return async (dispatch, getState) => {
        dispatch({type: UserTypes.SET_STATUS_REQUEST}, getState);

        try {
            await Client4.updateStatus(status);
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch);
            dispatch(batchActions([
                {type: UserTypes.SET_STATUS_FAILURE, error},
                logError(error)(dispatch)
            ]), getState);
            return null;
        }

        dispatch(batchActions([
            {
                type: UserTypes.RECEIVED_STATUS,
                data: status
            },
            {
                type: UserTypes.SET_STATUS_SUCCESS
            }
        ]), getState);

        return status;
    };
}

export function getSessions(userId) {
    return bindClientFunc(
        Client4.getSessions,
        UserTypes.SESSIONS_REQUEST,
        [UserTypes.RECEIVED_SESSIONS, UserTypes.SESSIONS_SUCCESS],
        UserTypes.SESSIONS_FAILURE,
        userId
    );
}

export function revokeSession(userId, sessionId) {
    return async (dispatch, getState) => {
        dispatch({type: UserTypes.REVOKE_SESSION_REQUEST}, getState);

        try {
            await Client4.revokeSession(userId, sessionId);
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch);
            dispatch(batchActions([
                {type: UserTypes.REVOKE_SESSION_FAILURE, error},
                logError(error)(dispatch)
            ]), getState);
            return false;
        }

        dispatch(batchActions([
            {
                type: UserTypes.RECEIVED_REVOKED_SESSION,
                sessionId
            },
            {
                type: UserTypes.REVOKE_SESSION_SUCCESS
            }
        ]), getState);

        return true;
    };
}

export function loadProfilesForDirect() {
    return async (dispatch, getState) => {
        const state = getState();
        const {channels, myMembers} = state.entities.channels;
        const {myPreferences} = state.entities.preferences;
        const {currentUserId} = state.entities.users;

        const values = Object.values(channels);
        for (let i = 0; i < values.length; i++) {
            const channel = values[i];
            const member = myMembers[channel.id];
            if (!isDirectChannel(channel) && !isGroupChannel(channel)) {
                continue;
            }

            if (member) {
                if (member.mention_count > 0 && isDirectChannel(channel) && !isDirectChannelVisible(currentUserId, myPreferences, channel)) {
                    const otherUserId = getUserIdFromChannelName(currentUserId, channel.name);
                    makeDirectChannelVisibleIfNecessary(otherUserId)(dispatch, getState);
                } else if ((member.mention_count > 0 || member.msg_count < channel.total_msg_count) &&
                    isGroupChannel(channel) && !isGroupChannelVisible(myPreferences, channel)) {
                    makeGroupMessageVisibleIfNecessary(channel.id)(dispatch, getState);
                }
            }
        }
    };
}

export function getUserAudits(userId, page = 0, perPage = General.AUDITS_CHUNK_SIZE) {
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

export function autocompleteUsers(term, teamId = '', channelId = '') {
    return async (dispatch, getState) => {
        dispatch({type: UserTypes.AUTOCOMPLETE_USERS_REQUEST}, getState);

        const {currentUserId} = getState().entities.users;

        let data;
        try {
            data = await Client4.autocompleteUsers(term, teamId, channelId);
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch);
            dispatch(batchActions([
                {type: UserTypes.AUTOCOMPLETE_USERS_FAILURE, error},
                logError(error)(dispatch)
            ]), getState);
            return null;
        }

        let users = [...data.users];
        if (data.out_of_channel) {
            users = [...users, ...data.out_of_channel];
        }
        removeUserFromList(currentUserId, users);

        const actions = [
            {
                type: UserTypes.RECEIVED_PROFILES_LIST,
                data: users
            },
            {
                type: UserTypes.AUTOCOMPLETE_USERS_SUCCESS
            }
        ];

        if (channelId) {
            actions.push(
                {
                    type: UserTypes.RECEIVED_PROFILES_LIST_IN_CHANNEL,
                    data: data.users,
                    id: channelId
                }
            );
            actions.push(
                {
                    type: UserTypes.RECEIVED_PROFILES_LIST_NOT_IN_CHANNEL,
                    data: data.out_of_channel,
                    id: channelId
                }
            );
        }

        if (teamId) {
            actions.push(
                {
                    type: UserTypes.RECEIVED_PROFILES_LIST_IN_TEAM,
                    data: users,
                    id: teamId
                }
            );
        }

        dispatch(batchActions(actions), getState);

        return data;
    };
}

export function searchProfiles(term, options = {}) {
    return async (dispatch, getState) => {
        dispatch({type: UserTypes.SEARCH_PROFILES_REQUEST}, getState);

        const {currentUserId} = getState().entities.users;

        let profiles;
        try {
            profiles = await Client4.searchUsers(term, options);
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch);
            dispatch(batchActions([
                {type: UserTypes.SEARCH_PROFILES_FAILURE, error},
                logError(error)(dispatch)
            ]), getState);
            return null;
        }

        const actions = [{type: UserTypes.RECEIVED_PROFILES_LIST, data: removeUserFromList(currentUserId, [...profiles])}];

        if (options.in_channel_id) {
            actions.push({
                type: UserTypes.RECEIVED_PROFILES_LIST_IN_CHANNEL,
                data: profiles,
                id: options.in_channel_id
            });
        }

        if (options.not_in_channel_id) {
            actions.push({
                type: UserTypes.RECEIVED_PROFILES_LIST_NOT_IN_CHANNEL,
                data: profiles,
                id: options.not_in_channel_id
            });
        }

        if (options.team_id) {
            actions.push({
                type: UserTypes.RECEIVED_PROFILES_LIST_IN_TEAM,
                data: profiles,
                id: options.team_id
            });
        }

        if (options.not_in_team_id) {
            actions.push({
                type: UserTypes.RECEIVED_PROFILES_LIST_NOT_IN_TEAM,
                data: profiles,
                id: options.not_in_team_id
            });
        }

        dispatch(batchActions([
            ...actions,
            {
                type: UserTypes.SEARCH_PROFILES_SUCCESS
            }
        ]), getState);

        return profiles;
    };
}

let statusIntervalId = '';
export function startPeriodicStatusUpdates() {
    return async (dispatch, getState) => {
        clearInterval(statusIntervalId);

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
    };
}

export function stopPeriodicStatusUpdates() {
    return async () => {
        if (statusIntervalId) {
            clearInterval(statusIntervalId);
        }
    };
}

export function updateMe(user) {
    return async (dispatch, getState) => {
        dispatch({type: UserTypes.UPDATE_ME_REQUEST}, getState);

        let data;
        try {
            data = await Client4.patchMe(user);
        } catch (error) {
            dispatch({type: UserTypes.UPDATE_ME_FAILURE, error}, getState);
            return null;
        }

        dispatch(batchActions([
            {type: UserTypes.RECEIVED_ME, data},
            {type: UserTypes.UPDATE_ME_SUCCESS}
        ]), getState);

        return data;
    };
}

export function updateUserRoles(userId, roles) {
    return async (dispatch, getState) => {
        dispatch({type: UserTypes.UPDATE_USER_REQUEST}, getState);

        try {
            await Client4.updateUserRoles(userId, roles);
        } catch (error) {
            dispatch({type: UserTypes.UPDATE_USER_FAILURE, error}, getState);
            return null;
        }

        const actions = [
            {type: UserTypes.UPDATE_USER_SUCCESS}
        ];

        const profile = getState().entities.users.profiles[userId];
        if (profile) {
            actions.push({type: UserTypes.RECEIVED_PROFILE, data: {...profile, roles}});
        }

        dispatch(batchActions(actions), getState);

        return true;
    };
}

export function updateUserMfa(userId, activate, code = '') {
    return async (dispatch, getState) => {
        dispatch({type: UserTypes.UPDATE_USER_REQUEST}, getState);

        try {
            await Client4.updateUserMfa(userId, activate, code);
        } catch (error) {
            dispatch({type: UserTypes.UPDATE_USER_FAILURE, error}, getState);
            return null;
        }

        const actions = [
            {type: UserTypes.UPDATE_USER_SUCCESS}
        ];

        const profile = getState().entities.users.profiles[userId];
        if (profile) {
            actions.push({type: UserTypes.RECEIVED_PROFILE, data: {...profile, mfa_active: activate}});
        }

        dispatch(batchActions(actions), getState);

        return true;
    };
}

export function updateUserPassword(userId, currentPassword, newPassword) {
    return async (dispatch, getState) => {
        dispatch({type: UserTypes.UPDATE_USER_REQUEST}, getState);

        try {
            await Client4.updateUserPassword(userId, currentPassword, newPassword);
        } catch (error) {
            dispatch({type: UserTypes.UPDATE_USER_FAILURE, error}, getState);
            return null;
        }

        const actions = [
            {type: UserTypes.UPDATE_USER_SUCCESS}
        ];

        const profile = getState().entities.users.profiles[userId];
        if (profile) {
            actions.push({type: UserTypes.RECEIVED_PROFILE, data: {...profile, last_password_update_at: new Date().getTime()}});
        }

        dispatch(batchActions(actions), getState);

        return true;
    };
}

export function updateUserActive(userId, active) {
    return async (dispatch, getState) => {
        dispatch({type: UserTypes.UPDATE_USER_REQUEST}, getState);

        try {
            await Client4.updateUserActive(userId, active);
        } catch (error) {
            dispatch({type: UserTypes.UPDATE_USER_FAILURE, error}, getState);
            return null;
        }

        const actions = [
            {type: UserTypes.UPDATE_USER_SUCCESS}
        ];

        const profile = getState().entities.users.profiles[userId];
        if (profile) {
            const deleteAt = active ? 0 : new Date().getTime();
            actions.push({type: UserTypes.RECEIVED_PROFILE, data: {...profile, delete_at: deleteAt}});
        }

        dispatch(batchActions(actions), getState);

        return true;
    };
}

export function verifyUserEmail(token) {
    return bindClientFunc(
        Client4.verifyUserEmail,
        UserTypes.VERIFY_EMAIL_REQUEST,
        UserTypes.VERIFY_EMAIL_SUCCESS,
        UserTypes.VERIFY_EMAIL_FAILURE,
        token
    );
}

export function sendVerificationEmail(email) {
    return bindClientFunc(
        Client4.sendVerificationEmail,
        UserTypes.VERIFY_EMAIL_REQUEST,
        UserTypes.VERIFY_EMAIL_SUCCESS,
        UserTypes.VERIFY_EMAIL_FAILURE,
        email
    );
}

export function resetUserPassword(token, newPassword) {
    return bindClientFunc(
        Client4.resetUserPassword,
        UserTypes.PASSWORD_RESET_REQUEST,
        UserTypes.PASSWORD_RESET_SUCCESS,
        UserTypes.PASSWORD_RESET_FAILURE,
        token,
        newPassword
    );
}

export function sendPasswordResetEmail(email) {
    return bindClientFunc(
        Client4.sendPasswordResetEmail,
        UserTypes.PASSWORD_RESET_REQUEST,
        UserTypes.PASSWORD_RESET_SUCCESS,
        UserTypes.PASSWORD_RESET_FAILURE,
        email
    );
}

export function uploadProfileImage(userId, imageData) {
    return async (dispatch, getState) => {
        dispatch({type: UserTypes.UPDATE_USER_REQUEST}, getState);

        try {
            await Client4.uploadProfileImage(userId, imageData);
        } catch (error) {
            dispatch({type: UserTypes.UPDATE_USER_FAILURE, error}, getState);
            return null;
        }

        const actions = [
            {type: UserTypes.UPDATE_USER_SUCCESS}
        ];

        const profile = getState().entities.users.profiles[userId];
        if (profile) {
            actions.push({type: UserTypes.RECEIVED_PROFILE, data: {...profile, last_picture_update: new Date().getTime()}});
        }

        dispatch(batchActions(actions), getState);

        return true;
    };
}

export function switchEmailToOAuth(service, email, password, mfaCode = '') {
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

export function switchOAuthToEmail(currentService, email, password) {
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

export function switchEmailToLdap(email, emailPassword, ldapId, ldapPassword, mfaCode = '') {
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

export function switchLdapToEmail(ldapPassword, email, emailPassword, mfaCode = '') {
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
    loadProfilesForDirect,
    revokeSession,
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
    switchLdapToEmail
};
