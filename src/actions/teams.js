// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
// @flow

import {batchActions} from 'redux-batched-actions';
import {Client4} from 'client';
import {General} from 'constants';
import {ChannelTypes, TeamTypes, UserTypes} from 'action_types';
import EventEmitter from 'utils/event_emitter';

import {logError} from './errors';
import {bindClientFunc, forceLogoutIfNecessary} from './helpers';
import {getProfilesByIds, getStatusesByIds} from './users';
import {loadRolesIfNeeded} from './roles';

import type {GetStateFunc, DispatchFunc, ActionFunc, ActionResult} from 'types/actions';
import type {Team} from 'types/teams';
import {isCompatibleWithJoinViewTeamPermissions} from 'selectors/entities/general';

async function getProfilesAndStatusesForMembers(userIds, dispatch, getState) {
    const {currentUserId, profiles, statuses} = getState().entities.users;
    const profilesToLoad = [];
    const statusesToLoad = [];

    userIds.forEach((userId) => {
        if (!profiles[userId] && !profilesToLoad.includes(userId) && userId !== currentUserId) {
            profilesToLoad.push(userId);
        }

        if (!statuses[userId] && !statusesToLoad.includes(userId) && userId !== currentUserId) {
            statusesToLoad.push(userId);
        }
    });

    const requests = [];

    if (profilesToLoad.length) {
        requests.push(getProfilesByIds(profilesToLoad)(dispatch, getState));
    }

    if (statusesToLoad.length) {
        requests.push(getStatusesByIds(statusesToLoad)(dispatch, getState));
    }

    await Promise.all(requests);
}

export function selectTeam(team: Team): ActionFunc {
    return async (dispatch: DispatchFunc, getState: GetStateFunc) => {
        dispatch({
            type: TeamTypes.SELECT_TEAM,
            data: team.id,
        }, getState);

        return {data: true};
    };
}

export function getMyTeams(): ActionFunc {
    return bindClientFunc({
        clientFunc: Client4.getMyTeams,
        onRequest: TeamTypes.MY_TEAMS_REQUEST,
        onSuccess: [TeamTypes.RECEIVED_TEAMS_LIST, TeamTypes.MY_TEAMS_SUCCESS],
        onFailure: TeamTypes.MY_TEAMS_FAILURE,
    });
}

export function getMyTeamUnreads(): ActionFunc {
    return bindClientFunc({
        clientFunc: Client4.getMyTeamUnreads,
        onSuccess: TeamTypes.RECEIVED_MY_TEAM_UNREADS,
    });
}

export function getTeam(teamId: string): ActionFunc {
    return bindClientFunc({
        clientFunc: Client4.getTeam,
        onSuccess: TeamTypes.RECEIVED_TEAM,
        params: [
            teamId,
        ],
    });
}

export function getTeamByName(teamName: string): ActionFunc {
    return bindClientFunc({
        clientFunc: Client4.getTeamByName,
        onSuccess: TeamTypes.RECEIVED_TEAM,
        params: [
            teamName,
        ],
    });
}

export function getTeams(page: number = 0, perPage: number = General.TEAMS_CHUNK_SIZE): ActionFunc {
    return bindClientFunc({
        clientFunc: Client4.getTeams,
        onRequest: TeamTypes.GET_TEAMS_REQUEST,
        onSuccess: [TeamTypes.RECEIVED_TEAMS_LIST, TeamTypes.GET_TEAMS_SUCCESS],
        onFailure: TeamTypes.GET_TEAMS_FAILURE,
        params: [
            page,
            perPage,
        ],
    });
}

export function searchTeams(term: string): ActionFunc {
    return bindClientFunc({
        clientFunc: Client4.searchTeams,
        onRequest: TeamTypes.GET_TEAMS_REQUEST,
        onSuccess: [TeamTypes.RECEIVED_TEAMS_LIST, TeamTypes.GET_TEAMS_SUCCESS],
        onFailure: TeamTypes.GET_TEAMS_FAILURE,
        params: [
            term,
        ],
    });
}

