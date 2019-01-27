// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
// @flow

export type PreferenceType = {|
    category: string,
    name: string,
    user_id: string,
    value: string
|}

export type Theme = {|
    awayIndicator: string,
    buttonBg: string,
    buttonColor: string,
    centerChannelBg: string,
    centerChannelColor: string,
    codeTheme: string,
    dndIndicator: string,
    errorTextColor: string,
    linkColor: string,
    mentionBg: string,
    mentionBj: string,
    mentionColor: string,
    mentionHighlightBg: string,
    mentionHighlightLink: string,
    newMessageSeparator: string,
    onlineIndicator: string,
    sidebarBg: string,
    sidebarHeaderBg: string,
    sidebarHeaderTextColor: string,
    sidebarText: string,
    sidebarTextActiveBorder: string,
    sidebarTextActiveColor: string,
    sidebarTextHoverBg: string,
    sidebarUnreadText: string,
    type: string,
|}
