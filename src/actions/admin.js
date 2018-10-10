// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
// @flow

import {AdminTypes} from 'action_types';
import {General} from 'constants';

import {Client4} from 'client';

import {logError} from './errors';
import {bindClientFunc, forceLogoutIfNecessary} from './helpers';
import {getTermsOfService, createTermsOfService} from './users';
import {batchActions} from 'redux-batched-actions';

import type {ActionFunc} from '../types/actions';
import type {Job} from '../types/jobs';

export function getLogs(page: number = 0, perPage: number = General.LOGS_PAGE_SIZE_DEFAULT): ActionFunc {
    return bindClientFunc(
        Client4.getLogs,
        AdminTypes.GET_LOGS_REQUEST,
        [AdminTypes.RECEIVED_LOGS, AdminTypes.GET_LOGS_SUCCESS],
        AdminTypes.GET_LOGS_FAILURE,
        page,
        perPage
    );
}

export function getAudits(page: number = 0, perPage: number = General.PAGE_SIZE_DEFAULT): ActionFunc {
    return bindClientFunc(
        Client4.getAudits,
        AdminTypes.GET_AUDITS_REQUEST,
        [AdminTypes.RECEIVED_AUDITS, AdminTypes.GET_AUDITS_SUCCESS],
        AdminTypes.GET_AUDITS_FAILURE,
        page,
        perPage
    );
}

export function getConfig(): ActionFunc {
    return async (dispatch, getState) => {
        let config;
        try {
            config = await Client4.getConfig();
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch, getState);
            dispatch(batchActions([
                {type: AdminTypes.GET_CONFIG_FAILURE, error},
                logError(error),
            ]), getState);
            return {error};
        }

        if (config.SupportSettings && config.SupportSettings.CustomTermsOfServiceEnabled) {
            const result = await dispatch(getTermsOfService());
            if (result.error) {
                return {error: result.error};
            }

            if (result.data) {
                config.SupportSettings.CustomTermsOfServiceText = result.data.text;
            }
        }
        dispatch(batchActions([
            {
                type: AdminTypes.RECEIVED_CONFIG,
                data: config,
            },
            {
                type: AdminTypes.GET_CONFIG_SUCCESS,
            },
        ]), getState);

        return {data: config};
    };
}

export function updateConfig(config: Object): ActionFunc {
    return async (dispatch, getState) => {
        const stateConfig = getState().entities.admin.config;
        if (config.SupportSettings && config.SupportSettings.CustomTermsOfServiceEnabled) {
            if (stateConfig.SupportSettings.CustomTermsOfServiceText !== config.SupportSettings.CustomTermsOfServiceText) {
                const result = await dispatch(createTermsOfService(config.SupportSettings.CustomTermsOfServiceText));
                if (result.error) {
                    return result;
                }
            }
        }

        if (config.SupportSettings && typeof config.SupportSettings === 'object') {
            Reflect.deleteProperty(config.SupportSettings, 'CustomTermsOfServiceText');
        }
        return dispatch(bindClientFunc(
            Client4.updateConfig,
            AdminTypes.UPDATE_CONFIG_REQUEST,
            [AdminTypes.RECEIVED_CONFIG, AdminTypes.UPDATE_CONFIG_SUCCESS],
            AdminTypes.UPDATE_CONFIG_FAILURE,
            config
        ));
    };
}

export function reloadConfig(): ActionFunc {
    return bindClientFunc(
        Client4.reloadConfig,
        AdminTypes.RELOAD_CONFIG_REQUEST,
        AdminTypes.RELOAD_CONFIG_SUCCESS,
        AdminTypes.RELOAD_CONFIG_FAILURE
    );
}

export function getEnvironmentConfig(): ActionFunc {
    return bindClientFunc(
        Client4.getEnvironmentConfig,
        AdminTypes.GET_ENVIRONMENT_CONFIG_REQUEST,
        [AdminTypes.RECEIVED_ENVIRONMENT_CONFIG, AdminTypes.GET_ENVIRONMENT_CONFIG_SUCCESS],
        AdminTypes.GET_ENVIRONMENT_CONFIG_FAILURE
    );
}

export function testEmail(config: Object): ActionFunc {
    return bindClientFunc(
        Client4.testEmail,
        AdminTypes.TEST_EMAIL_REQUEST,
        AdminTypes.TEST_EMAIL_SUCCESS,
        AdminTypes.TEST_EMAIL_FAILURE,
        config
    );
}

