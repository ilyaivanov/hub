export function clamp(val: number, min: number, max: number) {
    if (val < min) return min;
    if (val > max) return max;
    return val;
}

export function lerp(from: number, to: number, factor: number) {
    return from * (1 - factor) + to * factor;
}

export function mapNumber(
    inputMin: number,
    inputMax: number,
    outputMin: number,
    outputMax: number,
    input: number
): number {
    return (
        ((input - inputMin) / (inputMax - inputMin)) * (outputMax - outputMin) +
        outputMin
    );
}
