// Copyright (c) 2016-present Mattermost, Inc. All Rights Reserved.
// See License.txt for license information.

import {combineReducers} from 'redux';

import channels from './channels';
import files from './files';
import general from './general';
import posts from './posts';
import teams from './teams';
import users from './users';
import preferences from './preferences';
import integrations from './integrations';
import emojis from './emojis';
import admin from './admin';
import jobs from './jobs';

export default combineReducers({
    channels,
    files,
    general,
    posts,
    teams,
    users,
    preferences,
    integrations,
    emojis,
    admin,
    jobs
});
