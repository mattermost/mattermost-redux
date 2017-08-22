// Copyright (c) 2017-present Mattermost, Inc. All Rights Reserved.
// See License.txt for license information.

import EventEmitter from 'utils/event_emitter';
import {General} from 'constants';

const FormData = require('form-data');

import fetch from './fetch_etag';

const HEADER_TOKEN = 'Token';
const HEADER_AUTH = 'Authorization';
const HEADER_BEARER = 'BEARER';
const HEADER_REQUESTED_WITH = 'X-Requested-With';
const HEADER_USER_AGENT = 'User-Agent';
const HEADER_X_VERSION_ID = 'X-Version-Id';
const HEADER_X_CLUSTER_ID = 'X-Cluster-Id';

const PER_PAGE_DEFAULT = 60;

export default class Client4 {
    constructor() {
        this.logToConsole = false;
        this.serverVersion = '';
        this.clusterId = '';
        this.token = '';
        this.url = '';
        this.urlVersion = '/api/v4';
        this.userAgent = null;
        this.enableLogging = false;
        this.defaultHeaders = {};
        this.userId = '';
        this.includeCookies = true;

        this.translations = {
            connectionError: 'There appears to be a problem with your internet connection.',
            unknownError: 'We received an unexpected status code from the server.'
        };
    }

    getUrl() {
        return this.url;
    }

    setUrl(url) {
        this.url = url;
    }

    setUserAgent(userAgent) {
        this.userAgent = userAgent;
    }

    getToken() {
        return this.token;
    }

    setToken(token) {
        this.token = token;
    }

    setAcceptLanguage(locale) {
        this.defaultHeaders['Accept-Language'] = locale;
    }

    setEnableLogging(enable) {
        this.enableLogging = enable;
    }

    setIncludeCookies(include) {
        this.includeCookies = include;
    }

    setUserId(userId) {
        this.userId = userId;
    }

    getServerVersion() {
        return this.serverVersion;
    }

    getUrlVersion() {
        return this.urlVersion;
    }

    getBaseRoute() {
        return `${this.url}${this.urlVersion}`;
    }

    getUsersRoute() {
        return `${this.getBaseRoute()}/users`;
    }

    getUserRoute(userId) {
        return `${this.getUsersRoute()}/${userId}`;
    }

    getTeamsRoute() {
        return `${this.getBaseRoute()}/teams`;
    }

    getTeamRoute(teamId) {
        return `${this.getTeamsRoute()}/${teamId}`;
    }

    getTeamNameRoute(teamName) {
        return `${this.getTeamsRoute()}/name/${teamName}`;
    }

    getTeamMembersRoute(teamId) {
        return `${this.getTeamRoute(teamId)}/members`;
    }

    getTeamMemberRoute(teamId, userId) {
        return `${this.getTeamMembersRoute(teamId)}/${userId}`;
    }

    getChannelsRoute() {
        return `${this.getBaseRoute()}/channels`;
    }

    getChannelRoute(channelId) {
        return `${this.getChannelsRoute()}/${channelId}`;
    }

    getChannelMembersRoute(channelId) {
        return `${this.getChannelRoute(channelId)}/members`;
    }

    getChannelMemberRoute(channelId, userId) {
        return `${this.getChannelMembersRoute(channelId)}/${userId}`;
    }

    getPostsRoute() {
        return `${this.getBaseRoute()}/posts`;
    }

    getPostRoute(postId) {
        return `${this.getPostsRoute()}/${postId}`;
    }

    getReactionsRoute() {
        return `${this.getBaseRoute()}/reactions`;
    }

    getCommandsRoute() {
        return `${this.getBaseRoute()}/commands`;
    }

    getFilesRoute() {
        return `${this.getBaseRoute()}/files`;
    }

    getFileRoute(fileId) {
        return `${this.getFilesRoute()}/${fileId}`;
    }

    getPreferencesRoute(userId) {
        return `${this.getUserRoute(userId)}/preferences`;
    }

    getIncomingHooksRoute() {
        return `${this.getBaseRoute()}/hooks/incoming`;
    }

    getIncomingHookRoute(hookId) {
        return `${this.getBaseRoute()}/hooks/incoming/${hookId}`;
    }

    getOutgoingHooksRoute() {
        return `${this.getBaseRoute()}/hooks/outgoing`;
    }

    getOutgoingHookRoute(hookId) {
        return `${this.getBaseRoute()}/hooks/outgoing/${hookId}`;
    }

    getOAuthRoute() {
        return `${this.url}/oauth`;
    }

    getOAuthAppsRoute() {
        return `${this.getBaseRoute()}/oauth/apps`;
    }

    getOAuthAppRoute(appId) {
        return `${this.getOAuthAppsRoute()}/${appId}`;
    }

    getEmojisRoute() {
        return `${this.getBaseRoute()}/emoji`;
    }

    getEmojiRoute(emojiId) {
        return `${this.getEmojisRoute()}/${emojiId}`;
    }

    getBrandRoute() {
        return `${this.getBaseRoute()}/brand`;
    }

    getBrandImageUrl(timestamp) {
        return `${this.getBrandRoute()}/image?t=${timestamp}`;
    }

    getJobsRoute() {
        return `${this.getBaseRoute()}/jobs`;
    }

    getOptions(options) {
        const newOptions = Object.assign({}, options);

        const headers = {
            [HEADER_REQUESTED_WITH]: 'XMLHttpRequest',
            ...this.defaultHeaders
        };

        if (this.token) {
            headers[HEADER_AUTH] = `${HEADER_BEARER} ${this.token}`;
        }

        if (this.includeCookies) {
            newOptions.credentials = 'include';
        }

        if (this.userAgent) {
            headers[HEADER_USER_AGENT] = this.userAgent;
        }

        if (newOptions.headers) {
            Object.assign(headers, newOptions.headers);
        }

        return {
            ...newOptions,
            headers
        };
    }

    // User Routes

    createUser = async (user, data, emailHash, inviteId) => {
        this.trackEvent('api', 'api_users_create');

        const queryParams = {};

        if (data) {
            queryParams.d = data;
        }

        if (emailHash) {
            queryParams.h = emailHash;
        }

        if (inviteId) {
            queryParams.iid = inviteId;
        }

        return this.doFetch(
            `${this.getUsersRoute()}${buildQueryString(queryParams)}`,
            {method: 'post', body: JSON.stringify(user)}
        );
    }

    patchMe = async (user) => {
        return this.doFetch(
            `${this.getUserRoute('me')}/patch`,
            {method: 'put', body: JSON.stringify(user)}
        );
    }

    updateUser = async (user) => {
        this.trackEvent('api', 'api_users_update');

        return this.doFetch(
            `${this.getUserRoute(user.id)}`,
            {method: 'put', body: JSON.stringify(user)}
        );
    }

    updateUserRoles = async (userId, roles) => {
        this.trackEvent('api', 'api_users_update_roles');

        return this.doFetch(
            `${this.getUserRoute(userId)}/roles`,
            {method: 'put', body: JSON.stringify({roles})}
        );
    }

