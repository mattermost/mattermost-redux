// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {isSystemAdmin} from '../utils/user_utils';

const FormData = require('form-data');

import fetch from './fetch_etag';
import {buildQueryString, isMinimumServerVersion} from 'src/utils/helpers';
import {cleanUrlForLogging} from 'src/utils/sentry';
import {General} from 'constants';

const HEADER_AUTH = 'Authorization';
const HEADER_BEARER = 'BEARER';
const HEADER_REQUESTED_WITH = 'X-Requested-With';
const HEADER_USER_AGENT = 'User-Agent';
const HEADER_X_CLUSTER_ID = 'X-Cluster-Id';
const HEADER_X_CSRF_TOKEN = 'X-CSRF-Token';
export const HEADER_X_VERSION_ID = 'X-Version-Id';

const PER_PAGE_DEFAULT = 60;
const LOGS_PER_PAGE_DEFAULT = 10000;

/* eslint-disable no-throw-literal */

export default class Client4 {
    constructor() {
        this.logToConsole = false;
        this.serverVersion = '';
        this.clusterId = '';
        this.token = '';
        this.csrf = '';
        this.url = '';
        this.urlVersion = '/api/v4';
        this.userAgent = null;
        this.enableLogging = false;
        this.defaultHeaders = {};
        this.userId = '';
        this.diagnosticId = '';
        this.includeCookies = true;

        this.translations = {
            connectionError: 'There appears to be a problem with your internet connection.',
            unknownError: 'We received an unexpected status code from the server.',
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

    setCSRF(csrfToken) {
        this.csrf = csrfToken;
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

    setUserRoles(roles) {
        this.userRoles = roles;
    }

    setDiagnosticId(diagnosticId) {
        this.diagnosticId = diagnosticId;
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

    getTeamSchemeRoute(teamId) {
        return `${this.getTeamRoute(teamId)}/scheme`;
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

    getChannelSchemeRoute(channelId) {
        return `${this.getChannelRoute(channelId)}/scheme`;
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

    getDataRetentionRoute() {
        return `${this.getBaseRoute()}/data_retention`;
    }

    getJobsRoute() {
        return `${this.getBaseRoute()}/jobs`;
    }

    getPluginsRoute() {
        return `${this.getBaseRoute()}/plugins`;
    }

    getPluginRoute(pluginId) {
        return `${this.getPluginsRoute()}/${pluginId}`;
    }

    getRolesRoute() {
        return `${this.getBaseRoute()}/roles`;
    }

    getTimezonesRoute() {
        return `${this.getBaseRoute()}/system/timezones`;
    }

    getSchemesRoute() {
        return `${this.getBaseRoute()}/schemes`;
    }

    getRedirectLocationRoute() {
        return `${this.getBaseRoute()}/redirect_location`;
    }

    getBotsRoute() {
        return `${this.getBaseRoute()}/bots`;
    }

    getBotRoute(botUserId) {
        return `${this.getBotsRoute()}/${botUserId}`;
    }

    getOptions(options) {
        const newOptions = Object.assign({}, options);

        const headers = {
            [HEADER_REQUESTED_WITH]: 'XMLHttpRequest',
            ...this.defaultHeaders,
        };

        if (this.token) {
            headers[HEADER_AUTH] = `${HEADER_BEARER} ${this.token}`;
        }

        if (options.method && options.method.toLowerCase() !== 'get' && this.csrf) {
            headers[HEADER_X_CSRF_TOKEN] = this.csrf;
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
            headers,
        };
    }

    // User Routes

    createUser = async (user, token, inviteId) => {
        this.trackEvent('api', 'api_users_create');

        const queryParams = {};

        if (token) {
            queryParams.t = token;
        }

        if (inviteId) {
            queryParams.iid = inviteId;
        }

        return this.doFetch(
            `${this.getUsersRoute()}${buildQueryString(queryParams)}`,
            {method: 'post', body: JSON.stringify(user)}
        );
    }

    patchMe = async (userPatch) => {
        return this.doFetch(
            `${this.getUserRoute('me')}/patch`,
            {method: 'put', body: JSON.stringify(userPatch)}
        );
    }

    patchUser = async (userPatch) => {
        this.trackEvent('api', 'api_users_patch');

        return this.doFetch(
            `${this.getUserRoute(userPatch.id)}/patch`,
            {method: 'put', body: JSON.stringify(userPatch)}
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
            body: formData,
        };

        if (formData.getBoundary) {
            request.headers = {
                'Content-Type': `multipart/form-data; boundary=${formData.getBoundary()}`,
            };
        }

        return this.doFetch(
            `${this.getUserRoute(userId)}/image`,
            request
        );
    };

    setDefaultProfileImage = async (userId) => {
        this.trackEvent('api', 'api_users_set_default_profile_picture');

        return this.doFetch(
            `${this.getUserRoute(userId)}/image`,
            {method: 'delete'}
        );
    };

    verifyUserEmail = async (token) => {
        return this.doFetch(
            `${this.getUsersRoute()}/email/verify`,
            {method: 'post', body: JSON.stringify({token})}
        );
    }

    updateMyTermsOfServiceStatus = async (termsOfServiceId, accepted) => {
        return this.doFetch(
            `${this.getUserRoute('me')}/terms_of_service`,
            {method: 'post', body: JSON.stringify({termsOfServiceId, accepted})}
        );
    }

    getTermsOfService = async () => {
        return this.doFetch(
            `${this.getBaseRoute()}/terms_of_service`,
            {method: 'get'}
        );
    }

    createTermsOfService = async (text) => {
        return this.doFetch(
            `${this.getBaseRoute()}/terms_of_service`,
            {method: 'post', body: JSON.stringify({text})}
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
            token,
        };

        if (ldapOnly) {
            body.ldap_only = 'true';
        }

        const {data} = await this.doFetchWithResponse(
            `${this.getUsersRoute()}/login`,
            {method: 'post', body: JSON.stringify(body)}
        );

        return data;
    };

    loginById = async (id, password, token = '', deviceId = '') => {
        this.trackEvent('api', 'api_users_login');

        const body = {
            device_id: deviceId,
            id,
            password,
            token,
        };

        const {data} = await this.doFetchWithResponse(
            `${this.getUsersRoute()}/login`,
            {method: 'post', body: JSON.stringify(body)}
        );

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

    getProfiles = async (page = 0, perPage = PER_PAGE_DEFAULT, options = {}) => {
        this.trackEvent('api', 'api_profiles_get');

        return this.doFetch(
            `${this.getUsersRoute()}${buildQueryString({page, per_page: perPage, ...options})}`,
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

    getProfilesNotInTeam = async (teamId, groupConstrained, page = 0, perPage = PER_PAGE_DEFAULT) => {
        this.trackEvent('api', 'api_profiles_get_not_in_team', {team_id: teamId, group_constrained: groupConstrained});

        const queryStringObj = {not_in_team: teamId, page, per_page: perPage};
        if (groupConstrained) {
            queryStringObj.group_constrained = true;
        }

        return this.doFetch(
            `${this.getUsersRoute()}${buildQueryString(queryStringObj)}`,
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

    getProfilesInChannel = async (channelId, page = 0, perPage = PER_PAGE_DEFAULT, sort = '') => {
        this.trackEvent('api', 'api_profiles_get_in_channel', {channel_id: channelId});

        const serverVersion = this.getServerVersion();
        let queryStringObj;
        if (isMinimumServerVersion(serverVersion, 4, 7)) {
            queryStringObj = {in_channel: channelId, page, per_page: perPage, sort};
        } else {
            queryStringObj = {in_channel: channelId, page, per_page: perPage};
        }
        return this.doFetch(
            `${this.getUsersRoute()}${buildQueryString(queryStringObj)}`,
            {method: 'get'}
        );
    };

    getProfilesNotInChannel = async (teamId, channelId, groupConstrained, page = 0, perPage = PER_PAGE_DEFAULT) => {
        this.trackEvent('api', 'api_profiles_get_not_in_channel', {team_id: teamId, channel_id: channelId, group_constrained: groupConstrained});

        const queryStringObj = {in_team: teamId, not_in_channel: channelId, page, per_page: perPage};
        if (groupConstrained) {
            queryStringObj.group_constrained = true;
        }

        return this.doFetch(
            `${this.getUsersRoute()}${buildQueryString(queryStringObj)}`,
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
            params._ = lastPictureUpdate;
        }

        return `${this.getUserRoute(userId)}/image${buildQueryString(params)}`;
    };

    getDefaultProfilePictureUrl = (userId) => {
        return `${this.getUserRoute(userId)}/image/default`;
    };

    autocompleteUsers = async (name, teamId, channelId, options = {limit: General.AUTOCOMPLETE_LIMIT_DEFAULT}) => {
        return this.doFetch(
            `${this.getUsersRoute()}/autocomplete${buildQueryString({in_team: teamId, in_channel: channelId, name, limit: options.limit})}`,
            {method: 'get'}
        );
    };

    getSessions = async (userId) => {
        return this.doFetch(
            `${this.getUserRoute(userId)}/sessions`,
            {method: 'get'}
        );
    };

    revokeSession = async (userId, sessionId) => {
        return this.doFetch(
            `${this.getUserRoute(userId)}/sessions/revoke`,
            {method: 'post', body: JSON.stringify({session_id: sessionId})}
        );
    };

    revokeAllSessionsForUser = async (userId) => {
        return this.doFetch(
            `${this.getUserRoute(userId)}/sessions/revoke/all`,
            {method: 'post'}
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

    getUserAccessTokens = async (page = 0, perPage = PER_PAGE_DEFAULT) => {
        return this.doFetch(
            `${this.getUsersRoute()}/tokens${buildQueryString({page, per_page: perPage})}`,
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

    disableUserAccessToken = async (tokenId) => {
        return this.doFetch(
            `${this.getUsersRoute()}/tokens/disable`,
            {method: 'post', body: JSON.stringify({token_id: tokenId})}
        );
    }

    enableUserAccessToken = async (tokenId) => {
        return this.doFetch(
            `${this.getUsersRoute()}/tokens/enable`,
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

    deleteTeam = async (teamId) => {
        this.trackEvent('api', 'api_teams_delete');

        return this.doFetch(
            `${this.getTeamRoute(teamId)}`,
            {method: 'delete'}
        );
    };

    updateTeam = async (team) => {
        this.trackEvent('api', 'api_teams_update_name', {team_id: team.id});

        return this.doFetch(
            `${this.getTeamRoute(team.id)}`,
            {method: 'put', body: JSON.stringify(team)}
        );
    };

    patchTeam = async (team) => {
        this.trackEvent('api', 'api_teams_patch_name', {team_id: team.id});

        return this.doFetch(
            `${this.getTeamRoute(team.id)}/patch`,
            {method: 'put', body: JSON.stringify(team)}
        );
    };

    regenerateTeamInviteId = async (teamId) => {
        this.trackEvent('api', 'api_teams_regenerate_invite_id', {team_id: teamId});

        return this.doFetch(
            `${this.getTeamRoute(teamId)}/regenerate_invite_id`,
            {method: 'post'}
        );
    };

    updateTeamScheme = async (teamId, schemeId) => {
        const patch = {scheme_id: schemeId};

        this.trackEvent('api', 'api_teams_update_scheme', {team_id: teamId, ...patch});

        return this.doFetch(
            `${this.getTeamSchemeRoute(teamId)}`,
            {method: 'put', body: JSON.stringify(patch)}
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

    searchTeams = (term) => {
        this.trackEvent('api', 'api_search_teams');

        return this.doFetch(
            `${this.getTeamsRoute()}/search`,
            {method: 'post', body: JSON.stringify({term})}
        );
    };

    getTeam = async (teamId) => {
        return this.doFetch(
            this.getTeamRoute(teamId),
            {method: 'get'}
        );
    };

    getTeamByName = async (teamName) => {
        this.trackEvent('api', 'api_teams_get_team_by_name');

        return this.doFetch(
            this.getTeamNameRoute(teamName),
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

    getTeamMembers = async (teamId, page = 0, perPage = PER_PAGE_DEFAULT) => {
        return this.doFetch(
            `${this.getTeamMembersRoute(teamId)}${buildQueryString({page, per_page: perPage})}`,
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

    addToTeamFromInvite = async (token = '', inviteId = '') => {
        this.trackEvent('api', 'api_teams_invite_members');

        const query = buildQueryString({token, invite_id: inviteId});
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

    getTotalUsersStats = async () => {
        return this.doFetch(
            `${this.getUsersRoute()}/stats`,
            {method: 'get'}
        );
    };

    invalidateAllEmailInvites = async () => {
        return this.doFetch(
            `${this.getTeamsRoute()}/invites/email`,
            {method: 'delete'}
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
            body: formData,
        };

        if (formData.getBoundary) {
            request.headers = {
                'Content-Type': `multipart/form-data; boundary=${formData.getBoundary()}`,
            };
        }

        return this.doFetch(
            `${this.getTeamRoute(teamId)}/import`,
            request
        );
    };

    getTeamIconUrl = (teamId, lastTeamIconUpdate) => {
        const params = {};
        if (lastTeamIconUpdate) {
            params._ = lastTeamIconUpdate;
        }

        return `${this.getTeamRoute(teamId)}/image${buildQueryString(params)}`;
    };

    setTeamIcon = async (teamId, imageData) => {
        this.trackEvent('api', 'api_team_set_team_icon');

        const formData = new FormData();
        formData.append('image', imageData);

        const request = {
            method: 'post',
            body: formData,
        };

        if (formData.getBoundary) {
            request.headers = {
                'Content-Type': `multipart/form-data; boundary=${formData.getBoundary()}`,
            };
        }

        return this.doFetch(
            `${this.getTeamRoute(teamId)}/image`,
            request
        );
    };

    removeTeamIcon = async (teamId) => {
        this.trackEvent('api', 'api_team_remove_team_icon');

        return this.doFetch(
            `${this.getTeamRoute(teamId)}/image`,
            {method: 'delete'}
        );
    };

    updateTeamMemberSchemeRoles = async (teamId, userId, isSchemeUser, isSchemeAdmin) => {
        const body = {scheme_user: isSchemeUser, scheme_admin: isSchemeAdmin};
        return this.doFetch(
            `${this.getTeamRoute(teamId)}/members/${userId}/schemeRoles`,
            {method: 'put', body: JSON.stringify(body)}
        );
    };

    // Channel Routes

    getAllChannels = async (page = 0, perPage = PER_PAGE_DEFAULT, notAssociatedToGroup = '', excludeDefaultChannels = false) => {
        const queryData = {
            page,
            per_page: perPage,
            not_associated_to_group: notAssociatedToGroup,
            exclude_default_channels: excludeDefaultChannels,
        };
        return this.doFetch(
            `${this.getChannelsRoute()}${buildQueryString(queryData)}`,
            {method: 'get'}
        );
    };

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

    convertChannelToPrivate = async (channelId) => {
        this.trackEvent('api', 'api_channels_convert_to_private', {channel_id: channelId});

        return this.doFetch(
            `${this.getChannelRoute(channelId)}/convert`,
            {method: 'post'}
        );
    };

    patchChannel = async (channelId, channelPatch) => {
        this.trackEvent('api', 'api_channels_patch', {channel_id: channelId});

        return this.doFetch(
            `${this.getChannelRoute(channelId)}/patch`,
            {method: 'put', body: JSON.stringify(channelPatch)}
        );
    };

    updateChannelNotifyProps = async (props) => {
        this.trackEvent('api', 'api_users_update_channel_notifcations', {channel_id: props.channel_id});

        return this.doFetch(
            `${this.getChannelMemberRoute(props.channel_id, props.user_id)}/notify_props`,
            {method: 'put', body: JSON.stringify(props)}
        );
    };

    updateChannelScheme = async (channelId, schemeId) => {
        const patch = {scheme_id: schemeId};

        this.trackEvent('api', 'api_channels_update_scheme', {channel_id: channelId, ...patch});

        return this.doFetch(
            `${this.getChannelSchemeRoute(channelId)}`,
            {method: 'put', body: JSON.stringify(patch)}
        );
    };

    getChannel = async (channelId) => {
        this.trackEvent('api', 'api_channel_get', {channel_id: channelId});

        return this.doFetch(
            `${this.getChannelRoute(channelId)}`,
            {method: 'get'}
        );
    };

    getChannelByName = async (teamId, channelName, includeDeleted = false) => {
        return this.doFetch(
            `${this.getTeamRoute(teamId)}/channels/name/${channelName}?include_deleted=${includeDeleted}`,
            {method: 'get'}
        );
    };

    getChannelByNameAndTeamName = async (teamName, channelName, includeDeleted = false) => {
        this.trackEvent('api', 'api_channel_get_by_name_and_teamName', {channel_name: channelName, team_name: teamName, include_deleted: includeDeleted});

        return this.doFetch(
            `${this.getTeamNameRoute(teamName)}/channels/name/${channelName}?include_deleted=${includeDeleted}`,
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

    getChannelTimezones = async (channelId) => {
        return this.doFetch(
            `${this.getChannelRoute(channelId)}/timezones`,
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

    addToChannel = async (userId, channelId, postRootId = '') => {
        this.trackEvent('api', 'api_channels_add_member', {channel_id: channelId});

        const member = {user_id: userId, channel_id: channelId, post_root_id: postRootId};
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

    autocompleteChannels = async (teamId, name) => {
        return this.doFetch(
            `${this.getTeamRoute(teamId)}/channels/autocomplete${buildQueryString({name})}`,
            {method: 'get'}
        );
    };

    autocompleteChannelsForSearch = async (teamId, name) => {
        return this.doFetch(
            `${this.getTeamRoute(teamId)}/channels/search_autocomplete${buildQueryString({name})}`,
            {method: 'get'}
        );
    };

    searchChannels = async (teamId, term) => {
        return this.doFetch(
            `${this.getTeamRoute(teamId)}/channels/search`,
            {method: 'post', body: JSON.stringify({term})}
        );
    };

    searchAllChannels = async (term, notAssociatedToGroup = '', excludeDefaultChannels = false) => {
        const body = {
            term,
            not_associated_to_group: notAssociatedToGroup,
            exclude_default_channels: excludeDefaultChannels,
        };
        return this.doFetch(
            `${this.getChannelsRoute()}/search`,
            {method: 'post', body: JSON.stringify(body)}
        );
    };

    updateChannelMemberSchemeRoles = async (channelId, userId, isSchemeUser, isSchemeAdmin) => {
        const body = {scheme_user: isSchemeUser, scheme_admin: isSchemeAdmin};
        return this.doFetch(
            `${this.getChannelRoute(channelId)}/members/${userId}/schemeRoles`,
            {method: 'put', body: JSON.stringify(body)}
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

    getPost = async (postId) => {
        return this.doFetch(
            `${this.getPostRoute(postId)}`,
            {method: 'get'}
        );
    };

    patchPost = async (postPatch) => {
        this.trackEvent('api', 'api_posts_patch', {channel_id: postPatch.channel_id});

        return this.doFetch(
            `${this.getPostRoute(postPatch.id)}/patch`,
            {method: 'put', body: JSON.stringify(postPatch)}
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

    searchPostsWithParams = async (teamId, params) => {
        this.trackEvent('api', 'api_posts_search', {team_id: teamId});

        return this.doFetch(
            `${this.getTeamRoute(teamId)}/posts/search`,
            {method: 'post', body: JSON.stringify(params)}
        );
    };

    searchPosts = async (teamId, terms, isOrSearch) => {
        return this.searchPostsWithParams(teamId, {terms, is_or_search: isOrSearch});
    };

    getOpenGraphMetadata = async (url) => {
        return this.doFetch(
            `${this.getBaseRoute()}/opengraph`,
            {method: 'post', body: JSON.stringify({url})}
        );
    };

    doPostAction = async (postId, actionId, selectedOption = '') => {
        return this.doPostActionWithCookie(postId, actionId, '', selectedOption);
    };

    doPostActionWithCookie = async (postId, actionId, actionCookie, selectedOption = '') => {
        if (selectedOption) {
            this.trackEvent('api', 'api_interactive_messages_menu_selected');
        } else {
            this.trackEvent('api', 'api_interactive_messages_button_clicked');
        }

        const msg = {
            selected_option: selectedOption,
        };
        if (actionCookie !== '') {
            msg.cookie = actionCookie;
        }
        return this.doFetch(
            `${this.getPostRoute(postId)}/actions/${encodeURIComponent(actionId)}`,
            {method: 'post', body: JSON.stringify(msg)}
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
            body: fileFormData,
        };

        if (formBoundary) {
            request.headers = {
                'Content-Type': `multipart/form-data; boundary=${formBoundary}`,
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
        const url = `${this.getBaseRoute()}/logs`;

        if (!this.enableLogging) {
            throw new ClientError(this.getUrl(), {
                message: 'Logging disabled.',
                url,
            });
        }

        return this.doFetch(
            url,
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

    getAutocompleteCommandsList = async (teamId, page = 0, perPage = PER_PAGE_DEFAULT) => {
        return this.doFetch(
            `${this.getTeamRoute(teamId)}/commands/autocomplete${buildQueryString({page, per_page: perPage})}`,
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

    editOAuthApp = async (app) => {
        return this.doFetch(
            `${this.getOAuthAppsRoute()}/${app.id}`,
            {method: 'put', body: JSON.stringify(app)}
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

    submitInteractiveDialog = async (data) => {
        this.trackEvent('api', 'api_interactive_messages_dialog_submitted');
        return this.doFetch(
            `${this.getBaseRoute()}/actions/dialogs/submit`,
            {method: 'post', body: JSON.stringify(data)},
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
            body: formData,
        };

        if (formData.getBoundary) {
            request.headers = {
                'Content-Type': `multipart/form-data; boundary=${formData.getBoundary()}`,
            };
        }

        return this.doFetch(
            `${this.getEmojisRoute()}`,
            request
        );
    };

    getCustomEmoji = async (id) => {
        return this.doFetch(
            `${this.getEmojisRoute()}/${id}`,
            {method: 'get'}
        );
    };

    getCustomEmojiByName = async (name) => {
        return this.doFetch(
            `${this.getEmojisRoute()}/name/${name}`,
            {method: 'get'}
        );
    };

    getCustomEmojis = async (page = 0, perPage = PER_PAGE_DEFAULT, sort = '') => {
        return this.doFetch(
            `${this.getEmojisRoute()}${buildQueryString({page, per_page: perPage, sort})}`,
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

    searchCustomEmoji = async (term, options = {}) => {
        return this.doFetch(
            `${this.getEmojisRoute()}/search`,
            {method: 'post', body: JSON.stringify({term, ...options})}
        );
    };

    autocompleteCustomEmoji = async (name) => {
        return this.doFetch(
            `${this.getEmojisRoute()}/autocomplete${buildQueryString({name})}`,
            {method: 'get'}
        );
    };

    // Timezone Routes

    getTimezones = async () => {
        return this.doFetch(
            `${this.getTimezonesRoute()}`,
            {method: 'get'}
        );
    };

    // Data Retention

    getDataRetentionPolicy = () => {
        return this.doFetch(
            `${this.getDataRetentionRoute()}/policy`,
            {method: 'get'}
        );
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

    getLogs = async (page = 0, perPage = LOGS_PER_PAGE_DEFAULT) => {
        return this.doFetch(
            `${this.getBaseRoute()}/logs${buildQueryString({page, logs_per_page: perPage})}`,
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

    getEnvironmentConfig = async () => {
        return this.doFetch(
            `${this.getBaseRoute()}/config/environment`,
            {method: 'get'}
        );
    };

    testEmail = async (config) => {
        return this.doFetch(
            `${this.getBaseRoute()}/email/test`,
            {method: 'post', body: JSON.stringify(config)}
        );
    };

    testS3Connection = async (config) => {
        return this.doFetch(
            `${this.getBaseRoute()}/file/s3_test`,
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
            body: formData,
        };

        if (formData.getBoundary) {
            request.headers = {
                'Content-Type': `multipart/form-data; boundary=${formData.getBoundary()}`,
            };
        }

        return this.doFetch(
            `${this.getBrandRoute()}/image`,
            request
        );
    };

    deleteBrandImage = async () => {
        return this.doFetch(
            `${this.getBrandRoute()}/image`,
            {method: 'delete'}
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

    getLdapGroups = async (page = 0, perPage = PER_PAGE_DEFAULT, opts = {}) => {
        const query = {page, per_page: perPage, ...opts};
        return this.doFetch(
            `${this.getBaseRoute()}/ldap/groups${buildQueryString(query)}`,
            {method: 'get'}
        );
    };

    linkLdapGroup = async (key) => {
        return this.doFetch(
            `${this.getBaseRoute()}/ldap/groups/${encodeURI(key)}/link`,
            {method: 'post'}
        );
    };

    unlinkLdapGroup = async (key) => {
        return this.doFetch(
            `${this.getBaseRoute()}/ldap/groups/${encodeURI(key)}/link`,
            {method: 'delete'}
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
                body: formData,
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
                body: formData,
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
                body: formData,
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
            body: formData,
        };

        if (formData.getBoundary) {
            request.headers = {
                'Content-Type': `multipart/form-data; boundary=${formData.getBoundary()}`,
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

    // Role Routes

    getRole = async (roleId) => {
        return this.doFetch(
            `${this.getRolesRoute()}/${roleId}`,
            {method: 'get'}
        );
    };

    getRoleByName = async (roleName) => {
        return this.doFetch(
            `${this.getRolesRoute()}/name/${roleName}`,
            {method: 'get'}
        );
    };

    getRolesByNames = async (rolesNames) => {
        return this.doFetch(
            `${this.getRolesRoute()}/names`,
            {method: 'post', body: JSON.stringify(rolesNames)}
        );
    };

    patchRole = async (roleId, rolePatch) => {
        return this.doFetch(
            `${this.getRolesRoute()}/${roleId}/patch`,
            {method: 'put', body: JSON.stringify(rolePatch)}
        );
    };

    // Scheme Routes

    getSchemes = async (scope = '', page = 0, perPage = PER_PAGE_DEFAULT) => {
        return this.doFetch(
            `${this.getSchemesRoute()}${buildQueryString({scope, page, per_page: perPage})}`,
            {method: 'get'}
        );
    };

    createScheme = async (scheme) => {
        this.trackEvent('api', 'api_schemes_create');

        return this.doFetch(
            `${this.getSchemesRoute()}`,
            {method: 'post', body: JSON.stringify(scheme)}
        );
    };

    getScheme = async (schemeId) => {
        return this.doFetch(
            `${this.getSchemesRoute()}/${schemeId}`,
            {method: 'get'}
        );
    };

    deleteScheme = async (schemeId) => {
        this.trackEvent('api', 'api_schemes_delete');

        return this.doFetch(
            `${this.getSchemesRoute()}/${schemeId}`,
            {method: 'delete'}
        );
    };

    patchScheme = async (schemeId, schemePatch) => {
        this.trackEvent('api', 'api_schemes_patch', {scheme_id: schemeId});

        return this.doFetch(
            `${this.getSchemesRoute()}/${schemeId}/patch`,
            {method: 'put', body: JSON.stringify(schemePatch)}
        );
    };

    getSchemeTeams = async (schemeId, page = 0, perPage = PER_PAGE_DEFAULT) => {
        return this.doFetch(
            `${this.getSchemesRoute()}/${schemeId}/teams${buildQueryString({page, per_page: perPage})}`,
            {method: 'get'}
        );
    };

    getSchemeChannels = async (schemeId, page = 0, perPage = PER_PAGE_DEFAULT) => {
        return this.doFetch(
            `${this.getSchemesRoute()}/${schemeId}/channels${buildQueryString({page, per_page: perPage})}`,
            {method: 'get'}
        );
    };

    // Plugin Routes - EXPERIMENTAL - SUBJECT TO CHANGE

    uploadPlugin = async (fileData, force = false) => {
        this.trackEvent('api', 'api_plugin_upload');

        const formData = new FormData();
        if (force) {
            formData.append('force', 'true');
        }
        formData.append('plugin', fileData);

        const request = {
            method: 'post',
            body: formData,
        };

        if (formData.getBoundary) {
            request.headers = {
                'Content-Type': `multipart/form-data; boundary=${formData.getBoundary()}`,
            };
        }

        return this.doFetch(
            this.getPluginsRoute(),
            request
        );
    };

    getPlugins = async () => {
        return this.doFetch(
            this.getPluginsRoute(),
            {method: 'get'}
        );
    };

    getPluginStatuses = async () => {
        return this.doFetch(
            `${this.getPluginsRoute()}/statuses`,
            {method: 'get'}
        );
    };

    removePlugin = async (pluginId) => {
        return this.doFetch(
            this.getPluginRoute(pluginId),
            {method: 'delete'}
        );
    };

    getWebappPlugins = async () => {
        return this.doFetch(
            `${this.getPluginsRoute()}/webapp`,
            {method: 'get'}
        );
    };

    enablePlugin = async (pluginId) => {
        return this.doFetch(
            `${this.getPluginRoute(pluginId)}/enable`,
            {method: 'post'}
        );
    };

    disablePlugin = async (pluginId) => {
        return this.doFetch(
            `${this.getPluginRoute(pluginId)}/disable`,
            {method: 'post'}
        );
    };

    // Groups

    linkGroupSyncable = async (groupID, syncableID, syncableType, patch) => {
        return this.doFetch(
            `${this.getBaseRoute()}/groups/${groupID}/${syncableType}s/${syncableID}/link`,
            {method: 'post', body: JSON.stringify(patch)}
        );
    };

    unlinkGroupSyncable = async (groupID, syncableID, syncableType) => {
        return this.doFetch(
            `${this.getBaseRoute()}/groups/${groupID}/${syncableType}s/${syncableID}/link`,
            {method: 'delete'}
        );
    };

    getGroupSyncables = async (groupID, syncableType) => {
        return this.doFetch(
            `${this.getBaseRoute()}/groups/${groupID}/${syncableType}s`,
            {method: 'get'}
        );
    };

    getGroupMembers = async (groupID, page = 0, perPage = PER_PAGE_DEFAULT) => {
        return this.doFetch(
            `${this.getBaseRoute()}/groups/${groupID}/members${buildQueryString({page, per_page: perPage})}`,
            {method: 'get'}
        );
    };

    getGroup = async (groupID) => {
        return this.doFetch(
            `${this.getBaseRoute()}/groups/${groupID}`,
            {method: 'get'}
        );
    };

    getGroupsNotAssociatedToTeam = async (teamID, q = '', page = 0, perPage = PER_PAGE_DEFAULT) => {
        this.trackEvent('api', 'api_groups_get_not_associated_to_team', {team_id: teamID});
        return this.doFetch(
            `${this.getBaseRoute()}/groups${buildQueryString({not_associated_to_team: teamID, page, per_page: perPage, q, include_member_count: true})}`,
            {method: 'get'}
        );
    };

    getGroupsNotAssociatedToChannel = async (channelID, q = '', page = 0, perPage = PER_PAGE_DEFAULT) => {
        this.trackEvent('api', 'api_groups_get_not_associated_to_channel', {channel_id: channelID});
        return this.doFetch(
            `${this.getBaseRoute()}/groups${buildQueryString({not_associated_to_channel: channelID, page, per_page: perPage, q, include_member_count: true})}`,
            {method: 'get'}
        );
    };

    getGroupsAssociatedToTeam = async (teamID, q = '', page = 0, perPage = PER_PAGE_DEFAULT) => {
        this.trackEvent('api', 'api_groups_get_associated_to_team', {team_id: teamID});
        return this.doFetch(
            `${this.getBaseRoute()}/teams/${teamID}/groups${buildQueryString({page, per_page: perPage, q, include_member_count: true})}`,
            {method: 'get'}
        );
    };

    getGroupsAssociatedToChannel = async (channelID, q = '', page = 0, perPage = PER_PAGE_DEFAULT) => {
        this.trackEvent('api', 'api_groups_get_associated_to_channel', {channel_id: channelID});
        return this.doFetch(
            `${this.getBaseRoute()}/channels/${channelID}/groups${buildQueryString({page, per_page: perPage, q, include_member_count: true})}`,
            {method: 'get'}
        );
    };

    getAllGroupsAssociatedToTeam = async (teamID) => {
        return this.doFetch(
            `${this.getBaseRoute()}/teams/${teamID}/groups?paginate=false`,
            {method: 'get'}
        );
    };

    getAllGroupsAssociatedToChannel = async (channelID) => {
        return this.doFetch(
            `${this.getBaseRoute()}/channels/${channelID}/groups?paginate=false`,
            {method: 'get'}
        );
    };

    // Redirect Location

    getRedirectLocation = async (urlParam) => {
        if (!urlParam.length) {
            return Promise.resolve();
        }
        const url = `${this.getRedirectLocationRoute()}${buildQueryString({url: urlParam})}`;
        return this.doFetch(url, {method: 'get'});
    };

    // Bot Routes

    createBot = async (bot) => {
        return this.doFetch(
            `${this.getBotsRoute()}`,
            {method: 'post', body: JSON.stringify(bot)}
        );
    }

    patchBot = async (botUserId, botPatch) => {
        return this.doFetch(
            `${this.getBotRoute(botUserId)}`,
            {method: 'put', body: JSON.stringify(botPatch)}
        );
    }

    getBot = async (botUserId) => {
        return this.doFetch(
            `${this.getBotRoute(botUserId)}`,
            {method: 'get'}
        );
    }

    getBots = async (page = 0, perPage = PER_PAGE_DEFAULT) => {
        return this.doFetch(
            `${this.getBotsRoute()}${buildQueryString({page, per_page: perPage})}`,
            {method: 'get'}
        );
    }

    getBotsIncludeDeleted = async (page = 0, perPage = PER_PAGE_DEFAULT) => {
        return this.doFetch(
            `${this.getBotsRoute()}${buildQueryString({include_deleted: true, page, per_page: perPage})}`,
            {method: 'get'}
        );
    }

    getBotsOrphaned = async (page = 0, perPage = PER_PAGE_DEFAULT) => {
        return this.doFetch(
            `${this.getBotsRoute()}${buildQueryString({only_orphaned: true, page, per_page: perPage})}`,
            {method: 'get'}
        );
    }

    disableBot = async (botUserId) => {
        return this.doFetch(
            `${this.getBotRoute(botUserId)}/disable`,
            {method: 'post'}
        );
    }

    enableBot = async (botUserId) => {
        return this.doFetch(
            `${this.getBotRoute(botUserId)}/enable`,
            {method: 'post'}
        );
    }

    assignBot = async (botUserId, newOwnerId) => {
        return this.doFetch(
            `${this.getBotRoute(botUserId)}/assign/${newOwnerId}`,
            {method: 'post'}
        );
    }

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
            throw new ClientError(this.getUrl(), {
                message: 'Received invalid response from the server.',
                intl: {
                    id: 'mobile.request.invalid_response',
                    defaultMessage: 'Received invalid response from the server.',
                },
                url,
            });
        }

        if (headers.has(HEADER_X_VERSION_ID) && !headers.get('Cache-Control')) {
            const serverVersion = headers.get(HEADER_X_VERSION_ID);
            if (serverVersion && this.serverVersion !== serverVersion) {
                this.serverVersion = serverVersion;
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
                data,
            };
        }

        const msg = data.message || '';

        if (this.logToConsole) {
            console.error(msg); // eslint-disable-line no-console
        }

        throw new ClientError(this.getUrl(), {
            message: msg,
            server_error_id: data.id,
            status_code: data.status_code,
            url,
        });
    };

    trackEvent(category, event, props) {
        // Temporary change to allow only certain events to reduce data rate - see MM-13062
        if (![
            'api_posts_create',
            'api_interactive_messages_button_clicked',
            'api_interactive_messages_menu_selected',
            'api_interactive_messages_dialog_submitted',
        ].includes(event)) {
            return;
        }

        const properties = Object.assign({
            category,
            type: event,
            user_actual_role: this.userRoles && isSystemAdmin(this.userRoles) ? 'system_admin, system_user' : 'system_user',
            user_actual_id: this.userId,
        }, props);
        const options = {
            context: {
                ip: '0.0.0.0',
            },
            page: {
                path: '',
                referrer: '',
                search: '',
                title: '',
                url: '',
            },
            anonymousId: '00000000000000000000000000',
        };

        if (global && global.window && global.window.analytics && global.window.analytics.initialized) {
            global.window.analytics.track('event', properties, options);
        } else if (global && global.analytics) {
            if (global.analytics_context) {
                options.context = global.analytics_context;
            }
            global.analytics.track(Object.assign({
                event: 'event',
                userId: this.diagnosticId,
            }, {properties}, options));
        }
    }
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

export class ClientError extends Error {
    constructor(baseUrl, data) {
        super(data.message + ': ' + cleanUrlForLogging(baseUrl, data.url));

        this.message = data.message;
        this.url = data.url;
        this.intl = data.intl;
        this.server_error_id = data.server_error_id;
        this.status_code = data.status_code;

        // Ensure message is treated as a property of this class when object spreading. Without this,
        // copying the object by using `{...error}` would not include the message.
        Object.defineProperty(this, 'message', {enumerable: true});
    }
}
