// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {combineReducers} from 'redux';

import channels from './channels';
import general from './general';
import users from './users';
import teams from './teams';
import posts from './posts';
import files from './files';
import preferences from './preferences';
import typing from './typing';
import integrations from './integrations';
import emojis from './emojis';
import admin from './admin';
import alerts from './alerts';
import jobs from './jobs';
import search from './search';
import roles from './roles';
import schemes from './schemes';

export default combineReducers({
    general,
    users,
    teams,
    channels,
    posts,
    files,
    preferences,
    typing,
    integrations,
    emojis,
    admin,
    alerts,
    jobs,
    search,
    roles,
    schemes,
});