    updateUserMfa = async (userId, activate, code) => {
        const body = {activate};
        if (activate) {
            body.code = code;
        }

        return this.doFetch(
            `${this.getUserRoute(userId)}/mfa`,
            {method: 'put', body: JSON.stringify(body)}
        );
    }

    updateUserPassword = async (userId, currentPassword, newPassword) => {
        this.trackEvent('api', 'api_users_newpassword');

        return this.doFetch(
            `${this.getUserRoute(userId)}/password`,
            {method: 'put', body: JSON.stringify({current_password: currentPassword, new_password: newPassword})}
        );
    }

    resetUserPassword = async (token, newPassword) => {
        this.trackEvent('api', 'api_users_reset_password');

        return this.doFetch(
            `${this.getUsersRoute()}/password/reset`,
            {method: 'post', body: JSON.stringify({token, new_password: newPassword})}
        );
    }

    sendPasswordResetEmail = async (email) => {
        this.trackEvent('api', 'api_users_send_password_reset');

        return this.doFetch(
            `${this.getUsersRoute()}/password/reset/send`,
            {method: 'post', body: JSON.stringify({email})}
        );
    }

    updateUserActive = async (userId, active) => {
        this.trackEvent('api', 'api_users_update_active');

        return this.doFetch(
            `${this.getUserRoute(userId)}/active`,
            {method: 'put', body: JSON.stringify({active})}
        );
    }

    uploadProfileImage = async (userId, imageData) => {
        this.trackEvent('api', 'api_users_update_profile_picture');

        const formData = new FormData();
        formData.append('image', imageData);

        const request = {
            method: 'post',
            body: formData
        };

        if (formData.getBoundary) {
            request.headers = {
                'Content-Type': `multipart/form-data; boundary=${formData.getBoundary()}`
            };
        }

        return this.doFetch(
            `${this.getUserRoute(userId)}/image`,
            request
        );
    };

    verifyUserEmail = async (token) => {
        return this.doFetch(
            `${this.getUsersRoute()}/email/verify`,
            {method: 'post', body: JSON.stringify({token})}
        );
    }

    sendVerificationEmail = async (email) => {
        return this.doFetch(
            `${this.getUsersRoute()}/email/verify/send`,
            {method: 'post', body: JSON.stringify({email})}
        );
    }

    login = async (loginId, password, token = '', deviceId = '', ldapOnly = false) => {
        this.trackEvent('api', 'api_users_login');

        if (ldapOnly) {
            this.trackEvent('api', 'api_users_login_ldap');
        }

        const body = {
            device_id: deviceId,
            login_id: loginId,
            password,
            token
        };

        if (ldapOnly) {
            body.ldap_only = 'true';
        }

        const {headers, data} = await this.doFetchWithResponse(
            `${this.getUsersRoute()}/login`,
            {method: 'post', body: JSON.stringify(body)}
        );

        if (headers.has(HEADER_TOKEN)) {
            this.token = headers.get(HEADER_TOKEN);
        }

        return data;
    };

    loginById = async (id, password, token = '', deviceId = '') => {
        this.trackEvent('api', 'api_users_login');

        const body = {
            device_id: deviceId,
            id,
            password,
            token
        };

        const {headers, data} = await this.doFetchWithResponse(
            `${this.getUsersRoute()}/login`,
            {method: 'post', body: JSON.stringify(body)}
        );

        if (headers.has(HEADER_TOKEN)) {
            this.token = headers.get(HEADER_TOKEN);
        }

        return data;
    };

    logout = async () => {
        this.trackEvent('api', 'api_users_logout');

        const {response} = await this.doFetchWithResponse(
            `${this.getUsersRoute()}/logout`,
            {method: 'post'}
        );

        if (response.ok) {
            this.token = '';
        }

        this.serverVersion = '';

        return response;
    };

    getProfiles = async (page = 0, perPage = PER_PAGE_DEFAULT) => {
        this.trackEvent('api', 'api_profiles_get');

        return this.doFetch(
            `${this.getUsersRoute()}${buildQueryString({page, per_page: perPage})}`,
            {method: 'get'}
        );
    };

    getProfilesByIds = async (userIds) => {
        this.trackEvent('api', 'api_profiles_get_by_ids');

        return this.doFetch(
            `${this.getUsersRoute()}/ids`,
            {method: 'post', body: JSON.stringify(userIds)}
        );
    };

    getProfilesByUsernames = async (usernames) => {
        this.trackEvent('api', 'api_profiles_get_by_usernames');

        return this.doFetch(
            `${this.getUsersRoute()}/usernames`,
            {method: 'post', body: JSON.stringify(usernames)}
        );
    };

    getProfilesInTeam = async (teamId, page = 0, perPage = PER_PAGE_DEFAULT, sort = '') => {
        this.trackEvent('api', 'api_profiles_get_in_team', {team_id: teamId, sort});

        return this.doFetch(
            `${this.getUsersRoute()}${buildQueryString({in_team: teamId, page, per_page: perPage, sort})}`,
            {method: 'get'}
        );
    };

    getProfilesNotInTeam = async (teamId, page = 0, perPage = PER_PAGE_DEFAULT) => {
        this.trackEvent('api', 'api_profiles_get_not_in_team', {team_id: teamId});

        return this.doFetch(
            `${this.getUsersRoute()}${buildQueryString({not_in_team: teamId, page, per_page: perPage})}`,
            {method: 'get'}
        );
    };

    getProfilesWithoutTeam = async (page = 0, perPage = PER_PAGE_DEFAULT) => {
        this.trackEvent('api', 'api_profiles_get_without_team');

        return this.doFetch(
            `${this.getUsersRoute()}${buildQueryString({without_team: 1, page, per_page: perPage})}`,
            {method: 'get'}
        );
    };

    getProfilesInChannel = async (channelId, page = 0, perPage = PER_PAGE_DEFAULT) => {
        this.trackEvent('api', 'api_profiles_get_in_channel', {channel_id: channelId});

        return this.doFetch(
            `${this.getUsersRoute()}${buildQueryString({in_channel: channelId, page, per_page: perPage})}`,
            {method: 'get'}
        );
    };

    getProfilesNotInChannel = async (teamId, channelId, page = 0, perPage = PER_PAGE_DEFAULT) => {
        this.trackEvent('api', 'api_profiles_get_not_in_channel', {team_id: teamId, channel_id: channelId});

        return this.doFetch(
            `${this.getUsersRoute()}${buildQueryString({in_team: teamId, not_in_channel: channelId, page, per_page: perPage})}`,
            {method: 'get'}
        );
    };

    getMe = async () => {
        return this.doFetch(
            `${this.getUserRoute('me')}`,
            {method: 'get'}
        );
    };

    getUser = async (userId) => {
        return this.doFetch(
            `${this.getUserRoute(userId)}`,
            {method: 'get'}
        );
    };

    getUserByUsername = async (username) => {
        return this.doFetch(
            `${this.getUsersRoute()}/username/${username}`,
            {method: 'get'}
        );
    };

