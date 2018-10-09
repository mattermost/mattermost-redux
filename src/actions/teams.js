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

import type {GetStateFunc, DispatchFunc, ActionFunc, ActionResult} from '../types/actions';
import type {Team} from '../types/teams';

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
    return bindClientFunc(
        Client4.getMyTeams,
        TeamTypes.MY_TEAMS_REQUEST,
        [TeamTypes.RECEIVED_TEAMS_LIST, TeamTypes.MY_TEAMS_SUCCESS],
        TeamTypes.MY_TEAMS_FAILURE
    );
}

export function getMyTeamUnreads(): ActionFunc {
    return bindClientFunc(
        Client4.getMyTeamUnreads,
        TeamTypes.MY_TEAM_UNREADS_REQUEST,
        [TeamTypes.RECEIVED_MY_TEAM_UNREADS, TeamTypes.MY_TEAM_UNREADS_SUCCESS],
        TeamTypes.MY_TEAM_UNREADS_FAILURE
    );
}

export function getTeam(teamId: string): ActionFunc {
    return bindClientFunc(
        Client4.getTeam,
        TeamTypes.GET_TEAM_REQUEST,
        [TeamTypes.RECEIVED_TEAM, TeamTypes.GET_TEAM_SUCCESS],
        TeamTypes.GET_TEAM_FAILURE,
        teamId
    );
}

export function getTeamByName(teamName: string): ActionFunc {
    return bindClientFunc(
        Client4.getTeamByName,
        TeamTypes.GET_TEAM_REQUEST,
        [TeamTypes.RECEIVED_TEAM, TeamTypes.GET_TEAM_SUCCESS],
        TeamTypes.GET_TEAM_FAILURE,
        teamName
    );
}

export function getTeams(page: number = 0, perPage: number = General.TEAMS_CHUNK_SIZE): ActionFunc {
    return bindClientFunc(
        Client4.getTeams,
        TeamTypes.GET_TEAMS_REQUEST,
        [TeamTypes.RECEIVED_TEAMS_LIST, TeamTypes.GET_TEAMS_SUCCESS],
        TeamTypes.GET_TEAMS_FAILURE,
        page,
        perPage
    );
}

export function searchTeams(term: string): ActionFunc {
    return bindClientFunc(
        Client4.searchTeams,
        TeamTypes.GET_TEAMS_REQUEST,
        [TeamTypes.RECEIVED_TEAMS_LIST, TeamTypes.GET_TEAMS_SUCCESS],
        TeamTypes.GET_TEAMS_FAILURE,
        term,
    );
}

export function createTeam(team: Team): ActionFunc {
    return async (dispatch: DispatchFunc, getState: GetStateFunc) => {
        dispatch({type: TeamTypes.CREATE_TEAM_REQUEST, data: null}, getState);

        let created;
        try {
            created = await Client4.createTeam(team);
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch, getState);
            dispatch(batchActions([
                {type: TeamTypes.CREATE_TEAM_FAILURE, error},
                logError(error),
            ]), getState);
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
            {
                type: TeamTypes.CREATE_TEAM_SUCCESS,
            },
        ]), getState);
        dispatch(loadRolesIfNeeded(member.roles.split(' ')));

        return {data: created};
    };
}

export function deleteTeam(teamId: string): ActionFunc {
    return async (dispatch: DispatchFunc, getState: GetStateFunc) => {
        dispatch({type: TeamTypes.DELETE_TEAM_REQUEST, data: null}, getState);

        try {
            await Client4.deleteTeam(teamId);
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch, getState);
            dispatch(batchActions([
                {type: TeamTypes.DELETE_TEAM_FAILURE, error},
                logError(error),
            ]), getState);
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
            },
            {
                type: TeamTypes.DELETE_TEAM_SUCCESS,
            }
        );

        dispatch(batchActions(actions), getState);

        return {data: true};
    };
}

export function updateTeam(team: Team): ActionFunc {
    return bindClientFunc(
        Client4.updateTeam,
        TeamTypes.UPDATE_TEAM_REQUEST,
        [TeamTypes.UPDATED_TEAM, TeamTypes.UPDATE_TEAM_SUCCESS],
        TeamTypes.UPDATE_TEAM_FAILURE,
        team
    );
}

