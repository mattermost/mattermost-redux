// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
// @flow

export type IncomingWebhook = {|
    id: string,
    create_at: number,
    update_at: number,
    delete_at: number,
    user_id: string,
    channel_id: string,
    team_id: string,
    display_name: string,
    description: string,
    username: string,
    icon_url: string,
    channel_locked: boolean,
|};

export type OutgoingWebhook = {|
    id: string,
    token: string,
    create_at: number,
    update_at: number,
    delete_at: number,
    creator_id: string,
    channel_id: string,
    team_id: string,
    trigger_words: Array<string>,
    trigger_when: number,
    callback_urls: Array<string>,
    display_name: string,
    description: string,
    content_type: string,
    username: string,
    icon_url: string,
|};

export type Command = {|
    "id": string,
    "token": string,
    "create_at": number,
    "update_at": number,
    "delete_at": number,
    "creator_id": string,
    "team_id": string,
    "trigger": string,
    "method": "P" | "G" | "",
    "username": string,
    "icon_url": string,
    "auto_complete": boolean,
    "auto_complete_desc": string,
    "auto_complete_hint": string,
    "display_name": string,
    "description": string,
    "url": string
|};

export type OAuthApp = {|
    "id": string,
    "creator_id": string,
    "create_at": number,
    "update_at": number,
    "client_secret": string,
    "name": string,
    "description": string,
    "icon_url": string,
    "callback_urls": Array<string>,
    "homepage": string,
    "is_trusted": boolean
|};

export type IntegrationsState = {|
    incomingHooks: {[string]: IncomingWebhook},
    outgoingHooks: {[string]: OutgoingWebhook},
    oauthApps: {[string]: OAuthApp},
    systemCommands: {[string]: Command},
    commands: {[string]: Command}
|};