    getUserByEmail = async (email) => {
        return this.doFetch(
            `${this.getUsersRoute()}/email/${email}`,
            {method: 'get'}
        );
    };

    getProfilePictureUrl = (userId, lastPictureUpdate) => {
        const params = {};
        if (lastPictureUpdate) {
            params.time = lastPictureUpdate;
        }

        return `${this.getUserRoute(userId)}/image${buildQueryString(params)}`;
    };

    autocompleteUsers = async (name, teamId, channelId) => {
        return this.doFetch(
            `${this.getUsersRoute()}/autocomplete${buildQueryString({in_team: teamId, in_channel: channelId, name})}`,
            {method: 'get'}
        );
    };

    getSessions = async (userId) => {
        return this.doFetch(
            `${this.getUserRoute(userId)}/sessions`,
            {method: 'get'}
        );
    };

    getCurrentSession = async (userId, token) => {
        const sessions = await this.getSessions(userId);
        return sessions.find((s) => s.token === token);
    };

    revokeSession = async (userId, sessionId) => {
        return this.doFetch(
            `${this.getUserRoute(userId)}/sessions/revoke`,
            {method: 'post', body: JSON.stringify({session_id: sessionId})}
        );
    };

    getUserAudits = async (userId, page = 0, perPage = PER_PAGE_DEFAULT) => {
        return this.doFetch(
            `${this.getUserRoute(userId)}/audits${buildQueryString({page, per_page: perPage})}`,
            {method: 'get'}
        );
    };

    checkUserMfa = async (loginId) => {
        return this.doFetch(
            `${this.getUsersRoute()}/mfa`,
            {method: 'post', body: JSON.stringify({login_id: loginId})}
        );
    };

    generateMfaSecret = async (userId) => {
        return this.doFetch(
            `${this.getUserRoute(userId)}/mfa/generate`,
            {method: 'post'}
        );
    };

    attachDevice = async (deviceId) => {
        return this.doFetch(
            `${this.getUsersRoute()}/sessions/device`,
            {method: 'put', body: JSON.stringify({device_id: deviceId})}
        );
    };

    searchUsers = (term, options) => {
        this.trackEvent('api', 'api_search_users');

        return this.doFetch(
            `${this.getUsersRoute()}/search`,
            {method: 'post', body: JSON.stringify({term, ...options})}
        );
    };

    getStatusesByIds = async (userIds) => {
        return this.doFetch(
            `${this.getUsersRoute()}/status/ids`,
            {method: 'post', body: JSON.stringify(userIds)}
        );
    };

    getStatus = async (userId) => {
        return this.doFetch(
            `${this.getUserRoute(userId)}/status`,
            {method: 'get'}
        );
    };

    updateStatus = async (status) => {
        return this.doFetch(
            `${this.getUserRoute(status.user_id)}/status`,
            {method: 'put', body: JSON.stringify(status)}
        );
    };

    switchEmailToOAuth = async (service, email, password, mfaCode = '') => {
        this.trackEvent('api', 'api_users_email_to_oauth');

        return this.doFetch(
            `${this.getUsersRoute()}/login/switch`,
            {method: 'post', body: JSON.stringify({current_service: 'email', new_service: service, email, password, mfa_code: mfaCode})}
        );
    };

    switchOAuthToEmail = async (currentService, email, password) => {
        this.trackEvent('api', 'api_users_oauth_to_email');

        return this.doFetch(
            `${this.getUsersRoute()}/login/switch`,
            {method: 'post', body: JSON.stringify({current_service: currentService, new_service: 'email', email, new_password: password})}
        );
    };

    switchEmailToLdap = async (email, emailPassword, ldapId, ldapPassword, mfaCode = '') => {
        this.trackEvent('api', 'api_users_email_to_ldap');

        return this.doFetch(
            `${this.getUsersRoute()}/login/switch`,
            {method: 'post', body: JSON.stringify({current_service: 'email', new_service: 'ldap', email, password: emailPassword, ldap_id: ldapId, new_password: ldapPassword, mfa_code: mfaCode})}
        );
    };

    switchLdapToEmail = async (ldapPassword, email, emailPassword, mfaCode = '') => {
        this.trackEvent('api', 'api_users_ldap_to_email');

        return this.doFetch(
            `${this.getUsersRoute()}/login/switch`,
            {method: 'post', body: JSON.stringify({current_service: 'ldap', new_service: 'email', email, password: ldapPassword, new_password: emailPassword, mfa_code: mfaCode})}
        );
    };

    getAuthorizedOAuthApps = async (userId) => {
        return this.doFetch(
            `${this.getUserRoute(userId)}/oauth/apps/authorized`,
            {method: 'get'}
        );
    }

    authorizeOAuthApp = async (responseType, clientId, redirectUri, state, scope) => {
        return this.doFetch(
            `${this.url}/oauth/authorize`,
            {method: 'post', body: JSON.stringify({client_id: clientId, response_type: responseType, redirect_uri: redirectUri, state, scope})}
        );
    }

    deauthorizeOAuthApp = async (clientId) => {
        return this.doFetch(
            `${this.url}/oauth/deauthorize`,
            {method: 'post', body: JSON.stringify({client_id: clientId})}
        );
    }

    createUserAccessToken = async (userId, description) => {
        this.trackEvent('api', 'api_users_create_access_token');

        return this.doFetch(
            `${this.getUserRoute(userId)}/tokens`,
            {method: 'post', body: JSON.stringify({description})}
        );
    }

    getUserAccessToken = async (tokenId) => {
        return this.doFetch(
            `${this.getUsersRoute()}/tokens/${tokenId}`,
            {method: 'get'}
        );
    }

    getUserAccessTokensForUser = async (userId, page = 0, perPage = PER_PAGE_DEFAULT) => {
        return this.doFetch(
            `${this.getUserRoute(userId)}/tokens${buildQueryString({page, per_page: perPage})}`,
            {method: 'get'}
        );
    }

    revokeUserAccessToken = async (tokenId) => {
        this.trackEvent('api', 'api_users_revoke_access_token');

        return this.doFetch(
            `${this.getUsersRoute()}/tokens/revoke`,
            {method: 'post', body: JSON.stringify({token_id: tokenId})}
        );
    }

    // Team Routes

    createTeam = async (team) => {
        this.trackEvent('api', 'api_teams_create');

        return this.doFetch(
            `${this.getTeamsRoute()}`,
            {method: 'post', body: JSON.stringify(team)}
        );
    };

    updateTeam = async (team) => {
        this.trackEvent('api', 'api_teams_update_name', {team_id: team.id});

        return this.doFetch(
            `${this.getTeamRoute(team.id)}`,
            {method: 'put', body: JSON.stringify(team)}
        );
    };

    checkIfTeamExists = async (teamName) => {
        return this.doFetch(
            `${this.getTeamNameRoute(teamName)}/exists`,
            {method: 'get'}
        );
    };

    getTeams = async (page = 0, perPage = PER_PAGE_DEFAULT) => {
        return this.doFetch(
            `${this.getTeamsRoute()}${buildQueryString({page, per_page: perPage})}`,
            {method: 'get'}
        );
    };

