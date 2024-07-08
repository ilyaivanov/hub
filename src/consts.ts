import { grey } from "./swatches";

export const spacings = {
    padding: 25,
    fontSize: 13,
    fontWeight: 300,
    font: `-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen",
    "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue",
    sans-serif`,
    iconSize: 8,
    rowHeight: 26,
    xStep: 20,
    textToIcon: 8,
};

const swatches = grey;
export const dark = {
    bg: "#1e2021",
    lines: swatches["700"],
    icons: swatches["500"],
    text: swatches["100"],
    selectedRect: swatches["800"],
    selectedText: swatches["050"],
};
export const light = {
    bg: swatches["050"],
    lines: swatches["400"],
    icons: swatches["600"],
    text: swatches["900"],
    selectedRect: swatches["200"],
    selectedText: "#000000",
};

export let colors = dark;

export function setColors(c: typeof dark) {
    colors = c;
}
