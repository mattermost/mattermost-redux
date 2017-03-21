// Copyright (c) 2016 Mattermost, Inc. All Rights Reserved.
// See License.txt for license information.

import {batchActions} from 'redux-batched-actions';
import {Client, Client4} from 'client';
import {General} from 'constants';
import {PreferenceTypes, UserTypes, TeamTypes} from 'action_types';
import {fetchTeams} from './teams';
import {getLogErrorAction} from './errors';
import {bindClientFunc, forceLogoutIfNecessary, debounce} from './helpers';

export function checkMfa(loginId) {
    return async (dispatch, getState) => {
        dispatch({type: UserTypes.CHECK_MFA_REQUEST}, getState);
        try {
            const mfa = await Client.checkMfa(loginId);
            dispatch({type: UserTypes.CHECK_MFA_SUCCESS}, getState);
            return mfa;
        } catch (error) {
            dispatch(batchActions([
                {type: UserTypes.CHECK_MFA_FAILURE, error},
                getLogErrorAction(error)
            ]), getState);
            return null;
        }
    };
}

export function createUser(user) {
    return async (dispatch, getState) => {
        dispatch({type: UserTypes.CREATE_USER_REQUEST}, getState);

        let created;
        try {
            created = await Client4.createUser(user);
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch);
            dispatch(batchActions([
                {
                    type: UserTypes.CREATE_USER_FAILURE,
                    error
                },
                getLogErrorAction(error)
            ]), getState);
            return null;
        }

        const profiles = {};
        profiles[created.id] = created;
        dispatch({type: UserTypes.RECEIVED_PROFILES, data: profiles});

        return created;
    };
}

export function login(loginId, password, mfaToken = '') {
    return async (dispatch, getState) => {
        dispatch({type: UserTypes.LOGIN_REQUEST}, getState);

        const deviceId = getState().entities.general.deviceToken;

        return Client.login(loginId, password, mfaToken, deviceId).
        then(async (data) => {
            let teamMembers;
            let preferences;
            try {
                const teamMembersRequest = Client.getMyTeamMembers();
                const preferencesRequest = Client.getMyPreferences();

                teamMembers = await teamMembersRequest;
                preferences = await preferencesRequest;
            } catch (error) {
                dispatch(batchActions([
                    {type: UserTypes.LOGIN_FAILURE, error},
                    getLogErrorAction(error)
                ]), getState);
                return;
            }

            try {
                await fetchTeams()(dispatch, getState);
            } catch (error) {
                forceLogoutIfNecessary(error, dispatch);
                dispatch(batchActions([
                    {type: UserTypes.LOGIN_FAILURE, error},
                    getLogErrorAction(error)
                ]), getState);
                return;
            }

            dispatch(batchActions([
                {
                    type: UserTypes.RECEIVED_ME,
                    data
                },
                {
                    type: PreferenceTypes.RECEIVED_PREFERENCES,
                    data: await preferences
                },
                {
                    type: TeamTypes.RECEIVED_MY_TEAM_MEMBERS,
                    data: await teamMembers
                },
                {
                    type: UserTypes.LOGIN_SUCCESS
                }
            ]), getState);
        }).
        catch((error) => {
            dispatch(batchActions([
                {type: UserTypes.LOGIN_FAILURE, error},
                getLogErrorAction(error)
            ]), getState);
            return;
        });
    };
}

export function loadMe() {
    return async (dispatch, getState) => {
        let user;
        dispatch({type: UserTypes.LOGIN_REQUEST}, getState);
        try {
            user = await Client.getMe();
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch);
            dispatch(batchActions([
                {type: UserTypes.LOGIN_FAILURE, error},
                getLogErrorAction(error)
            ]), getState);
            return;
        }

        const deviceId = getState().entities.general.deviceToken;
        if (deviceId) {
            Client.attachDevice(deviceId);
        }

        let preferences;
        dispatch({type: PreferenceTypes.MY_PREFERENCES_REQUEST}, getState);
        try {
            preferences = await Client.getMyPreferences();
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch);
            dispatch(batchActions([
                {type: PreferenceTypes.MY_PREFERENCES_FAILURE, error},
                getLogErrorAction(error)
            ]), getState);
            return;
        }

        try {
            await fetchTeams()(dispatch, getState);
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch);
            dispatch(batchActions([
                {type: TeamTypes.FETCH_TEAMS_FAILURE, error},
                getLogErrorAction(error)
            ]), getState);
            return;
        }

        let teamMembers;
        dispatch({type: TeamTypes.MY_TEAM_MEMBERS_REQUEST}, getState);
        try {
            teamMembers = await Client.getMyTeamMembers();
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch);
            dispatch(batchActions([
                {type: TeamTypes.MY_TEAM_MEMBERS_FAILURE, error},
                getLogErrorAction(error)
            ]), getState);
            return;
        }

        dispatch(batchActions([
            {
                type: UserTypes.RECEIVED_ME,
                data: user
            },
            {
                type: UserTypes.LOGIN_SUCCESS
            },
            {
                type: PreferenceTypes.RECEIVED_PREFERENCES,
                data: preferences
            },
            {
                type: PreferenceTypes.MY_PREFERENCES_SUCCESS
            },
            {
                type: TeamTypes.RECEIVED_MY_TEAM_MEMBERS,
                data: teamMembers
            },
            {
                type: TeamTypes.MY_TEAM_MEMBERS_SUCCESS
            }
        ]), getState);
    };
}

