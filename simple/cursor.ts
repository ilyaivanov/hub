import type { AppState } from "./index";

export type Cursor = { row: number; col: number };

export function moveDown(state: AppState) {
    if (state.cursor.row < state.items.length - 1) state.cursor.row += 1;
}

export function moveUp(state: AppState) {
    if (state.cursor.row > 0) state.cursor.row -= 1;
}

export function moveLeft(state: AppState) {
    if (state.cursor.col > 0) state.cursor.col -= 1;
}

export function moveRight(state: AppState) {
    if (state.cursor.col < state.items[state.cursor.row].length)
        state.cursor.col += 1;
}

export function jumpWordForward(state: AppState) {
    const item = state.items[state.cursor.row];
    const nextSpace = item.indexOf(" ", state.cursor.col + 1);
    if (nextSpace > 0) state.cursor.col = nextSpace + 1;
    else state.cursor.col = item.length;
}

export function jumpWordBackward(state: AppState) {
    const item = state.items[state.cursor.row];
    const nextSpace = item.lastIndexOf(" ", state.cursor.col - 2);
    if (nextSpace > 0) state.cursor.col = nextSpace + 1;
    else state.cursor.col = 0;
}

export function moveStartOfItem(state: AppState) {
    state.cursor.col = 0;
}

export function moveEndOfItem(state: AppState) {
    state.cursor.col = state.items[state.cursor.row].length;
}