    getTeam = async (teamId) => {
        return this.doFetch(
            this.getTeamRoute(teamId),
            {method: 'get'}
        );
    };

    getMyTeams = async () => {
        return this.doFetch(
            `${this.getUserRoute('me')}/teams`,
            {method: 'get'}
        );
    };

    getTeamsForUser = async (userId) => {
        return this.doFetch(
            `${this.getUserRoute(userId)}/teams`,
            {method: 'get'}
        );
    };

    getMyTeamMembers = async () => {
        return this.doFetch(
            `${this.getUserRoute('me')}/teams/members`,
            {method: 'get'}
        );
    };

    getMyTeamUnreads = async () => {
        return this.doFetch(
            `${this.getUserRoute('me')}/teams/unread`,
            {method: 'get'}
        );
    };

    getTeamMembersForUser = async (userId) => {
        return this.doFetch(
            `${this.getUserRoute(userId)}/teams/members`,
            {method: 'get'}
        );
    };

    getTeamMember = async (teamId, userId) => {
        return this.doFetch(
            `${this.getTeamMemberRoute(teamId, userId)}`,
            {method: 'get'}
        );
    };

    getTeamMembersByIds = async (teamId, userIds) => {
        return this.doFetch(
            `${this.getTeamMembersRoute(teamId)}/ids`,
            {method: 'post', body: JSON.stringify(userIds)}
        );
    };

    addToTeam = async (teamId, userId) => {
        this.trackEvent('api', 'api_teams_invite_members', {team_id: teamId});

        const member = {user_id: userId, team_id: teamId};
        return this.doFetch(
            `${this.getTeamMembersRoute(teamId)}`,
            {method: 'post', body: JSON.stringify(member)}
        );
    };

    addToTeamFromInvite = async (hash = '', data = '', inviteId = '') => {
        this.trackEvent('api', 'api_teams_invite_members');

        const query = buildQueryString({hash, data, invite_id: inviteId});
        return this.doFetch(
            `${this.getTeamsRoute()}/members/invite${query}`,
            {method: 'post'}
        );
    };

    addUsersToTeam = async (teamId, userIds) => {
        this.trackEvent('api', 'api_teams_batch_add_members', {team_id: teamId, count: userIds.length});

        const members = [];
        userIds.forEach((id) => members.push({team_id: teamId, user_id: id}));
        return this.doFetch(
            `${this.getTeamMembersRoute(teamId)}/batch`,
            {method: 'post', body: JSON.stringify(members)}
        );
    };

    joinTeam = async (inviteId) => {
        const query = buildQueryString({invite_id: inviteId});
        return this.doFetch(
            `${this.getTeamsRoute()}/members/invite${query}`,
            {method: 'post'}
        );
    };

    removeFromTeam = async (teamId, userId) => {
        this.trackEvent('api', 'api_teams_remove_members', {team_id: teamId});

        return this.doFetch(
            `${this.getTeamMemberRoute(teamId, userId)}`,
            {method: 'delete'}
        );
    };

    getTeamStats = async (teamId) => {
        return this.doFetch(
            `${this.getTeamRoute(teamId)}/stats`,
            {method: 'get'}
        );
    };

    getTeamInviteInfo = async (inviteId) => {
        return this.doFetch(
            `${this.getTeamsRoute()}/invite/${inviteId}`,
            {method: 'get'}
        );
    };

    updateTeamMemberRoles = async (teamId, userId, roles) => {
        this.trackEvent('api', 'api_teams_update_member_roles', {team_id: teamId});

        return this.doFetch(
            `${this.getTeamMemberRoute(teamId, userId)}/roles`,
            {method: 'put', body: JSON.stringify({roles})}
        );
    };

    sendEmailInvitesToTeam = async (teamId, emails) => {
        this.trackEvent('api', 'api_teams_invite_members', {team_id: teamId});

        return this.doFetch(
            `${this.getTeamRoute(teamId)}/invite/email`,
            {method: 'post', body: JSON.stringify(emails)}
        );
    };

    importTeam = async (teamId, file, importFrom) => {
        const formData = new FormData();
        formData.append('file', file, file.name);
        formData.append('filesize', file.size);
        formData.append('importFrom', importFrom);

        const request = {
            method: 'post',
            body: formData
        };

        if (formData.getBoundary) {
            request.headers = {
                'Content-Type': `multipart/form-data; boundary=${formData.getBoundary()}`
            };
        }

        return this.doFetch(
            `${this.getTeamRoute(teamId)}/import`,
            request
        );
    };

    // Channel Routes

    createChannel = async (channel) => {
        this.trackEvent('api', 'api_channels_create', {team_id: channel.team_id});

        return this.doFetch(
            `${this.getChannelsRoute()}`,
            {method: 'post', body: JSON.stringify(channel)}
        );
    };

    createDirectChannel = async (userIds) => {
        this.trackEvent('api', 'api_channels_create_direct');

        return this.doFetch(
            `${this.getChannelsRoute()}/direct`,
            {method: 'post', body: JSON.stringify(userIds)}
        );
    };

    createGroupChannel = async (userIds) => {
        this.trackEvent('api', 'api_channels_create_group');

        return this.doFetch(
            `${this.getChannelsRoute()}/group`,
            {method: 'post', body: JSON.stringify(userIds)}
        );
    };

    deleteChannel = async (channelId) => {
        this.trackEvent('api', 'api_channels_delete', {channel_id: channelId});

        return this.doFetch(
            `${this.getChannelRoute(channelId)}`,
            {method: 'delete'}
        );
    };

    updateChannel = async (channel) => {
        this.trackEvent('api', 'api_channels_update', {channel_id: channel.id});

        return this.doFetch(
            `${this.getChannelRoute(channel.id)}`,
            {method: 'put', body: JSON.stringify(channel)}
        );
    };

    patchChannel = async (channelId, patch) => {
        this.trackEvent('api', 'api_channels_patch', {channel_id: channelId});

        return this.doFetch(
            `${this.getChannelRoute(channelId)}/patch`,
            {method: 'put', body: JSON.stringify(patch)}
        );
    };

    updateChannelNotifyProps = async (props) => {
        this.trackEvent('api', 'api_users_update_channel_notifcations', {channel_id: props.channel_id});

        return this.doFetch(
            `${this.getChannelMemberRoute(props.channel_id, props.user_id)}/notify_props`,
            {method: 'put', body: JSON.stringify(props)}
        );
    };

    getChannel = async (channelId) => {
        this.trackEvent('api', 'api_channel_get', {channel_id: channelId});

        return this.doFetch(
            `${this.getChannelRoute(channelId)}`,
            {method: 'get'}
        );
    };

    getChannelByName = async (teamId, channelName) => {
        return this.doFetch(
            `${this.getTeamRoute(teamId)}/channels/name/${channelName}`,
            {method: 'get'}
        );
    };

    getChannels = async (teamId, page = 0, perPage = PER_PAGE_DEFAULT) => {
        return this.doFetch(
            `${this.getTeamRoute(teamId)}/channels${buildQueryString({page, per_page: perPage})}`,
            {method: 'get'}
        );
    };

