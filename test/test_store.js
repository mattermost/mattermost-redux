// Copyright (c) 2017 Mattermost, Inc. All Rights Reserved.
// See License.txt for license information.
import {AsyncNodeStorage} from 'redux-persist-node-storage';
import {createTransform, persistStore} from 'redux-persist';

import configureStore from 'store';

export default async function testConfigureStore() {
    const storageTransform = createTransform(
      () => ({}),
      () => ({})
    );

    const offlineConfig = {
        detectNetwork: () => true,
        persist: (store, options) => {
            return persistStore(store, {storage: new AsyncNodeStorage('./.tmp'), ...options});
        },
        persistOptions: {
            debounce: 1000,
            transforms: [
                storageTransform
            ]
        }
    };

    const store = configureStore(undefined, {}, offlineConfig, () => ({}));

    const wait = () => new Promise((resolve) => setTimeout(resolve), 300); //eslint-disable-line
    await wait();

    return store;
}
