// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {Observable} from 'rxjs/Observable';
import {switchMap} from 'rxjs/operators';
import {ofType} from 'redux-observable';
import 'rxjs/add/observable/empty';

export const changeLicenseEpic = (action$: any) =>
    action$.pipe(
        ofType('UPLOAD_LICENSE_SUCCESS'),
        switchMap(() => {
            console.log('I AM AN EPIC BEING CALLED');
            return Observable.empty();
        }),
    );
