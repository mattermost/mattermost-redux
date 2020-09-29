// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import {CloudTypes} from 'action_types';
import {Client4} from 'client';

import {ActionFunc} from 'types/actions';

import {bindClientFunc} from './helpers';

export function getCloudCustomer(): ActionFunc {
    return bindClientFunc({
        clientFunc: Client4.getCloudCustomer,
        onSuccess: [CloudTypes.RECEIVED_CLOUD_CUSTOMER],
    });
}
