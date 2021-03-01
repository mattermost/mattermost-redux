// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import Permissions from './permissions';

export const ResourceToSysConsolePermissionsTable: Record<string, string[]> = {
    about: [Permissions.SYSCONSOLE_READ_ABOUT, Permissions.SYSCONSOLE_WRITE_ABOUT],
    billing: [Permissions.SYSCONSOLE_READ_BILLING, Permissions.SYSCONSOLE_WRITE_BILLING],
    reporting: [Permissions.SYSCONSOLE_READ_REPORTING, Permissions.SYSCONSOLE_WRITE_REPORTING],
    'user_management.users': [Permissions.SYSCONSOLE_READ_USERMANAGEMENT_USERS, Permissions.SYSCONSOLE_WRITE_USERMANAGEMENT_USERS],
    'user_management.groups': [Permissions.SYSCONSOLE_READ_USERMANAGEMENT_GROUPS, Permissions.SYSCONSOLE_WRITE_USERMANAGEMENT_GROUPS],
    'user_management.teams': [Permissions.SYSCONSOLE_READ_USERMANAGEMENT_TEAMS, Permissions.SYSCONSOLE_WRITE_USERMANAGEMENT_TEAMS],
    'user_management.channels': [Permissions.SYSCONSOLE_READ_USERMANAGEMENT_CHANNELS, Permissions.SYSCONSOLE_WRITE_USERMANAGEMENT_CHANNELS],
    'user_management.permissions': [Permissions.SYSCONSOLE_READ_USERMANAGEMENT_PERMISSIONS, Permissions.SYSCONSOLE_WRITE_USERMANAGEMENT_PERMISSIONS],
    'user_management.system_roles': [Permissions.SYSCONSOLE_READ_USERMANAGEMENT_SYSTEM_ROLES, Permissions.SYSCONSOLE_WRITE_USERMANAGEMENT_SYSTEM_ROLES],
    'environment.web_server': [Permissions.SYSCONSOLE_READ_ENVIRONMENT_WEB_SERVER, Permissions.SYSCONSOLE_WRITE_ENVIRONMENT_WEB_SERVER],
    'environment.database': [Permissions.SYSCONSOLE_READ_ENVIRONMENT_DATABASE, Permissions.SYSCONSOLE_WRITE_ENVIRONMENT_DATABASE],
    'environment.elasticsearch': [Permissions.SYSCONSOLE_READ_ENVIRONMENT_ELASTICSEARCH, Permissions.SYSCONSOLE_WRITE_ENVIRONMENT_ELASTICSEARCH],
    'environment.file_storage': [Permissions.SYSCONSOLE_READ_ENVIRONMENT_FILE_STORAGE, Permissions.SYSCONSOLE_WRITE_ENVIRONMENT_FILE_STORAGE],
    'environment.image_proxy': [Permissions.SYSCONSOLE_READ_ENVIRONMENT_IMAGE_PROXY, Permissions.SYSCONSOLE_WRITE_ENVIRONMENT_IMAGE_PROXY],
    'environment.smtp': [Permissions.SYSCONSOLE_READ_ENVIRONMENT_SMTP, Permissions.SYSCONSOLE_WRITE_ENVIRONMENT_SMTP],
    'environment.push_notification_server': [Permissions.SYSCONSOLE_READ_ENVIRONMENT_PUSH_NOTIFICATION_SERVER, Permissions.SYSCONSOLE_WRITE_ENVIRONMENT_PUSH_NOTIFICATION_SERVER],
    'environment.high_availability': [Permissions.SYSCONSOLE_READ_ENVIRONMENT_HIGH_AVAILABILITY, Permissions.SYSCONSOLE_WRITE_ENVIRONMENT_HIGH_AVAILABILITY],
    'environment.rate_limiting': [Permissions.SYSCONSOLE_READ_ENVIRONMENT_RATE_LIMITING, Permissions.SYSCONSOLE_WRITE_ENVIRONMENT_RATE_LIMITING],
    'environment.logging': [Permissions.SYSCONSOLE_READ_ENVIRONMENT_LOGGING, Permissions.SYSCONSOLE_WRITE_ENVIRONMENT_LOGGING],
    'environment.session_lengths': [Permissions.SYSCONSOLE_READ_ENVIRONMENT_SESSION_LENGTHS, Permissions.SYSCONSOLE_WRITE_ENVIRONMENT_SESSION_LENGTHS],
    'environment.performance_monitoring': [Permissions.SYSCONSOLE_READ_ENVIRONMENT_PERFORMANCE_MONITORING, Permissions.SYSCONSOLE_WRITE_ENVIRONMENT_PERFORMANCE_MONITORING],
    'environment.developer': [Permissions.SYSCONSOLE_READ_ENVIRONMENT_DEVELOPER, Permissions.SYSCONSOLE_WRITE_ENVIRONMENT_DEVELOPER],
    site: [Permissions.SYSCONSOLE_READ_SITE, Permissions.SYSCONSOLE_WRITE_SITE],
    authentication: [Permissions.SYSCONSOLE_READ_AUTHENTICATION, Permissions.SYSCONSOLE_WRITE_AUTHENTICATION],
    plugins: [Permissions.SYSCONSOLE_READ_PLUGINS, Permissions.SYSCONSOLE_WRITE_PLUGINS],
    integrations: [Permissions.SYSCONSOLE_READ_INTEGRATIONS, Permissions.SYSCONSOLE_WRITE_INTEGRATIONS],
    compliance: [Permissions.SYSCONSOLE_READ_COMPLIANCE, Permissions.SYSCONSOLE_WRITE_COMPLIANCE],
    experimental: [Permissions.SYSCONSOLE_READ_EXPERIMENTAL, Permissions.SYSCONSOLE_WRITE_EXPERIMENTAL],
};