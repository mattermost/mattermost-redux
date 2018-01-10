// Copyright (c) 2016-present Mattermost, Inc. All Rights Reserved.
// See License.txt for license information.

import {batchActions} from 'redux-batched-actions';
import {Client, Client4} from 'client';
import {General} from 'constants';
import {ChannelTypes, TeamTypes, UserTypes} from 'action_types';
import EventEmitter from 'utils/event_emitter';

import {logError} from './errors';
import {bindClientFunc, forceLogoutIfNecessary} from './helpers';
import {getProfilesByIds, getStatusesByIds} from './users';
import {loadRolesIfNeeded} from './roles';

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

export function selectTeam(team) {
    return async (dispatch, getState) => {
        dispatch({
            type: TeamTypes.SELECT_TEAM,
            data: team.id
        }, getState);

        return {data: true};
    };
}

export function getMyTeams() {
    return bindClientFunc(
        Client4.getMyTeams,
        TeamTypes.MY_TEAMS_REQUEST,
        [TeamTypes.RECEIVED_TEAMS_LIST, TeamTypes.MY_TEAMS_SUCCESS],
        TeamTypes.MY_TEAMS_FAILURE
    );
}

export function getMyTeamUnreads() {
    return bindClientFunc(
        Client4.getMyTeamUnreads,
        TeamTypes.MY_TEAM_UNREADS_REQUEST,
        [TeamTypes.RECEIVED_MY_TEAM_UNREADS, TeamTypes.MY_TEAM_UNREADS_SUCCESS],
        TeamTypes.MY_TEAM_UNREADS_FAILURE
    );
}

export function getTeam(teamId) {
    return bindClientFunc(
        Client4.getTeam,
        TeamTypes.GET_TEAM_REQUEST,
        [TeamTypes.RECEIVED_TEAM, TeamTypes.GET_TEAM_SUCCESS],
        TeamTypes.GET_TEAM_FAILURE,
        teamId
    );
}

export function getTeamByName(teamName) {
    return bindClientFunc(
        Client4.getTeamByName,
        TeamTypes.GET_TEAM_REQUEST,
        [TeamTypes.RECEIVED_TEAM, TeamTypes.GET_TEAM_SUCCESS],
        TeamTypes.GET_TEAM_FAILURE,
        teamName
    );
}

export function getTeams(page = 0, perPage = General.TEAMS_CHUNK_SIZE) {
    return bindClientFunc(
        Client4.getTeams,
        TeamTypes.GET_TEAMS_REQUEST,
        [TeamTypes.RECEIVED_TEAMS_LIST, TeamTypes.GET_TEAMS_SUCCESS],
        TeamTypes.GET_TEAMS_FAILURE,
        page,
        perPage
    );
}

export function createTeam(team) {
    return async (dispatch, getState) => {
        dispatch({type: TeamTypes.CREATE_TEAM_REQUEST}, getState);

        let created;
        try {
            created = await Client4.createTeam(team);
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch, getState);
            dispatch(batchActions([
                {type: TeamTypes.CREATE_TEAM_FAILURE, error},
                logError(error)(dispatch)
            ]), getState);
            return {error};
        }

        const member = {
            team_id: created.id,
            user_id: getState().entities.users.currentUserId,
            roles: `${General.TEAM_ADMIN_ROLE} ${General.TEAM_USER_ROLE}`,
            delete_at: 0,
            msg_count: 0,
            mention_count: 0
        };

        dispatch(batchActions([
            {
                type: TeamTypes.CREATED_TEAM,
                data: created
            },
            {
                type: TeamTypes.RECEIVED_MY_TEAM_MEMBER,
                data: member
            },
            {
                type: TeamTypes.SELECT_TEAM,
                data: created.id
            },
            {
                type: TeamTypes.CREATE_TEAM_SUCCESS
            }
        ]), getState);
        loadRolesIfNeeded(new Set(member.roles.split(' ')))(dispatch, getState);

        return {data: created};
    };
}

