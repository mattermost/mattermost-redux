// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
// @flow

export type PostType = 'system_add_remove' |
                       'system_add_to_channel' |
                       'system_channel_deleted' |
                       'system_displayname_change' |
                       'system_convert_channel' |
                       'system_ephemeral' |
                       'system_header_change' |
                       'system_join_channel' |
                       'system_join_leave' |
                       'system_leave_channel' |
                       'system_purpose_change' |
                       'system_remove_from_channel';

export type Post = {
    id: string,
    create_at: number,
    update_at: number,
    edit_at: number,
    delete_at: number,
    is_pinned: boolean,
    user_id: string,
    channel_id: string,
    root_id: string,
    parent_id: string,
    original_id: string,
    message: string,
    type: PostType,
    props: Object,
    hashtags: string,
    pending_post_id: string
}

export type PostsState = {
    posts: {[string]: Post},
    postsInChannel: {[string]: Array<string>},
    selectedPostId: string,
    currentFocusedPostId: string,
    messagesHistory: {
        messages: Array<string>,
        index: {
            post: number,
            comment: number
        }
    }
};
