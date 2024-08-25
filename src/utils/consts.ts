import { green, grey } from "./swatches";

export const SHOULD_PERSIST_TO_LOCAL_STORAGE = false;
export const spacings = {
    hPadding: 30,
    vPadding: 20,
    maxWidth: 800,
    lineHeight: 1.1,
    paragraphExtraLineHeight: 0.4,
    fontSize: 12,
    selectedRowExtraSpace: 4,
    fontWeight: 400,
    titleFontSize: 22,
    titleFontWeight: 600,
    // font: "monospace",
    font: `-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen",
    "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue",
    sans-serif`,
    iconSize: 8,
    xStep: 25,
    textToIcon: 8,
};

const swatches = grey;
export const dark = {
    bg: "#1a1a1a",
    lines: swatches["800"],
    icons: swatches["500"],
    text: swatches["100"],
    selectedRect: swatches["500"],
    selectedRectInsert: green["500"],
    cursor: "red",
    selectedText: swatches["050"],
};
export const light: Theme = {
    bg: swatches["050"],
    lines: swatches["100"],
    icons: swatches["600"],
    text: swatches["800"],
    selectedRect: swatches["200"],
    selectedRectInsert: green["500"],
    cursor: swatches["800"],
    selectedText: swatches["900"],
};
type Theme = typeof dark;
export let colors: Theme;

export function setColors(c: Theme) {
    colors = c;
    document.body.style.backgroundColor = dark.bg;
}

setColors(dark);
