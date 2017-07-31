// Copyright (c) 2017-present Mattermost, Inc. All Rights Reserved.
// See License.txt for license information.

import {combineReducers} from 'redux';
import {AdminTypes, UserTypes} from 'action_types';
import {Stats} from 'constants';

function logs(state = [], action) {
    switch (action.type) {
    case AdminTypes.RECEIVED_LOGS: {
        return action.data;
    }
    case UserTypes.LOGOUT_SUCCESS:
        return [];

    default:
        return state;
    }
}

function audits(state = {}, action) {
    const nextState = {...state};

    switch (action.type) {
    case AdminTypes.RECEIVED_AUDITS: {
        for (const audit of action.data) {
            nextState[audit.id] = audit;
        }
        return nextState;
    }
    case UserTypes.LOGOUT_SUCCESS:
        return {};

    default:
        return state;
    }
}

function config(state = {}, action) {
    switch (action.type) {
    case AdminTypes.RECEIVED_CONFIG: {
        return action.data;
    }
    case UserTypes.LOGOUT_SUCCESS:
        return {};

    default:
        return state;
    }
}

function complianceReports(state = {}, action) {
    const nextState = {...state};

    switch (action.type) {
    case AdminTypes.RECEIVED_COMPLIANCE_REPORT: {
        nextState[action.data.id] = action.data;
        return nextState;
    }
    case AdminTypes.RECEIVED_COMPLIANCE_REPORTS: {
        for (const report of action.data) {
            nextState[report.id] = report;
        }
        return nextState;
    }
    case UserTypes.LOGOUT_SUCCESS:
        return {};

    default:
        return state;
    }
}

function clusterInfo(state = [], action) {
    switch (action.type) {
    case AdminTypes.RECEIVED_CLUSTER_STATUS: {
        return action.data;
    }
    case UserTypes.LOGOUT_SUCCESS:
        return [];

    default:
        return state;
    }
}

function samlCertStatus(state = {}, action) {
    switch (action.type) {
    case AdminTypes.RECEIVED_SAML_CERT_STATUS: {
        return action.data;
    }
    case UserTypes.LOGOUT_SUCCESS:
        return {};

    default:
        return state;
    }
}

function convertAnalyticsRowsToStats(data, name) {
    const stats = {};

    if (name === 'post_counts_day') {
        data.reverse();
        stats[Stats.POST_PER_DAY] = data;
        return stats;
    }

    if (name === 'user_counts_with_posts_day') {
        data.reverse();
        stats[Stats.USERS_WITH_POSTS_PER_DAY] = data;
        return stats;
    }

    data.forEach((row) => {
        let key;
        switch (row.name) {
        case 'channel_open_count':
            key = Stats.TOTAL_PUBLIC_CHANNELS;
            break;
        case 'channel_private_count':
            key = Stats.TOTAL_PRIVATE_GROUPS;
            break;
        case 'post_count':
            key = Stats.TOTAL_POSTS;
            break;
        case 'unique_user_count':
            key = Stats.TOTAL_USERS;
            break;
        case 'team_count':
            key = Stats.TOTAL_TEAMS;
            break;
        case 'total_websocket_connections':
            key = Stats.TOTAL_WEBSOCKET_CONNECTIONS;
            break;
        case 'total_master_db_connections':
            key = Stats.TOTAL_MASTER_DB_CONNECTIONS;
            break;
        case 'total_read_db_connections':
            key = Stats.TOTAL_READ_DB_CONNECTIONS;
            break;
        case 'daily_active_users':
            key = Stats.DAILY_ACTIVE_USERS;
            break;
        case 'monthly_active_users':
            key = Stats.MONTHLY_ACTIVE_USERS;
            break;
        case 'file_post_count':
            key = Stats.TOTAL_FILE_POSTS;
            break;
        case 'hashtag_post_count':
            key = Stats.TOTAL_HASHTAG_POSTS;
            break;
        case 'incoming_webhook_count':
            key = Stats.TOTAL_IHOOKS;
            break;
        case 'outgoing_webhook_count':
            key = Stats.TOTAL_OHOOKS;
            break;
        case 'command_count':
            key = Stats.TOTAL_COMMANDS;
            break;
        case 'session_count':
            key = Stats.TOTAL_SESSIONS;
            break;
        }

        if (key) {
            stats[key] = row.value;
        }
    });

    return stats;
}

function analytics(state = {}, action) {
    switch (action.type) {
    case AdminTypes.RECEIVED_SYSTEM_ANALYTICS: {
        const stats = convertAnalyticsRowsToStats(action.data, action.name);
        return {...state, ...stats};
    }
    case UserTypes.LOGOUT_SUCCESS:
        return {};

    default:
        return state;
    }
}

function teamAnalytics(state = {}, action) {
    switch (action.type) {
    case AdminTypes.RECEIVED_TEAM_ANALYTICS: {
        const nextState = {...state};
        const stats = convertAnalyticsRowsToStats(action.data, action.name);
        const analyticsForTeam = {...(nextState[action.teamId] || {}), ...stats};
        nextState[action.teamId] = analyticsForTeam;
        return nextState;
    }
    case UserTypes.LOGOUT_SUCCESS:
        return {};

    default:
        return state;
    }
}

function userAccessTokens(state = {}, action) {
    switch (action.type) {
    case AdminTypes.RECEIVED_USER_ACCESS_TOKEN: {
        const nextUserState = {...(state[action.data.user_id] || {})};
        nextUserState[action.data.id] = action.data;

        return {...state, [action.data.user_id]: nextUserState};
    }
    case AdminTypes.RECEIVED_USER_ACCESS_TOKENS: {
        const nextUserState = {...(state[action.userId] || {})};

        for (const uat of action.data) {
            nextUserState[uat.id] = uat;
        }

        return {...state, [action.userId]: nextUserState};
    }
    case UserTypes.REVOKED_USER_ACCESS_TOKEN: {
        const userIds = Object.keys(state);
        for (let i = 0; i < userIds.length; i++) {
            const userId = userIds[i];
            if (state[userId] && state[userId][action.data]) {
                const nextUserState = {...state[userId]};
                Reflect.deleteProperty(nextUserState, action.data);
                return {...state, [userId]: nextUserState};
            }
        }

        return state;
    }
    case UserTypes.LOGOUT_SUCCESS:
        return {};

    default:
        return state;
    }
}

export default combineReducers({

    // array of strings each representing a log entry
    logs,

    // object where every key is an audit id and has an object with audit details
    audits,

    // object representing the server configuration
    config,

    // object where every key is a report id and has an object with report details
    complianceReports,

    // array of cluster status data
    clusterInfo,

    // object with certificate type as keys and boolean statuses as values
    samlCertStatus,

    // object with analytic categories as types and numbers as values
    analytics,

    // object with team ids as keys and analytics objects as values
    teamAnalytics,

    // object with user ids as keys and objects, with token ids as keys, as values
    userAccessTokens
});

