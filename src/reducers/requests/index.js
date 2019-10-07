// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {combineReducers} from 'redux';

import channels from './channels';
import files from './files';
import general from './general';
import posts from './posts';
import teams from './teams';
import users from './users';
import preferences from './preferences';
import integrations from './integrations';
import admin from './admin';
import jobs from './jobs';
import search from './search';
import roles from './roles';
import schemes from './schemes';
import groups from './groups';

export default combineReducers({
    channels,
    files,
    general,
    posts,
    teams,
    users,
    preferences,
    integrations,
    admin,
    jobs,
    search,
    roles,
    schemes,
    groups,
});
