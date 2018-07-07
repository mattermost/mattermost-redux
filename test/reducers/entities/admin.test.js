// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import assert from 'assert';

import {AdminTypes, UserTypes} from 'action_types';
import reducer from 'reducers/entities/admin';
import PluginState from 'constants/plugins';

describe('reducers.entities.admin', () => {
    describe('pluginStatuses', () => {
        it('initial state', () => {
            const state = {};
            const action = {};
            const expectedState = {};

            const actualState = reducer({pluginStatuses: state}, action);
            assert.deepEqual(actualState.pluginStatuses, expectedState);
        });

        it('RECEIVED_PLUGIN_STATUSES, empty initial state', () => {
            const state = {};
            const action = {
                type: AdminTypes.RECEIVED_PLUGIN_STATUSES,
                data: [
                    {
                        plugin_id: 'plugin_0',
                        cluster_id: 'cluster_id_1',
                        version: '0.1.0',
                        state: PluginState.PLUGIN_STATE_NOT_RUNNING,
                        name: 'Plugin 0',
                        description: 'The plugin 0.',
                        is_prepackaged: false,
                    },
                    {
                        plugin_id: 'plugin_1',
                        cluster_id: 'cluster_id_1',
                        version: '0.0.1',
                        state: PluginState.PLUGIN_STATE_NOT_RUNNING,
                        name: 'Plugin 1',
                        description: 'The plugin.',
                        is_prepackaged: false,
                    },
                    {
                        plugin_id: 'plugin_1',
                        cluster_id: 'cluster_id_2',
                        version: '0.0.2',
                        state: PluginState.PLUGIN_STATE_RUNNING,
                        name: 'Plugin 1',
                        description: 'The plugin, different description.',
                        is_prepackaged: false,
                    },
                ],
            };
            const expectedState = {
                plugin_0: {
                    id: 'plugin_0',
                    version: '0.1.0',
                    state: PluginState.PLUGIN_STATE_NOT_RUNNING,
                    name: 'Plugin 0',
                    description: 'The plugin 0.',
                    is_prepackaged: false,
                    active: false,
                    instances: [
                        {
                            cluster_id: 'cluster_id_1',
                            state: PluginState.PLUGIN_STATE_NOT_RUNNING,
                            version: '0.1.0',
                        },
                    ],
                },
                plugin_1: {
                    id: 'plugin_1',
                    version: '0.0.1',
                    state: PluginState.PLUGIN_STATE_RUNNING,
                    name: 'Plugin 1',
                    description: 'The plugin.',
                    is_prepackaged: false,
                    active: true,
                    instances: [
                        {
                            cluster_id: 'cluster_id_1',
                            state: PluginState.PLUGIN_STATE_NOT_RUNNING,
                            version: '0.0.1',
                        },
                        {
                            cluster_id: 'cluster_id_2',
                            state: PluginState.PLUGIN_STATE_RUNNING,
                            version: '0.0.2',
                        },
                    ],
                },
            };

            const actualState = reducer({pluginStatuses: state}, action);
            assert.deepEqual(actualState.pluginStatuses, expectedState);
        });

        it('RECEIVED_PLUGIN_STATUSES, previously populated state', () => {
            const state = {
                plugin_0: {
                    id: 'plugin_0',
                    version: '0.1.0-old',
                    state: PluginState.PLUGIN_STATE_NOT_RUNNING,
                    name: 'Plugin 0 - old',
                    description: 'The plugin 0 - old.',
                    is_prepackaged: true,
                    active: false,
                    instances: [
                        {
                            cluster_id: 'cluster_id_1',
                            state: PluginState.PLUGIN_STATE_NOT_RUNNING,
                            version: '0.1.0',
                        },
                    ],
                },
                plugin_1: {
                    id: 'plugin_1',
                    version: '0.0.1',
                    state: PluginState.PLUGIN_STATE_NOT_RUNNING,
                    name: 'Plugin 1',
                    description: 'The plugin.',
                    is_prepackaged: false,
                    active: false,
                    instances: [
                        {
                            cluster_id: 'cluster_id_1',
                            state: PluginState.PLUGIN_STATE_NOT_RUNNING,
                            version: '0.0.1',
                        },
                    ],
                },
            };
            const action = {
                type: AdminTypes.RECEIVED_PLUGIN_STATUSES,
                data: [
                    {
                        plugin_id: 'plugin_0',
                        cluster_id: 'cluster_id_1',
                        version: '0.1.0',
                        state: PluginState.PLUGIN_STATE_NOT_RUNNING,
                        name: 'Plugin 0',
                        description: 'The plugin 0.',
                        is_prepackaged: false,
                    },
                    {
                        plugin_id: 'plugin_1',
                        cluster_id: 'cluster_id_1',
                        version: '0.0.1',
                        state: PluginState.PLUGIN_STATE_NOT_RUNNING,
                        name: 'Plugin 1',
                        description: 'The plugin.',
                        is_prepackaged: false,
                    },
                    {
                        plugin_id: 'plugin_1',
                        cluster_id: 'cluster_id_2',
                        version: '0.0.2',
                        state: PluginState.PLUGIN_STATE_RUNNING,
                        name: 'Plugin 1',
                        description: 'The plugin, different description.',
                        is_prepackaged: false,
                    },
                ],
            };
            const expectedState = {
                plugin_0: {
                    id: 'plugin_0',
                    version: '0.1.0',
                    state: PluginState.PLUGIN_STATE_NOT_RUNNING,
                    name: 'Plugin 0',
                    description: 'The plugin 0.',
                    is_prepackaged: false,
                    active: false,
                    instances: [
                        {
                            cluster_id: 'cluster_id_1',
                            state: PluginState.PLUGIN_STATE_NOT_RUNNING,
                            version: '0.1.0',
                        },
                    ],
                },
                plugin_1: {
                    id: 'plugin_1',
                    version: '0.0.1',
                    state: PluginState.PLUGIN_STATE_RUNNING,
                    name: 'Plugin 1',
                    description: 'The plugin.',
                    is_prepackaged: false,
                    active: true,
                    instances: [
                        {
                            cluster_id: 'cluster_id_1',
                            state: PluginState.PLUGIN_STATE_NOT_RUNNING,
                            version: '0.0.1',
                        },
                        {
                            cluster_id: 'cluster_id_2',
                            state: PluginState.PLUGIN_STATE_RUNNING,
                            version: '0.0.2',
                        },
                    ],
                },
            };

            const actualState = reducer({pluginStatuses: state}, action);
            assert.deepEqual(actualState.pluginStatuses, expectedState);
        });

        it('RECEIVED_PLUGIN, new plugin', () => {
            const state = {
                plugin_0: {
                    id: 'plugin_0',
                    version: '0.1.0',
                    state: PluginState.PLUGIN_STATE_NOT_RUNNING,
                    name: 'Plugin 0',
                    description: 'The plugin 0.',
                    is_prepackaged: true,
                    active: false,
                    instances: [
                        {
                            cluster_id: 'cluster_id_1',
                            state: PluginState.PLUGIN_STATE_NOT_RUNNING,
                            version: '0.1.0',
                        },
                    ],
                },
                plugin_1: {
                    id: 'plugin_1',
                    version: '0.0.1',
                    state: PluginState.PLUGIN_STATE_NOT_RUNNING,
                    name: 'Plugin 1',
                    description: 'The plugin.',
                    is_prepackaged: false,
                    active: false,
                    instances: [
                        {
                            cluster_id: 'cluster_id_1',
                            state: PluginState.PLUGIN_STATE_NOT_RUNNING,
                            version: '0.0.1',
                        },
                    ],
                },
            };
            const action = {
                type: AdminTypes.RECEIVED_PLUGIN,
                data: {
                    id: 'plugin_new',
                    version: '0.5.0',
                    name: 'New Plugin',
                    description: 'The new plugin.',
                    active: false,
                },
            };
            const expectedState = {
                plugin_0: {
                    id: 'plugin_0',
                    version: '0.1.0',
                    state: PluginState.PLUGIN_STATE_NOT_RUNNING,
                    name: 'Plugin 0',
                    description: 'The plugin 0.',
                    is_prepackaged: true,
                    active: false,
                    instances: [
                        {
                            cluster_id: 'cluster_id_1',
                            state: PluginState.PLUGIN_STATE_NOT_RUNNING,
                            version: '0.1.0',
                        },
                    ],
                },
                plugin_1: {
                    id: 'plugin_1',
                    version: '0.0.1',
                    state: PluginState.PLUGIN_STATE_NOT_RUNNING,
                    name: 'Plugin 1',
                    description: 'The plugin.',
                    is_prepackaged: false,
                    active: false,
                    instances: [
                        {
                            cluster_id: 'cluster_id_1',
                            state: PluginState.PLUGIN_STATE_NOT_RUNNING,
                            version: '0.0.1',
                        },
                    ],
                },
                plugin_new: {
                    id: 'plugin_new',
                    version: '0.5.0',
                    state: PluginState.PLUGIN_STATE_NOT_RUNNING,
                    name: 'New Plugin',
                    description: 'The new plugin.',
                    is_prepackaged: false,
                    active: false,
                    instances: [],
                },
            };

            const actualState = reducer({pluginStatuses: state}, action);
            assert.deepEqual(actualState.pluginStatuses, expectedState);
        });

        it('RECEIVED_PLUGIN, existing plugin', () => {
            const state = {
                plugin_0: {
                    id: 'plugin_0',
                    version: '0.1.0',
                    state: PluginState.PLUGIN_STATE_NOT_RUNNING,
                    name: 'Plugin 0',
                    description: 'The plugin 0.',
                    is_prepackaged: true,
                    active: false,
                    instances: [
                        {
                            cluster_id: 'cluster_id_1',
                            state: PluginState.PLUGIN_STATE_NOT_RUNNING,
                            version: '0.1.0',
                        },
                    ],
                },
                plugin_1: {
                    id: 'plugin_1',
                    version: '0.0.1',
                    state: PluginState.PLUGIN_STATE_NOT_RUNNING,
                    name: 'Plugin 1',
                    description: 'The plugin.',
                    is_prepackaged: false,
                    active: false,
                    instances: [
                        {
                            cluster_id: 'cluster_id_1',
                            state: PluginState.PLUGIN_STATE_NOT_RUNNING,
                            version: '0.0.1',
                        },
                    ],
                },
            };
            const action = {
                type: AdminTypes.RECEIVED_PLUGIN,
                data: {
                    id: 'plugin_1',
                    version: '0.5.0',
                    name: 'Existing Plugin',
                    description: 'The existing plugin.',
                    active: false,
                },
            };
            const expectedState = {
                plugin_0: {
                    id: 'plugin_0',
                    version: '0.1.0',
                    state: PluginState.PLUGIN_STATE_NOT_RUNNING,
                    name: 'Plugin 0',
                    description: 'The plugin 0.',
                    is_prepackaged: true,
                    active: false,
                    instances: [
                        {
                            cluster_id: 'cluster_id_1',
                            state: PluginState.PLUGIN_STATE_NOT_RUNNING,
                            version: '0.1.0',
                        },
                    ],
                },
                plugin_1: {
                    id: 'plugin_1',
                    version: '0.5.0',
                    state: PluginState.PLUGIN_STATE_NOT_RUNNING,
                    name: 'Existing Plugin',
                    description: 'The existing plugin.',
                    is_prepackaged: false,
                    active: false,
                    instances: [
                        {
                            cluster_id: 'cluster_id_1',
                            state: PluginState.PLUGIN_STATE_NOT_RUNNING,
                            version: '0.0.1',
                        },
                    ],
                },
            };

            const actualState = reducer({pluginStatuses: state}, action);
            assert.deepEqual(actualState.pluginStatuses, expectedState);
        });

        it('ENABLE_PLUGIN_REQUEST, plugin_0', () => {
            const state = {
                plugin_0: {
                    id: 'plugin_0',
                    version: '0.1.0',
                    state: PluginState.PLUGIN_STATE_NOT_RUNNING,
                    name: 'Plugin 0',
                    description: 'The plugin 0.',
                    is_prepackaged: false,
                    active: false,
                    instances: [
                        {
                            cluster_id: 'cluster_id_1',
                            state: PluginState.PLUGIN_STATE_NOT_RUNNING,
                            version: '0.1.0',
                        },
                    ],
                },
                plugin_1: {
                    id: 'plugin_1',
                    version: '0.0.1',
                    state: PluginState.PLUGIN_STATE_RUNNING,
                    name: 'Plugin 1',
                    description: 'The plugin.',
                    is_prepackaged: false,
                    active: true,
                    instances: [
                        {
                            cluster_id: 'cluster_id_1',
                            state: PluginState.PLUGIN_STATE_NOT_RUNNING,
                            version: '0.0.1',
                        },
                        {
                            cluster_id: 'cluster_id_2',
                            state: PluginState.PLUGIN_STATE_RUNNING,
                            version: '0.0.2',
                        },
                    ],
                },
            };
            const action = {
                type: AdminTypes.ENABLE_PLUGIN_REQUEST,
                data: 'plugin_0',
            };
            const expectedState = {
                plugin_0: {
                    id: 'plugin_0',
                    version: '0.1.0',
                    state: PluginState.PLUGIN_STATE_STARTING,
                    name: 'Plugin 0',
                    description: 'The plugin 0.',
                    is_prepackaged: false,
                    active: false,
                    instances: [
                        {
                            cluster_id: 'cluster_id_1',
                            state: PluginState.PLUGIN_STATE_NOT_RUNNING,
                            version: '0.1.0',
                        },
                    ],
                },
                plugin_1: {
                    id: 'plugin_1',
                    version: '0.0.1',
                    state: PluginState.PLUGIN_STATE_RUNNING,
                    name: 'Plugin 1',
                    description: 'The plugin.',
                    is_prepackaged: false,
                    active: true,
                    instances: [
                        {
                            cluster_id: 'cluster_id_1',
                            state: PluginState.PLUGIN_STATE_NOT_RUNNING,
                            version: '0.0.1',
                        },
                        {
                            cluster_id: 'cluster_id_2',
                            state: PluginState.PLUGIN_STATE_RUNNING,
                            version: '0.0.2',
                        },
                    ],
                },
            };

            const actualState = reducer({pluginStatuses: state}, action);
            assert.deepEqual(actualState.pluginStatuses, expectedState);
        });

        it('DISABLE_PLUGIN_REQUEST, plugin_0', () => {
            const state = {
                plugin_0: {
                    id: 'plugin_0',
                    version: '0.1.0',
                    state: PluginState.PLUGIN_STATE_NOT_RUNNING,
                    name: 'Plugin 0',
                    description: 'The plugin 0.',
                    is_prepackaged: false,
                    active: false,
                    instances: [
                        {
                            cluster_id: 'cluster_id_1',
                            state: PluginState.PLUGIN_STATE_NOT_RUNNING,
                            version: '0.1.0',
                        },
                    ],
                },
                plugin_1: {
                    id: 'plugin_1',
                    version: '0.0.1',
                    state: PluginState.PLUGIN_STATE_RUNNING,
                    name: 'Plugin 1',
                    description: 'The plugin.',
                    is_prepackaged: false,
                    active: true,
                    instances: [
                        {
                            cluster_id: 'cluster_id_1',
                            state: PluginState.PLUGIN_STATE_NOT_RUNNING,
                            version: '0.0.1',
                        },
                        {
                            cluster_id: 'cluster_id_2',
                            state: PluginState.PLUGIN_STATE_RUNNING,
                            version: '0.0.2',
                        },
                    ],
                },
            };
            const action = {
                type: AdminTypes.DISABLE_PLUGIN_REQUEST,
                data: 'plugin_0',
            };
            const expectedState = {
                plugin_0: {
                    id: 'plugin_0',
                    version: '0.1.0',
                    state: PluginState.PLUGIN_STATE_STOPPING,
                    name: 'Plugin 0',
                    description: 'The plugin 0.',
                    is_prepackaged: false,
                    active: false,
                    instances: [
                        {
                            cluster_id: 'cluster_id_1',
                            state: PluginState.PLUGIN_STATE_NOT_RUNNING,
                            version: '0.1.0',
                        },
                    ],
                },
                plugin_1: {
                    id: 'plugin_1',
                    version: '0.0.1',
                    state: PluginState.PLUGIN_STATE_RUNNING,
                    name: 'Plugin 1',
                    description: 'The plugin.',
                    is_prepackaged: false,
                    active: true,
                    instances: [
                        {
                            cluster_id: 'cluster_id_1',
                            state: PluginState.PLUGIN_STATE_NOT_RUNNING,
                            version: '0.0.1',
                        },
                        {
                            cluster_id: 'cluster_id_2',
                            state: PluginState.PLUGIN_STATE_RUNNING,
                            version: '0.0.2',
                        },
                    ],
                },
            };

            const actualState = reducer({pluginStatuses: state}, action);
            assert.deepEqual(actualState.pluginStatuses, expectedState);
        });

        it('DISABLE_PLUGIN_REQUEST, plugin_1', () => {
            const state = {
                plugin_0: {
                    id: 'plugin_0',
                    version: '0.1.0',
                    state: PluginState.PLUGIN_STATE_NOT_RUNNING,
                    name: 'Plugin 0',
                    description: 'The plugin 0.',
                    is_prepackaged: false,
                    active: false,
                    instances: [
                        {
                            cluster_id: 'cluster_id_1',
                            state: PluginState.PLUGIN_STATE_NOT_RUNNING,
                            version: '0.1.0',
                        },
                    ],
                },
                plugin_1: {
                    id: 'plugin_1',
                    version: '0.0.1',
                    state: PluginState.PLUGIN_STATE_RUNNING,
                    name: 'Plugin 1',
                    description: 'The plugin.',
                    is_prepackaged: false,
                    active: true,
                    instances: [
                        {
                            cluster_id: 'cluster_id_1',
                            state: PluginState.PLUGIN_STATE_NOT_RUNNING,
                            version: '0.0.1',
                        },
                        {
                            cluster_id: 'cluster_id_2',
                            state: PluginState.PLUGIN_STATE_RUNNING,
                            version: '0.0.2',
                        },
                    ],
                },
            };
            const action = {
                type: AdminTypes.DISABLE_PLUGIN_REQUEST,
                data: 'plugin_1',
            };
            const expectedState = {
                plugin_0: {
                    id: 'plugin_0',
                    version: '0.1.0',
                    state: PluginState.PLUGIN_STATE_NOT_RUNNING,
                    name: 'Plugin 0',
                    description: 'The plugin 0.',
                    is_prepackaged: false,
                    active: false,
                    instances: [
                        {
                            cluster_id: 'cluster_id_1',
                            state: PluginState.PLUGIN_STATE_NOT_RUNNING,
                            version: '0.1.0',
                        },
                    ],
                },
                plugin_1: {
                    id: 'plugin_1',
                    version: '0.0.1',
                    state: PluginState.PLUGIN_STATE_STOPPING,
                    name: 'Plugin 1',
                    description: 'The plugin.',
                    is_prepackaged: false,
                    active: true,
                    instances: [
                        {
                            cluster_id: 'cluster_id_1',
                            state: PluginState.PLUGIN_STATE_NOT_RUNNING,
                            version: '0.0.1',
                        },
                        {
                            cluster_id: 'cluster_id_2',
                            state: PluginState.PLUGIN_STATE_RUNNING,
                            version: '0.0.2',
                        },
                    ],
                },
            };

            const actualState = reducer({pluginStatuses: state}, action);
            assert.deepEqual(actualState.pluginStatuses, expectedState);
        });

        it('REMOVED_PLUGIN, plugin_0', () => {
            const state = {
                plugin_0: {
                    id: 'plugin_0',
                    version: '0.1.0-old',
                    state: PluginState.PLUGIN_STATE_NOT_RUNNING,
                    name: 'Plugin 0 - old',
                    description: 'The plugin 0 - old.',
                    is_prepackaged: true,
                    active: false,
                    instances: [
                        {
                            cluster_id: 'cluster_id_1',
                            state: PluginState.PLUGIN_STATE_NOT_RUNNING,
                            version: '0.1.0',
                        },
                    ],
                },
                plugin_1: {
                    id: 'plugin_1',
                    version: '0.0.1',
                    state: PluginState.PLUGIN_STATE_NOT_RUNNING,
                    name: 'Plugin 1',
                    description: 'The plugin.',
                    is_prepackaged: false,
                    active: false,
                    instances: [
                        {
                            cluster_id: 'cluster_id_1',
                            state: PluginState.PLUGIN_STATE_NOT_RUNNING,
                            version: '0.0.1',
                        },
                    ],
                },
            };
            const action = {
                type: AdminTypes.REMOVED_PLUGIN,
                data: 'plugin_0',
            };
            const expectedState = {
                plugin_1: {
                    id: 'plugin_1',
                    version: '0.0.1',
                    state: PluginState.PLUGIN_STATE_NOT_RUNNING,
                    name: 'Plugin 1',
                    description: 'The plugin.',
                    is_prepackaged: false,
                    active: false,
                    instances: [
                        {
                            cluster_id: 'cluster_id_1',
                            state: PluginState.PLUGIN_STATE_NOT_RUNNING,
                            version: '0.0.1',
                        },
                    ],
                },
            };

            const actualState = reducer({pluginStatuses: state}, action);
            assert.deepEqual(actualState.pluginStatuses, expectedState);
        });

        it('REMOVED_PLUGIN, plugin_1', () => {
            const state = {
                plugin_1: {
                    id: 'plugin_1',
                    version: '0.0.1',
                    state: PluginState.PLUGIN_STATE_NOT_RUNNING,
                    name: 'Plugin 1',
                    description: 'The plugin.',
                    is_prepackaged: false,
                    active: false,
                    instances: [
                        {
                            cluster_id: 'cluster_id_1',
                            state: PluginState.PLUGIN_STATE_NOT_RUNNING,
                            version: '0.0.1',
                        },
                    ],
                },
            };
            const action = {
                type: AdminTypes.REMOVED_PLUGIN,
                data: 'plugin_1',
            };
            const expectedState = {};

            const actualState = reducer({pluginStatuses: state}, action);
            assert.deepEqual(actualState.pluginStatuses, expectedState);
        });

        it('LOGOUT_SUCCESS, previously populated state', () => {
            const state = {
                plugin_0: {
                    id: 'plugin_0',
                    version: '0.1.0-old',
                    state: PluginState.PLUGIN_STATE_NOT_RUNNING,
                    name: 'Plugin 0 - old',
                    description: 'The plugin 0 - old.',
                    is_prepackaged: true,
                    active: false,
                    instances: [
                        {
                            cluster_id: 'cluster_id_1',
                            state: PluginState.PLUGIN_STATE_NOT_RUNNING,
                            version: '0.1.0',
                        },
                    ],
                },
                plugin_1: {
                    id: 'plugin_1',
                    version: '0.0.1',
                    state: PluginState.PLUGIN_STATE_NOT_RUNNING,
                    name: 'Plugin 1',
                    description: 'The plugin.',
                    is_prepackaged: false,
                    active: false,
                    instances: [
                        {
                            cluster_id: 'cluster_id_1',
                            state: PluginState.PLUGIN_STATE_NOT_RUNNING,
                            version: '0.0.1',
                        },
                    ],
                },
            };
            const action = {
                type: UserTypes.LOGOUT_SUCCESS,
            };
            const expectedState = {};

            const actualState = reducer({pluginStatuses: state}, action);
            assert.deepEqual(actualState.pluginStatuses, expectedState);
        });
    });
});
