// Copyright (c) 2017 Mattermost, Inc. All Rights Reserved.
// See License.txt for license information.

import fs from 'fs';
import assert from 'assert';
import nock from 'nock';

import * as Actions from 'actions/admin';
import {Client, Client4} from 'client';

import {RequestStatus} from 'constants';
import TestHelper from 'test/test_helper';
import configureStore from 'test/test_store';

const OK_RESPONSE = {status: 'OK'};

describe('Actions.Admin', () => {
    let store;
    before(async () => {
        await TestHelper.initBasic(Client, Client4);
    });

    beforeEach(async () => {
        store = await configureStore();
    });

    after(async () => {
        nock.restore();
        await TestHelper.basicClient.logout();
        await TestHelper.basicClient4.logout();
    });

    it('getLogs', async () => {
        nock(Client4.getBaseRoute()).
            get('/logs').
            query(true).
            reply(200, [
                '[2017/04/04 14:56:19 EDT] [INFO] Starting Server...',
                '[2017/04/04 14:56:19 EDT] [INFO] Server is listening on :8065',
                '[2017/04/04 15:01:48 EDT] [INFO] Stopping Server...',
                '[2017/04/04 15:01:48 EDT] [INFO] Closing SqlStore'
            ]);

        await Actions.getLogs()(store.dispatch, store.getState);

        const state = store.getState();
        const request = state.requests.admin.getLogs;
        if (request.status === RequestStatus.FAILURE) {
            throw new Error('getLogs request failed');
        }

        const logs = state.entities.admin.logs;
        assert.ok(logs);
        assert.ok(logs.length > 0);
    });

    it('getAudits', async () => {
        nock(Client4.getBaseRoute()).
            get('/audits').
            query(true).
            reply(200, [
                {
                    id: 'z6ghakhm5brsub66cjhz9yb9za',
                    create_at: 1491331476323,
                    user_id: 'ua7yqgjiq3dabc46ianp3yfgty',
                    action: '/api/v4/teams/o5pjxhkq8br8fj6xnidt7hm3ja',
                    extra_info: '',
                    ip_address: '127.0.0.1',
                    session_id: 'u3yb6bqe6fg15bu4stzyto8rgh'
                }
            ]);

        await Actions.getAudits()(store.dispatch, store.getState);

        const state = store.getState();
        const request = state.requests.admin.getAudits;
        if (request.status === RequestStatus.FAILURE) {
            throw new Error('getAudits request failed');
        }

        const audits = state.entities.admin.audits;
        assert.ok(audits);
        assert.ok(Object.keys(audits).length > 0);
    });

    it('getConfig', async () => {
        nock(Client4.getBaseRoute()).
            get('/config').
            reply(200, {
                ServiceSettings: {
                    SiteURL: 'http://localhost:8065'
                }
            });

        await Actions.getConfig()(store.dispatch, store.getState);

        const state = store.getState();
        const request = state.requests.admin.getConfig;
        if (request.status === RequestStatus.FAILURE) {
            throw new Error('getConfig request failed');
        }

        const config = state.entities.admin.config;
        assert.ok(config);
        assert.ok(config.ServiceSettings);
        assert.ok(config.ServiceSettings.SiteURL === 'http://localhost:8065');
    });

    it('updateConfig', async () => {
        const updated = {
            ServiceSettings: {
                SiteURL: 'http://localhost:8066'
            }
        };

        nock(Client4.getBaseRoute()).
            put('/config').
            reply(200, updated);

        await Actions.updateConfig(updated)(store.dispatch, store.getState);

        const state = store.getState();
        const request = state.requests.admin.updateConfig;
        if (request.status === RequestStatus.FAILURE) {
            throw new Error('updateConfig request failed');
        }

        const config = state.entities.admin.config;
        assert.ok(config);
        assert.ok(config.ServiceSettings);
        assert.ok(config.ServiceSettings.SiteURL === updated.ServiceSettings.SiteURL);
    });

    it('reloadConfig', async () => {
        nock(Client4.getBaseRoute()).
            post('/config/reload').
            reply(200, OK_RESPONSE);

        await Actions.reloadConfig()(store.dispatch, store.getState);

        const state = store.getState();
        const request = state.requests.admin.reloadConfig;
        if (request.status === RequestStatus.FAILURE) {
            throw new Error('reloadConfig request failed');
        }
    });

    it('testEmail', async () => {
        nock(Client4.getBaseRoute()).
            post('/email/test').
            reply(200, OK_RESPONSE);

        await Actions.testEmail({})(store.dispatch, store.getState);

        const state = store.getState();
        const request = state.requests.admin.testEmail;
        if (request.status === RequestStatus.FAILURE) {
            throw new Error('testEmail request failed');
        }
    });

    it('invalidateCaches', async () => {
        nock(Client4.getBaseRoute()).
            post('/caches/invalidate').
            reply(200, OK_RESPONSE);

        await Actions.invalidateCaches()(store.dispatch, store.getState);

        const state = store.getState();
        const request = state.requests.admin.invalidateCaches;
        if (request.status === RequestStatus.FAILURE) {
            throw new Error('invalidateCaches request failed');
        }
    });

    it('recycleDatabase', async () => {
        nock(Client4.getBaseRoute()).
            post('/database/recycle').
            reply(200, OK_RESPONSE);

        await Actions.recycleDatabase()(store.dispatch, store.getState);

        const state = store.getState();
        const request = state.requests.admin.recycleDatabase;
        if (request.status === RequestStatus.FAILURE) {
            throw new Error('recycleDatabase request failed');
        }
    });

    it('createComplianceReport', async () => {
        const job = {
            desc: 'testjob',
            emails: 'joram@example.com',
            keywords: 'testkeyword',
            start_at: 1457654400000,
            end_at: 1458000000000
        };

        nock(Client4.getBaseRoute()).
            post('/compliance/reports').
            reply(201, {
                id: 'six4h67ja7ntdkek6g13dp3wka',
                create_at: 1491399241953,
                user_id: 'ua7yqgjiq3dabc46ianp3yfgty',
                status: 'running',
                count: 0,
                desc: 'testjob',
                type: 'adhoc',
                start_at: 1457654400000,
                end_at: 1458000000000,
                keywords: 'testkeyword',
                emails: 'joram@example.com'
            });

        const created = await Actions.createComplianceReport(job)(store.dispatch, store.getState);

        const state = store.getState();
        const request = state.requests.admin.createCompliance;
        if (request.status === RequestStatus.FAILURE) {
            throw new Error('createComplianceReport request failed');
        }

        const reports = state.entities.admin.complianceReports;
        assert.ok(reports);
        assert.ok(reports[created.id]);
    });

    it('getComplianceReport', async () => {
        const report = {
            id: 'lix4h67ja7ntdkek6g13dp3wka',
            create_at: 1491399241953,
            user_id: 'ua7yqgjiq3dabc46ianp3yfgty',
            status: 'running',
            count: 0,
            desc: 'testjob',
            type: 'adhoc',
            start_at: 1457654400000,
            end_at: 1458000000000,
            keywords: 'testkeyword',
            emails: 'joram@example.com'
        };

        nock(Client4.getBaseRoute()).
            get(`/compliance/reports/${report.id}`).
            reply(200, report);

        await Actions.getComplianceReport(report.id)(store.dispatch, store.getState);

        const state = store.getState();
        const request = state.requests.admin.getCompliance;
        if (request.status === RequestStatus.FAILURE) {
            throw new Error('getComplianceReport request failed err=' + request.error);
        }

        const reports = state.entities.admin.complianceReports;
        assert.ok(reports);
        assert.ok(reports[report.id]);
    });

    it('getComplianceReports', async () => {
        const report = {
            id: 'aix4h67ja7ntdkek6g13dp3wka',
            create_at: 1491399241953,
            user_id: 'ua7yqgjiq3dabc46ianp3yfgty',
            status: 'running',
            count: 0,
            desc: 'testjob',
            type: 'adhoc',
            start_at: 1457654400000,
            end_at: 1458000000000,
            keywords: 'testkeyword',
            emails: 'joram@example.com'
        };

        nock(Client4.getBaseRoute()).
            get('/compliance/reports').
            query(true).
            reply(200, [report]);

        await Actions.getComplianceReports()(store.dispatch, store.getState);

        const state = store.getState();
        const request = state.requests.admin.getCompliance;
        if (request.status === RequestStatus.FAILURE) {
            throw new Error('getComplianceReports request failed err=' + request.error);
        }

        const reports = state.entities.admin.complianceReports;
        assert.ok(reports);
        assert.ok(reports[report.id]);
    });

    it('uploadBrandImage', async () => {
        const testImageData = fs.createReadStream('test/assets/images/test.png');

        nock(Client4.getBaseRoute()).
            post('/brand/image').
            reply(200, OK_RESPONSE);

        await Actions.uploadBrandImage(testImageData)(store.dispatch, store.getState);

        const state = store.getState();
        const request = state.requests.admin.uploadBrandImage;
        if (request.status === RequestStatus.FAILURE) {
            throw new Error('uploadBrandImage request failed');
        }
    });

    it('getClusterStatus', async () => {
        nock(Client4.getBaseRoute()).
            get('/cluster/status').
            reply(200, [
                {
                    id: 'someid',
                    version: 'someversion'
                }
            ]);

        await Actions.getClusterStatus()(store.dispatch, store.getState);

        const state = store.getState();
        const request = state.requests.admin.getClusterStatus;
        if (request.status === RequestStatus.FAILURE) {
            throw new Error('getClusterStatus request failed');
        }

        const clusterInfo = state.entities.admin.clusterInfo;
        assert.ok(clusterInfo);
        assert.ok(clusterInfo.length === 1);
        assert.ok(clusterInfo[0].id === 'someid');
    });

    it('testLdap', async () => {
        nock(Client4.getBaseRoute()).
            post('/ldap/test').
            reply(200, OK_RESPONSE);

        await Actions.testLdap()(store.dispatch, store.getState);

        const state = store.getState();
        const request = state.requests.admin.testLdap;
        if (request.status === RequestStatus.FAILURE) {
            throw new Error('testLdap request failed err=' + request.error);
        }
    });

    it('syncLdap', async () => {
        nock(Client4.getBaseRoute()).
            post('/ldap/sync').
            reply(200, OK_RESPONSE);

        await Actions.syncLdap()(store.dispatch, store.getState);

        const state = store.getState();
        const request = state.requests.admin.syncLdap;
        if (request.status === RequestStatus.FAILURE) {
            throw new Error('syncLdap request failed err=' + request.error);
        }
    });

    it('getSamlCertificateStatus', async () => {
        nock(Client4.getBaseRoute()).
            get('/saml/certificate/status').
            reply(200, {
                public_certificate_file: true,
                private_key_file: true,
                idp_certificate_file: true
            });

        await Actions.getSamlCertificateStatus()(store.dispatch, store.getState);

        const state = store.getState();
        const request = state.requests.admin.getSamlCertificateStatus;
        if (request.status === RequestStatus.FAILURE) {
            throw new Error('getSamlCertificateStatus request failed err=' + request.error);
        }

        const certStatus = state.entities.admin.samlCertStatus;
        assert.ok(certStatus);
        assert.ok(certStatus.idp_certificate_file);
        assert.ok(certStatus.private_key_file);
        assert.ok(certStatus.public_certificate_file);
    });

    it('uploadPublicSamlCertificate', async () => {
        const testFileData = fs.createReadStream('test/assets/images/test.png');

        nock(Client4.getBaseRoute()).
            post('/saml/certificate/public').
            reply(200, OK_RESPONSE);

        await Actions.uploadPublicSamlCertificate(testFileData)(store.dispatch, store.getState);

        const state = store.getState();
        const request = state.requests.admin.uploadPublicSamlCertificate;
        if (request.status === RequestStatus.FAILURE) {
            throw new Error('uploadPublicSamlCertificate request failed err=' + request.error);
        }
    });

    it('uploadPrivateSamlCertificate', async () => {
        const testFileData = fs.createReadStream('test/assets/images/test.png');

        nock(Client4.getBaseRoute()).
            post('/saml/certificate/private').
            reply(200, OK_RESPONSE);

        await Actions.uploadPrivateSamlCertificate(testFileData)(store.dispatch, store.getState);

        const state = store.getState();
        const request = state.requests.admin.uploadPrivateSamlCertificate;
        if (request.status === RequestStatus.FAILURE) {
            throw new Error('uploadPrivateSamlCertificate request failed err=' + request.error);
        }
    });

    it('uploadIdpSamlCertificate', async () => {
        const testFileData = fs.createReadStream('test/assets/images/test.png');

        nock(Client4.getBaseRoute()).
            post('/saml/certificate/idp').
            reply(200, OK_RESPONSE);

        await Actions.uploadIdpSamlCertificate(testFileData)(store.dispatch, store.getState);

        const state = store.getState();
        const request = state.requests.admin.uploadIdpSamlCertificate;
        if (request.status === RequestStatus.FAILURE) {
            throw new Error('uploadIdpSamlCertificate request failed err=' + request.error);
        }
    });

    it('removePublicSamlCertificate', async () => {
        nock(Client4.getBaseRoute()).
            delete('/saml/certificate/public').
            reply(200, OK_RESPONSE);

        await Actions.removePublicSamlCertificate()(store.dispatch, store.getState);

        const state = store.getState();
        const request = state.requests.admin.removePublicSamlCertificate;
        if (request.status === RequestStatus.FAILURE) {
            throw new Error('removePublicSamlCertificate request failed err=' + request.error);
        }
    });

    it('removePrivateSamlCertificate', async () => {
        nock(Client4.getBaseRoute()).
            delete('/saml/certificate/private').
            reply(200, OK_RESPONSE);

        await Actions.removePrivateSamlCertificate()(store.dispatch, store.getState);

        const state = store.getState();
        const request = state.requests.admin.removePrivateSamlCertificate;
        if (request.status === RequestStatus.FAILURE) {
            throw new Error('removePrivateSamlCertificate request failed err=' + request.error);
        }
    });

    it('removeIdpSamlCertificate', async () => {
        nock(Client4.getBaseRoute()).
            delete('/saml/certificate/idp').
            reply(200, OK_RESPONSE);

        await Actions.removeIdpSamlCertificate()(store.dispatch, store.getState);

        const state = store.getState();
        const request = state.requests.admin.removeIdpSamlCertificate;
        if (request.status === RequestStatus.FAILURE) {
            throw new Error('removeIdpSamlCertificate request failed err=' + request.error);
        }
    });

    it('testElasticsearch', async () => {
        nock(Client4.getBaseRoute()).
        post('/elasticsearch/test').
        reply(200, OK_RESPONSE);

        await Actions.testElasticsearch()(store.dispatch, store.getState);

        const state = store.getState();
        const request = state.requests.admin.testElasticsearch;
        if (request.status === RequestStatus.FAILURE) {
            throw new Error('testElasticsearch request failed err=' + request.error);
        }
    });
});