export function createTeam(team: Team): ActionFunc {
    return async (dispatch: DispatchFunc, getState: GetStateFunc) => {
        let created;
        try {
            created = await Client4.createTeam(team);
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch, getState);
            dispatch(logError(error));
            return {error};
        }

        const member = {
            team_id: created.id,
            user_id: getState().entities.users.currentUserId,
            roles: `${General.TEAM_ADMIN_ROLE} ${General.TEAM_USER_ROLE}`,
            delete_at: 0,
            msg_count: 0,
            mention_count: 0,
        };

        dispatch(batchActions([
            {
                type: TeamTypes.CREATED_TEAM,
                data: created,
            },
            {
                type: TeamTypes.RECEIVED_MY_TEAM_MEMBER,
                data: member,
            },
            {
                type: TeamTypes.SELECT_TEAM,
                data: created.id,
            },
        ]), getState);
        dispatch(loadRolesIfNeeded(member.roles.split(' ')));

        return {data: created};
    };
}

export function deleteTeam(teamId: string): ActionFunc {
    return async (dispatch: DispatchFunc, getState: GetStateFunc) => {
        try {
            await Client4.deleteTeam(teamId);
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch, getState);
            dispatch(logError(error));
            return {error};
        }

        const entities = getState().entities;
        const {currentTeamId} = entities.teams;
        const actions = [];
        if (teamId === currentTeamId) {
            EventEmitter.emit('leave_team');
            actions.push({type: ChannelTypes.SELECT_CHANNEL, data: ''});
        }

        actions.push(
            {
                type: TeamTypes.RECEIVED_TEAM_DELETED,
                data: {id: teamId},
            }
        );

        dispatch(batchActions(actions), getState);

        return {data: true};
    };
}

export function updateTeam(team: Team): ActionFunc {
    return bindClientFunc({
        clientFunc: Client4.updateTeam,
        onSuccess: TeamTypes.UPDATED_TEAM,
        params: [
            team,
        ],
    });
}

export function patchTeam(team: Team): ActionFunc {
    return bindClientFunc({
        clientFunc: Client4.patchTeam,
        onSuccess: TeamTypes.PATCHED_TEAM,
        params: [
            team,
        ],
    });
}

export function regenerateTeamInviteId(teamId: string): ActionFunc {
    return bindClientFunc({
        clientFunc: Client4.regenerateTeamInviteId,
        onSuccess: TeamTypes.REGENERATED_TEAM_INVITE_ID,
        params: [
            teamId,
        ],
    });
}

export function getMyTeamMembers(): ActionFunc {
    return async (dispatch: DispatchFunc, getState: GetStateFunc) => {
        const getMyTeamMembersFunc = bindClientFunc({
            clientFunc: Client4.getMyTeamMembers,
            onSuccess: TeamTypes.RECEIVED_MY_TEAM_MEMBERS,
        });

        const teamMembers: ActionResult = await getMyTeamMembersFunc(dispatch, getState);

        if (teamMembers.data) {
            const roles = new Set();
            for (const teamMember of teamMembers.data) {
                for (const role of teamMember.roles.split(' ')) {
                    roles.add(role);
                }
            }
            if (roles.size > 0) {
                dispatch(loadRolesIfNeeded([...roles]));
            }
        }

        return teamMembers;
    };
}

export function getTeamMembers(teamId: string, page: number = 0, perPage: number = General.TEAMS_CHUNK_SIZE): ActionFunc {
    return bindClientFunc({
        clientFunc: Client4.getTeamMembers,
        onRequest: TeamTypes.GET_TEAM_MEMBERS_REQUEST,
        onSuccess: [TeamTypes.RECEIVED_MEMBERS_IN_TEAM, TeamTypes.GET_TEAM_MEMBERS_SUCCESS],
        onFailure: TeamTypes.GET_TEAM_MEMBERS_FAILURE,
        params: [
            teamId,
            page,
            perPage,
        ],
    });
}

export function getTeamMember(teamId: string, userId: string): ActionFunc {
    return async (dispatch: DispatchFunc, getState: GetStateFunc) => {
        let member;
        try {
            const memberRequest = Client4.getTeamMember(teamId, userId);

            getProfilesAndStatusesForMembers([userId], dispatch, getState);

            member = await memberRequest;
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch, getState);
            dispatch(logError(error));
            return {error};
        }

        dispatch({
            type: TeamTypes.RECEIVED_MEMBERS_IN_TEAM,
            data: [member],
        });

        return {data: member};
    };
}