export function deleteTeam(teamId) {
    return async (dispatch, getState) => {
        dispatch({type: TeamTypes.DELETE_TEAM_REQUEST}, getState);

        try {
            await Client4.deleteTeam(teamId);
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch);
            dispatch(batchActions([
                {type: TeamTypes.DELETE_TEAM_FAILURE, error},
                logError(error)(dispatch)
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
                data: {id: teamId}
            },
            {
                type: TeamTypes.DELETE_TEAM_SUCCESS
            }
        );

        dispatch(batchActions(actions), getState);

        return {data: true};
    };
}

export function updateTeam(team) {
    return bindClientFunc(
        Client4.updateTeam,
        TeamTypes.UPDATE_TEAM_REQUEST,
        [TeamTypes.UPDATED_TEAM, TeamTypes.UPDATE_TEAM_SUCCESS],
        TeamTypes.UPDATE_TEAM_FAILURE,
        team
    );
}

export function getMyTeamMembers() {
    return async (dispatch, getState) => {
        const getMyTeamMembersFunc = bindClientFunc(
            Client4.getMyTeamMembers,
            TeamTypes.MY_TEAM_MEMBERS_REQUEST,
            [TeamTypes.RECEIVED_MY_TEAM_MEMBERS, TeamTypes.MY_TEAM_MEMBERS_SUCCESS],
            TeamTypes.MY_TEAM_MEMBERS_FAILURE
        );
        const teamMembers = await getMyTeamMembersFunc(dispatch, getState);
        if (teamMembers.error) {
            return teamMembers;
        }
        const roles = new Set();
        for (const teamMember of teamMembers.data) {
            for (const role of teamMember.roles.split(' ')) {
                roles.add(role);
            }
        }
        if (roles.size > 0) {
            loadRolesIfNeeded(roles)(dispatch, getState);
        }
        return teamMembers;
    };
}

export function getTeamMembers(teamId, page = 0, perPage = General.TEAMS_CHUNK_SIZE) {
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

export function getTeamMember(teamId, userId) {
    return async (dispatch, getState) => {
        dispatch({type: TeamTypes.TEAM_MEMBERS_REQUEST}, getState);

        let member;
        try {
            const memberRequest = Client4.getTeamMember(teamId, userId);

            getProfilesAndStatusesForMembers([userId], dispatch, getState);

            member = await memberRequest;
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch, getState);
            dispatch(batchActions([
                {type: TeamTypes.TEAM_MEMBERS_FAILURE, error},
                logError(error)(dispatch)
            ]), getState);
            return {error};
        }

        dispatch(batchActions([
            {
                type: TeamTypes.RECEIVED_MEMBERS_IN_TEAM,
                data: [member]
            },
            {
                type: TeamTypes.TEAM_MEMBERS_SUCCESS
            }
        ]), getState);

        return {data: member};
    };
}

export function getTeamMembersByIds(teamId, userIds) {
    return async (dispatch, getState) => {
        dispatch({type: TeamTypes.TEAM_MEMBERS_REQUEST}, getState);

        let members;
        try {
            const membersRequest = Client4.getTeamMembersByIds(teamId, userIds);

            getProfilesAndStatusesForMembers(userIds, dispatch, getState);

            members = await membersRequest;
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch, getState);
            dispatch(batchActions([
                {type: TeamTypes.TEAM_MEMBERS_FAILURE, error},
                logError(error)(dispatch)
            ]), getState);
            return {error};
        }

        dispatch(batchActions([
            {
                type: TeamTypes.RECEIVED_MEMBERS_IN_TEAM,
                data: members
            },
            {
                type: TeamTypes.TEAM_MEMBERS_SUCCESS
            }
        ]), getState);

        return {data: members};
    };
}

export function getTeamsForUser(userId) {
    return bindClientFunc(
        Client4.getTeamsForUser,
        TeamTypes.GET_TEAMS_REQUEST,
        [TeamTypes.RECEIVED_TEAMS_LIST, TeamTypes.GET_TEAMS_SUCCESS],
        TeamTypes.GET_TEAMS_FAILURE,
        userId
    );
}

export function getTeamMembersForUser(userId) {
    return bindClientFunc(
        Client4.getTeamMembersForUser,
        TeamTypes.TEAM_MEMBERS_REQUEST,
        [TeamTypes.RECEIVED_TEAM_MEMBERS, TeamTypes.TEAM_MEMBERS_SUCCESS],
        TeamTypes.TEAM_MEMBERS_FAILURE,
        userId
    );
}

export function getTeamStats(teamId) {
    return bindClientFunc(
        Client4.getTeamStats,
        TeamTypes.TEAM_STATS_REQUEST,
        [TeamTypes.RECEIVED_TEAM_STATS, TeamTypes.TEAM_STATS_SUCCESS],
        TeamTypes.TEAM_STATS_FAILURE,
        teamId
    );
}

export function addUserToTeam(teamId, userId) {
    return async (dispatch, getState) => {
        dispatch({type: TeamTypes.ADD_TEAM_MEMBER_REQUEST}, getState);

        let member;
        try {
            member = await Client4.addToTeam(teamId, userId);
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch, getState);
            dispatch(batchActions([
                {type: TeamTypes.ADD_TEAM_MEMBER_FAILURE, error},
                logError(error)(dispatch)
            ]), getState);
            return {error};
        }

        dispatch(batchActions([
            {
                type: UserTypes.RECEIVED_PROFILE_IN_TEAM,
                data: {user_id: userId},
                id: teamId
            },
            {
                type: TeamTypes.RECEIVED_MEMBER_IN_TEAM,
                data: member
            },
            {
                type: TeamTypes.ADD_TEAM_MEMBER_SUCCESS
            }
        ]), getState);

        return {data: member};
    };
}