    getMyChannels = async (teamId) => {
        return this.doFetch(
            `${this.getUserRoute('me')}/teams/${teamId}/channels`,
            {method: 'get'}
        );
    };

    getMyChannelMember = async (channelId) => {
        return this.doFetch(
            `${this.getChannelMemberRoute(channelId, 'me')}`,
            {method: 'get'}
        );
    };

    getMyChannelMembers = async (teamId) => {
        return this.doFetch(
            `${this.getUserRoute('me')}/teams/${teamId}/channels/members`,
            {method: 'get'}
        );
    };

    getChannelMembers = async (channelId, page = 0, perPage = PER_PAGE_DEFAULT) => {
        return this.doFetch(
            `${this.getChannelMembersRoute(channelId)}${buildQueryString({page, per_page: perPage})}`,
            {method: 'get'}
        );
    };

    getChannelMember = async (channelId, userId) => {
        return this.doFetch(
            `${this.getChannelMemberRoute(channelId, userId)}`,
            {method: 'get'}
        );
    };

    getChannelMembersByIds = async (channelId, userIds) => {
        return this.doFetch(
            `${this.getChannelMembersRoute(channelId)}/ids`,
            {method: 'post', body: JSON.stringify(userIds)}
        );
    };

    addToChannel = async (userId, channelId) => {
        this.trackEvent('api', 'api_channels_add_member', {channel_id: channelId});

        const member = {user_id: userId, channel_id: channelId};
        return this.doFetch(
            `${this.getChannelMembersRoute(channelId)}`,
            {method: 'post', body: JSON.stringify(member)}
        );
    };

    removeFromChannel = async (userId, channelId) => {
        this.trackEvent('api', 'api_channels_remove_member', {channel_id: channelId});

        return this.doFetch(
            `${this.getChannelMemberRoute(channelId, userId)}`,
            {method: 'delete'}
        );
    };

    updateChannelMemberRoles = async (channelId, userId, roles) => {
        return this.doFetch(
            `${this.getChannelMemberRoute(channelId, userId)}/roles`,
            {method: 'put', body: JSON.stringify({roles})}
        );
    };

    getChannelStats = async (channelId) => {
        return this.doFetch(
            `${this.getChannelRoute(channelId)}/stats`,
            {method: 'get'}
        );
    };

    viewMyChannel = async (channelId, prevChannelId) => {
        const data = {channel_id: channelId, prev_channel_id: prevChannelId};
        return this.doFetch(
            `${this.getChannelsRoute()}/members/me/view`,
            {method: 'post', body: JSON.stringify(data)}
        );
    };

    searchChannels = async (teamId, term) => {
        return this.doFetch(
            `${this.getTeamRoute(teamId)}/channels/search`,
            {method: 'post', body: JSON.stringify({term})}
        );
    };

    // Post Routes
    createPost = async (post) => {
        this.trackEvent('api', 'api_posts_create', {channel_id: post.channel_id});

        if (post.root_id != null && post.root_id !== '') {
            this.trackEvent('api', 'api_posts_replied', {channel_id: post.channel_id});
        }

        return this.doFetch(
            `${this.getPostsRoute()}`,
            {method: 'post', body: JSON.stringify(post)}
        );
    };

    updatePost = async (post) => {
        this.trackEvent('api', 'api_posts_update', {channel_id: post.channel_id});

        return this.doFetch(
            `${this.getPostRoute(post.id)}`,
            {method: 'put', body: JSON.stringify(post)}
        );
    };

    patchPost = async (post) => {
        this.trackEvent('api', 'api_posts_patch', {channel_id: post.channel_id});

        return this.doFetch(
            `${this.getPostRoute(post.id)}/patch`,
            {method: 'put', body: JSON.stringify(post)}
        );
    };

    deletePost = async (postId) => {
        this.trackEvent('api', 'api_posts_delete');

        return this.doFetch(
            `${this.getPostRoute(postId)}`,
            {method: 'delete'}
        );
    };

    getPostThread = async (postId) => {
        return this.doFetch(
            `${this.getPostRoute(postId)}/thread`,
            {method: 'get'}
        );
    };

    getPosts = async (channelId, page = 0, perPage = PER_PAGE_DEFAULT) => {
        return this.doFetch(
            `${this.getChannelRoute(channelId)}/posts${buildQueryString({page, per_page: perPage})}`,
            {method: 'get'}
        );
    };

    getPostsSince = async (channelId, since) => {
        return this.doFetch(
            `${this.getChannelRoute(channelId)}/posts${buildQueryString({since})}`,
            {method: 'get'}
        );
    };

    getPostsBefore = async (channelId, postId, page = 0, perPage = PER_PAGE_DEFAULT) => {
        this.trackEvent('api', 'api_posts_get_before', {channel_id: channelId});

        return this.doFetch(
            `${this.getChannelRoute(channelId)}/posts${buildQueryString({before: postId, page, per_page: perPage})}`,
            {method: 'get'}
        );
    };

    getPostsAfter = async (channelId, postId, page = 0, perPage = PER_PAGE_DEFAULT) => {
        this.trackEvent('api', 'api_posts_get_after', {channel_id: channelId});

        return this.doFetch(
            `${this.getChannelRoute(channelId)}/posts${buildQueryString({after: postId, page, per_page: perPage})}`,
            {method: 'get'}
        );
    };

    getFileInfosForPost = async (postId) => {
        return this.doFetch(
            `${this.getPostRoute(postId)}/files/info`,
            {method: 'get'}
        );
    };

    getFlaggedPosts = async (userId, channelId = '', teamId = '', page = 0, perPage = PER_PAGE_DEFAULT) => {
        this.trackEvent('api', 'api_posts_get_flagged', {team_id: teamId});

        return this.doFetch(
            `${this.getUserRoute(userId)}/posts/flagged${buildQueryString({channel_id: channelId, team_id: teamId, page, per_page: perPage})}`,
            {method: 'get'}
        );
    };

    getPinnedPosts = async (channelId) => {
        this.trackEvent('api', 'api_posts_get_pinned', {channel_id: channelId});
        return this.doFetch(
            `${this.getChannelRoute(channelId)}/pinned`,
            {method: 'get'}
        );
    };

    pinPost = async (postId) => {
        this.trackEvent('api', 'api_posts_pin');

        return this.doFetch(
            `${this.getPostRoute(postId)}/pin`,
            {method: 'post'}
        );
    };

    unpinPost = async (postId) => {
        this.trackEvent('api', 'api_posts_unpin');

        return this.doFetch(
            `${this.getPostRoute(postId)}/unpin`,
            {method: 'post'}
        );
    };

    addReaction = async (userId, postId, emojiName) => {
        this.trackEvent('api', 'api_reactions_save', {post_id: postId});

        return this.doFetch(
            `${this.getReactionsRoute()}`,
            {method: 'post', body: JSON.stringify({user_id: userId, post_id: postId, emoji_name: emojiName})}
        );
    };

