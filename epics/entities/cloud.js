"use strict";
// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
Object.defineProperty(exports, "__esModule", { value: true });
exports.changeLicenseEpic = void 0;
var Observable_1 = require("rxjs/Observable");
var operators_1 = require("rxjs/operators");
var redux_observable_1 = require("redux-observable");
require("rxjs/add/observable/empty");
// export const changeLicenseEpic = (action$: any, state$: any) => action$.pipe(
//     ofType('UPLOAD_LICENSE_SUCCESS'),
//     switchMap(() => {
//         console.log('THE STATE', state$);
//         return Rx.Observable.interval(1000);
//     }),
// );
var changeLicenseEpic = function (action$) {
    return action$.pipe(redux_observable_1.ofType('UPLOAD_LICENSE_SUCCESS'), operators_1.switchMap(function () {
        console.log('I AM AN EPIC BEING CALLED');
        return Observable_1.Observable.empty();
    }));
};
exports.changeLicenseEpic = changeLicenseEpic;
//# sourceMappingURL=cloud.js.map