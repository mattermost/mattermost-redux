// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {combineReducers} from 'redux';
import {CloudTypes} from 'action_types';

import {GenericAction} from 'types/actions';
import {Product, Subscription, CloudCustomer} from 'types/cloud';
import {Dictionary} from 'types/utilities';

function subscription(state: Subscription | null = null, action: GenericAction) {
    switch (action.type) {
    case CloudTypes.RECEIVED_CLOUD_SUBSCRIPTION: {
        return action.data;
    }
    default:
        return state;
    }
}

function customer(state: CloudCustomer | null = null, action: GenericAction) {
    switch (action.type) {
    case CloudTypes.RECEIVED_CLOUD_CUSTOMER: {
        return action.data;
    }
    default:
        return state;
    }
}

function products(state: Dictionary<Product> | null = null, action: GenericAction) {
    switch (action.type) {
    case CloudTypes.RECEIVED_CLOUD_PRODUCTS: {
        const productList: Product[] = action.data;
        return productList.reduce((map, obj) => {
            map[obj.id] = obj;
            return map;
        }, {} as Dictionary<Product>);
    }
    default:
        return state;
    }
}

export default combineReducers({

    // represents the current cloud subscription
    customer,

    // represents the current cloud subscription
    subscription,

    // represents the cloud products offered
    products,
});