    removeReaction = async (userId, postId, emojiName) => {
        this.trackEvent('api', 'api_reactions_delete', {post_id: postId});

        return this.doFetch(
            `${this.getUserRoute(userId)}/posts/${postId}/reactions/${emojiName}`,
            {method: 'delete'}
        );
    };

    getReactionsForPost = async (postId) => {
        return this.doFetch(
            `${this.getPostRoute(postId)}/reactions`,
            {method: 'get'}
        );
    };

    searchPosts = async (teamId, terms, isOrSearch) => {
        this.trackEvent('api', 'api_posts_search', {team_id: teamId});

        return this.doFetch(
            `${this.getTeamRoute(teamId)}/posts/search`,
            {method: 'post', body: JSON.stringify({terms, is_or_search: isOrSearch})}
        );
    };

    getOpenGraphMetadata = async (url) => {
        return this.doFetch(
            `${this.getBaseRoute()}/opengraph`,
            {method: 'post', body: JSON.stringify({url})}
        );
    };

    // Files Routes

    getFileUrl(fileId, timestamp) {
        let url = `${this.getFileRoute(fileId)}`;
        if (timestamp) {
            url += `?${timestamp}`;
        }

        return url;
    }

    getFileThumbnailUrl(fileId, timestamp) {
        let url = `${this.getFileRoute(fileId)}/thumbnail`;
        if (timestamp) {
            url += `?${timestamp}`;
        }

        return url;
    }

    getFilePreviewUrl(fileId, timestamp) {
        let url = `${this.getFileRoute(fileId)}/preview`;
        if (timestamp) {
            url += `?${timestamp}`;
        }

        return url;
    }

    uploadFile = async (fileFormData, formBoundary) => {
        this.trackEvent('api', 'api_files_upload');

        const request = {
            method: 'post',
            body: fileFormData
        };

        if (formBoundary) {
            request.headers = {
                'Content-Type': `multipart/form-data; boundary=${formBoundary}`
            };
        }

        return this.doFetch(
            `${this.getFilesRoute()}`,
            request
        );
    };

    getFilePublicLink = async (fileId) => {
        return this.doFetch(
            `${this.getFileRoute(fileId)}/link`,
            {method: 'get'}
        );
    }

    // Preference Routes

    savePreferences = async (userId, preferences) => {
        return this.doFetch(
            `${this.getPreferencesRoute(userId)}`,
            {method: 'put', body: JSON.stringify(preferences)}
        );
    };

    getMyPreferences = async () => {
        return this.doFetch(
            `${this.getPreferencesRoute('me')}`,
            {method: 'get'}
        );
    };

    deletePreferences = async (userId, preferences) => {
        return this.doFetch(
            `${this.getPreferencesRoute(userId)}/delete`,
            {method: 'post', body: JSON.stringify(preferences)}
        );
    };

    // General Routes

    ping = async () => {
        return this.doFetch(
            `${this.getBaseRoute()}/system/ping?time=${Date.now()}`,
            {method: 'get'}
        );
    };

    logClientError = async (message, level = 'ERROR') => {
        if (!this.enableLogging) {
            throw {
                message: 'Logging disabled.'
            };
        }

        return this.doFetch(
            `${this.getBaseRoute()}/logs`,
            {method: 'post', body: JSON.stringify({message, level})}
        );
    };

    getClientConfigOld = async () => {
        return this.doFetch(
            `${this.getBaseRoute()}/config/client?format=old`,
            {method: 'get'}
        );
    };

    getClientLicenseOld = async () => {
        return this.doFetch(
            `${this.getBaseRoute()}/license/client?format=old`,
            {method: 'get'}
        );
    };

    getTranslations = async (url) => {
        return this.doFetch(
            url,
            {method: 'get'}
        );
    };

    getWebSocketUrl = () => {
        return `${this.getBaseRoute()}/websocket`;
    }

    webrtcToken = async () => {
        return this.doFetch(
            `${this.getBaseRoute()}/webrtc/token`,
            {method: 'get'}
        );
    };

    // Integration Routes

    createIncomingWebhook = async (hook) => {
        this.trackEvent('api', 'api_integrations_created', {team_id: hook.team_id});

        return this.doFetch(
            `${this.getIncomingHooksRoute()}`,
            {method: 'post', body: JSON.stringify(hook)}
        );
    };

    getIncomingWebhook = async (hookId) => {
        return this.doFetch(
            `${this.getIncomingHookRoute(hookId)}`,
            {method: 'get'}
        );
    };

    getIncomingWebhooks = async (teamId = '', page = 0, perPage = PER_PAGE_DEFAULT) => {
        const queryParams = {page, per_page: perPage};

        if (teamId) {
            queryParams.team_id = teamId;
        }

        return this.doFetch(
            `${this.getIncomingHooksRoute()}${buildQueryString(queryParams)}`,
            {method: 'get'}
        );
    };

    removeIncomingWebhook = async (hookId) => {
        this.trackEvent('api', 'api_integrations_deleted');

        return this.doFetch(
            `${this.getIncomingHookRoute(hookId)}`,
            {method: 'delete'}
        );
    };

    updateIncomingWebhook = async (hook) => {
        this.trackEvent('api', 'api_integrations_updated', {team_id: hook.team_id});

        return this.doFetch(
            `${this.getIncomingHookRoute(hook.id)}`,
            {method: 'put', body: JSON.stringify(hook)}
        );
    };

    createOutgoingWebhook = async (hook) => {
        this.trackEvent('api', 'api_integrations_created', {team_id: hook.team_id});

        return this.doFetch(
            `${this.getOutgoingHooksRoute()}`,
            {method: 'post', body: JSON.stringify(hook)}
        );
    };

    getOutgoingWebhook = async (hookId) => {
        return this.doFetch(
            `${this.getOutgoingHookRoute(hookId)}`,
            {method: 'get'}
        );
    };

    getOutgoingWebhooks = async (channelId = '', teamId = '', page = 0, perPage = PER_PAGE_DEFAULT) => {
        const queryParams = {page, per_page: perPage};

        if (channelId) {
            queryParams.channel_id = channelId;
        }

        if (teamId) {
            queryParams.team_id = teamId;
        }

        return this.doFetch(
            `${this.getOutgoingHooksRoute()}${buildQueryString(queryParams)}`,
            {method: 'get'}
        );
    };

    removeOutgoingWebhook = async (hookId) => {
        this.trackEvent('api', 'api_integrations_deleted');

        return this.doFetch(
            `${this.getOutgoingHookRoute(hookId)}`,
            {method: 'delete'}
        );
    };

    updateOutgoingWebhook = async (hook) => {
        this.trackEvent('api', 'api_integrations_updated', {team_id: hook.team_id});

        return this.doFetch(
            `${this.getOutgoingHookRoute(hook.id)}`,
            {method: 'put', body: JSON.stringify(hook)}
        );
    };

    regenOutgoingHookToken = async (id) => {
        return this.doFetch(
            `${this.getOutgoingHookRoute(id)}/regen_token`,
            {method: 'post'}
        );
    };

