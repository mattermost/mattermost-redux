// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
// @flow

export type AdminState = {|
    logs: Array<Object>,
    audits: Object,
    config: Object,
    environmentConfig: Object,
    complianceReports: Object,
    ldapGroups: Object,
    ldapGroupsCount: number
|};
