// Copyright (c) 2017-present Mattermost, Inc. All Rights Reserved.
// See License.txt for license information.
// @flow

export function makeStyleFromTheme(getStyleFromTheme: (Object) => Object): (Object) => Object {
    let lastTheme = null;
    let style = null;

    return (theme: Object) => {
        if (!style || theme !== lastTheme) {
            style = getStyleFromTheme(theme);
            lastTheme = theme;
        }

        return style;
    };
}

function normalizeColor(oldColor: string): string {
    let color = oldColor;
    if (color.length && color[0] === '#') {
        color = color.slice(1);
    }

    if (color.length === 3) {
        const tempColor = color;
        color = '';

        color += tempColor[0] + tempColor[0];
        color += tempColor[1] + tempColor[1];
        color += tempColor[2] + tempColor[2];
    }

    return color;
}

export function changeOpacity(oldColor: string, opacity: number): string {
    const color = normalizeColor(oldColor);

    const r = parseInt(color.substring(0, 2), 16);
    const g = parseInt(color.substring(2, 4), 16);
    const b = parseInt(color.substring(4, 6), 16);

    return `rgba(${r},${g},${b},${opacity})`;
}

function blendComponent(background: number, foreground: number, opacity: number): number {
    return ((1 - opacity) * background) + (opacity * foreground);
}

export function blendColors(background: string, foreground: string, opacity: number): string {
    const backgroundNormalized = normalizeColor(background);
    const foregroundNormalized = normalizeColor(foreground);

    const r = blendComponent(
        parseInt(backgroundNormalized.substring(0, 2), 16),
        parseInt(foregroundNormalized.substring(0, 2), 16),
        opacity
    );
    const g = blendComponent(
        parseInt(backgroundNormalized.substring(2, 4), 16),
        parseInt(foregroundNormalized.substring(2, 4), 16),
        opacity
    );
    const b = blendComponent(
        parseInt(backgroundNormalized.substring(4, 6), 16),
        parseInt(foregroundNormalized.substring(4, 6), 16),
        opacity
    );

    return `rgb(${r},${g},${b})`;
}
