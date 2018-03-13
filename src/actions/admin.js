// Copyright (c) 2017-present Mattermost, Inc. All Rights Reserved.
// See License.txt for license information.

import {AdminTypes} from 'action_types';
import {General} from 'constants';

import {Client4} from 'client';

import {logError} from './errors';
import {bindClientFunc, forceLogoutIfNecessary} from './helpers';
import {batchActions} from 'redux-batched-actions';

export function getLogs(page = 0, perPage = General.LOGS_PAGE_SIZE_DEFAULT) {
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

export function updateConfig(config) {
    return bindClientFunc(
        Client4.updateConfig,
        AdminTypes.UPDATE_CONFIG_REQUEST,
        [AdminTypes.RECEIVED_CONFIG, AdminTypes.UPDATE_CONFIG_SUCCESS],
        AdminTypes.UPDATE_CONFIG_FAILURE,
        config
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

export function testEmail(config) {
    return bindClientFunc(
        Client4.testEmail,
        AdminTypes.TEST_EMAIL_REQUEST,
        AdminTypes.TEST_EMAIL_SUCCESS,
        AdminTypes.TEST_EMAIL_FAILURE,
        config
    );
}

export function testS3Connection(config) {
    return bindClientFunc(
        Client4.testS3Connection,
        AdminTypes.TEST_S3_REQUEST,
        AdminTypes.TEST_S3_SUCCESS,
        AdminTypes.TEST_S3_FAILURE,
        config
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

export function uploadBrandImage(imageData) {
    return bindClientFunc(
        Client4.uploadBrandImage,
        AdminTypes.UPLOAD_BRAND_IMAGE_REQUEST,
        AdminTypes.UPLOAD_BRAND_IMAGE_SUCCESS,
        AdminTypes.UPLOAD_BRAND_IMAGE_FAILURE,
        imageData
    );
}

export function getClusterStatus() {
    return bindClientFunc(
        Client4.getClusterStatus,
        AdminTypes.GET_CLUSTER_STATUS_REQUEST,
        [AdminTypes.RECEIVED_CLUSTER_STATUS, AdminTypes.GET_CLUSTER_STATUS_SUCCESS],
        AdminTypes.GET_CLUSTER_STATUS_FAILURE
    );
}

export function testLdap() {
    return bindClientFunc(
        Client4.testLdap,
        AdminTypes.TEST_LDAP_REQUEST,
        AdminTypes.TEST_LDAP_SUCCESS,
        AdminTypes.TEST_LDAP_FAILURE
    );
}

export function syncLdap() {
    return bindClientFunc(
        Client4.syncLdap,
        AdminTypes.SYNC_LDAP_REQUEST,
        AdminTypes.SYNC_LDAP_SUCCESS,
        AdminTypes.SYNC_LDAP_FAILURE
    );
}

export function getSamlCertificateStatus() {
    return bindClientFunc(
        Client4.getSamlCertificateStatus,
        AdminTypes.SAML_CERT_STATUS_REQUEST,
        [AdminTypes.RECEIVED_SAML_CERT_STATUS, AdminTypes.SAML_CERT_STATUS_SUCCESS],
        AdminTypes.SAML_CERT_STATUS_FAILURE
    );
}

export function uploadPublicSamlCertificate(fileData) {
    return bindClientFunc(
        Client4.uploadPublicSamlCertificate,
        AdminTypes.UPLOAD_SAML_PUBLIC_REQUEST,
        AdminTypes.UPLOAD_SAML_PUBLIC_SUCCESS,
        AdminTypes.UPLOAD_SAML_PUBLIC_FAILURE,
        fileData
    );
}

export function uploadPrivateSamlCertificate(fileData) {
    return bindClientFunc(
        Client4.uploadPrivateSamlCertificate,
        AdminTypes.UPLOAD_SAML_PRIVATE_REQUEST,
        AdminTypes.UPLOAD_SAML_PRIVATE_SUCCESS,
        AdminTypes.UPLOAD_SAML_PRIVATE_FAILURE,
        fileData
    );
}

export function uploadIdpSamlCertificate(fileData) {
    return bindClientFunc(
        Client4.uploadIdpSamlCertificate,
        AdminTypes.UPLOAD_SAML_IDP_REQUEST,
        AdminTypes.UPLOAD_SAML_IDP_SUCCESS,
        AdminTypes.UPLOAD_SAML_IDP_FAILURE,
        fileData
    );
}

export function removePublicSamlCertificate() {
    return bindClientFunc(
        Client4.deletePublicSamlCertificate,
        AdminTypes.DELETE_SAML_PUBLIC_REQUEST,
        AdminTypes.DELETE_SAML_PUBLIC_SUCCESS,
        AdminTypes.DELETE_SAML_PUBLIC_FAILURE
    );
}

export function removePrivateSamlCertificate() {
    return bindClientFunc(
        Client4.deletePrivateSamlCertificate,
        AdminTypes.DELETE_SAML_PRIVATE_REQUEST,
        AdminTypes.DELETE_SAML_PRIVATE_SUCCESS,
        AdminTypes.DELETE_SAML_PRIVATE_FAILURE
    );
}

export function removeIdpSamlCertificate() {
    return bindClientFunc(
        Client4.deleteIdpSamlCertificate,
        AdminTypes.DELETE_SAML_IDP_REQUEST,
        AdminTypes.DELETE_SAML_IDP_SUCCESS,
        AdminTypes.DELETE_SAML_IDP_FAILURE
    );
}

export function testElasticsearch(config) {
    return bindClientFunc(
        Client4.testElasticsearch,
        AdminTypes.TEST_ELASTICSEARCH_REQUEST,
        AdminTypes.TEST_ELASTICSEARCH_SUCCESS,
        AdminTypes.TEST_ELASTICSEARCH_FAILURE,
        config
    );
}

export function purgeElasticsearchIndexes() {
    return bindClientFunc(
        Client4.purgeElasticsearchIndexes,
        AdminTypes.PURGE_ELASTICSEARCH_INDEXES_REQUEST,
        AdminTypes.PURGE_ELASTICSEARCH_INDEXES_SUCCESS,
        AdminTypes.PURGE_ELASTICSEARCH_INDEXES_FAILURE,
    );
}

export function uploadLicense(fileData) {
    return bindClientFunc(
        Client4.uploadLicense,
        AdminTypes.UPLOAD_LICENSE_REQUEST,
        AdminTypes.UPLOAD_LICENSE_SUCCESS,
        AdminTypes.UPLOAD_LICENSE_FAILURE,
        fileData
    );
}

export function removeLicense() {
    return bindClientFunc(
        Client4.removeLicense,
        AdminTypes.REMOVE_LICENSE_REQUEST,
        AdminTypes.REMOVE_LICENSE_SUCCESS,
        AdminTypes.REMOVE_LICENSE_FAILURE
    );
}

export function getAnalytics(name, teamId = '') {
    return async (dispatch, getState) => {
        dispatch({type: AdminTypes.GET_ANALYTICS_REQUEST}, getState);

        let data;
        try {
            data = await Client4.getAnalytics(name, teamId);
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch, getState);
            dispatch(batchActions([
                {type: AdminTypes.GET_ANALYTICS_FAILURE, error},
                logError(error)(dispatch),
            ]), getState);
            return {error};
        }

        const actions = [{type: AdminTypes.GET_ANALYTICS_SUCCESS}];
        if (teamId === '') {
            actions.push({type: AdminTypes.RECEIVED_SYSTEM_ANALYTICS, data, name});
        } else {
            actions.push({type: AdminTypes.RECEIVED_TEAM_ANALYTICS, data, name, teamId});
        }

        dispatch(batchActions(actions), getState);

        return {data};
    };
}

export function getStandardAnalytics(teamId = '') {
    return getAnalytics('standard', teamId);
}

export function getAdvancedAnalytics(teamId = '') {
    return getAnalytics('extra_counts', teamId);
}

export function getPostsPerDayAnalytics(teamId = '') {
    return getAnalytics('post_counts_day', teamId);
}

export function getUsersPerDayAnalytics(teamId = '') {
    return getAnalytics('user_counts_with_posts_day', teamId);
}

// EXPERIMENTAL - SUBJECT TO CHANGE
export function uploadPlugin(fileData) {
    return async (dispatch, getState) => {
        dispatch({type: AdminTypes.UPLOAD_PLUGIN_REQUEST});

        let data;
        try {
            data = await Client4.uploadPlugin(fileData);
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch, getState);
            dispatch(batchActions([
                {type: AdminTypes.UPLOAD_PLUGIN_FAILURE, error},
                logError(error)(dispatch),
            ]));
            return {error};
        }

        dispatch(batchActions([
            {type: AdminTypes.UPLOAD_PLUGIN_SUCCESS},
            {type: AdminTypes.RECEIVED_PLUGIN, data: {...data, active: false}},
        ]));

        return {data};
    };
}

// EXPERIMENTAL - SUBJECT TO CHANGE
export function getPlugins() {
    return async (dispatch, getState) => {
        dispatch({type: AdminTypes.GET_PLUGIN_REQUEST});

        let data;
        try {
            data = await Client4.getPlugins();
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch, getState);
            dispatch(batchActions([
                {type: AdminTypes.GET_PLUGIN_FAILURE, error},
                logError(error)(dispatch),
            ]));
            return {error};
        }

        dispatch(batchActions([
            {type: AdminTypes.GET_PLUGIN_SUCCESS},
            {type: AdminTypes.RECEIVED_PLUGINS, data},
        ]));

        return {data};
    };
}

// EXPERIMENTAL - SUBJECT TO CHANGE
export function removePlugin(pluginId) {
    return async (dispatch, getState) => {
        dispatch({type: AdminTypes.REMOVE_PLUGIN_REQUEST});

        try {
            await Client4.removePlugin(pluginId);
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch, getState);
            dispatch(batchActions([
                {type: AdminTypes.REMOVE_PLUGIN_FAILURE, error},
                logError(error)(dispatch),
            ]));
            return {error};
        }

        dispatch(batchActions([
            {type: AdminTypes.REMOVE_PLUGIN_SUCCESS},
            {type: AdminTypes.REMOVED_PLUGIN, data: pluginId},
        ]));

        return {data: true};
    };
}

// EXPERIMENTAL - SUBJECT TO CHANGE
export function activatePlugin(pluginId) {
    return async (dispatch, getState) => {
        dispatch({type: AdminTypes.ACTIVATE_PLUGIN_REQUEST});

        try {
            await Client4.activatePlugin(pluginId);
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch, getState);
            dispatch(batchActions([
                {type: AdminTypes.ACTIVATE_PLUGIN_FAILURE, error},
                logError(error)(dispatch),
            ]));
            return {error};
        }

        dispatch(batchActions([
            {type: AdminTypes.ACTIVATE_PLUGIN_SUCCESS},
            {type: AdminTypes.ACTIVATED_PLUGIN, data: pluginId},
        ]));

        return {data: true};
    };
}

// EXPERIMENTAL - SUBJECT TO CHANGE
export function deactivatePlugin(pluginId) {
    return async (dispatch, getState) => {
        dispatch({type: AdminTypes.DEACTIVATE_PLUGIN_REQUEST});

        try {
            await Client4.deactivatePlugin(pluginId);
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch, getState);
            dispatch(batchActions([
                {type: AdminTypes.DEACTIVATE_PLUGIN_FAILURE, error},
                logError(error)(dispatch),
            ]));
            return {error};
        }

        dispatch(batchActions([
            {type: AdminTypes.DEACTIVATE_PLUGIN_SUCCESS},
            {type: AdminTypes.DEACTIVATED_PLUGIN, data: pluginId},
        ]));

        return {data: true};
    };
}

