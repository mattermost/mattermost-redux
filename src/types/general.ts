// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {ClientConfig, ClientLicense, WarnMetricStatus} from './config';

import {Dictionary} from './utilities';

export type GeneralState = {
    appState: boolean;
    credentials: any;
    config: Partial<ClientConfig>;
    dataRetentionPolicy: any;
    deviceToken: string;
    license: ClientLicense;
    serverVersion: string;
    timezones: string[];
    warnMetricsStatus: Dictionary<WarnMetricStatus>;
    firstAdminVisitMarketplaceStatus: boolean;
};

export type SystemSetting = {
    name: string;
    value: string;
 };