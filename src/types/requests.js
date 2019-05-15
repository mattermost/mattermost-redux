// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
// @flow

export type RequestStatusOption = 'not_started' | 'started' | 'success' | 'failure' | 'cancelled';
export type RequestStatusType = {|
    status: RequestStatusOption,
    error: null | Object
|};

export type ChannelsRequestsStatuses = {|
    getChannels: RequestStatusType,
    getAllChannels: RequestStatusType,
    myChannels: RequestStatusType,
    createChannel: RequestStatusType,
    updateChannel: RequestStatusType,
|};

export type GeneralRequestsStatuses = {|
    server: RequestStatusType,
    config: RequestStatusType,
    dataRetentionPolicy: RequestStatusType,
    license: RequestStatusType,
    websocket: RequestStatusType,
    redirectLocation: RequestStatusType
|};

export type PostsRequestsStatuses = {|
    createPost: RequestStatusType,
    editPost: RequestStatusType,
    getPostThread: RequestStatusType,
|};

export type TeamsRequestsStatuses = {|
    getMyTeams: RequestStatusType,
    getTeams: RequestStatusType,
    joinTeam: RequestStatusType,
|};

export type UsersRequestsStatuses = {|
    checkMfa: RequestStatusType,
    login: RequestStatusType,
    logout: RequestStatusType,
    autocompleteUsers: RequestStatusType,
    updateMe: RequestStatusType,
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
    testS3Connection: RequestStatusType,
    getLdapGroups: RequestStatusType,
    linkLdapGroup: RequestStatusType,
    unlinkLdapGroup: RequestStatusType,
    deleteBrandImage: RequestStatusType,
    disablePlugin: RequestStatusType,
    enablePlugin: RequestStatusType,
    getAnalytics: RequestStatusType,
    getClusterStatus: RequestStatusType,
    getEnvironmentConfig: RequestStatusType,
    getPluginStatuses: RequestStatusType,
    getPlugins: RequestStatusType,
    getSamlCertificateStatus: RequestStatusType,
    purgeElasticsearchIndexes: RequestStatusType,
    removeIdpSamlCertificate: RequestStatusType,
    removeLicense: RequestStatusType,
    removePlugin: RequestStatusType,
    removePrivateSamlCertificate: RequestStatusType,
    removePublicSamlCertificate: RequestStatusType,
    syncLdap: RequestStatusType,
    testElasticsearch: RequestStatusType,
    testLdap: RequestStatusType,
    uploadBrandImage: RequestStatusType,
    uploadIdpSamlCertificate: RequestStatusType,
    uploadLicense: RequestStatusType,
    uploadPlugin: RequestStatusType,
    uploadPrivateSamlCertificate: RequestStatusType,
    uploadPublicSamlCertificate: RequestStatusType,
|};

export type EmojisRequestsStatuses = {|
    createCustomEmoji: RequestStatusType,
    getCustomEmojis: RequestStatusType,
    deleteCustomEmoji: RequestStatusType,
    getAllCustomEmojis: RequestStatusType,
    getCustomEmoji: RequestStatusType,
|};

export type FilesRequestsStatuses = {|
    uploadFiles: RequestStatusType,
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
    deleteOAuthApp: RequestStatusType,
    executeCommand: RequestStatusType,
    submitInteractiveDialog: RequestStatusType,
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

export type GroupsRequestsStatuses = {|
    linkGroupSyncable: RequestStatusType,
    unlinkGroupSyncable: RequestStatusType,
    getGroupSyncables: RequestStatusType,
    getGroupMembers: RequestStatusType,
    getGroup: RequestStatusType,
    getAllGroupsAssociatedToTeam: RequestStatusType,
    getAllGroupsAssociatedToChannel: RequestStatusType,
    getGroupsAssociatedToTeam: RequestStatusType,
    getGroupsAssociatedToChannel: RequestStatusType,
    getGroupsNotAssociatedToTeam: RequestStatusType,
    getGroupsNotAssociatedToChannel: RequestStatusType,
|};

export type JobsRequestsStatuses = {|
    createJob: RequestStatusType,
    getJob: RequestStatusType,
    getJobs: RequestStatusType,
    cancelJob: RequestStatusType,
|};

export type SearchRequestsStatuses = {|
    flaggedPosts: RequestStatusType,
    pinnedPosts: RequestStatusType,
    recentMentions: RequestStatusType,
    searchPosts: RequestStatusType,
|};
