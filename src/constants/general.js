// Copyright (c) 2017-present Mattermost, Inc. All Rights Reserved.
// See License.txt for license information.

export default {
    CONFIG_CHANGED: 'config_changed',

    PAGE_SIZE_DEFAULT: 60,
    PAGE_SIZE_MAXIMUM: 200,
    AUDITS_CHUNK_SIZE: 100,
    PROFILE_CHUNK_SIZE: 100,
    CHANNELS_CHUNK_SIZE: 50,
    TEAMS_CHUNK_SIZE: 50,
    JOBS_CHUNK_SIZE: 50,
    SEARCH_TIMEOUT_MILLISECONDS: 100,
    STATUS_INTERVAL: 60000,

    MENTION: 'mention',

    OFFLINE: 'offline',
    AWAY: 'away',
    ONLINE: 'online',

    PERMISSIONS_ALL: 'all',
    PERMISSIONS_CHANNEL_ADMIN: 'channel_admin',
    PERMISSIONS_TEAM_ADMIN: 'team_admin',
    PERMISSIONS_SYSTEM_ADMIN: 'system_admin',

    TEAM_USER_ROLE: 'team_user',
    TEAM_ADMIN_ROLE: 'team_admin',

    CHANNEL_USER_ROLE: 'channel_user',
    CHANNEL_ADMIN_ROLE: 'channel_admin',

    SYSTEM_USER_ROLE: 'system_user',
    SYSTEM_ADMIN_ROLE: 'system_admin',

    ALLOW_EDIT_POST_ALWAYS: 'always',
    ALLOW_EDIT_POST_NEVER: 'never',
    ALLOW_EDIT_POST_TIME_LIMIT: 'time_limit',
    DEFAULT_POST_EDIT_TIME_LIMIT: 300,

    RESTRICT_DIRECT_MESSAGE_ANY: 'any',
    RESTRICT_DIRECT_MESSAGE_TEAM: 'team',

    DEFAULT_CHANNEL: 'town-square',
    DM_CHANNEL: 'D',
    OPEN_CHANNEL: 'O',
    PRIVATE_CHANNEL: 'P',
    GM_CHANNEL: 'G',

    START_OF_NEW_MESSAGES: 'start-of-new-messages',

    PUSH_NOTIFY_APPLE_REACT_NATIVE: 'apple_rn',
    PUSH_NOTIFY_ANDROID_REACT_NATIVE: 'android_rn',

    STORE_REHYDRATION_COMPLETE: 'store_hydation_complete',
    OFFLINE_STORE_RESET: 'offline_store_reset',
    OFFLINE_STORE_PURGE: 'offline_store_purge',

    TEAMMATE_NAME_DISPLAY: {
        SHOW_USERNAME: 'username',
        SHOW_NICKNAME_FULLNAME: 'nickname_full_name',
        SHOW_FULLNAME: 'full_name'
    },

    SPECIAL_MENTIONS: [
        'all',
        'channel',
        'here'
    ]
};
