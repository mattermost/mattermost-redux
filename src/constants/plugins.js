// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
// @flow

export default {
    PLUGIN_STATE_NOT_RUNNING: 0,
    PLUGIN_STATE_STARTING: 1,
    PLUGIN_STATE_RUNNING: 2,
    PLUGIN_STATE_FAILED_TO_START: 3,
    PLUGIN_STATE_FAILED_TO_STAY_RUNNING: 4,
    PLUGIN_STATE_STOPPING: 5,
    PREPACKAGED_PLUGINS: ['zoom', 'jira', 'mattermost-autolink', 'com.mattermost.nps', 'com.mattermost.custom-attributes', 'github', 'com.mattermost.welcomebot', 'com.mattermost.aws-sns'],
};
