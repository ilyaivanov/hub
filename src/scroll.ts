import { getPrimaryCursor } from "./cursor/cursor";
import type { AppState } from "./index";
import { clamp } from "./utils/math";

export function clampOffset(state: AppState, val: number) {
    const maxOffset = Math.max(state.pageHeight - state.canvas.height, 0);
    return clamp(val, 0, maxOffset);
}

export function scrollToSelectedItem(state: AppState) {
    const itemsToLookAhead = 3;

    const p = state.paragraphsMap.get(getPrimaryCursor(state).item);
    const { pageHeight, scrollOffset } = state;
    const { height } = state.canvas;
    if (p) {
        const spaceToLookAhead = p.lineHeight * itemsToLookAhead;
        if (
            pageHeight > height &&
            p.y + spaceToLookAhead - height > scrollOffset
        ) {
            const targetOffset = p.y - height + spaceToLookAhead;
            state.scrollOffset = clampOffset(state, targetOffset);
        } else if (
            pageHeight > height &&
            p.y - spaceToLookAhead < scrollOffset
        ) {
            const targetOffset = p.y - spaceToLookAhead;
            state.scrollOffset = clampOffset(state, targetOffset);
        } else {
            state.scrollOffset = clampOffset(state, state.scrollOffset);
        }
    }
}
