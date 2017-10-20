// Copyright (c) 2017-present Mattermost, Inc. All Rights Reserved.
// See License.txt for license information.

import keyMirror from 'utils/key_mirror';

export default keyMirror({
    SEARCH_POSTS_REQUEST: null,
    SEARCH_POSTS_SUCCESS: null,
    SEARCH_POSTS_FAILURE: null,

    /*
     * The same action as `Constants.ActionTypes.RECEIVE_SEARCH`
     */
    RECEIVED_SEARCH: null,
    RECEIVED_PINNED_POSTS: null,
    RECEIVED_FLAGGED_POSTS: null,
    RECEIVED_SEARCH_POSTS: null,
    RECEIVED_SEARCH_TERM: null,
    REMOVE_SEARCH_POSTS: null,
    REMOVE_SEARCH_TERM: null
});