export function testS3Connection(config: Object): ActionFunc {
    return bindClientFunc(
        Client4.testS3Connection,
        AdminTypes.TEST_S3_REQUEST,
        AdminTypes.TEST_S3_SUCCESS,
        AdminTypes.TEST_S3_FAILURE,
        config
    );
}

export function invalidateCaches(): ActionFunc {
    return bindClientFunc(
        Client4.invalidateCaches,
        AdminTypes.INVALIDATE_CACHES_REQUEST,
        AdminTypes.INVALIDATE_CACHES_SUCCESS,
        AdminTypes.INVALIDATE_CACHES_FAILURE
    );
}

export function recycleDatabase(): ActionFunc {
    return bindClientFunc(
        Client4.recycleDatabase,
        AdminTypes.RECYCLE_DATABASE_REQUEST,
        AdminTypes.RECYCLE_DATABASE_SUCCESS,
        AdminTypes.RECYCLE_DATABASE_FAILURE
    );
}

export function createComplianceReport(job: Job): ActionFunc {
    return bindClientFunc(
        Client4.createComplianceReport,
        AdminTypes.CREATE_COMPLIANCE_REQUEST,
        [AdminTypes.RECEIVED_COMPLIANCE_REPORT, AdminTypes.CREATE_COMPLIANCE_SUCCESS],
        AdminTypes.CREATE_COMPLIANCE_FAILURE,
        job
    );
}

export function getComplianceReport(reportId: string): ActionFunc {
    return bindClientFunc(
        Client4.getComplianceReport,
        AdminTypes.GET_COMPLIANCE_REQUEST,
        [AdminTypes.RECEIVED_COMPLIANCE_REPORT, AdminTypes.GET_COMPLIANCE_SUCCESS],
        AdminTypes.GET_COMPLIANCE_FAILURE,
        reportId
    );
}

export function getComplianceReports(page: number = 0, perPage: number = General.PAGE_SIZE_DEFAULT): ActionFunc {
    return bindClientFunc(
        Client4.getComplianceReports,
        AdminTypes.GET_COMPLIANCE_REQUEST,
        [AdminTypes.RECEIVED_COMPLIANCE_REPORTS, AdminTypes.GET_COMPLIANCE_SUCCESS],
        AdminTypes.GET_COMPLIANCE_FAILURE,
        page,
        perPage
    );
}

export function uploadBrandImage(imageData: File): ActionFunc {
    return bindClientFunc(
        Client4.uploadBrandImage,
        AdminTypes.UPLOAD_BRAND_IMAGE_REQUEST,
        AdminTypes.UPLOAD_BRAND_IMAGE_SUCCESS,
        AdminTypes.UPLOAD_BRAND_IMAGE_FAILURE,
        imageData
    );
}

export function getClusterStatus(): ActionFunc {
    return bindClientFunc(
        Client4.getClusterStatus,
        AdminTypes.GET_CLUSTER_STATUS_REQUEST,
        [AdminTypes.RECEIVED_CLUSTER_STATUS, AdminTypes.GET_CLUSTER_STATUS_SUCCESS],
        AdminTypes.GET_CLUSTER_STATUS_FAILURE
    );
}

export function testLdap(): ActionFunc {
    return bindClientFunc(
        Client4.testLdap,
        AdminTypes.TEST_LDAP_REQUEST,
        AdminTypes.TEST_LDAP_SUCCESS,
        AdminTypes.TEST_LDAP_FAILURE
    );
}

export function syncLdap(): ActionFunc {
    return bindClientFunc(
        Client4.syncLdap,
        AdminTypes.SYNC_LDAP_REQUEST,
        AdminTypes.SYNC_LDAP_SUCCESS,
        AdminTypes.SYNC_LDAP_FAILURE
    );
}

export function getSamlCertificateStatus(): ActionFunc {
    return bindClientFunc(
        Client4.getSamlCertificateStatus,
        AdminTypes.SAML_CERT_STATUS_REQUEST,
        [AdminTypes.RECEIVED_SAML_CERT_STATUS, AdminTypes.SAML_CERT_STATUS_SUCCESS],
        AdminTypes.SAML_CERT_STATUS_FAILURE
    );
}

