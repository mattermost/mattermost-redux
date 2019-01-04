// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
// @flow

import type {Channel} from './channels';
import type {IDMappedObjects, RelationOneToMany, RelationOneToOne} from './utilities';

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
|};

export type UsersState = {|
    currentUserId: string,
    myAcceptedTermsOfServiceData: Object,
    mySessions: Array<Object>,
    myAudits: Array<Object>,
    profiles: IDMappedObjects<UserProfile>,
    profilesInTeam: Object,
    profilesNotInTeam: Object,
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
