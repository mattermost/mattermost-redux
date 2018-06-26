// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import Gfycat from './gfycat-sdk.umd.bundle.min';

let instance = null;

export default function(key, secret) {
    if (!instance) {
        instance = new Gfycat({client_id: key, client_secret: secret});
    }
    return instance;
}
