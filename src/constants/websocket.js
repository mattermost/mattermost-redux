// Copyright (c) 2016-present Mattermost, Inc. All Rights Reserved.
// See License.txt for license information.

const WebsocketEvents = {
    POSTED: 'posted',
    POST_EDITED: 'post_edited',
    POST_DELETED: 'post_deleted',
    CHANNEL_CREATED: 'channel_created',
    CHANNEL_DELETED: 'channel_deleted',
    CHANNEL_UPDATED: 'channel_updated',
    CHANNEL_VIEWED: 'channel_viewed',
    DIRECT_ADDED: 'direct_added',
    ADDED_TO_TEAM: 'added_to_team',
    LEAVE_TEAM: 'leave_team',
    UPDATE_TEAM: 'update_team',
    USER_ADDED: 'user_added',
    USER_REMOVED: 'user_removed',
    USER_UPDATED: 'user_updated',
    ROLE_ADDED: 'role_added',
    ROLE_REMOVED: 'role_removed',
    ROLE_UPDATED: 'role_updated',
    TYPING: 'typing',
    STOP_TYPING: 'stop_typing',
    PREFERENCE_CHANGED: 'preference_changed',
    PREFERENCES_CHANGED: 'preferences_changed',
    PREFERENCES_DELETED: 'preferences_deleted',
    EPHEMERAL_MESSAGE: 'ephemeral_message',
    STATUS_CHANGED: 'status_change',
    HELLO: 'hello',
    WEBRTC: 'webrtc',
    REACTION_ADDED: 'reaction_added',
    REACTION_REMOVED: 'reaction_removed',
    EMOJI_ADDED: 'emoji_added'
};

export default WebsocketEvents;