    getCommandsList = async (teamId) => {
        return this.doFetch(
            `${this.getCommandsRoute()}?team_id=${teamId}`,
            {method: 'get'}
        );
    };

    getCustomTeamCommands = async (teamId) => {
        return this.doFetch(
            `${this.getCommandsRoute()}?team_id=${teamId}&custom_only=true`,
            {method: 'get'}
        );
    };

    executeCommand = async (command, commandArgs = {}) => {
        this.trackEvent('api', 'api_integrations_used');

        return this.doFetch(
            `${this.getCommandsRoute()}/execute`,
            {method: 'post', body: JSON.stringify({command, ...commandArgs})}
        );
    };

    addCommand = async (command) => {
        this.trackEvent('api', 'api_integrations_created');

        return this.doFetch(
            `${this.getCommandsRoute()}`,
            {method: 'post', body: JSON.stringify(command)}
        );
    };

    editCommand = async (command) => {
        this.trackEvent('api', 'api_integrations_created');

        return this.doFetch(
            `${this.getCommandsRoute()}/${command.id}`,
            {method: 'put', body: JSON.stringify(command)}
        );
    };

    regenCommandToken = async (id) => {
        return this.doFetch(
            `${this.getCommandsRoute()}/${id}/regen_token`,
            {method: 'put'}
        );
    };

    deleteCommand = async (id) => {
        this.trackEvent('api', 'api_integrations_deleted');

        return this.doFetch(
            `${this.getCommandsRoute()}/${id}`,
            {method: 'delete'}
        );
    };

    createOAuthApp = async (app) => {
        this.trackEvent('api', 'api_apps_register');

        return this.doFetch(
            `${this.getOAuthAppsRoute()}`,
            {method: 'post', body: JSON.stringify(app)}
        );
    };

    getOAuthApps = async (page = 0, perPage = PER_PAGE_DEFAULT) => {
        return this.doFetch(
            `${this.getOAuthAppsRoute()}${buildQueryString({page, per_page: perPage})}`,
            {method: 'get'}
        );
    };

    getOAuthApp = async (appId) => {
        return this.doFetch(
            `${this.getOAuthAppRoute(appId)}`,
            {method: 'get'}
        );
    };

    getOAuthAppInfo = async (appId) => {
        return this.doFetch(
            `${this.getOAuthAppRoute(appId)}/info`,
            {method: 'get'}
        );
    };

    deleteOAuthApp = async (appId) => {
        this.trackEvent('api', 'api_apps_delete');

        return this.doFetch(
            `${this.getOAuthAppRoute(appId)}`,
            {method: 'delete'}
        );
    };

    regenOAuthAppSecret = async (appId) => {
        return this.doFetch(
            `${this.getOAuthAppRoute(appId)}/regen_secret`,
            {method: 'post'}
        );
    };

    // Emoji Routes

    createCustomEmoji = async (emoji, imageData) => {
        this.trackEvent('api', 'api_emoji_custom_add');

        const formData = new FormData();
        formData.append('image', imageData);
        formData.append('emoji', JSON.stringify(emoji));

        const request = {
            method: 'post',
            body: formData
        };

        if (formData.getBoundary) {
            request.headers = {
                'Content-Type': `multipart/form-data; boundary=${formData.getBoundary()}`
            };
        }

        return this.doFetch(
            `${this.getEmojisRoute()}`,
            request
        );
    };

    getCustomEmojis = async (page = 0, perPage = PER_PAGE_DEFAULT) => {
        return this.doFetch(
            `${this.getEmojisRoute()}${buildQueryString({page, per_page: perPage})}`,
            {method: 'get'}
        );
    };

    deleteCustomEmoji = async (emojiId) => {
        this.trackEvent('api', 'api_emoji_custom_delete');

        return this.doFetch(
            `${this.getEmojiRoute(emojiId)}`,
            {method: 'delete'}
        );
    };

    getSystemEmojiImageUrl = (filename) => {
        return `${this.url}/static/emoji/${filename}.png`;
    };

    getCustomEmojiImageUrl = (id) => {
        return `${this.getEmojiRoute(id)}/image`;
    };

    // Jobs Routes

    getJob = async (id) => {
        return this.doFetch(
            `${this.getJobsRoute()}/${id}`,
            {method: 'get'}
        );
    };

    getJobs = async (page = 0, perPage = PER_PAGE_DEFAULT) => {
        return this.doFetch(
            `${this.getJobsRoute()}${buildQueryString({page, per_page: perPage})}`,
            {method: 'get'}
        );
    };

    getJobsByType = async (type, page = 0, perPage = PER_PAGE_DEFAULT) => {
        return this.doFetch(
            `${this.getJobsRoute()}/type/${type}${buildQueryString({page, per_page: perPage})}`,
            {method: 'get'}
        );
    };

    createJob = async (job) => {
        return this.doFetch(
            `${this.getJobsRoute()}`,
            {method: 'post', body: JSON.stringify(job)}
        );
    };

    cancelJob = async (id) => {
        return this.doFetch(
            `${this.getJobsRoute()}/${id}/cancel`,
            {method: 'post'}
        );
    };

    // Admin Routes

    getLogs = async (page = 0, perPage = PER_PAGE_DEFAULT) => {
        return this.doFetch(
            `${this.getBaseRoute()}/logs${buildQueryString({page, per_page: perPage})}`,
            {method: 'get'}
        );
    };

    getAudits = async (page = 0, perPage = PER_PAGE_DEFAULT) => {
        return this.doFetch(
            `${this.getBaseRoute()}/audits${buildQueryString({page, per_page: perPage})}`,
            {method: 'get'}
        );
    };

    getConfig = async () => {
        return this.doFetch(
            `${this.getBaseRoute()}/config`,
            {method: 'get'}
        );
    };

    updateConfig = async (config) => {
        return this.doFetch(
            `${this.getBaseRoute()}/config`,
            {method: 'put', body: JSON.stringify(config)}
        );
    };

    reloadConfig = async () => {
        return this.doFetch(
            `${this.getBaseRoute()}/config/reload`,
            {method: 'post'}
        );
    };

    testEmail = async (config) => {
        return this.doFetch(
            `${this.getBaseRoute()}/email/test`,
            {method: 'post', body: JSON.stringify(config)}
        );
    };

    invalidateCaches = async () => {
        return this.doFetch(
            `${this.getBaseRoute()}/caches/invalidate`,
            {method: 'post'}
        );
    };

    recycleDatabase = async () => {
        return this.doFetch(
            `${this.getBaseRoute()}/database/recycle`,
            {method: 'post'}
        );
    };

    createComplianceReport = async (job) => {
        return this.doFetch(
            `${this.getBaseRoute()}/compliance/reports`,
            {method: 'post', body: JSON.stringify(job)}
        );
    };

    getComplianceReport = async (reportId) => {
        return this.doFetch(
            `${this.getBaseRoute()}/compliance/reports/${reportId}`,
            {method: 'get'}
        );
    };

    getComplianceReports = async (page = 0, perPage = PER_PAGE_DEFAULT) => {
        return this.doFetch(
            `${this.getBaseRoute()}/compliance/reports${buildQueryString({page, per_page: perPage})}`,
            {method: 'get'}
        );
    };

