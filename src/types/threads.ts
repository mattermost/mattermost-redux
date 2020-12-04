// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {UserProfile} from './users';
import {Post} from './posts';
import {IDMappedObjects, $ID} from './utilities';

export type Thread = {
    id: string;
    reply_count: number;
    unread_replies: number;
    unread_mentions: number;
    last_reply_at: number;
    last_viewed_at: number;
    participants: (UserProfile | $ID<UserProfile>)[];
    post: Post;
};

export type ThreadsState = {
    threads: IDMappedObjects<Thread>;
    order: $ID<Thread>[];
    selectedThreadId: string;
};

export type ThreadList = {
    total: number;
    threads: Thread[];
};