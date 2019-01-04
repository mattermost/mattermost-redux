// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
// @flow

import type {Config} from './general';

export type AdminState = {|
    logs: Array<Object>,
    audits: Object,
    config: ?Config,
    environmentConfig: ?Config,
    complianceReports: Object
|};