    uploadBrandImage = async (imageData) => {
        const formData = new FormData();
        formData.append('image', imageData);

        const request = {
            method: 'post',
            body: formData
        };

        if (formData.getBoundary) {
            request.headers = {
                'Content-Type': `multipart/form-data; boundary=${formData.getBoundary()}`
            };
        }

        return this.doFetch(
            `${this.getBrandRoute()}/image`,
            request
        );
    };

    getClusterStatus = async () => {
        return this.doFetch(
            `${this.getBaseRoute()}/cluster/status`,
            {method: 'get'}
        );
    };

    testLdap = async () => {
        return this.doFetch(
            `${this.getBaseRoute()}/ldap/test`,
            {method: 'post'}
        );
    };

    syncLdap = async () => {
        return this.doFetch(
            `${this.getBaseRoute()}/ldap/sync`,
            {method: 'post'}
        );
    };

    getSamlCertificateStatus = async () => {
        return this.doFetch(
            `${this.getBaseRoute()}/saml/certificate/status`,
            {method: 'get'}
        );
    };

    uploadPublicSamlCertificate = async (fileData) => {
        const formData = new FormData();
        formData.append('certificate', fileData);

        return this.doFetch(
            `${this.getBaseRoute()}/saml/certificate/public`,
            {
                method: 'post',
                body: formData
            }
        );
    };

    uploadPrivateSamlCertificate = async (fileData) => {
        const formData = new FormData();
        formData.append('certificate', fileData);

        return this.doFetch(
            `${this.getBaseRoute()}/saml/certificate/private`,
            {
                method: 'post',
                body: formData
            }
        );
    };

    uploadIdpSamlCertificate = async (fileData) => {
        const formData = new FormData();
        formData.append('certificate', fileData);

        return this.doFetch(
            `${this.getBaseRoute()}/saml/certificate/idp`,
            {
                method: 'post',
                body: formData
            }
        );
    };

    deletePublicSamlCertificate = async () => {
        return this.doFetch(
            `${this.getBaseRoute()}/saml/certificate/public`,
            {method: 'delete'}
        );
    };

    deletePrivateSamlCertificate = async () => {
        return this.doFetch(
            `${this.getBaseRoute()}/saml/certificate/private`,
            {method: 'delete'}
        );
    };

    deleteIdpSamlCertificate = async () => {
        return this.doFetch(
            `${this.getBaseRoute()}/saml/certificate/idp`,
            {method: 'delete'}
        );
    };

    testElasticsearch = async (config) => {
        return this.doFetch(
            `${this.getBaseRoute()}/elasticsearch/test`,
            {method: 'post', body: JSON.stringify(config)}
        );
    };

    purgeElasticsearchIndexes = async () => {
        return this.doFetch(
            `${this.getBaseRoute()}/elasticsearch/purge_indexes`,
            {method: 'post'}
        );
    };

    uploadLicense = async (fileData) => {
        this.trackEvent('api', 'api_license_upload');

        const formData = new FormData();
        formData.append('license', fileData);

        const request = {
            method: 'post',
            body: formData
        };

        if (formData.getBoundary) {
            request.headers = {
                'Content-Type': `multipart/form-data; boundary=${formData.getBoundary()}`
            };
        }

        return this.doFetch(
            `${this.getBaseRoute()}/license`,
            request
        );
    };

    removeLicense = async () => {
        return this.doFetch(
            `${this.getBaseRoute()}/license`,
            {method: 'delete'}
        );
    };

    getAnalytics = async (name = 'standard', teamId = '') => {
        return this.doFetch(
            `${this.getBaseRoute()}/analytics/old${buildQueryString({name, team_id: teamId})}`,
            {method: 'get'}
        );
    };

    // Client Helpers

    doFetch = async (url, options) => {
        const {data} = await this.doFetchWithResponse(url, options);

        return data;
    };

    doFetchWithResponse = async (url, options) => {
        const response = await fetch(url, this.getOptions(options));
        const headers = parseAndMergeNestedHeaders(response.headers);

        let data;
        try {
            data = await response.json();
        } catch (err) {
            throw {
                intl: {
                    id: 'mobile.request.invalid_response',
                    defaultMessage: 'Received invalid response from the server.'
                }
            };
        }

        // Need to only accept version in the header from requests that are not cached
        // to avoid getting an old version from a cached response
        if (headers.has(HEADER_X_VERSION_ID) && !headers.get('Cache-Control')) {
            const serverVersion = headers.get(HEADER_X_VERSION_ID);
            if (serverVersion && this.serverVersion !== serverVersion) {
                this.serverVersion = serverVersion;
                EventEmitter.emit(General.CONFIG_CHANGED, serverVersion);
            }
        }

        if (headers.has(HEADER_X_CLUSTER_ID)) {
            const clusterId = headers.get(HEADER_X_CLUSTER_ID);
            if (clusterId && this.clusterId !== clusterId) {
                this.clusterId = clusterId;
            }
        }

        if (response.ok) {
            return {
                response,
                headers,
                data
            };
        }

        const msg = data.message || '';

        if (this.logToConsole) {
            console.error(msg); // eslint-disable-line no-console
        }

        throw {
            message: msg,
            server_error_id: data.id,
            status_code: data.status_code,
            url
        };
    };

    trackEvent(category, event, props) {
        const properties = Object.assign({category, type: event, user_actual_id: this.userId}, props);
        const options = {
            context: {
                ip: '0.0.0.0'
            },
            page: {
                path: '',
                referrer: '',
                search: '',
                title: '',
                url: ''
            },
            anonymousId: '00000000000000000000000000'
        };

        if (global && global.window && global.window.analytics && global.window.analytics.initialized) {
            global.window.analytics.track('event', properties, options);
        } else if (global && global.analytics) {
            global.analytics.track(Object.assign({
                event: 'event'
            }, {properties}, options));
        }
    }
}

function buildQueryString(parameters) {
    const keys = Object.keys(parameters);
    if (keys.length === 0) {
        return '';
    }

    let query = '?';
    for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        query += key + '=' + encodeURIComponent(parameters[key]);

        if (i < keys.length - 1) {
            query += '&';
        }
    }

    return query;
}

function parseAndMergeNestedHeaders(originalHeaders) {
    const headers = new Map();
    let nestedHeaders = new Map();
    originalHeaders.forEach((val, key) => {
        const capitalizedKey = key.replace(/\b[a-z]/g, (l) => l.toUpperCase());
        let realVal = val;
        if (val && val.match(/\n\S+:\s\S+/)) {
            const nestedHeaderStrings = val.split('\n');
            realVal = nestedHeaderStrings.shift();
            const moreNestedHeaders = new Map(
                nestedHeaderStrings.map((h) => h.split(/:\s/))
            );
            nestedHeaders = new Map([...nestedHeaders, ...moreNestedHeaders]);
        }
        headers.set(capitalizedKey, realVal);
    });
    return new Map([...headers, ...nestedHeaders]);
}
