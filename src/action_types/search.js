// Copyright (c) 2017-present Mattermost, Inc. All Rights Reserved.
// See License.txt for license information.
// @flow

import keyMirror from 'utils/key_mirror';

export default keyMirror({
    SEARCH_POSTS_REQUEST: null,
    SEARCH_POSTS_SUCCESS: null,
    SEARCH_POSTS_FAILURE: null,

    SEARCH_FLAGGED_POSTS_REQUEST: null,
    SEARCH_FLAGGED_POSTS_SUCCESS: null,
    SEARCH_FLAGGED_POSTS_FAILURE: null,

    SEARCH_RECENT_MENTIONS_REQUEST: null,
    SEARCH_RECENT_MENTIONS_SUCCESS: null,
    SEARCH_RECENT_MENTIONS_FAILURE: null,

    RECEIVED_SEARCH_POSTS: null,
    RECEIVED_SEARCH_FLAGGED_POSTS: null,
    RECEIVED_SEARCH_TERM: null,
    REMOVE_SEARCH_POSTS: null,
    REMOVE_SEARCH_TERM: null,
});
