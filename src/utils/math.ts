export function clamp(val: number, min: number, max: number) {
    if (val < min) return min;
    if (val > max) return max;
    return val;
}

export function lerp(from: number, to: number, factor: number) {
    return from * (1 - factor) + to * factor;
}