export function getMyTeamMembers(): ActionFunc {
    return async (dispatch: DispatchFunc, getState: GetStateFunc) => {
        const getMyTeamMembersFunc = bindClientFunc(
            Client4.getMyTeamMembers,
            TeamTypes.MY_TEAM_MEMBERS_REQUEST,
            [TeamTypes.RECEIVED_MY_TEAM_MEMBERS, TeamTypes.MY_TEAM_MEMBERS_SUCCESS],
            TeamTypes.MY_TEAM_MEMBERS_FAILURE
        );

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
    return bindClientFunc(
        Client4.getTeamMembers,
        TeamTypes.GET_TEAM_MEMBERS_REQUEST,
        [TeamTypes.RECEIVED_MEMBERS_IN_TEAM, TeamTypes.GET_TEAM_MEMBERS_SUCCESS],
        TeamTypes.GET_TEAM_MEMBERS_FAILURE,
        teamId,
        page,
        perPage
    );
}

export function getTeamMember(teamId: string, userId: string): ActionFunc {
    return async (dispatch: DispatchFunc, getState: GetStateFunc) => {
        dispatch({type: TeamTypes.TEAM_MEMBERS_REQUEST, data: null}, getState);

        let member;
        try {
            const memberRequest = Client4.getTeamMember(teamId, userId);

            getProfilesAndStatusesForMembers([userId], dispatch, getState);

            member = await memberRequest;
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch, getState);
            dispatch(batchActions([
                {type: TeamTypes.TEAM_MEMBERS_FAILURE, error},
                logError(error),
            ]), getState);
            return {error};
        }

        dispatch(batchActions([
            {
                type: TeamTypes.RECEIVED_MEMBERS_IN_TEAM,
                data: [member],
            },
            {
                type: TeamTypes.TEAM_MEMBERS_SUCCESS,
            },
        ]), getState);

        return {data: member};
    };
}

export function getTeamMembersByIds(teamId: string, userIds: Array<string>): ActionFunc {
    return async (dispatch: DispatchFunc, getState: GetStateFunc) => {
        dispatch({type: TeamTypes.TEAM_MEMBERS_REQUEST, data: null}, getState);

        let members;
        try {
            const membersRequest = Client4.getTeamMembersByIds(teamId, userIds);

            getProfilesAndStatusesForMembers(userIds, dispatch, getState);

            members = await membersRequest;
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch, getState);
            dispatch(batchActions([
                {type: TeamTypes.TEAM_MEMBERS_FAILURE, error},
                logError(error),
            ]), getState);
            return {error};
        }

        dispatch(batchActions([
            {
                type: TeamTypes.RECEIVED_MEMBERS_IN_TEAM,
                data: members,
            },
            {
                type: TeamTypes.TEAM_MEMBERS_SUCCESS,
            },
        ]), getState);

        return {data: members};
    };
}

export function getTeamsForUser(userId: string): ActionFunc {
    return bindClientFunc(
        Client4.getTeamsForUser,
        TeamTypes.GET_TEAMS_REQUEST,
        [TeamTypes.RECEIVED_TEAMS_LIST, TeamTypes.GET_TEAMS_SUCCESS],
        TeamTypes.GET_TEAMS_FAILURE,
        userId
    );
}

export function getTeamMembersForUser(userId: string): ActionFunc {
    return bindClientFunc(
        Client4.getTeamMembersForUser,
        TeamTypes.TEAM_MEMBERS_REQUEST,
        [TeamTypes.RECEIVED_TEAM_MEMBERS, TeamTypes.TEAM_MEMBERS_SUCCESS],
        TeamTypes.TEAM_MEMBERS_FAILURE,
        userId
    );
}

export function getTeamStats(teamId: string): ActionFunc {
    return bindClientFunc(
        Client4.getTeamStats,
        TeamTypes.TEAM_STATS_REQUEST,
        [TeamTypes.RECEIVED_TEAM_STATS, TeamTypes.TEAM_STATS_SUCCESS],
        TeamTypes.TEAM_STATS_FAILURE,
        teamId
    );
}

export function addUserToTeam(teamId: string, userId: string): ActionFunc {
    return async (dispatch: DispatchFunc, getState: GetStateFunc) => {
        dispatch({type: TeamTypes.ADD_TEAM_MEMBER_REQUEST, data: null}, getState);

        let member;
        try {
            member = await Client4.addToTeam(teamId, userId);
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch, getState);
            dispatch(batchActions([
                {type: TeamTypes.ADD_TEAM_MEMBER_FAILURE, error},
                logError(error),
            ]), getState);
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
            {
                type: TeamTypes.ADD_TEAM_MEMBER_SUCCESS,
            },
        ]), getState);

        return {data: member};
    };
}

export function addUsersToTeam(teamId: string, userIds: Array<string>): ActionFunc {
    return async (dispatch: DispatchFunc, getState: GetStateFunc) => {
        dispatch({type: TeamTypes.ADD_TEAM_MEMBER_REQUEST, data: null}, getState);

        let members;
        try {
            members = await Client4.addUsersToTeam(teamId, userIds);
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch, getState);
            dispatch(batchActions([
                {type: TeamTypes.ADD_TEAM_MEMBER_FAILURE, error},
                logError(error),
            ]), getState);
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
            {
                type: TeamTypes.ADD_TEAM_MEMBER_SUCCESS,
            },
        ]), getState);

        return {data: members};
    };
}

