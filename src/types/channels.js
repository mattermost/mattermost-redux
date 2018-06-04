// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
// @flow

export type ChannelType = 'O' | 'P' | 'D' | 'G';

export type ChannelStats = {|
    channel_id: string,
    member_count: number
|};

export type NotifyProps = {|
    desktop: 'default' | 'all' | 'mention' | 'none',
    email: 'default' | 'all' | 'mention' | 'none',
    mark_unread: 'all' | 'mention',
    push: 'default' | 'all' | 'mention' | 'none'
|};

export type Channel = {|
    id: string,
    create_at: number,
    update_at: number,
    delete_at: number,
    team_id: string,
    type: ChannelType,
    display_name: string,
    name: string,
    header: string,
    purpose: string,
    last_post_at: number,
    total_msg_count: number,
    extra_update_at: number,
    creator_id: string,
    scheme_id: string
|};

export type ChannelMembership = {|
    channel_id: string,
    user_id: string,
    roles: string,
    last_viewed_at: number,
    msg_count: number,
    mention_count: number,
    notify_props: NotifyProps,
    last_update_at: number,
    scheme_user: boolean,
    scheme_admin: boolean
|}

export type ChannelsState = {|
    currentChannelId: string,
    channels: { [string]: Channel },
    channelsInTeam: { [string]: Array<string> },
    myMembers: { [string]: ChannelMembership },
    membersInChannel: { [string]: { [string]: ChannelMembership } },
    stats: { [string]: ChannelStats }
|};
