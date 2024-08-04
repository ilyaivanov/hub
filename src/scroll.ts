import type { AppState } from "./index";

function clamp(val: number, min: number, max: number) {
    if (val < min) return min;
    if (val > max) return max;
    return val;
}

export function clampOffset(state: AppState, val: number) {
    const maxOffset = Math.max(state.pageHeight - state.canvas.height, 0);
    return clamp(val, 0, maxOffset);
}
