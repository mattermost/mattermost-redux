// Copyright (c) 2017-present Mattermost, Inc. All Rights Reserved.
// See License.txt for license information.

export function getLogs(state) {
    return state.entities.admin.logs;
}

export function getAudits(state) {
    return state.entities.admin.audits;
}

export function getConfig(state) {
    return state.entities.admin.config;
}

export function getComplianceReports(state) {
    return state.entities.admin.complianceReports;
}

