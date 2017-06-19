// Copyright (c) 2017-present Mattermost, Inc. All Rights Reserved.
// See License.txt for license information.

import {combineReducers} from 'redux';
import {AdminTypes, UserTypes} from 'action_types';

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

function analytics(state = {}, action) {
    switch (action.type) {
    case AdminTypes.RECEIVED_SYSTEM_ANALYTICS: {
        const nextState = {...state};
        nextState[action.name] = action.data;
        return nextState;
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
        const analyticsForTeam = {...(nextState[action.teamId] || {})};
        analyticsForTeam[action.name] = action.data;
        nextState[action.teamId] = analyticsForTeam;
        return nextState;
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
    teamAnalytics

});

