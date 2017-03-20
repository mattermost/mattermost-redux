// Copyright (c) 2017 Mattermost, Inc. All Rights Reserved.
// See License.txt for license information.

import EventEmitter from 'utils/event_emitter';
import {General} from 'constants';

import fetch from './fetch_etag';

//const HEADER_TOKEN = 'Token';
const HEADER_AUTH = 'Authorization';
const HEADER_BEARER = 'BEARER';
const HEADER_REQUESTED_WITH = 'X-Requested-With';
const HEADER_USER_AGENT = 'User-Agent';
const HEADER_X_VERSION_ID = 'X-Version-Id';

export default class Client4 {
    constructor() {
        this.logToConsole = false;
        this.serverVersion = '';
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

    getOptions(options) {
        const headers = {
            [HEADER_REQUESTED_WITH]: 'XMLHttpRequest'
        };

        if (this.token) {
            headers[HEADER_AUTH] = `${HEADER_BEARER} ${this.token}`;
        }

        if (this.userAgent) {
            headers[HEADER_USER_AGENT] = this.userAgent;
        }

        if (options.headers) {
            Object.assign(headers, options.headers);
        }

        return {
            ...options,
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
            `${this.getUsersRoute()}` + buildQueryString(queryParams),
            {method: 'post', body: JSON.stringify(user)}
        );
    }

    // Client helpers
    doFetch = async (url, options) => {
        const {data} = await this.doFetchWithResponse(url, options);

        return data;
    }

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

        if (headers.has(HEADER_X_VERSION_ID)) {
            const serverVersion = headers.get(HEADER_X_VERSION_ID);
            if (serverVersion && this.serverVersion !== serverVersion) {
                this.serverVersion = serverVersion;
                EventEmitter.emit(General.CONFIG_CHANGED, serverVersion);
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
