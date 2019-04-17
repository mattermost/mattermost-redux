// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
// @flow

export type SyncableType = 'team' | 'channel';

export type SyncablePatch = {|
    auto_add: boolean
|};

export type Group = {|
    id: string,
    name: string,
    display_name: string,
    description: string,
    type: string,
    remote_id: string,
    create_at: number,
    update_at: number,
    delete_at: number,
    has_syncables: boolean,
    member_count: number,
|};

export type GroupTeam = {|
    team_id: string,
    team_display_name: string,
    team_type: string,
    group_id: string,
    auto_add: boolean,
    create_at: number,
    delete_at: number,
    update_at: number,
|};

export type GroupChannel = {|
    channel_id: string,
    channel_display_name: string,
    channel_type: string,
    team_id: string,
    team_display_name: string,
    team_type: string,
    group_id: string,
    auto_add: boolean,
    create_at: number,
    delete_at: number,
    update_at: number,
|};

export type GroupSyncables = {|
    teams: Array<GroupTeam>,
    channels: Array<GroupChannel>,
|};

export type GroupsState = {|
    syncables: {[string]: GroupSyncables},
    members: Object,
    groups: { [string]: Group },
|};

export type GroupSearchOpts = {|
    q: string,
    is_linked?: boolean,
    is_configured?: boolean,
|};