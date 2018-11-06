// Copyright (c) 2017 Mattermost, Inc. All Rights Reserved.
// See License.txt for license information.

/* eslint-disable */

import register from '@babel/register';
import config from '../babel.config';

global.window = {};

register(config);
