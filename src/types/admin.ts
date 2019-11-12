// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
export type AdminState = {
    logs: Array<any>;
    audits: any;
    config: any;
    environmentConfig: any;
    complianceReports: any;
    ldapGroups: any;
    ldapGroupsCount: number;
    userAccessTokens: any[];
    clusterInfo: any;
};
