// Copyright (c) 2017 Mattermost, Inc. All Rights Reserved.
// See License.txt for license information.

/* eslint-disable */

import fs from 'fs';
import path from 'path';
import register from 'babel-core/register';

const rcPath = path.join(__dirname, '..', '.babelrc');
const source = fs.readFileSync(rcPath).toString();
const config = JSON.parse(source);

global.window = {};

register(config);
