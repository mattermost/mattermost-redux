// Copyright (c) 2017-present Mattermost, Inc. All Rights Reserved.
// See License.txt for license information.

import ClientClass from './client.js';
import ClientClass4 from './client4.js';
import WebSocketClient from './websocket_client.js';

const Client = new ClientClass();
const Client4 = new ClientClass4();

export {
    Client,
    Client4,
    WebSocketClient
};
