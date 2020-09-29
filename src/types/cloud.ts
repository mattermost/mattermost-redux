// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

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
