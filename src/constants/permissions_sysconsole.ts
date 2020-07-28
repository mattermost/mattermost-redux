// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import Permissions from './permissions';

export const ResourceToSysConsolePermissionsTable: Record<string, Array<string>> = {
    about: [Permissions.READ_SYSCONSOLE_ABOUT, Permissions.WRITE_SYSCONSOLE_ABOUT],
    reporting: [Permissions.READ_SYSCONSOLE_REPORTING, Permissions.WRITE_SYSCONSOLE_REPORTING],
    user_management: [Permissions.READ_SYSCONSOLE_USERMANAGEMENT, Permissions.WRITE_SYSCONSOLE_USERMANAGEMENT],
    'user_management.users': [Permissions.READ_SYSCONSOLE_USERMANAGEMENT_USERS, Permissions.WRITE_SYSCONSOLE_USERMANAGEMENT_USERS],
    'user_management.groups': [Permissions.READ_SYSCONSOLE_USERMANAGEMENT_GROUPS, Permissions.WRITE_SYSCONSOLE_USERMANAGEMENT_GROUPS],
    'user_management.teams': [Permissions.READ_SYSCONSOLE_USERMANAGEMENT_TEAMS, Permissions.WRITE_SYSCONSOLE_USERMANAGEMENT_TEAMS],
    'user_management.channels': [Permissions.READ_SYSCONSOLE_USERMANAGEMENT_CHANNELS, Permissions.WRITE_SYSCONSOLE_USERMANAGEMENT_CHANNELS],
    'user_management.permissions': [Permissions.READ_SYSCONSOLE_USERMANAGEMENT_PERMISSIONS, Permissions.WRITE_SYSCONSOLE_USERMANAGEMENT_PERMISSIONS],
    environment: [Permissions.READ_SYSCONSOLE_ENVIRONMENT, Permissions.WRITE_SYSCONSOLE_ENVIRONMENT],
    site: [Permissions.READ_SYSCONSOLE_SITE, Permissions.WRITE_SYSCONSOLE_SITE],
    authentication: [Permissions.READ_SYSCONSOLE_AUTHENTICATION, Permissions.WRITE_SYSCONSOLE_AUTHENTICATION],
    plugins: [Permissions.READ_SYSCONSOLE_PLUGINS, Permissions.WRITE_SYSCONSOLE_PLUGINS],
    integrations: [Permissions.READ_SYSCONSOLE_INTEGRATIONS, Permissions.WRITE_SYSCONSOLE_INTEGRATIONS],
    compliance: [Permissions.READ_SYSCONSOLE_COMPLIANCE, Permissions.WRITE_SYSCONSOLE_COMPLIANCE],
    experimental: [Permissions.READ_SYSCONSOLE_EXPERIMENTAL, Permissions.WRITE_SYSCONSOLE_EXPERIMENTAL],
};