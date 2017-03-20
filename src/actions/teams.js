// Copyright (c) 2016 Mattermost, Inc. All Rights Reserved.
// See License.txt for license information.

import {batchActions} from 'redux-batched-actions';
import {Client} from 'client';
import {General} from 'constants';
import {TeamTypes} from 'action_types';
import {getLogErrorAction} from './errors';
import {bindClientFunc, forceLogoutIfNecessary} from './helpers';
import {getProfilesByIds, getStatusesByIds} from './users';

async function getProfilesAndStatusesForMembers(userIds, dispatch, getState) {
    const {profiles, statuses} = getState().entities.users;
    const profilesToLoad = [];
    const statusesToLoad = [];

    userIds.forEach((userId) => {
        if (!profiles[userId]) {
            profilesToLoad.push(userId);
        }

        if (!statuses[userId]) {
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

export function fetchTeams() {
    return bindClientFunc(
        Client.getAllTeams,
        TeamTypes.FETCH_TEAMS_REQUEST,
        [TeamTypes.RECEIVED_ALL_TEAMS, TeamTypes.FETCH_TEAMS_SUCCESS],
        TeamTypes.FETCH_TEAMS_FAILURE
    );
}

export function getAllTeamListings() {
    return bindClientFunc(
        Client.getAllTeamListings,
        TeamTypes.TEAM_LISTINGS_REQUEST,
        [TeamTypes.RECEIVED_TEAM_LISTINGS, TeamTypes.TEAM_LISTINGS_SUCCESS],
        TeamTypes.TEAM_LISTINGS_FAILURE
    );
}

export function createTeam(userId, team) {
    return async (dispatch, getState) => {
        dispatch({type: TeamTypes.CREATE_TEAM_REQUEST}, getState);

        let created;
        try {
            created = await Client.createTeam(team);
        } catch (err) {
            forceLogoutIfNecessary(err, dispatch);
            dispatch(batchActions([
                {type: TeamTypes.CREATE_TEAM_FAILURE, error: err},
                getLogErrorAction(err)
            ]), getState);
            return;
        }

        const member = {
            team_id: created.id,
            user_id: userId,
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
                type: TeamTypes.RECEIVED_MY_TEAM_MEMBERS,
                data: [member]
            },
            {
                type: TeamTypes.SELECT_TEAM,
                data: created.id
            },
            {
                type: TeamTypes.CREATE_TEAM_SUCCESS
            }
        ]), getState);
    };
}

export function updateTeam(team) {
    return bindClientFunc(
        Client.updateTeam,
        TeamTypes.UPDATE_TEAM_REQUEST,
        [TeamTypes.UPDATED_TEAM, TeamTypes.UPDATE_TEAM_SUCCESS],
        TeamTypes.UPDATE_TEAM_FAILURE,
        team
    );
}

export function getMyTeamMembers() {
    return bindClientFunc(
        Client.getMyTeamMembers,
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
            member = await Client.getTeamMember(teamId, userId);
            getProfilesAndStatusesForMembers([userId], dispatch, getState);
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch);
            dispatch(batchActions([
                {type: TeamTypes.TEAM_MEMBERS_FAILURE, error},
                getLogErrorAction(error)
            ]), getState);
            return;
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
    };
}

export function getTeamMembersByIds(teamId, userIds) {
    return async (dispatch, getState) => {
        dispatch({type: TeamTypes.TEAM_MEMBERS_REQUEST}, getState);

        let members;
        try {
            members = await Client.getTeamMemberByIds(teamId, userIds);
            getProfilesAndStatusesForMembers(userIds, dispatch, getState);
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch);
            dispatch(batchActions([
                {type: TeamTypes.TEAM_MEMBERS_FAILURE, error},
                getLogErrorAction(error)
            ]), getState);
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
    };
}

export function getTeamStats(teamId) {
    return bindClientFunc(
        Client.getTeamStats,
        TeamTypes.TEAM_STATS_REQUEST,
        [TeamTypes.RECEIVED_TEAM_STATS, TeamTypes.TEAM_STATS_SUCCESS],
        TeamTypes.TEAM_STATS_FAILURE,
        teamId
    );
}

export function addUserToTeam(teamId, userId) {
    return async (dispatch, getState) => {
        dispatch({type: TeamTypes.ADD_TEAM_MEMBER_REQUEST}, getState);

        try {
            await Client.addUserToTeam(teamId, userId);
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch);
            dispatch(batchActions([
                {type: TeamTypes.ADD_TEAM_MEMBER_FAILURE, error},
                getLogErrorAction(error)
            ]), getState);
            return;
        }

        const member = {
            team_id: teamId,
            user_id: userId
        };

        dispatch(batchActions([
            {
                type: TeamTypes.RECEIVED_MEMBER_IN_TEAM,
                data: member
            },
            {
                type: TeamTypes.ADD_TEAM_MEMBER_SUCCESS
            }
        ]), getState);
    };
}

export function removeUserFromTeam(teamId, userId) {
    return async (dispatch, getState) => {
        dispatch({type: TeamTypes.REMOVE_TEAM_MEMBER_REQUEST}, getState);

        try {
            await Client.removeUserFromTeam(teamId, userId);
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch);
            dispatch(batchActions([
                {type: TeamTypes.REMOVE_TEAM_MEMBER_FAILURE, error},
                getLogErrorAction(error)
            ]), getState);
            return;
        }

        const member = {
            team_id: teamId,
            user_id: userId
        };

        dispatch(batchActions([
            {
                type: TeamTypes.REMOVE_MEMBER_FROM_TEAM,
                data: member
            },
            {
                type: TeamTypes.REMOVE_TEAM_MEMBER_SUCCESS
            }
        ]), getState);
    };
}
