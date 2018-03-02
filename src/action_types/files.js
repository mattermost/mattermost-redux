// Copyright (c) 2017-present Mattermost, Inc. All Rights Reserved.
// See License.txt for license information.

import keyMirror from 'utils/key_mirror';

export default keyMirror({
    FETCH_FILES_FOR_POST_REQUEST: null,
    FETCH_FILES_FOR_POST_SUCCESS: null,
    FETCH_FILES_FOR_POST_FAILURE: null,

    UPLOAD_FILES_REQUEST: null,
    UPLOAD_FILES_SUCCESS: null,
    UPLOAD_FILES_FAILURE: null,
    UPLOAD_FILES_CANCEL: null,

    GET_FILE_PUBLIC_LINK_REQUEST: null,
    GET_FILE_PUBLIC_LINK_SUCCESS: null,
    GET_FILE_PUBLIC_LINK_FAILURE: null,

    RECEIVED_FILES_FOR_POST: null,
    RECEIVED_UPLOAD_FILES: null,
    RECEIVED_FILE_PUBLIC_LINK: null,
});
