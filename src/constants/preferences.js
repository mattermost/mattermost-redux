// Copyright (c) 2017-present Mattermost, Inc. All Rights Reserved.
// See License.txt for license information.

export default {
    CATEGORY_CHANNEL_OPEN_TIME: 'channel_open_time',
    CATEGORY_DIRECT_CHANNEL_SHOW: 'direct_channel_show',
    CATEGORY_GROUP_CHANNEL_SHOW: 'group_channel_show',
    CATEGORY_FLAGGED_POST: 'flagged_post',
    CATEGORY_FAVORITE_CHANNEL: 'favorite_channel',
    CATEGORY_AUTO_RESET_MANUAL_STATUS: 'auto_reset_manual_status',

    CATEGORY_NOTIFICATIONS: 'notifications',
    EMAIL_INTERVAL: 'email_interval',
    INTERVAL_FIFTEEN_MINUTES: 15 * 60,
    INTERVAL_HOUR: 60 * 60,
    INTERVAL_IMMEDIATE: 30, // "immediate" is a 30 second interval

    CATEGORY_DISPLAY_SETTINGS: 'display_settings',
    NAME_NAME_FORMAT: 'name_format',
    DISPLAY_PREFER_NICKNAME: 'nickname_full_name',
    DISPLAY_PREFER_FULL_NAME: 'full_name',

    CATEGORY_SIDEBAR_SETTINGS: 'sidebar_settings',

    CATEGORY_ADVANCED_SETTINGS: 'advanced_settings',
    ADVANCED_FILTER_JOIN_LEAVE: 'join_leave',

    CATEGORY_THEME: 'theme',
    THEMES: {
        default: {
            type: 'Mattermost',
            sidebarBg: '#145dbf',
            sidebarText: '#ffffff',
            sidebarUnreadText: '#ffffff',
            sidebarTextHoverBg: '#4578bf',
            sidebarTextActiveBorder: '#579eff',
            sidebarTextActiveColor: '#ffffff',
            sidebarHeaderBg: '#1153ab',
            sidebarHeaderTextColor: '#ffffff',
            onlineIndicator: '#06d6a0',
            awayIndicator: '#ffbc42',
            mentionBj: '#ffffff',
            mentionColor: '#145dbf',
            centerChannelBg: '#ffffff',
            centerChannelColor: '#3d3c40',
            newMessageSeparator: '#ff8800',
            linkColor: '#2389d7',
            buttonBg: '#166de0',
            buttonColor: '#ffffff',
            errorTextColor: '#fd5960',
            mentionHighlightBg: '#ffe577',
            mentionHighlightLink: '#166de0',
            codeTheme: 'github'
        }
    }
};
