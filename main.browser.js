require('babel-polyfill');
const Client4 = require('./client/client4.js').default;
const client = new Client4;
const wsClient = require('./client/websocket_client.js').default;

window.MatterMostClient = client;
window.MatterMostWebSocketClient = wsClient;
