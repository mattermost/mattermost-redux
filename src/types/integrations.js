// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
// @flow

export type IntegrationsState = {|
    incomingHooks: Object,
    outgoingHooks: Object,
    oauthApps: Object,
    systemCommands: Object,
    commands: Object
|};
