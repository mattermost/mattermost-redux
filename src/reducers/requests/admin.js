// Copyright (c) 2017-present Mattermost, Inc. All Rights Reserved.
// See License.txt for license information.

import {combineReducers} from 'redux';
import {AdminTypes} from 'action_types';

import {handleRequest, initialRequestState} from './helpers';

function getLogs(state = initialRequestState(), action) {
    return handleRequest(
        AdminTypes.GET_LOGS_REQUEST,
        AdminTypes.GET_LOGS_SUCCESS,
        AdminTypes.GET_LOGS_FAILURE,
        state,
        action
    );
}

function getAudits(state = initialRequestState(), action) {
    return handleRequest(
        AdminTypes.GET_AUDITS_REQUEST,
        AdminTypes.GET_AUDITS_SUCCESS,
        AdminTypes.GET_AUDITS_FAILURE,
        state,
        action
    );
}

function getConfig(state = initialRequestState(), action) {
    return handleRequest(
        AdminTypes.GET_CONFIG_REQUEST,
        AdminTypes.GET_CONFIG_SUCCESS,
        AdminTypes.GET_CONFIG_FAILURE,
        state,
        action
    );
}

function updateConfig(state = initialRequestState(), action) {
    return handleRequest(
        AdminTypes.UPDATE_CONFIG_REQUEST,
        AdminTypes.UPDATE_CONFIG_SUCCESS,
        AdminTypes.UPDATE_CONFIG_FAILURE,
        state,
        action
    );
}

function reloadConfig(state = initialRequestState(), action) {
    return handleRequest(
        AdminTypes.RELOAD_CONFIG_REQUEST,
        AdminTypes.RELOAD_CONFIG_SUCCESS,
        AdminTypes.RELOAD_CONFIG_FAILURE,
        state,
        action
    );
}

function testEmail(state = initialRequestState(), action) {
    return handleRequest(
        AdminTypes.TEST_EMAIL_REQUEST,
        AdminTypes.TEST_EMAIL_SUCCESS,
        AdminTypes.TEST_EMAIL_FAILURE,
        state,
        action
    );
}

function testS3Connection(state = initialRequestState(), action) {
    return handleRequest(
        AdminTypes.TEST_S3_REQUEST,
        AdminTypes.TEST_S3_SUCCESS,
        AdminTypes.TEST_S3_FAILURE,
        state,
        action
    );
}

function invalidateCaches(state = initialRequestState(), action) {
    return handleRequest(
        AdminTypes.INVALIDATE_CACHES_REQUEST,
        AdminTypes.INVALIDATE_CACHES_SUCCESS,
        AdminTypes.INVALIDATE_CACHES_FAILURE,
        state,
        action
    );
}

function recycleDatabase(state = initialRequestState(), action) {
    return handleRequest(
        AdminTypes.RECYCLE_DATABASE_REQUEST,
        AdminTypes.RECYCLE_DATABASE_SUCCESS,
        AdminTypes.RECYCLE_DATABASE_FAILURE,
        state,
        action
    );
}

function createCompliance(state = initialRequestState(), action) {
    return handleRequest(
        AdminTypes.CREATE_COMPLIANCE_REQUEST,
        AdminTypes.CREATE_COMPLIANCE_SUCCESS,
        AdminTypes.CREATE_COMPLIANCE_FAILURE,
        state,
        action
    );
}

function getCompliance(state = initialRequestState(), action) {
    return handleRequest(
        AdminTypes.GET_COMPLIANCE_REQUEST,
        AdminTypes.GET_COMPLIANCE_SUCCESS,
        AdminTypes.GET_COMPLIANCE_FAILURE,
        state,
        action
    );
}

function uploadBrandImage(state = initialRequestState(), action) {
    return handleRequest(
        AdminTypes.UPLOAD_BRAND_IMAGE_REQUEST,
        AdminTypes.UPLOAD_BRAND_IMAGE_SUCCESS,
        AdminTypes.UPLOAD_BRAND_IMAGE_FAILURE,
        state,
        action
    );
}

