// Copyright (c) 2017-present Mattermost, Inc. All Rights Reserved.
// See License.txt for license information.

export default class DelayedAction {
    constructor(action) {
        this.action = action;

        this.timer = -1;

        // bind fire since it doesn't get passed the correct this value with setTimeout
        this.fire = this.fire.bind(this);
    }

    fire() {
        this.action();

        this.timer = -1;
    }

    fireAfter(timeout) {
        if (this.timer >= 0) {
            clearTimeout(this.timer);
        }

        this.timer = setTimeout(this.fire, timeout);
    }

    cancel() {
        clearTimeout(this.timer);
    }
}
