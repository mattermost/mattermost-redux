// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

export type CloudState = {
    subscription?: Subscription;
}

export type Subscription = {
	id: string;
	customer_id: string;
	product_id: string;
	add_ons: string[];
	start_at: number;
	end_at: number;
	create_at: number;
	seats: number;
}

export type Product = {
    id: string;
    name: string;
    description: string;
    dollars_per_seat: number;
    add_ons: AddOn[];
};

export type AddOn = {
    id: string;
    name: string;
    display_name: string;
    dollars_per_seat: number;
};
