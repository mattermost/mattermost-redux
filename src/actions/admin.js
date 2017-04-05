// Copyright (c) 2017 Mattermost, Inc. All Rights Reserved.
// See License.txt for license information.

import {AdminTypes} from 'action_types';
import {General} from 'constants';

import {Client4} from 'client';

import {bindClientFunc} from './helpers';

export function getLogs(page = 0, perPage = General.PAGE_SIZE_DEFAULT) {
    return bindClientFunc(
        Client4.getLogs,
        AdminTypes.GET_LOGS_REQUEST,
        [AdminTypes.RECEIVED_LOGS, AdminTypes.GET_LOGS_SUCCESS],
        AdminTypes.GET_LOGS_FAILURE,
        page,
        perPage
    );
}

export function getAudits(page = 0, perPage = General.PAGE_SIZE_DEFAULT) {
    return bindClientFunc(
        Client4.getAudits,
        AdminTypes.GET_AUDITS_REQUEST,
        [AdminTypes.RECEIVED_AUDITS, AdminTypes.GET_AUDITS_SUCCESS],
        AdminTypes.GET_AUDITS_FAILURE,
        page,
        perPage
    );
}

export function getConfig() {
    return bindClientFunc(
        Client4.getConfig,
        AdminTypes.GET_CONFIG_REQUEST,
        [AdminTypes.RECEIVED_CONFIG, AdminTypes.GET_CONFIG_SUCCESS],
        AdminTypes.GET_CONFIG_FAILURE
    );
}

export function updateConfig() {
    return bindClientFunc(
        Client4.updateConfig,
        AdminTypes.UPDATE_CONFIG_REQUEST,
        [AdminTypes.RECEIVED_CONFIG, AdminTypes.UPDATE_CONFIG_SUCCESS],
        AdminTypes.UPDATE_CONFIG_FAILURE
    );
}

export function reloadConfig() {
    return bindClientFunc(
        Client4.reloadConfig,
        AdminTypes.RELOAD_CONFIG_REQUEST,
        AdminTypes.RELOAD_CONFIG_SUCCESS,
        AdminTypes.RELOAD_CONFIG_FAILURE
    );
}

export function testEmail() {
    return bindClientFunc(
        Client4.testEmail,
        AdminTypes.TEST_EMAIL_REQUEST,
        AdminTypes.TEST_EMAIL_SUCCESS,
        AdminTypes.TEST_EMAIL_FAILURE
    );
}

export function invalidateCaches() {
    return bindClientFunc(
        Client4.invalidateCaches,
        AdminTypes.INVALIDATE_CACHES_REQUEST,
        AdminTypes.INVALIDATE_CACHES_SUCCESS,
        AdminTypes.INVALIDATE_CACHES_FAILURE
    );
}

export function recycleDatabase() {
    return bindClientFunc(
        Client4.recycleDatabase,
        AdminTypes.RECYCLE_DATABASE_REQUEST,
        AdminTypes.RECYCLE_DATABASE_SUCCESS,
        AdminTypes.RECYCLE_DATABASE_FAILURE
    );
}

export function createComplianceReport(job) {
    return bindClientFunc(
        Client4.createComplianceReport,
        AdminTypes.CREATE_COMPLIANCE_REQUEST,
        [AdminTypes.RECEIVED_COMPLIANCE_REPORT, AdminTypes.CREATE_COMPLIANCE_SUCCESS],
        AdminTypes.CREATE_COMPLIANCE_FAILURE,
        job
    );
}

export function getComplianceReport(reportId) {
    return bindClientFunc(
        Client4.getComplianceReport,
        AdminTypes.GET_COMPLIANCE_REQUEST,
        [AdminTypes.RECEIVED_COMPLIANCE_REPORT, AdminTypes.GET_COMPLIANCE_SUCCESS],
        AdminTypes.GET_COMPLIANCE_FAILURE,
        reportId
    );
}

export function getComplianceReports(page = 0, perPage = General.PER_PAGE_DEFAULT) {
    return bindClientFunc(
        Client4.getComplianceReports,
        AdminTypes.GET_COMPLIANCE_REQUEST,
        [AdminTypes.RECEIVED_COMPLIANCE_REPORTS, AdminTypes.GET_COMPLIANCE_SUCCESS],
        AdminTypes.GET_COMPLIANCE_FAILURE,
        page,
        perPage
    );
}