export function logout() {
    return bindClientFunc(
        Client.logout,
        UserTypes.LOGOUT_REQUEST,
        UserTypes.LOGOUT_SUCCESS,
        UserTypes.LOGOUT_FAILURE,
    );
}

export function getProfiles(offset, limit = General.PROFILE_CHUNK_SIZE) {
    return async (dispatch, getState) => {
        dispatch({type: UserTypes.PROFILES_REQUEST}, getState);

        let profiles;
        try {
            profiles = await Client.getProfiles(offset, limit);
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch);
            dispatch(batchActions([
                {type: UserTypes.PROFILES_FAILURE, error},
                getLogErrorAction(error)
            ]), getState);
            return null;
        }

        dispatch(batchActions([
            {
                type: UserTypes.RECEIVED_PROFILES,
                data: profiles
            },
            {
                type: UserTypes.PROFILES_SUCCESS
            }
        ]), getState);

        return profiles;
    };
}

export function getProfilesByIds(userIds) {
    return bindClientFunc(
        Client.getProfilesByIds,
        UserTypes.PROFILES_REQUEST,
        [UserTypes.RECEIVED_PROFILES, UserTypes.PROFILES_SUCCESS],
        UserTypes.PROFILES_FAILURE,
        userIds
    );
}

export function getProfilesInTeam(teamId, offset, limit = General.PROFILE_CHUNK_SIZE) {
    return async (dispatch, getState) => {
        dispatch({type: UserTypes.PROFILES_IN_TEAM_REQUEST}, getState);

        let profiles;
        try {
            profiles = await Client.getProfilesInTeam(teamId, offset, limit);
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch);
            dispatch(batchActions([
                {type: UserTypes.PROFILES_IN_TEAM_FAILURE, error},
                getLogErrorAction(error)
            ]), getState);
            return;
        }

        dispatch(batchActions([
            {
                type: UserTypes.RECEIVED_PROFILES_IN_TEAM,
                data: profiles,
                id: teamId
            },
            {
                type: UserTypes.RECEIVED_PROFILES,
                data: profiles
            },
            {
                type: UserTypes.PROFILES_IN_TEAM_SUCCESS
            }
        ]), getState);
    };
}

export function getProfilesInChannel(teamId, channelId, offset, limit = General.PROFILE_CHUNK_SIZE) {
    return async (dispatch, getState) => {
        dispatch({type: UserTypes.PROFILES_IN_CHANNEL_REQUEST}, getState);

        let profiles;
        try {
            profiles = await Client.getProfilesInChannel(teamId, channelId, offset, limit);
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch);
            dispatch(batchActions([
                {type: UserTypes.PROFILES_IN_CHANNEL_FAILURE, error},
                getLogErrorAction(error)
            ]), getState);
            return;
        }

        dispatch(batchActions([
            {
                type: UserTypes.RECEIVED_PROFILES_IN_CHANNEL,
                data: profiles,
                id: channelId
            },
            {
                type: UserTypes.RECEIVED_PROFILES,
                data: profiles
            },
            {
                type: UserTypes.PROFILES_IN_CHANNEL_SUCCESS
            }
        ]), getState);
    };
}

