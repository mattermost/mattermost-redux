// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
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

const rgbPattern = /^rgba?\((\d+),(\d+),(\d+)(?:,([\d.]+))?\)$/;

export function getComponents(inColor: string): {red: number, green: number, blue: number, alpha: number} {
    let color = inColor;

    // RGB color
    const match = rgbPattern.exec(color);
    if (match) {
        return {
            red: parseInt(match[1], 10),
            green: parseInt(match[2], 10),
            blue: parseInt(match[3], 10),
            alpha: match[4] ? parseFloat(match[4]) : 1,
        };
    }

    // Hex color
    if (color[0] === '#') {
        color = color.slice(1);
    }

    if (color.length === 3) {
        const tempColor = color;
        color = '';

        color += tempColor[0] + tempColor[0];
        color += tempColor[1] + tempColor[1];
        color += tempColor[2] + tempColor[2];
    }

    return {
        red: parseInt(color.substring(0, 2), 16),
        green: parseInt(color.substring(2, 4), 16),
        blue: parseInt(color.substring(4, 6), 16),
        alpha: 1,
    };
}

export function changeOpacity(oldColor: string, opacity: number): string {
    const {
        red,
        green,
        blue,
        alpha,
    } = getComponents(oldColor);

    return `rgba(${red},${green},${blue},${alpha * opacity})`;
}

function blendComponent(background: number, foreground: number, opacity: number): number {
    return ((1 - opacity) * background) + (opacity * foreground);
}

export function blendColors(background: string, foreground: string, opacity: number): string {
    const backgroundComponents = getComponents(background);
    const foregroundComponents = getComponents(foreground);

    const red = Math.floor(blendComponent(
        backgroundComponents.red,
        foregroundComponents.red,
        opacity
    ));
    const green = Math.floor(blendComponent(
        backgroundComponents.green,
        foregroundComponents.green,
        opacity
    ));
    const blue = Math.floor(blendComponent(
        backgroundComponents.blue,
        foregroundComponents.blue,
        opacity
    ));
    const alpha = blendComponent(
        backgroundComponents.alpha,
        foregroundComponents.alpha,
        opacity
    );

    return `rgba(${red},${green},${blue},${alpha})`;
}