export function uploadPublicSamlCertificate(fileData: File): ActionFunc {
    return bindClientFunc(
        Client4.uploadPublicSamlCertificate,
        AdminTypes.UPLOAD_SAML_PUBLIC_REQUEST,
        AdminTypes.UPLOAD_SAML_PUBLIC_SUCCESS,
        AdminTypes.UPLOAD_SAML_PUBLIC_FAILURE,
        fileData
    );
}

export function uploadPrivateSamlCertificate(fileData: File): ActionFunc {
    return bindClientFunc(
        Client4.uploadPrivateSamlCertificate,
        AdminTypes.UPLOAD_SAML_PRIVATE_REQUEST,
        AdminTypes.UPLOAD_SAML_PRIVATE_SUCCESS,
        AdminTypes.UPLOAD_SAML_PRIVATE_FAILURE,
        fileData
    );
}

export function uploadIdpSamlCertificate(fileData: File): ActionFunc {
    return bindClientFunc(
        Client4.uploadIdpSamlCertificate,
        AdminTypes.UPLOAD_SAML_IDP_REQUEST,
        AdminTypes.UPLOAD_SAML_IDP_SUCCESS,
        AdminTypes.UPLOAD_SAML_IDP_FAILURE,
        fileData
    );
}

export function removePublicSamlCertificate(): ActionFunc {
    return bindClientFunc(
        Client4.deletePublicSamlCertificate,
        AdminTypes.DELETE_SAML_PUBLIC_REQUEST,
        AdminTypes.DELETE_SAML_PUBLIC_SUCCESS,
        AdminTypes.DELETE_SAML_PUBLIC_FAILURE
    );
}

export function removePrivateSamlCertificate(): ActionFunc {
    return bindClientFunc(
        Client4.deletePrivateSamlCertificate,
        AdminTypes.DELETE_SAML_PRIVATE_REQUEST,
        AdminTypes.DELETE_SAML_PRIVATE_SUCCESS,
        AdminTypes.DELETE_SAML_PRIVATE_FAILURE
    );
}

export function removeIdpSamlCertificate(): ActionFunc {
    return bindClientFunc(
        Client4.deleteIdpSamlCertificate,
        AdminTypes.DELETE_SAML_IDP_REQUEST,
        AdminTypes.DELETE_SAML_IDP_SUCCESS,
        AdminTypes.DELETE_SAML_IDP_FAILURE
    );
}

export function testElasticsearch(config: Object): ActionFunc {
    return bindClientFunc(
        Client4.testElasticsearch,
        AdminTypes.TEST_ELASTICSEARCH_REQUEST,
        AdminTypes.TEST_ELASTICSEARCH_SUCCESS,
        AdminTypes.TEST_ELASTICSEARCH_FAILURE,
        config
    );
}

export function purgeElasticsearchIndexes(): ActionFunc {
    return bindClientFunc(
        Client4.purgeElasticsearchIndexes,
        AdminTypes.PURGE_ELASTICSEARCH_INDEXES_REQUEST,
        AdminTypes.PURGE_ELASTICSEARCH_INDEXES_SUCCESS,
        AdminTypes.PURGE_ELASTICSEARCH_INDEXES_FAILURE,
    );
}

export function uploadLicense(fileData: File): ActionFunc {
    return bindClientFunc(
        Client4.uploadLicense,
        AdminTypes.UPLOAD_LICENSE_REQUEST,
        AdminTypes.UPLOAD_LICENSE_SUCCESS,
        AdminTypes.UPLOAD_LICENSE_FAILURE,
        fileData
    );
}

export function removeLicense(): ActionFunc {
    return bindClientFunc(
        Client4.removeLicense,
        AdminTypes.REMOVE_LICENSE_REQUEST,
        AdminTypes.REMOVE_LICENSE_SUCCESS,
        AdminTypes.REMOVE_LICENSE_FAILURE
    );
}

export function getAnalytics(name: string, teamId: string = ''): ActionFunc {
    return async (dispatch, getState) => {
        dispatch({type: AdminTypes.GET_ANALYTICS_REQUEST, data: null}, getState);

        let data;
        try {
            data = await Client4.getAnalytics(name, teamId);
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch, getState);
            dispatch(batchActions([
                {type: AdminTypes.GET_ANALYTICS_FAILURE, error},
                logError(error),
            ]), getState);
            return {error};
        }

        const actions = [{type: AdminTypes.GET_ANALYTICS_SUCCESS, data: null}];
        if (teamId === '') {
            actions.push({type: AdminTypes.RECEIVED_SYSTEM_ANALYTICS, data, name});
        } else {
            actions.push({type: AdminTypes.RECEIVED_TEAM_ANALYTICS, data, name, teamId});
        }

        dispatch(batchActions(actions), getState);

        return {data};
    };
}