export function getTeamMembersByIds(teamId: string, userIds: Array<string>): ActionFunc {
    return async (dispatch: DispatchFunc, getState: GetStateFunc) => {
        let members;
        try {
            const membersRequest = Client4.getTeamMembersByIds(teamId, userIds);

            getProfilesAndStatusesForMembers(userIds, dispatch, getState);

            members = await membersRequest;
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch, getState);
            dispatch(logError(error));
            return {error};
        }

        dispatch({
            type: TeamTypes.RECEIVED_MEMBERS_IN_TEAM,
            data: members,
        });

        return {data: members};
    };
}

export function getTeamsForUser(userId: string): ActionFunc {
    return bindClientFunc({
        clientFunc: Client4.getTeamsForUser,
        onRequest: TeamTypes.GET_TEAMS_REQUEST,
        onSuccess: [TeamTypes.RECEIVED_TEAMS_LIST, TeamTypes.GET_TEAMS_SUCCESS],
        onFailure: TeamTypes.GET_TEAMS_FAILURE,
        params: [
            userId,
        ],
    });
}

export function getTeamMembersForUser(userId: string): ActionFunc {
    return bindClientFunc({
        clientFunc: Client4.getTeamMembersForUser,
        onSuccess: TeamTypes.RECEIVED_TEAM_MEMBERS,
        params: [
            userId,
        ],
    });
}

export function getTeamStats(teamId: string): ActionFunc {
    return bindClientFunc({
        clientFunc: Client4.getTeamStats,
        onSuccess: TeamTypes.RECEIVED_TEAM_STATS,
        params: [
            teamId,
        ],
    });
}

export function addUserToTeamFromInvite(token: string, inviteId: string): ActionFunc {
    return bindClientFunc({
        clientFunc: Client4.addToTeamFromInvite,
        onRequest: TeamTypes.ADD_TO_TEAM_FROM_INVITE_REQUEST,
        onSuccess: TeamTypes.ADD_TO_TEAM_FROM_INVITE_SUCCESS,
        onFailure: TeamTypes.ADD_TO_TEAM_FROM_INVITE_FAILURE,
        params: [
            token,
            inviteId,
        ],
    });
}

export function addUserToTeam(teamId: string, userId: string): ActionFunc {
    return async (dispatch: DispatchFunc, getState: GetStateFunc) => {
        let member;
        try {
            member = await Client4.addToTeam(teamId, userId);
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch, getState);
            dispatch(logError(error));
            return {error};
        }

        dispatch(batchActions([
            {
                type: UserTypes.RECEIVED_PROFILE_IN_TEAM,
                data: {id: teamId, user_id: userId},
            },
            {
                type: TeamTypes.RECEIVED_MEMBER_IN_TEAM,
                data: member,
            },
        ]), getState);

        return {data: member};
    };
}

export function addUsersToTeam(teamId: string, userIds: Array<string>): ActionFunc {
    return async (dispatch: DispatchFunc, getState: GetStateFunc) => {
        let members;
        try {
            members = await Client4.addUsersToTeam(teamId, userIds);
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch, getState);
            dispatch(logError(error));
            return {error};
        }

        const profiles = [];
        members.forEach((m) => profiles.push({id: m.user_id}));

        dispatch(batchActions([
            {
                type: UserTypes.RECEIVED_PROFILES_LIST_IN_TEAM,
                data: profiles,
                id: teamId,
            },
            {
                type: TeamTypes.RECEIVED_MEMBERS_IN_TEAM,
                data: members,
            },
        ]), getState);

        return {data: members};
    };
}

export function removeUserFromTeam(teamId: string, userId: string): ActionFunc {
    return async (dispatch: DispatchFunc, getState: GetStateFunc) => {
        try {
            await Client4.removeFromTeam(teamId, userId);
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch, getState);
            dispatch(logError(error));
            return {error};
        }

        const member = {
            team_id: teamId,
            user_id: userId,
        };

        const actions = [
            {
                type: UserTypes.RECEIVED_PROFILE_NOT_IN_TEAM,
                data: {id: teamId, user_id: userId},
            },
            {
                type: TeamTypes.REMOVE_MEMBER_FROM_TEAM,
                data: member,
            },
        ];

        const state = getState();
        const {currentUserId} = state.entities.users;

        if (currentUserId === userId) {
            const {channels, myMembers} = state.entities.channels;

            for (const channelMember of Object.values(myMembers)) {
                // https://github.com/facebook/flow/issues/2221
                // $FlowFixMe - Object.values currently does not have good flow support
                const channel = channels[channelMember.channel_id];
                if (channel && channel.team_id === teamId) {
                    actions.push({
                        type: ChannelTypes.LEAVE_CHANNEL,
                        data: channel,
                    });
                }
            }
        }

        dispatch(batchActions(actions), getState);

        return {data: true};
    };
}

