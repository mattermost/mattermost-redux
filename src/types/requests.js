// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
// @flow

export type RequestStatusOption = 'not_started' | 'started' | 'success' | 'failure' | 'cancelled';
export type RequestStatusType = {|
    status: RequestStatusOption,
    error: null | Object
|};

export type ChannelsRequestsStatuses = {|
    getChannel: RequestStatusType,
    getChannels: RequestStatusType,
    myMembers: RequestStatusType,
    members: RequestStatusType,
    myChannels: RequestStatusType,
    createChannel: RequestStatusType,
    updateChannel: RequestStatusType,
    updateChannelNotifyProps: RequestStatusType,
    joinChannel: RequestStatusType,
    deleteChannel: RequestStatusType,
    updateLastViewedAt: RequestStatusType,
    getChannelStats: RequestStatusType,
    addChannelMember: RequestStatusType,
    removeChannelMember: RequestStatusType,
    updateChannelMember: RequestStatusType,
    updateChannelScheme: RequestStatusType,
    updateChannelMemberSchemeRoles: RequestStatusType,
|};

export type GeneralRequestsStatuses = {|
    server: RequestStatusType,
    config: RequestStatusType,
    dataRetentionPolicy: RequestStatusType,
    license: RequestStatusType,
    websocket: RequestStatusType
|};

export type PostsRequestsStatuses = {|
    createPost: RequestStatusType,
    editPost: RequestStatusType,
    deletePost: RequestStatusType,
    getPostThread: RequestStatusType,
    getPostThreadRetryAttempts: number,
    getPosts: RequestStatusType,
    getPostsRetryAttempts: number,
    getPostsSince: RequestStatusType,
    getPostsSinceRetryAttempts: number,
    getPostsBefore: RequestStatusType,
    getPostsBeforeRetryAttempts: number,
    getPostsAfter: RequestStatusType,
    getPostsAfterRetryAttempts: number
|};

export type TeamsRequestsStatuses = {|
    getMyTeams: RequestStatusType,
    getTeams: RequestStatusType,
    createTeam: RequestStatusType,
    updateTeam: RequestStatusType,
    getMyTeamMembers: RequestStatusType,
    getTeamMembers: RequestStatusType,
    getTeamStats: RequestStatusType,
    addUserToTeam: RequestStatusType,
    removeUserFromTeam: RequestStatusType,
    updateTeamScheme: RequestStatusType,
|};

export type UsersRequestsStatuses = {|
    checkMfa: RequestStatusType,
    login: RequestStatusType,
    logout: RequestStatusType,
    create: RequestStatusType,
    getProfiles: RequestStatusType,
    getProfilesInTeam: RequestStatusType,
    getProfilesInChannel: RequestStatusType,
    getProfilesNotInChannel: RequestStatusType,
    getUser: RequestStatusType,
    getUserByUsername: RequestStatusType,
    getStatusesByIds: RequestStatusType,
    getSessions: RequestStatusType,
    revokeSession: RequestStatusType,
    getAudits: RequestStatusType,
    autocompleteUsers: RequestStatusType,
    searchProfiles: RequestStatusType,
    updateMe: RequestStatusType
|};

export type PreferencesRequestsStatuses = {|
    getMyPreferences: RequestStatusType,
    savePreferences: RequestStatusType,
    deletePreferences: RequestStatusType
|};

export type AdminRequestsStatuses = {|
    getLogs: RequestStatusType,
    getAudits: RequestStatusType,
    getConfig: RequestStatusType,
    updateConfig: RequestStatusType,
    reloadConfig: RequestStatusType,
    testEmail: RequestStatusType,
    invalidateCaches: RequestStatusType,
    recycleDatabase: RequestStatusType,
    createCompliance: RequestStatusType,
    getCompliance: RequestStatusType,
    testS3Connection: RequestStatusType
|};

export type EmojisRequestsStatuses = {|
    createCustomEmoji: RequestStatusType,
    getCustomEmojis: RequestStatusType,
    deleteCustomEmoji: RequestStatusType
|};

export type FilesRequestsStatuses = {|
    getFilesForPost: RequestStatusType,
    uploadFiles: RequestStatusType,
    getFilePublicLink: RequestStatusType
|};

export type IntegrationsRequestsStatuses = {|
    createIncomingHook: RequestStatusType,
    getIncomingHooks: RequestStatusType,
    deleteIncomingHook: RequestStatusType,
    updateIncomingHook: RequestStatusType,
    createOutgoingHook: RequestStatusType,
    getOutgoingHooks: RequestStatusType,
    deleteOutgoingHook: RequestStatusType,
    updateOutgoingHook: RequestStatusType,
    getCommands: RequestStatusType,
    getAutocompleteCommands: RequestStatusType,
    getCustomTeamCommands: RequestStatusType,
    addCommand: RequestStatusType,
    regenCommandToken: RequestStatusType,
    editCommand: RequestStatusType,
    deleteCommand: RequestStatusType,
    addOAuthApp: RequestStatusType,
    updateOAuthApp: RequestStatusType,
    getOAuthApp: RequestStatusType,
    getOAuthApps: RequestStatusType,
    deleteOAuthApp: RequestStatusType
|};

export type RolesRequestsStatuses = {|
    getRolesByNames: RequestStatusType,
    getRoleByName: RequestStatusType,
    getRole: RequestStatusType,
    editRole: RequestStatusType
|};

export type SchemesRequestsStatuses = {|
    getSchemes: RequestStatusType,
    getScheme: RequestStatusType,
    createScheme: RequestStatusType,
    deleteScheme: RequestStatusType,
    patchScheme: RequestStatusType,
    getSchemeTeams: RequestStatusType,
    getSchemeChannels: RequestStatusType
|};