export function addUsersToTeam(teamId, userIds) {
    return async (dispatch, getState) => {
        dispatch({type: TeamTypes.ADD_TEAM_MEMBER_REQUEST}, getState);

        let members;
        try {
            members = await Client4.addUsersToTeam(teamId, userIds);
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch, getState);
            dispatch(batchActions([
                {type: TeamTypes.ADD_TEAM_MEMBER_FAILURE, error},
                logError(error)(dispatch)
            ]), getState);
            return {error};
        }

        const profiles = [];
        members.forEach((m) => profiles.push({id: m.user_id}));

        dispatch(batchActions([
            {
                type: UserTypes.RECEIVED_PROFILES_LIST_IN_TEAM,
                data: profiles,
                id: teamId
            },
            {
                type: TeamTypes.RECEIVED_MEMBERS_IN_TEAM,
                data: members
            },
            {
                type: TeamTypes.ADD_TEAM_MEMBER_SUCCESS
            }
        ]), getState);

        return {data: members};
    };
}

export function removeUserFromTeam(teamId, userId) {
    return async (dispatch, getState) => {
        dispatch({type: TeamTypes.REMOVE_TEAM_MEMBER_REQUEST}, getState);

        try {
            await Client4.removeFromTeam(teamId, userId);
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch, getState);
            dispatch(batchActions([
                {type: TeamTypes.REMOVE_TEAM_MEMBER_FAILURE, error},
                logError(error)(dispatch)
            ]), getState);
            return {error};
        }

        const member = {
            team_id: teamId,
            user_id: userId
        };

        const actions = [
            {
                type: UserTypes.RECEIVED_PROFILE_NOT_IN_TEAM,
                data: {user_id: userId},
                id: teamId
            },
            {
                type: TeamTypes.REMOVE_MEMBER_FROM_TEAM,
                data: member
            },
            {
                type: TeamTypes.REMOVE_TEAM_MEMBER_SUCCESS
            }
        ];

        const state = getState();
        const {currentUserId} = state.entities.users;

        if (currentUserId === userId) {
            const {channels, myMembers} = state.entities.channels;

            for (const channelMember of Object.values(myMembers)) {
                const channel = channels[channelMember.channel_id];
                if (channel && channel.team_id === teamId) {
                    actions.push({
                        type: ChannelTypes.LEAVE_CHANNEL,
                        data: channel
                    });
                }
            }
        }

        dispatch(batchActions(actions), getState);

        return {data: true};
    };
}

export function updateTeamMemberRoles(teamId, userId, roles) {
    return async (dispatch, getState) => {
        dispatch({type: TeamTypes.UPDATE_TEAM_MEMBER_REQUEST}, getState);

        try {
            await Client4.updateTeamMemberRoles(teamId, userId, roles);
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch, getState);
            dispatch(batchActions([
                {type: TeamTypes.UPDATE_TEAM_MEMBER_FAILURE, error},
                logError(error)(dispatch)
            ]), getState);
            return {error};
        }

        const actions = [
            {
                type: TeamTypes.UPDATE_TEAM_MEMBER_SUCCESS
            }
        ];

        const membersInTeam = getState().entities.teams.membersInTeam[teamId];
        if (membersInTeam && membersInTeam[userId]) {
            actions.push(
                {
                    type: TeamTypes.RECEIVED_MEMBER_IN_TEAM,
                    data: {...membersInTeam[userId], roles}
                }
            );
        }

        dispatch(batchActions(actions), getState);

        return {data: true};
    };
}

export function sendEmailInvitesToTeam(teamId, emails) {
    return bindClientFunc(
        Client4.sendEmailInvitesToTeam,
        TeamTypes.TEAM_EMAIL_INVITE_REQUEST,
        [TeamTypes.TEAM_EMAIL_INVITE_SUCCESS],
        TeamTypes.TEAM_EMAIL_INVITE_FAILURE,
        teamId,
        emails
    );
}

export function checkIfTeamExists(teamName) {
    return async (dispatch, getState) => {
        dispatch({type: TeamTypes.GET_TEAM_REQUEST}, getState);

        let data;
        try {
            data = await Client4.checkIfTeamExists(teamName);
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch, getState);
            dispatch(batchActions([
                {type: TeamTypes.GET_TEAM_FAILURE, error},
                logError(error)(dispatch)
            ]));
            return {error};
        }

        dispatch({type: TeamTypes.GET_TEAM_SUCCESS});

        return {data: data.exists};
    };
}

export function joinTeam(inviteId, teamId) {
    return async (dispatch, getState) => {
        dispatch({type: TeamTypes.JOIN_TEAM_REQUEST}, getState);

        const serverVersion = getState().entities.general.serverVersion;

        try {
            if (serverVersion.charAt(0) === '3') {
                await Client.joinTeamFromInvite(inviteId);
            } else {
                await Client4.joinTeam(inviteId);
            }
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch, getState);
            dispatch(batchActions([
                {type: TeamTypes.JOIN_TEAM_FAILURE, error},
                logError(error)(dispatch)
            ]), getState);
            return {error};
        }

        getMyTeamUnreads()(dispatch, getState);

        await Promise.all([
            getTeam(teamId)(dispatch, getState),
            getMyTeamMembers()(dispatch, getState)
        ]);

        dispatch({type: TeamTypes.JOIN_TEAM_SUCCESS}, getState);
        return {data: true};
    };
}