export function getProfilesNotInChannel(teamId, channelId, offset, limit = General.PROFILE_CHUNK_SIZE) {
    return async (dispatch, getState) => {
        dispatch({type: UserTypes.PROFILES_NOT_IN_CHANNEL_REQUEST}, getState);

        let profiles;
        try {
            profiles = await Client.getProfilesNotInChannel(teamId, channelId, offset, limit);
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch);
            dispatch(batchActions([
                {type: UserTypes.PROFILES_NOT_IN_CHANNEL_FAILURE, error},
                getLogErrorAction(error)
            ]), getState);
            return;
        }

        dispatch(batchActions([
            {
                type: UserTypes.RECEIVED_PROFILES_NOT_IN_CHANNEL,
                data: profiles,
                id: channelId
            },
            {
                type: UserTypes.RECEIVED_PROFILES,
                data: profiles
            },
            {
                type: UserTypes.PROFILES_NOT_IN_CHANNEL_SUCCESS
            }
        ]), getState);
    };
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
        Client.getStatusesByIds,
        UserTypes.PROFILES_STATUSES_REQUEST,
        [UserTypes.RECEIVED_STATUSES, UserTypes.PROFILES_STATUSES_SUCCESS],
        UserTypes.PROFILES_STATUSES_FAILURE,
        userIds
    );
}

export function getSessions(userId) {
    return bindClientFunc(
        Client.getSessions,
        UserTypes.SESSIONS_REQUEST,
        [UserTypes.RECEIVED_SESSIONS, UserTypes.SESSIONS_SUCCESS],
        UserTypes.SESSIONS_FAILURE,
        userId
    );
}

export function revokeSession(id) {
    return bindClientFunc(
        Client.revokeSession,
        UserTypes.REVOKE_SESSION_REQUEST,
        [UserTypes.RECEIVED_REVOKED_SESSION, UserTypes.REVOKE_SESSION_SUCCESS],
        UserTypes.REVOKE_SESSION_FAILURE,
        id
    );
}

export function getAudits(userId) {
    return bindClientFunc(
        Client.getAudits,
        UserTypes.AUDITS_REQUEST,
        [UserTypes.RECEIVED_AUDITS, UserTypes.AUDITS_SUCCESS],
        UserTypes.AUDITS_FAILURE,
        userId
    );
}

export function autocompleteUsersInChannel(teamId, channelId, term) {
    return async (dispatch, getState) => {
        dispatch({type: UserTypes.AUTOCOMPLETE_IN_CHANNEL_REQUEST}, getState);

        let data;
        try {
            data = await Client.autocompleteUsersInChannel(teamId, channelId, term);
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch);
            dispatch(batchActions([
                {type: UserTypes.AUTOCOMPLETE_IN_CHANNEL_FAILURE, error},
                getLogErrorAction(error)
            ]), getState);
            return;
        }

        dispatch(batchActions([
            {
                type: UserTypes.RECEIVED_AUTOCOMPLETE_IN_CHANNEL,
                data,
                channelId
            },
            {
                type: UserTypes.AUTOCOMPLETE_IN_CHANNEL_SUCCESS
            }
        ]), getState);
    };
}

export function searchProfiles(term, options) {
    return bindClientFunc(
        Client.searchProfiles,
        UserTypes.SEARCH_PROFILES_REQUEST,
        [UserTypes.RECEIVED_SEARCH_PROFILES, UserTypes.SEARCH_PROFILES_SUCCESS],
        UserTypes.SEARCH_PROFILES_FAILURE,
        term,
        options
    );
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

export function updateUserNotifyProps(notifyProps) {
    return async (dispatch, getState) => {
        dispatch({type: UserTypes.UPDATE_NOTIFY_PROPS_REQUEST}, getState);

        let data;
        try {
            data = await Client.updateUserNotifyProps(notifyProps);
        } catch (error) {
            dispatch({type: UserTypes.UPDATE_NOTIFY_PROPS_FAILURE, error}, getState);
            return;
        }

        dispatch(batchActions([
            {type: UserTypes.RECEIVED_ME, data},
            {type: UserTypes.UPDATE_NOTIFY_PROPS_SUCCESS}
        ]), getState);
    };
}

export default {
    checkMfa,
    login,
    logout,
    getProfiles,
    getProfilesByIds,
    getProfilesInTeam,
    getProfilesInChannel,
    getProfilesNotInChannel,
    getStatusesByIds,
    getSessions,
    revokeSession,
    getAudits,
    searchProfiles,
    startPeriodicStatusUpdates,
    stopPeriodicStatusUpdates,
    updateUserNotifyProps
};
