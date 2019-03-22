// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
// @flow

import type {Channel} from './channels';
import type {Team} from './teams';
import type {PostType} from './posts';
import type {$ID, IDMappedObjects, RelationOneToMany, RelationOneToOne} from './utilities';

export type UserNotifyProps = {|
    desktop: 'default' | 'all' | 'mention' | 'none',
    desktop_sound: 'true' | 'false',
    email: 'true' | 'false',
    mark_unread: 'all' | 'mention',
    push: 'default' | 'all' | 'mention' | 'none',
    push_status: 'ooo' | 'offline' | 'away' | 'dnd' | 'online',
    comments: 'never' | 'root' | 'any',
    first_name: 'true' | 'false',
    channel: 'true' | 'false',
    mention_keys: string,
|};

export type UserProfile = {|
    id: string,
    create_at: number,
    update_at: number,
    delete_at: number,
    username: string,
    auth_data: string,
    auth_service: string,
    email: string,
    email_verified: boolean,
    nickname: string,
    first_name: string,
    last_name: string,
    position: string,
    roles: string,
    locale: string,
    notify_props: UserNotifyProps,
    terms_of_service_id: string,
    terms_of_service_create_at: number,
    timezone?: {|
        useAutomaticTimezone: string,
        automaticTimezone: string,
        manualTimezone: string,
    |},
|};

export type UsersState = {|
    currentUserId: string,
    mySessions: Array<Object>,
    myAudits: Array<Object>,
    profiles: IDMappedObjects<UserProfile>,
    profilesInTeam: RelationOneToMany<Team, UserProfile>,
    profilesNotInTeam: RelationOneToMany<Team, UserProfile>,
    profilesWithoutTeam: Set<Object>,
    profilesInChannel: RelationOneToMany<Channel, UserProfile>,
    profilesNotInChannel: RelationOneToMany<Channel, UserProfile>,
    statuses: RelationOneToOne<UserProfile, string>,
    stats: Object,
|};

export type UserTimezone = {|
    useAutomaticTimezone: boolean | string,
    automaticTimezone: string,
    manualTimezone: string,
|};

export type UserActivity = {
    [PostType]: {
        [$ID<UserProfile>]: {|
            ids: Array<$ID<UserProfile>>,
            usernames: Array<$PropertyType<UserProfile, 'username'>>,
        |} | Array<$ID<UserProfile>>,
    },
};
