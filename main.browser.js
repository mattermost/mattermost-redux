require('babel-polyfill');
import {Client4} from './client/client4.js';
import {WebSocketClient} from './client/websocket_client.js';
const client = new Client4();

window.MattermostClient = client;
window.MattermostWebSocketClient = WebSocketClient;
