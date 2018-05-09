// @flow

export type AlertTypeType = 'notification' | 'developer' | 'error';
export type AlertType = {|
    type: AlertTypeType,
    message: string
|};
