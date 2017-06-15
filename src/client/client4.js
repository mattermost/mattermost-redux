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

    getEmojiRoute(emojiId) {
        return `${this.getBaseRoute()}/emoji/${emojiId}`;
    }

    getBrandRoute() {
        return `${this.getBaseRoute()}/brand`;
    }

    getBrandImageUrl(timestamp) {
        return `${this.getBrandRoute()}/image?t=${timestamp}`;
    }

    getOptions(options) {
        const newOptions = Object.assign({}, options);

        const headers = {
            [HEADER_REQUESTED_WITH]: 'XMLHttpRequest'
        };

        if (this.token) {
            headers[HEADER_AUTH] = `${HEADER_BEARER} ${this.token}`;
        } else {
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
        return this.doFetch(
            `${this.getUserRoute(user.id)}`,
            {method: 'put', body: JSON.stringify(user)}
        );
    }

    updateUserRoles = async (userId, roles) => {
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
        return this.doFetch(
            `${this.getUserRoute(userId)}/password`,
            {method: 'put', body: JSON.stringify({current_password: currentPassword, new_password: newPassword})}
        );
    }

    resetUserPassword = async (token, newPassword) => {
        return this.doFetch(
            `${this.getUsersRoute()}/password/reset`,
            {method: 'post', body: JSON.stringify({token, new_password: newPassword})}
        );
    }

    sendPasswordResetEmail = async (email) => {
        return this.doFetch(
            `${this.getUsersRoute()}/password/reset/send`,
            {method: 'post', body: JSON.stringify({email})}
        );
    }

    updateUserActive = async (userId, active) => {
        return this.doFetch(
            `${this.getUserRoute(userId)}/active`,
            {method: 'put', body: JSON.stringify({active})}
        );
    }

    uploadProfileImage = async (userId, imageData) => {
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
        return this.doFetch(
            `${this.getUsersRoute()}${buildQueryString({page, per_page: perPage})}`,
            {method: 'get'}
        );
    };

    getProfilesByIds = async (userIds) => {
        return this.doFetch(
            `${this.getUsersRoute()}/ids`,
            {method: 'post', body: JSON.stringify(userIds)}
        );
    };

    getProfilesInTeam = async (teamId, page = 0, perPage = PER_PAGE_DEFAULT) => {
        return this.doFetch(
            `${this.getUsersRoute()}${buildQueryString({in_team: teamId, page, per_page: perPage})}`,
            {method: 'get'}
        );
    };

    getProfilesNotInTeam = async (teamId, page = 0, perPage = PER_PAGE_DEFAULT) => {
        return this.doFetch(
            `${this.getUsersRoute()}${buildQueryString({not_in_team: teamId, page, per_page: perPage})}`,
            {method: 'get'}
        );
    };

    getProfilesWithoutTeam = async (page = 0, perPage = PER_PAGE_DEFAULT) => {
        return this.doFetch(
            `${this.getUsersRoute()}${buildQueryString({without_team: 1, page, per_page: perPage})}`,
            {method: 'get'}
        );
    };

    getProfilesInChannel = async (channelId, page = 0, perPage = PER_PAGE_DEFAULT) => {
        return this.doFetch(
            `${this.getUsersRoute()}${buildQueryString({in_channel: channelId, page, per_page: perPage})}`,
            {method: 'get'}
        );
    };

    getProfilesNotInChannel = async (teamId, channelId, page = 0, perPage = PER_PAGE_DEFAULT) => {
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
        return this.doFetch(
            `${this.getUsersRoute()}/login/switch`,
            {method: 'post', body: JSON.stringify({current_service: 'email', new_service: service, email, password, mfa_code: mfaCode})}
        );
    };

    switchOAuthToEmail = async (currentService, email, password) => {
        return this.doFetch(
            `${this.getUsersRoute()}/login/switch`,
            {method: 'post', body: JSON.stringify({current_service: currentService, new_service: 'email', email, new_password: password})}
        );
    };

    switchEmailToLdap = async (email, emailPassword, ldapId, ldapPassword, mfaCode = '') => {
        return this.doFetch(
            `${this.getUsersRoute()}/login/switch`,
            {method: 'post', body: JSON.stringify({current_service: 'email', new_service: 'ldap', email, password: emailPassword, ldap_id: ldapId, new_password: ldapPassword, mfa_code: mfaCode})}
        );
    };

    switchLdapToEmail = async (ldapPassword, email, emailPassword, mfaCode = '') => {
        return this.doFetch(
            `${this.getUsersRoute()}/login/switch`,
            {method: 'post', body: JSON.stringify({current_service: 'ldap', new_service: 'email', email, password: ldapPassword, new_password: emailPassword, mfa_code: mfaCode})}
        );
    };

    // Team Routes

    createTeam = async (team) => {
        return this.doFetch(
            `${this.getTeamsRoute()}`,
            {method: 'post', body: JSON.stringify(team)}
        );
    };

    updateTeam = async (team) => {
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
        const member = {user_id: userId, team_id: teamId};
        return this.doFetch(
            `${this.getTeamMembersRoute(teamId)}`,
            {method: 'post', body: JSON.stringify(member)}
        );
    };

    addUsersToTeam = async (teamId, userIds) => {
        const members = [];
        userIds.forEach((id) => members.push({team_id: teamId, user_id: id}));
        return this.doFetch(
            `${this.getTeamMembersRoute(teamId)}/batch`,
            {method: 'post', body: JSON.stringify(members)}
        );
    };

    joinTeam = async (inviteId, teamId) => {
        const member = {team_id: teamId};
        const query = buildQueryString({invite_id: inviteId});
        return this.doFetch(
            `${this.getTeamMembersRoute(teamId)}${query}`,
            {method: 'post', body: JSON.stringify(member)}
        );
    };

    removeFromTeam = async (teamId, userId) => {
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

    updateTeamMemberRoles = async (teamId, userId, roles) => {
        return this.doFetch(
            `${this.getTeamMemberRoute(teamId, userId)}/roles`,
            {method: 'put', body: JSON.stringify({roles})}
        );
    };

    sendEmailInvitesToTeam = async (teamId, emails) => {
        return this.doFetch(
            `${this.getTeamRoute(teamId)}/invite/email`,
            {method: 'post', body: JSON.stringify(emails)}
        );
    };

    // Channel Routes

    createChannel = async (channel) => {
        return this.doFetch(
            `${this.getChannelsRoute()}`,
            {method: 'post', body: JSON.stringify(channel)}
        );
    };

    createDirectChannel = async (userIds) => {
        return this.doFetch(
            `${this.getChannelsRoute()}/direct`,
            {method: 'post', body: JSON.stringify(userIds)}
        );
    };

    deleteChannel = async (channelId) => {
        return this.doFetch(
            `${this.getChannelRoute(channelId)}`,
            {method: 'delete'}
        );
    };

    updateChannel = async (channel) => {
        return this.doFetch(
            `${this.getChannelRoute(channel.id)}`,
            {method: 'put', body: JSON.stringify(channel)}
        );
    };

    patchChannel = async (channelId, patch) => {
        return this.doFetch(
            `${this.getChannelRoute(channelId)}/patch`,
            {method: 'put', body: JSON.stringify(patch)}
        );
    };

    updateChannelNotifyProps = async (props) => {
        return this.doFetch(
            `${this.getChannelMemberRoute(props.channel_id, props.user_id)}/notify_props`,
            {method: 'put', body: JSON.stringify(props)}
        );
    };

    getChannel = async (channelId) => {
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
        const member = {user_id: userId, channel_id: channelId};
        return this.doFetch(
            `${this.getChannelMembersRoute(channelId)}`,
            {method: 'post', body: JSON.stringify(member)}
        );
    };

    removeFromChannel = async (userId, channelId) => {
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
        return this.doFetch(
            `${this.getPostsRoute()}`,
            {method: 'post', body: JSON.stringify(post)}
        );
    };

    updatePost = async (post) => {
        return this.doFetch(
            `${this.getPostRoute(post.id)}`,
            {method: 'put', body: JSON.stringify(post)}
        );
    };

    patchPost = async (post) => {
        return this.doFetch(
            `${this.getPostRoute(post.id)}/patch`,
            {method: 'put', body: JSON.stringify(post)}
        );
    };

    deletePost = async (postId) => {
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
        return this.doFetch(
            `${this.getChannelRoute(channelId)}/posts${buildQueryString({before: postId, page, per_page: perPage})}`,
            {method: 'get'}
        );
    };

    getPostsAfter = async (channelId, postId, page = 0, perPage = PER_PAGE_DEFAULT) => {
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

    pinPost = async (postId) => {
        return this.doFetch(
            `${this.getPostRoute(postId)}/pin`,
            {method: 'post'}
        );
    };

    unpinPost = async (postId) => {
        return this.doFetch(
            `${this.getPostRoute(postId)}/unpin`,
            {method: 'post'}
        );
    };

    addReaction = async (userId, postId, emojiName) => {
        return this.doFetch(
            `${this.getReactionsRoute()}`,
            {method: 'post', body: JSON.stringify({user_id: userId, post_id: postId, emoji_name: emojiName})}
        );
    };

    removeReaction = async (userId, postId, emojiName) => {
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
        const body = {
            message,
            level
        };

        return this.doFetch(
            `${this.url}/api/v3/general/log_client`,
            {method: 'post', body: JSON.stringify(body)}
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

    // Integration Routes

    createIncomingWebhook = async (hook) => {
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
        return this.doFetch(
            `${this.getIncomingHookRoute(hookId)}`,
            {method: 'delete'}
        );
    };

    updateIncomingWebhook = async (hook) => {
        return this.doFetch(
            `${this.getIncomingHookRoute(hook.id)}`,
            {method: 'put', body: JSON.stringify(hook)}
        );
    };

    createOutgoingWebhook = async (hook) => {
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
        return this.doFetch(
            `${this.getOutgoingHookRoute(hookId)}`,
            {method: 'delete'}
        );
    };

    updateOutgoingWebhook = async (hook) => {
        return this.doFetch(
            `${this.getOutgoingHookRoute(hook.id)}`,
            {method: 'put', body: JSON.stringify(hook)}
        );
    };

    getCustomTeamCommands = async (teamId) => {
        return this.doFetch(
            `${this.getCommandsRoute()}?team_id=${teamId}&custom_only=true`,
            {method: 'get'}
        );
    };

    addCommand = async (teamId, command) => {
        command.team_id = teamId;
        return this.doFetch(
            `${this.getCommandsRoute()}`,
            {method: 'post', body: JSON.stringify(command)}
        );
    };

    editCommand = async (command) => {
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
        return this.doFetch(
            `${this.getCommandsRoute()}/${id}`,
            {method: 'delete'}
        );
    };

    // Emoji Routes
    getSystemEmojiImageUrl = (filename) => {
        return `${this.url}/static/emoji/${filename}.png`;
    };

    getCustomEmojiImageUrl = (id) => {
        return `${this.getEmojiRoute()}/${id}`;
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
