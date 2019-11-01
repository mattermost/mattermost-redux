// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import {AlertTypeType} from 'types/alerts';
import {Dictionary} from 'types/utilities';

const alerts: Dictionary<AlertTypeType> =
{
    ALERT_NOTIFICATION: 'notification',
    ALERT_DEVELOPER: 'developer',
    ALERT_ERROR: 'error',
};
export default alerts;