export function getStandardAnalytics(teamId: string = ''): ActionFunc {
    return getAnalytics('standard', teamId);
}

export function getAdvancedAnalytics(teamId: string = ''): ActionFunc {
    return getAnalytics('extra_counts', teamId);
}

export function getPostsPerDayAnalytics(teamId: string = ''): ActionFunc {
    return getAnalytics('post_counts_day', teamId);
}

export function getUsersPerDayAnalytics(teamId: string = ''): ActionFunc {
    return getAnalytics('user_counts_with_posts_day', teamId);
}

export function uploadPlugin(fileData: File): ActionFunc {
    return async (dispatch, getState) => {
        dispatch({type: AdminTypes.UPLOAD_PLUGIN_REQUEST, data: null});

        let data;
        try {
            data = await Client4.uploadPlugin(fileData);
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch, getState);
            dispatch(batchActions([
                {type: AdminTypes.UPLOAD_PLUGIN_FAILURE, error},
                logError(error),
            ]));
            return {error};
        }

        dispatch(batchActions([
            {type: AdminTypes.UPLOAD_PLUGIN_SUCCESS, data: null},
            {type: AdminTypes.RECEIVED_PLUGIN, data: {...data, active: false}},
        ]));

        return {data};
    };
}

export function getPlugins(): ActionFunc {
    return bindClientFunc(
        Client4.getPlugins,
        AdminTypes.GET_PLUGIN_REQUEST,
        [AdminTypes.GET_PLUGIN_SUCCESS, AdminTypes.RECEIVED_PLUGINS],
        AdminTypes.GET_PLUGIN_FAILURE,
    );
}

export function getPluginStatuses(): ActionFunc {
    return bindClientFunc(
        Client4.getPluginStatuses,
        AdminTypes.GET_PLUGIN_STATUSES_REQUEST,
        [AdminTypes.GET_PLUGIN_STATUSES_SUCCESS, AdminTypes.RECEIVED_PLUGIN_STATUSES],
        AdminTypes.GET_PLUGIN_STATUSES_FAILURE,
    );
}

export function removePlugin(pluginId: string): ActionFunc {
    return async (dispatch, getState) => {
        dispatch({type: AdminTypes.REMOVE_PLUGIN_REQUEST, data: pluginId});

        try {
            await Client4.removePlugin(pluginId);
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch, getState);
            dispatch(batchActions([
                {type: AdminTypes.REMOVE_PLUGIN_FAILURE, error, data: pluginId},
                logError(error),
            ]));
            return {error};
        }

        dispatch(batchActions([
            {type: AdminTypes.REMOVE_PLUGIN_SUCCESS, data: null},
            {type: AdminTypes.REMOVED_PLUGIN, data: pluginId},
        ]));

        return {data: true};
    };
}
export function enablePlugin(pluginId: string): ActionFunc {
    return async (dispatch, getState) => {
        dispatch({type: AdminTypes.ENABLE_PLUGIN_REQUEST, data: pluginId});

        try {
            await Client4.enablePlugin(pluginId);
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch, getState);
            dispatch(batchActions([
                {type: AdminTypes.ENABLE_PLUGIN_FAILURE, error, data: pluginId},
                logError(error),
            ]));
            return {error};
        }

        dispatch(batchActions([
            {type: AdminTypes.ENABLE_PLUGIN_SUCCESS, data: null},
            {type: AdminTypes.ENABLED_PLUGIN, data: pluginId},
        ]));

        return {data: true};
    };
}

export function disablePlugin(pluginId: string): ActionFunc {
    return async (dispatch, getState) => {
        dispatch({type: AdminTypes.DISABLE_PLUGIN_REQUEST, data: pluginId});

        try {
            await Client4.disablePlugin(pluginId);
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch, getState);
            dispatch(batchActions([
                {type: AdminTypes.DISABLE_PLUGIN_FAILURE, error, data: pluginId},
                logError(error),
            ]));
            return {error};
        }

        dispatch(batchActions([
            {type: AdminTypes.DISABLE_PLUGIN_SUCCESS, data: null},
            {type: AdminTypes.DISABLED_PLUGIN, data: pluginId},
        ]));

        return {data: true};
    };
}
