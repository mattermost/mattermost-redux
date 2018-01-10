// Copyright (c) 2018-present Mattermost, Inc. All Rights Reserved.
// See License.txt for license information.

import {createSelector} from 'reselect';

import {getCurrentUser} from 'selectors/entities/common';
import {getTeamMemberships} from 'selectors/entities/teams';
import {getMyChannelMemberships} from 'selectors/entities/channels';

export const getMySystemRoles = createSelector(
    getCurrentUser,
    (user) => {
        if (user) {
            return new Set(user.roles.split(' '));
        }
        return new Set();
    }
);

export const getMyTeamRoles = createSelector(
    getTeamMemberships,
    (teamsMemberships) => {
        const roles = {};
        if (teamsMemberships) {
            for (const key in teamsMemberships) {
                if (teamsMemberships.hasOwnProperty(key)) {
                    roles[key] = new Set(teamsMemberships[key].roles.split(' '));
                }
            }
        }
        return roles;
    }
);

export const getMyChannelRoles = createSelector(
    getMyChannelMemberships,
    (channelsMemberships) => {
        const roles = {};
        if (channelsMemberships) {
            for (const key in channelsMemberships) {
                if (channelsMemberships.hasOwnProperty(key)) {
                    roles[key] = new Set(channelsMemberships[key].roles.split(' '));
                }
            }
        }
        return roles;
    }
);

export const getMyRoles = createSelector(
    getMySystemRoles,
    getMyTeamRoles,
    getMyChannelRoles,
    (systemRoles, teamRoles, channelRoles) => {
        return {
            system: systemRoles,
            team: teamRoles,
            channel: channelRoles
        };
    }
);

export function getRoles(state) {
    return state.entities.roles.roles;
}

export const getMySystemPerms = createSelector(
    getMySystemRoles,
    getRoles,
    (mySystemRoles, roles) => {
        const perms = new Set();
        for (const roleName of mySystemRoles) {
            if (roles[roleName]) {
                for (const perm of roles[roleName].permissions) {
                    perms.add(perm);
                }
            }
        }
        return perms;
    }
);

export const getMyTeamPerms = createSelector(
    getMyTeamRoles,
    getRoles,
    getMySystemPerms,
    (state, options) => options.team,
    (myTeamRoles, roles, systemPerms, teamId) => {
        const perms = new Set();
        if (myTeamRoles[teamId]) {
            for (const roleName of myTeamRoles[teamId]) {
                if (roles[roleName]) {
                    for (const perm of roles[roleName].permissions) {
                        perms.add(perm);
                    }
                }
            }
        }
        for (const perm of systemPerms) {
            perms.add(perm);
        }
        return perms;
    }
);

export const getMyChannelPerms = createSelector(
    getMyChannelRoles,
    getRoles,
    getMyTeamPerms,
    (state, options) => options.team,
    (state, options) => options.channel,
    (myChannelRoles, roles, teamPerms, teamId, channelId) => {
        const perms = new Set();
        if (myChannelRoles[channelId]) {
            for (const roleName of myChannelRoles[channelId]) {
                if (roles[roleName]) {
                    for (const perm of roles[roleName].permissions) {
                        perms.add(perm);
                    }
                }
            }
        }
        for (const perm of teamPerms) {
            perms.add(perm);
        }
        return perms;
    }
);

export const haveISystemPerm = createSelector(
    getMySystemPerms,
    (state, options) => options.perm,
    (perms, perm) => {
        return perms.has(perm);
    }
);

export const haveITeamPerm = createSelector(
    getMyTeamPerms,
    (state, options) => options.perm,
    (perms, perm) => {
        return perms.has(perm);
    }
);

export const haveIChannelPerm = createSelector(
    getMyChannelPerms,
    (state, options) => options.perm,
    (perms, perm) => {
        return perms.has(perm);
    }
);
