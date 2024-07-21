import { blueGrey, cyan, grey } from "./swatches";

export const spacings = {
    padding: 25,
    fontSize: 12,
    rowHeight: 20,
    selectedRowExtraSpace: 4,
    fontWeight: 300,
    titleFontSize: 22,
    titleFontWeight: 600,
    // font: "monospace",
    font: `-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen",
    "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue",
    sans-serif`,
    iconSize: 8,
    xStep: 20,
    textToIcon: 8,
};

const swatches = grey;
export const dark = {
    bg: "#1e2021",
    lines: swatches["800"],
    icons: swatches["500"],
    text: swatches["100"],
    selectedRect: swatches["800"],
    selectedText: swatches["050"],
};
export const light = {
    bg: swatches["050"],
    lines: swatches["100"],
    icons: swatches["600"],
    text: swatches["800"],
    selectedRect: swatches["200"],
    selectedText: swatches["900"],
};

export let colors: typeof dark;

export function setColors(c: typeof dark) {
    colors = c;
    document.body.style.backgroundColor = dark.bg;
}

setColors(dark);
