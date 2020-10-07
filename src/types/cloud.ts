// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {Dictionary} from './utilities';

export type CloudState = {
    subscription?: Subscription;
	products?: Dictionary<Product>;
	customer?: CloudCustomer;
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
	is_paid_tier: string;
}

export type Product = {
    id: string;
    name: string;
    description: string;
    price_per_seat: number;
    add_ons: AddOn[];
};

export type AddOn = {
    id: string;
    name: string;
    display_name: string;
    price_per_seat: number;
};

// Customer model represents a customer on the system.
export type CloudCustomer = {
	id: string;
	creator_id: string;
	create_at: number;
	email: string;
	name: string;
	num_employees: number;
	contact_first_name: string;
	contact_last_name: string;
	billing_address: Address;
	company_address: Address;
	payment_method: PaymentMethod;
}

// Address model represents a customer's address.
export type Address = {
	city: string;
	country: string;
	line1: string;
	line2: string;
	postal_code: string;
	state: string;
}

// PaymentMethod represents methods of payment for a customer.
export type PaymentMethod = {
	type: string;
	last_four: number;
	exp_month: number;
	exp_year: number;
	card_brand: string;
	name: string;
}
