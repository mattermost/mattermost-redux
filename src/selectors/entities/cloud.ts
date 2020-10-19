// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {createSelector} from 'reselect';

import {Invoice} from 'types/cloud';
import {GlobalState} from 'types/store';
import {Dictionary} from 'types/utilities';

export function makeGetLastInvoice(): (state: GlobalState) => Invoice | undefined {
    return createSelector(
        (state: GlobalState) => state.entities.cloud.invoices,
        (invoices?: Dictionary<Invoice>) => {
            if (!invoices || !Object.keys(invoices).length) {
                return undefined;
            }
            const allInvoices = Object.values(invoices).sort((a, b) => b.period_end - a.period_end);
            return allInvoices[0];
        },
    );
}
