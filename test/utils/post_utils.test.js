// Copyright (c) 2017-present Mattermost, Inc. All Rights Reserved.
// See License.txt for license information.

import assert from 'assert';

import {PostTypes} from 'constants/posts';

import {shouldFilterPost} from 'utils/post_utils';

describe('PostUtils', () => {
    describe('shouldFilterPost', () => {
        it('show join/leave posts', () => {
            const options = {showJoinLeave: true};

            assert.equal(shouldFilterPost({type: ''}, options), false);
            assert.equal(shouldFilterPost({type: PostTypes.CHANNEL_DELETED}, options), false);
            assert.equal(shouldFilterPost({type: PostTypes.DISPLAYNAME_CHANGE}, options), false);
            assert.equal(shouldFilterPost({type: PostTypes.EPHEMERAL}, options), false);
            assert.equal(shouldFilterPost({type: PostTypes.HEADER_CHANGE}, options), false);
            assert.equal(shouldFilterPost({type: PostTypes.PURPOSE_CHANGE}, options), false);

            assert.equal(shouldFilterPost({type: PostTypes.JOIN_LEAVE}, options), false);
            assert.equal(shouldFilterPost({type: PostTypes.JOIN_CHANNEL}, options), false);
            assert.equal(shouldFilterPost({type: PostTypes.LEAVE_CHANNEL}, options), false);
            assert.equal(shouldFilterPost({type: PostTypes.ADD_REMOVE}, options), false);
            assert.equal(shouldFilterPost({type: PostTypes.ADD_TO_CHANNEL}, options), false);
            assert.equal(shouldFilterPost({type: PostTypes.REMOVE_FROM_CHANNEL}, options), false);

            assert.equal(shouldFilterPost({type: PostTypes.JOIN_TEAM}, options), false);
            assert.equal(shouldFilterPost({type: PostTypes.LEAVE_TEAM}, options), false);
            assert.equal(shouldFilterPost({type: PostTypes.ADD_TO_TEAM}, options), false);
            assert.equal(shouldFilterPost({type: PostTypes.REMOVE_FROM_TEAM}, options), false);
        });

        it('show join/leave posts', () => {
            const options = {showJoinLeave: false};

            assert.equal(shouldFilterPost({type: ''}, options), false);
            assert.equal(shouldFilterPost({type: PostTypes.CHANNEL_DELETED}, options), false);
            assert.equal(shouldFilterPost({type: PostTypes.DISPLAYNAME_CHANGE}, options), false);
            assert.equal(shouldFilterPost({type: PostTypes.EPHEMERAL}, options), false);
            assert.equal(shouldFilterPost({type: PostTypes.HEADER_CHANGE}, options), false);
            assert.equal(shouldFilterPost({type: PostTypes.PURPOSE_CHANGE}, options), false);

            assert.equal(shouldFilterPost({type: PostTypes.JOIN_LEAVE}, options), true);
            assert.equal(shouldFilterPost({type: PostTypes.JOIN_CHANNEL}, options), true);
            assert.equal(shouldFilterPost({type: PostTypes.LEAVE_CHANNEL}, options), true);
            assert.equal(shouldFilterPost({type: PostTypes.ADD_REMOVE}, options), true);
            assert.equal(shouldFilterPost({type: PostTypes.ADD_TO_CHANNEL}, options), true);
            assert.equal(shouldFilterPost({type: PostTypes.REMOVE_FROM_CHANNEL}, options), true);

            assert.equal(shouldFilterPost({type: PostTypes.JOIN_TEAM}, options), true);
            assert.equal(shouldFilterPost({type: PostTypes.LEAVE_TEAM}, options), true);
            assert.equal(shouldFilterPost({type: PostTypes.ADD_TO_TEAM}, options), true);
            assert.equal(shouldFilterPost({type: PostTypes.REMOVE_FROM_TEAM}, options), true);
        });
    });
});
