// Copyright (c) 2016 Mattermost, Inc. All Rights Reserved.
// See License.txt for license information.

import {createSelector} from 'reselect';

export function getAllPosts(state) {
    return state.entities.posts.posts;
}

function getPostIdsInCurrentChannel(state) {
    return state.entities.posts.postsInChannel[state.entities.channels.currentChannelId] || [];
}

export const getPostsInCurrentChannel = createSelector(
    getAllPosts,
    getPostIdsInCurrentChannel,
    (posts, postIds) => {
        return postIds.map((id) => posts[id]);
    }
);

// Returns a function that creates a creates a selector that will get the posts for a given thread.
// That selector will take a props object (containing a channelId field and a rootId field) as its
// only argument and will be memoized based on that argument.
export function makeGetPostsForThread() {
    return createSelector(
        getAllPosts,
        (state, props) => state.entities.posts.postsInChannel[props.channelId],
        (state, props) => props,
        (posts, postIds, {rootId}) => {
            const thread = [];

            for (const id of postIds) {
                const post = posts[id];

                if (id === rootId || post.root_id === rootId) {
                    thread.push(post);
                }
            }

            return thread;
        }
    );
}

export function makeGetCommentCountForPost() {
    return createSelector(
      getAllPosts,
      (state, props) => props,
      (posts, {post: currentPost}) => {
          let count = 0;
          for (const id in posts) {
              if (posts.hasOwnProperty(id)) {
                  const post = posts[id];

                  if (post.root_id === currentPost.id) {
                      count += 1;
                  }
              }
          }

          return count;
      }
    );
}