function getClusterStatus(state = initialRequestState(), action) {
    return handleRequest(
        AdminTypes.GET_CLUSTER_STATUS_REQUEST,
        AdminTypes.GET_CLUSTER_STATUS_SUCCESS,
        AdminTypes.GET_CLUSTER_STATUS_FAILURE,
        state,
        action
    );
}

function testLdap(state = initialRequestState(), action) {
    return handleRequest(
        AdminTypes.TEST_LDAP_REQUEST,
        AdminTypes.TEST_LDAP_SUCCESS,
        AdminTypes.TEST_LDAP_FAILURE,
        state,
        action
    );
}

function syncLdap(state = initialRequestState(), action) {
    return handleRequest(
        AdminTypes.SYNC_LDAP_REQUEST,
        AdminTypes.SYNC_LDAP_SUCCESS,
        AdminTypes.SYNC_LDAP_FAILURE,
        state,
        action
    );
}

function getSamlCertificateStatus(state = initialRequestState(), action) {
    return handleRequest(
        AdminTypes.SAML_CERT_STATUS_REQUEST,
        AdminTypes.SAML_CERT_STATUS_SUCCESS,
        AdminTypes.SAML_CERT_STATUS_FAILURE,
        state,
        action
    );
}

function uploadPublicSamlCertificate(state = initialRequestState(), action) {
    return handleRequest(
        AdminTypes.UPLOAD_SAML_PUBLIC_REQUEST,
        AdminTypes.UPLOAD_SAML_PUBLIC_SUCCESS,
        AdminTypes.UPLOAD_SAML_PUBLIC_FAILURE,
        state,
        action
    );
}

function uploadPrivateSamlCertificate(state = initialRequestState(), action) {
    return handleRequest(
        AdminTypes.UPLOAD_SAML_PRIVATE_REQUEST,
        AdminTypes.UPLOAD_SAML_PRIVATE_SUCCESS,
        AdminTypes.UPLOAD_SAML_PRIVATE_FAILURE,
        state,
        action
    );
}

function uploadIdpSamlCertificate(state = initialRequestState(), action) {
    return handleRequest(
        AdminTypes.UPLOAD_SAML_IDP_REQUEST,
        AdminTypes.UPLOAD_SAML_IDP_SUCCESS,
        AdminTypes.UPLOAD_SAML_IDP_FAILURE,
        state,
        action
    );
}

function removePublicSamlCertificate(state = initialRequestState(), action) {
    return handleRequest(
        AdminTypes.DELETE_SAML_PUBLIC_REQUEST,
        AdminTypes.DELETE_SAML_PUBLIC_SUCCESS,
        AdminTypes.DELETE_SAML_PUBLIC_FAILURE,
        state,
        action
    );
}

function removePrivateSamlCertificate(state = initialRequestState(), action) {
    return handleRequest(
        AdminTypes.DELETE_SAML_PRIVATE_REQUEST,
        AdminTypes.DELETE_SAML_PRIVATE_SUCCESS,
        AdminTypes.DELETE_SAML_PRIVATE_FAILURE,
        state,
        action
    );
}

function removeIdpSamlCertificate(state = initialRequestState(), action) {
    return handleRequest(
        AdminTypes.DELETE_SAML_IDP_REQUEST,
        AdminTypes.DELETE_SAML_IDP_SUCCESS,
        AdminTypes.DELETE_SAML_IDP_FAILURE,
        state,
        action
    );
}

function testElasticsearch(state = initialRequestState(), action) {
    return handleRequest(
        AdminTypes.TEST_ELASTICSEARCH_REQUEST,
        AdminTypes.TEST_ELASTICSEARCH_SUCCESS,
        AdminTypes.TEST_ELASTICSEARCH_FAILURE,
        state,
        action
    );
}

