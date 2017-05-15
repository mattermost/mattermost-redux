// Copyright (c) 2016-present Mattermost, Inc. All Rights Reserved.
// See License.txt for license information.

import {batchActions} from 'redux-batched-actions';
import {Client4} from 'client';
import {General} from 'constants';
import {ChannelTypes, TeamTypes, UserTypes} from 'action_types';
import {getLogErrorAction} from './errors';
import {bindClientFunc, forceLogoutIfNecessary} from './helpers';
import {getProfilesByIds, getStatusesByIds} from './users';

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

    if (profilesToLoad.length) {
        await getProfilesByIds(profilesToLoad)(dispatch, getState);
    }

    if (statusesToLoad.length) {
        await getStatusesByIds(statusesToLoad)(dispatch, getState);
    }
}

export function selectTeam(team) {
    return async (dispatch, getState) => dispatch({
        type: TeamTypes.SELECT_TEAM,
        data: team.id
    }, getState);
}

export function getMyTeams() {
    return bindClientFunc(
        Client4.getMyTeams,
        TeamTypes.MY_TEAMS_REQUEST,
        [TeamTypes.RECEIVED_TEAMS_LIST, TeamTypes.MY_TEAMS_SUCCESS],
        TeamTypes.MY_TEAMS_FAILURE
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
        } catch (err) {
            forceLogoutIfNecessary(err, dispatch);
            dispatch(batchActions([
                {type: TeamTypes.CREATE_TEAM_FAILURE, error: err},
                getLogErrorAction(err)
            ]), getState);
            return null;
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

        return created;
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
    return bindClientFunc(
        Client4.getMyTeamMembers,
        TeamTypes.MY_TEAM_MEMBERS_REQUEST,
        [TeamTypes.RECEIVED_MY_TEAM_MEMBERS, TeamTypes.MY_TEAM_MEMBERS_SUCCESS],
        TeamTypes.MY_TEAM_MEMBERS_FAILURE
    );
}

export function getTeamMember(teamId, userId) {
    return async (dispatch, getState) => {
        dispatch({type: TeamTypes.TEAM_MEMBERS_REQUEST}, getState);

        let member;
        try {
            member = await Client4.getTeamMember(teamId, userId);
            getProfilesAndStatusesForMembers([userId], dispatch, getState);
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch);
            dispatch(batchActions([
                {type: TeamTypes.TEAM_MEMBERS_FAILURE, error},
                getLogErrorAction(error)
            ]), getState);
            return null;
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

        return member;
    };
}

export function getTeamMembersByIds(teamId, userIds) {
    return async (dispatch, getState) => {
        dispatch({type: TeamTypes.TEAM_MEMBERS_REQUEST}, getState);

        let members;
        try {
            members = await Client4.getTeamMembersByIds(teamId, userIds);
            getProfilesAndStatusesForMembers(userIds, dispatch, getState);
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch);
            dispatch(batchActions([
                {type: TeamTypes.TEAM_MEMBERS_FAILURE, error},
                getLogErrorAction(error)
            ]), getState);
            return null;
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

        return members;
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
            forceLogoutIfNecessary(error, dispatch);
            dispatch(batchActions([
                {type: TeamTypes.ADD_TEAM_MEMBER_FAILURE, error},
                getLogErrorAction(error)
            ]), getState);
            return null;
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

        return true;
    };
}

export function addUsersToTeam(teamId, userIds) {
    return async (dispatch, getState) => {
        dispatch({type: TeamTypes.ADD_TEAM_MEMBER_REQUEST}, getState);

        let members;
        try {
            members = await Client4.addUsersToTeam(teamId, userIds);
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch);
            dispatch(batchActions([
                {type: TeamTypes.ADD_TEAM_MEMBER_FAILURE, error},
                getLogErrorAction(error)
            ]), getState);
            return null;
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

        return members;
    };
}

export function removeUserFromTeam(teamId, userId) {
    return async (dispatch, getState) => {
        dispatch({type: TeamTypes.REMOVE_TEAM_MEMBER_REQUEST}, getState);

        try {
            await Client4.removeFromTeam(teamId, userId);
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch);
            dispatch(batchActions([
                {type: TeamTypes.REMOVE_TEAM_MEMBER_FAILURE, error},
                getLogErrorAction(error)
            ]), getState);
            return null;
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

        dispatch(batchActions(actions), getState);

        return true;
    };
}

export function updateTeamMemberRoles(teamId, userId, roles) {
    return async (dispatch, getState) => {
        dispatch({type: TeamTypes.UPDATE_TEAM_MEMBER_REQUEST}, getState);

        try {
            await Client4.updateTeamMemberRoles(teamId, userId, roles);
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch);
            dispatch(batchActions([
                {type: TeamTypes.UPDATE_TEAM_MEMBER_FAILURE, error},
                getLogErrorAction(error)
            ]), getState);
            return null;
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

        return true;
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
            forceLogoutIfNecessary(error, dispatch);
            dispatch(batchActions([
                {type: TeamTypes.GET_TEAM_FAILURE, error},
                getLogErrorAction(error)
            ]));
            return null;
        }

        dispatch({type: TeamTypes.GET_TEAM_SUCCESS});

        return data.exists;
    };
}
