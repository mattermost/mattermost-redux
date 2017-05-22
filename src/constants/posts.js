// Copyright (c) 2017-present Mattermost, Inc. All Rights Reserved.
// See License.txt for license information.

const PostTypes = {
    ADD_REMOVE: 'system_add_remove',
    ADD_TO_CHANNEL: 'system_add_to_channel',
    CHANNEL_DELETED: 'system_channel_deleted',
    DISPLAYNAME_CHANGE: 'system_displayname_change',
    EPHEMERAL: 'system_ephemeral',
    HEADER_CHANGE: 'system_header_change',
    JOIN_CHANNEL: 'system_join_channel',
    JOIN_LEAVE: 'system_join_leave',
    LEAVE_CHANNEL: 'system_leave_channel',
    PURPOSE_CHANGE: 'system_purpose_change',
    REMOVE_FROM_CHANNEL: 'system_remove_from_channel'
};

export default {
    POST_CHUNK_SIZE: 60,
    POST_DELETED: 'DELETED',
    SYSTEM_MESSAGE_PREFIX: 'system_',
    POST_TYPES: PostTypes,
    POST_COLLAPSE_TIMEOUT: 1000 * 60 * 5, // five minutes
    IGNORE_POST_TYPES: [
        PostTypes.ADD_REMOVE,
        PostTypes.ADD_TO_CHANNEL,
        PostTypes.CHANNEL_DELETED,
        PostTypes.JOIN_LEAVE,
        PostTypes.JOIN_CHANNEL,
        PostTypes.LEAVE_CHANNEL,
        PostTypes.REMOVE_FROM_CHANNEL
    ]
};
