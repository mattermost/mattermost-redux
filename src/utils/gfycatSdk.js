// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import Gfycat from './gfycat-sdk.umd.bundle.min';

let activeKey = null;
let activeSecret = null;
let instance = null;

export default function(key, secret) {
    let currentKey = key;
    let currentSecret = secret;

    if (!key || !secret) {
        currentKey = '2_KtH_W5';
        currentSecret = '3wLVZPiswc3DnaiaFoLkDvB4X0IV6CpMkj4tf2inJRsBY6-FnkT08zGmppWFgeof';
    }

    if (instance && activeKey === currentKey && activeSecret === currentSecret) {
        return instance;
    }

    activeKey = currentKey;
    activeSecret = currentSecret;
    instance = new Gfycat({client_id: activeKey, client_secret: activeSecret});
    return instance;
}
