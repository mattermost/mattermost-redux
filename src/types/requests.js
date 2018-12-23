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
    getChannelTimezones: RequestStatusType,
    updateChannelMember: RequestStatusType,
    updateChannelScheme: RequestStatusType,
    updateChannelMemberSchemeRoles: RequestStatusType,
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
    getPostsAfterRetryAttempts: number,
    doPostAction: RequestStatusType,
    openGraph: RequestStatusType,
    reaction: RequestStatusType
|};

export type TeamsRequestsStatuses = {|
    getMyTeams: RequestStatusType,
    getTeams: RequestStatusType,
    createTeam: RequestStatusType,
    updateTeam: RequestStatusType,
    patchTeam: RequestStatusType,
    getMyTeamMembers: RequestStatusType,
    getTeamMembers: RequestStatusType,
    getTeamStats: RequestStatusType,
    addUserToTeam: RequestStatusType,
    removeUserFromTeam: RequestStatusType,
    updateTeamScheme: RequestStatusType,
    deleteTeam: RequestStatusType,
    emailInvite: RequestStatusType,
    getMyTeamUnreads: RequestStatusType,
    getTeam: RequestStatusType,
    joinTeam: RequestStatusType,
    removeTeamIcon: RequestStatusType,
    setTeamIcon: RequestStatusType,
    updateTeamMember: RequestStatusType,
    updateTeamMemberSchemeRoles: RequestStatusType,
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
    getTermsOfService: RequestStatusType,
    createTermsOfService: RequestStatusType,
    getMyTermsOfServiceStatus: RequestStatusType,
    updateMyTermsOfServiceStatus: RequestStatusType,
    revokeSession: RequestStatusType,
    getAudits: RequestStatusType,
    autocompleteUsers: RequestStatusType,
    searchProfiles: RequestStatusType,
    updateMe: RequestStatusType,
    getTotalUsersStats: RequestStatusType,
    createUserAccessToken: RequestStatusType,
    disableUserAccessToken: RequestStatusType,
    enableUserAccessToken: RequestStatusType,
    generateMfaSecret: RequestStatusType,
    getProfilesNotInTeam: RequestStatusType,
    getProfilesWithoutTeam: RequestStatusType,
    getStatus: RequestStatusType,
    getUserAccessToken: RequestStatusType,
    passwordReset: RequestStatusType,
    revokeAllSessionsForUser: RequestStatusType,
    revokeUserAccessToken: RequestStatusType,
    setStatus: RequestStatusType,
    switchLogin: RequestStatusType,
    updateUser: RequestStatusType,
    verifyEmail: RequestStatusType,
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
