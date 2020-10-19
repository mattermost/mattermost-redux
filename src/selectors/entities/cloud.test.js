// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import * as Selectors from './cloud';

describe('getLastInvoice', () => {
    const getLastInvoice = Selectors.makeGetLastInvoice();

    const state = {
        entities: {
            cloud: {
                invoices: {
                    invoice_1: {id: 'invoice_1', period_end: 1000},
                    invoice_2: {id: 'invoice_2', period_end: 2000},
                    invoice_3: {id: 'invoice_3', period_end: 3000},
                    invoice_4: {id: 'invoice_4', period_end: 4000},
                },
            },
        },
    };

    test('should return null when no invoices exist or have not been loaded', () => {
        const nullState = {
            entities: {
                cloud: {
                    invoices: null,
                },
            },
        };

        expect(getLastInvoice(nullState)).toBeUndefined();

        const emptyState = {
            entities: {
                cloud: {
                    invoices: {},
                },
            },
        };

        expect(getLastInvoice(emptyState)).toBeUndefined();
    });

    test('should return last invoice', () => {
        expect(getLastInvoice(state)).toEqual({id: 'invoice_4', period_end: 4000});
    });
});