export function updateTeamMemberRoles(teamId: string, userId: string, roles: string): ActionFunc {
    return async (dispatch: DispatchFunc, getState: GetStateFunc) => {
        try {
            await Client4.updateTeamMemberRoles(teamId, userId, roles);
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch, getState);
            dispatch(logError(error));
            return {error};
        }

        const membersInTeam = getState().entities.teams.membersInTeam[teamId];
        if (membersInTeam && membersInTeam[userId]) {
            dispatch({
                type: TeamTypes.RECEIVED_MEMBER_IN_TEAM,
                data: {...membersInTeam[userId], roles},
            });
        }

        return {data: true};
    };
}

export function sendEmailInvitesToTeam(teamId: string, emails: Array<string>): ActionFunc {
    return bindClientFunc({
        clientFunc: Client4.sendEmailInvitesToTeam,
        params: [
            teamId,
            emails,
        ],
    });
}

export function getTeamInviteInfo(inviteId: string): ActionFunc {
    return bindClientFunc({
        clientFunc: Client4.getTeamInviteInfo,
        onRequest: TeamTypes.TEAM_INVITE_INFO_REQUEST,
        onSuccess: TeamTypes.TEAM_INVITE_INFO_SUCCESS,
        onFailure: TeamTypes.TEAM_INVITE_INFO_FAILURE,
        params: [
            inviteId,
        ],
    });
}

export function checkIfTeamExists(teamName: string): ActionFunc {
    return async (dispatch: DispatchFunc, getState: GetStateFunc) => {
        let data;
        try {
            data = await Client4.checkIfTeamExists(teamName);
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch, getState);
            dispatch(logError(error));
            return {error};
        }

        return {data: data.exists};
    };
}

export function joinTeam(inviteId: string, teamId: string): ActionFunc {
    return async (dispatch: DispatchFunc, getState: GetStateFunc) => {
        dispatch({type: TeamTypes.JOIN_TEAM_REQUEST, data: null}, getState);

        const state = getState();
        try {
            if (isCompatibleWithJoinViewTeamPermissions(state)) {
                const currentUserId = state.entities.users.currentUserId;
                await Client4.addToTeam(teamId, currentUserId);
            } else {
                await Client4.joinTeam(inviteId);
            }
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch, getState);
            dispatch(batchActions([
                {type: TeamTypes.JOIN_TEAM_FAILURE, error},
                logError(error),
            ]));
            return {error};
        }

        getMyTeamUnreads()(dispatch, getState);

        await Promise.all([
            getTeam(teamId)(dispatch, getState),
            getMyTeamMembers()(dispatch, getState),
        ]);

        dispatch({type: TeamTypes.JOIN_TEAM_SUCCESS, data: null}, getState);
        return {data: true};
    };
}

export function setTeamIcon(teamId: string, imageData: File): ActionFunc {
    return bindClientFunc({
        clientFunc: Client4.setTeamIcon,
        params: [
            teamId,
            imageData,
        ],
    });
}

export function removeTeamIcon(teamId: string): ActionFunc {
    return bindClientFunc({
        clientFunc: Client4.removeTeamIcon,
        params: [
            teamId,
        ],
    });
}

export function updateTeamScheme(teamId: string, schemeId: string): ActionFunc {
    return bindClientFunc({
        clientFunc: async () => {
            await Client4.updateTeamScheme(teamId, schemeId);
            return {teamId, schemeId};
        },
        onSuccess: TeamTypes.UPDATED_TEAM_SCHEME,
    });
}

export function updateTeamMemberSchemeRoles(
    teamId: string,
    userId: string,
    isSchemeUser: boolean,
    isSchemeAdmin: boolean
): ActionFunc {
    return bindClientFunc({
        clientFunc: async () => {
            await Client4.updateTeamMemberSchemeRoles(teamId, userId, isSchemeUser, isSchemeAdmin);
            return {teamId, userId, isSchemeUser, isSchemeAdmin};
        },
        onSuccess: TeamTypes.UPDATED_TEAM_MEMBER_SCHEME_ROLES,
    });
}

export function invalidateAllEmailInvites(): ActionFunc {
    return bindClientFunc({
        clientFunc: Client4.invalidateAllEmailInvites,
    });
}
