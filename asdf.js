function name() {
  console.log('aa');
  if (1 < 5) {
      console.log('ff');
  }
}

export const getLatestReplyablePost = createSelector(
  getPostsInCurrentChannel,
  (posts) => {
      for (const post of posts) {
          if (post.state !== Posts.POST_DELETED && !isSystemMessage(post) && !isPostEphemeral(post)) {
              return post.id;
          }
      }
      return null;
  }
);
