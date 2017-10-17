# Mattermost Redux (beta)

**Supported Server Versions:** Latest

The project is in beta, with the purpose of consolidating the storage, web utilities and logic of the webapp and React Native mobile clients into a single driver. We encourage you to use mattermost-redux to power your own Mattermost clients or integrations.

[Redux](http://redux.js.org/docs/introduction/) is the backbone for this project and many of the design decisions and patterns stem from it.

Mattermost is an open source Slack-alternative used by thousands of companies around the world in more than 12 languages. Learn more at https://mattermost.com.

# Usage

### Basic Usage

To hook up your application to the mattermost-redux store:

```
import configureServiceStore from 'mattermost-redux/store';

configureServiceStore(yourInitialState, yourAppReducers, yourOfflineOptions);

const store = configureStore();

// use store
```

* `yourInitialState` - any initial state for any extra reducers you may have (set to `{}` if none)
* `yourAppReducers` - any reducers from your app (set to `{}` if none)
* `yourOfflineOptions` - any offline options, specified using [this redux-offline configuration object](https://github.com/jevakallio/redux-offline#configuration-object)

### Web Client Usage

If you're only looking to use the v4 JavaScript web client for the Mattermost server:

With async/await:
```
import {Client4} from 'mattermost-redux/client';

Client4.setUrl('https://your-mattermost-url.com');

async function loginAndGetUser(username, password) {
    try {
        await Client4.login(username, password);
    } catch (error) {
        console.error(error);
        return null;
    }

    let user;
    try {
        user = await Client4.getMe();
    } catch (error) {
        console.error(error);
        return null;
    }

    return user;
}

```

With promises:
```
import {Client4} from 'mattermost-redux/client';

Client4.setUrl('https://your-mattermost-url.com');

function loginAndGetUser(username, password, callback) {
    Client4.login(username, password).then(
        () => {
            Client4.getMe().then(
                (data) => {
                    callback(data);
                }
            ).catch(
                (error) => {
                    console.error(error);
                }
            );
        }
    ).catch(
        (error) => {
            console.error(error);
        }
    );
}
```

If you already have a [personal access token](https://docs.mattermost.com/guides/developer/personal-access-tokens.html) or session token, you can set the token manually instead of logging in:

```
import {Client4} from 'mattermost-redux/client';

Client4.setUrl('https://your-mattermost-url.com');
Client4.setToken(yourToken);
```

### node.js Usage

Running the client from node.js requires making the `fetch` and `WebSocket` packages globally available, and the use of `babel-polyfill`:

```
require('babel-polyfill');
require('isomorphic-fetch');
if (!global.WebSocket) {
    global.WebSocket = require('ws');
}
const Client4 = require('./client/client4.js').default;
const client = new Client4;
const wsClient = require('./client/websocket_client.js').default;
var token;

wsClient.setEventCallback(function(event){
    console.log(event);
});

client.setUrl('https://your-mattermost-url.com');
client.login(username, password)
.then(function(me){
    console.log(`logged in as ${me.email}`);
    token = client.getToken();
})
.then(function(){
    wsClient.initialize(token, {}, {}, {connectionUrl: 'wss://your-mattermost-url.com/api/v4/websocket'});
})
.catch(function(err){
    console.error(err);
});
```

# Features for Stable Release

* Improved return pattern for actions, always return both data and error
* Error reporting for optimistic actions
* Better documentation

### Future Features

* Full server mocking for unit tests (including WebSocket mocking)
* Offline support with automatic update polling (needs server work)

# How to Contribute

### Contribute Code

If you're contributing to help [migrate the webapp to Redux](https://docs.mattermost.com/developer/webapp-to-redux.html) go ahead and submit your PR. If you're just fixing a small bug or adding a small improvement then feel free to submit a PR for it. For everything else, please either work on an issue labeled `[Help Wanted]` or open an issue if there's something else that you'd like to work on.

Feel free to drop by [the Redux channel](https://pre-release.mattermost.com/core/channels/redux) on our Mattermost instance.

### Running the Tests

To run the tests you need to have a Mattermost server running locally on port 8065 with "EnableOpenServer", "EnableCustomEmoji", "EnableLinkPreviews" and "EnableOAuthServiceProvider" set to `true` and with "EnableOnlyAdminIntegrations" set to `false` in your config/config.json (copy default.json to config.json first if none exists).

With that set up, you can run the tests with `make test`.