export function removeUserFromTeam(teamId: string, userId: string): ActionFunc {
    return async (dispatch: DispatchFunc, getState: GetStateFunc) => {
        dispatch({type: TeamTypes.REMOVE_TEAM_MEMBER_REQUEST, data: null}, getState);

        try {
            await Client4.removeFromTeam(teamId, userId);
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch, getState);
            dispatch(batchActions([
                {type: TeamTypes.REMOVE_TEAM_MEMBER_FAILURE, error},
                logError(error),
            ]), getState);
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
            {
                type: TeamTypes.REMOVE_TEAM_MEMBER_SUCCESS,
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
        dispatch({type: TeamTypes.UPDATE_TEAM_MEMBER_REQUEST, data: null}, getState);

        try {
            await Client4.updateTeamMemberRoles(teamId, userId, roles);
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch, getState);
            dispatch(batchActions([
                {type: TeamTypes.UPDATE_TEAM_MEMBER_FAILURE, error},
                logError(error),
            ]), getState);
            return {error};
        }

        const actions = [
            {
                type: TeamTypes.UPDATE_TEAM_MEMBER_SUCCESS,
            },
        ];

        const membersInTeam = getState().entities.teams.membersInTeam[teamId];
        if (membersInTeam && membersInTeam[userId]) {
            actions.push(
                {
                    type: TeamTypes.RECEIVED_MEMBER_IN_TEAM,
                    data: {...membersInTeam[userId], roles},
                }
            );
        }

        dispatch(batchActions(actions), getState);

        return {data: true};
    };
}

export function sendEmailInvitesToTeam(teamId: string, emails: Array<string>): ActionFunc {
    return bindClientFunc(
        Client4.sendEmailInvitesToTeam,
        TeamTypes.TEAM_EMAIL_INVITE_REQUEST,
        [TeamTypes.TEAM_EMAIL_INVITE_SUCCESS],
        TeamTypes.TEAM_EMAIL_INVITE_FAILURE,
        teamId,
        emails
    );
}

export function checkIfTeamExists(teamName: string): ActionFunc {
    return async (dispatch: DispatchFunc, getState: GetStateFunc) => {
        dispatch({type: TeamTypes.GET_TEAM_REQUEST, data: null}, getState);

        let data;
        try {
            data = await Client4.checkIfTeamExists(teamName);
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch, getState);
            dispatch(batchActions([
                {type: TeamTypes.GET_TEAM_FAILURE, error},
                logError(error),
            ]));
            return {error};
        }

        dispatch({type: TeamTypes.GET_TEAM_SUCCESS, data: null});

        return {data: data.exists};
    };
}

export function joinTeam(inviteId: string, teamId: string): ActionFunc {
    return async (dispatch: DispatchFunc, getState: GetStateFunc) => {
        dispatch({type: TeamTypes.JOIN_TEAM_REQUEST, data: null}, getState);

        try {
            await Client4.joinTeam(inviteId);
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch, getState);
            dispatch(batchActions([
                {type: TeamTypes.JOIN_TEAM_FAILURE, error},
                logError(error),
            ]), getState);
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
    return bindClientFunc(
        Client4.setTeamIcon,
        TeamTypes.SET_TEAM_ICON_REQUEST,
        TeamTypes.SET_TEAM_ICON_SUCCESS,
        TeamTypes.SET_TEAM_ICON_FAILURE,
        teamId,
        imageData
    );
}

export function removeTeamIcon(teamId: string): ActionFunc {
    return bindClientFunc(
        Client4.removeTeamIcon,
        TeamTypes.REMOVE_TEAM_ICON_REQUEST,
        TeamTypes.REMOVE_TEAM_ICON_SUCCESS,
        TeamTypes.REMOVE_TEAM_ICON_FAILURE,
        teamId,
    );
}

export function updateTeamScheme(teamId: string, schemeId: string): ActionFunc {
    return bindClientFunc(
        async () => {
            await Client4.updateTeamScheme(teamId, schemeId);
            return {teamId, schemeId};
        },
        TeamTypes.UPDATE_TEAM_SCHEME_REQUEST,
        [TeamTypes.UPDATE_TEAM_SCHEME_SUCCESS, TeamTypes.UPDATED_TEAM_SCHEME],
        TeamTypes.UPDATE_TEAM_SCHEME_FAILURE,
    );
}

export function updateTeamMemberSchemeRoles(
    teamId: string,
    userId: string,
    isSchemeUser: boolean,
    isSchemeAdmin: boolean
): ActionFunc {
    return bindClientFunc(
        async () => {
            await Client4.updateTeamMemberSchemeRoles(teamId, userId, isSchemeUser, isSchemeAdmin);
            return {teamId, userId, isSchemeUser, isSchemeAdmin};
        },
        TeamTypes.UPDATE_TEAM_MEMBER_SCHEME_ROLES_REQUEST,
        [TeamTypes.UPDATE_TEAM_MEMBER_SCHEME_ROLES_SUCCESS, TeamTypes.UPDATED_TEAM_MEMBER_SCHEME_ROLES],
        TeamTypes.UPDATE_TEAM_MEMBER_SCHEME_ROLES_FAILURE,
    );
}