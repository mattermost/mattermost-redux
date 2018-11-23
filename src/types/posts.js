// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
// @flow

import type {CustomEmoji} from './emojis';
import type {FileInfo} from './files';
import type {Reaction} from './reactions';

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

export type PostEmbedType = 'image' | 'message_attachment' | 'opengraph';

export type PostEmbed = {|
    type: PostEmbedType,
    url: string,
    data: Object
|};

export type PostImage = {|
    height: number,
    width: number
|};

export type PostMetadata = {|
    embeds: Array<PostEmbed>,
    emojis: Array<CustomEmoji>,
    files: Array<FileInfo>,
    images: {[string]: PostImage},
    reactions: Array<Reaction>
|};

export type Post = {|
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
    pending_post_id: string,
    metadata: PostMetadata
|}

export type PostsState = {|
    posts: {[string]: Post},
    postsInChannel: {[string]: Array<string>},
    postsInThread: {[string]: Array<string>},
    selectedPostId: string,
    currentFocusedPostId: string,
    messagesHistory: {|
        messages: Array<string>,
        index: {|
            post: number,
            comment: number
        |}
    |}
|};