function purgeElasticsearchIndexes(state = initialRequestState(), action) {
    return handleRequest(
        AdminTypes.PURGE_ELASTICSEARCH_INDEXES_REQUEST,
        AdminTypes.PURGE_ELASTICSEARCH_INDEXES_SUCCESS,
        AdminTypes.PURGE_ELASTICSEARCH_INDEXES_FAILURE,
        state,
        action
    );
}

function uploadLicense(state = initialRequestState(), action) {
    return handleRequest(
        AdminTypes.UPLOAD_LICENSE_REQUEST,
        AdminTypes.UPLOAD_LICENSE_SUCCESS,
        AdminTypes.UPLOAD_LICENSE_FAILURE,
        state,
        action
    );
}

function removeLicense(state = initialRequestState(), action) {
    return handleRequest(
        AdminTypes.REMOVE_LICENSE_REQUEST,
        AdminTypes.REMOVE_LICENSE_SUCCESS,
        AdminTypes.REMOVE_LICENSE_FAILURE,
        state,
        action
    );
}

function getAnalytics(state = initialRequestState(), action) {
    return handleRequest(
        AdminTypes.GET_ANALYTICS_REQUEST,
        AdminTypes.GET_ANALYTICS_SUCCESS,
        AdminTypes.GET_ANALYTICS_FAILURE,
        state,
        action
    );
}

function uploadPlugin(state = initialRequestState(), action) {
    return handleRequest(
        AdminTypes.UPLOAD_PLUGIN_REQUEST,
        AdminTypes.UPLOAD_PLUGIN_SUCCESS,
        AdminTypes.UPLOAD_PLUGIN_FAILURE,
        state,
        action
    );
}

function getPlugins(state = initialRequestState(), action) {
    return handleRequest(
        AdminTypes.GET_PLUGIN_REQUEST,
        AdminTypes.GET_PLUGIN_SUCCESS,
        AdminTypes.GET_PLUGIN_FAILURE,
        state,
        action
    );
}

function removePlugin(state = initialRequestState(), action) {
    return handleRequest(
        AdminTypes.REMOVE_PLUGIN_REQUEST,
        AdminTypes.REMOVE_PLUGIN_SUCCESS,
        AdminTypes.REMOVE_PLUGIN_FAILURE,
        state,
        action
    );
}

function activatePlugin(state = initialRequestState(), action) {
    return handleRequest(
        AdminTypes.ACTIVATE_PLUGIN_REQUEST,
        AdminTypes.ACTIVATE_PLUGIN_SUCCESS,
        AdminTypes.ACTIVATE_PLUGIN_FAILURE,
        state,
        action
    );
}

function deactivatePlugin(state = initialRequestState(), action) {
    return handleRequest(
        AdminTypes.DEACTIVATE_PLUGIN_REQUEST,
        AdminTypes.DEACTIVATE_PLUGIN_SUCCESS,
        AdminTypes.DEACTIVATE_PLUGIN_FAILURE,
        state,
        action
    );
}

export default combineReducers({
    getLogs,
    getAudits,
    getConfig,
    updateConfig,
    reloadConfig,
    testEmail,
    testS3Connection,
    invalidateCaches,
    recycleDatabase,
    createCompliance,
    getCompliance,
    uploadBrandImage,
    getClusterStatus,
    testLdap,
    syncLdap,
    getSamlCertificateStatus,
    uploadPublicSamlCertificate,
    uploadPrivateSamlCertificate,
    uploadIdpSamlCertificate,
    removePublicSamlCertificate,
    removePrivateSamlCertificate,
    removeIdpSamlCertificate,
    testElasticsearch,
    purgeElasticsearchIndexes,
    uploadLicense,
    removeLicense,
    getAnalytics,
    uploadPlugin,
    getPlugins,
    removePlugin,
    activatePlugin,
    deactivatePlugin,
});

