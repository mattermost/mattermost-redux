# Mattermost Redux (unreleased)

**Supported Server Versions:** Master (no released versions are currently supported) 

This is an unreleased project for replacing the current implementation of the store with Redux. The project is not yet stable, and the instructions are for internal use currently (i.e. probably out-of-date until we stablize).

We'll post updates to our [Forums](http://forum.mattermost.org/) and [Twitter](https://twitter.com/mattermosthq) when we're ready to bring in more community contributors.

Mattermost is an open source Slack-alternative used by thousands of companies around the world in 11 languages. Learn more at https://mattermost.com.

# How to Contribute

### Contribute Code

We're not quite ready to accept external contributions yet - when things are ready, issues with a [Help Wanted] title will be posted in the [GitHub Issues section](https://github.com/mattermost/mattermost-mobile/issues).

### Running the Tests

To run the tests you need to have a Mattermost server running locally on port 8065 with "EnableOpenServer", "EnableCustomEmoji" and "EnableLinkPreviews" set to `true` in your config.json.

With that set up, you can run the tests with `make test`.
