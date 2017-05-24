# Mattermost Redux (unreleased)

**Supported Server Versions:** Master (no released versions are currently supported) 

This is an unreleased project for replacing the current implementation of the store with Redux. The project is not yet stable, and the instructions are for internal use currently (i.e. probably out-of-date until we stablize).

We'll post updates to our [Forums](http://forum.mattermost.org/) and [Twitter](https://twitter.com/mattermosthq) when we're ready to bring in more community contributors.

Mattermost is an open source Slack-alternative used by thousands of companies around the world in 11 languages. Learn more at https://mattermost.com.

# How to Contribute

### Contribute Code

If you're contributing to help [migrate the webapp to Redux](https://docs.mattermost.com/developer/webapp-to-redux.html) go ahead and submit your PR. If you're just fixing a small bug or adding a small improvement then feel free to submit a PR for it. For everything else, please either work on an issue labeled `[Help Wanted]` or open an issue if there's something else that you'd like to work on.

Feel free to drop by [the Redux channel](https://pre-release.mattermost.com/core/channels/redux) on our Mattermost instance.

### Running the Tests

To run the tests you need to have a Mattermost server running locally on port 8065 with "EnableOpenServer", "EnableCustomEmoji" and "EnableLinkPreviews" set to `true` in your config.json.

With that set up, you can run the tests with `make test`.
