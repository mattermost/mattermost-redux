// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import {UserProfile} from 'types/users';
import {Post} from 'types/posts';
import {$ID, IDMappedObjects, RelationOneToMany, RelationOneToOne} from 'types/utilities';
import {Team} from 'types/teams';
import {Channel} from 'types/channels';

export type UserThread = {
    id: string;
    reply_count: number;
    last_reply_at: number;
    last_viewed_at: number;
    participants: (UserProfile | $ID<UserProfile>)[];
    post: Post;
    unread_replies: number;
    unread_mentions: number;
}

export type UserThreadList = {
    total: number;
    total_unread_replies: number;
    total_unread_mentions: number;
    threads: UserThread[];
}

export type ThreadsState = {
    threadsInTeam: RelationOneToMany<Team, UserThread>;
    threads: IDMappedObjects<UserThread>;
    selectedThreadIdInTeam: RelationOneToOne<Team, string|undefined>;
    counts: RelationOneToOne<Team, {
        total: number;
        total_unread_replies: number;
        total_unread_mentions: number;
    }>;
};
