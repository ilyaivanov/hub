let ctx: CanvasRenderingContext2D;
export function setCtx(c: CanvasRenderingContext2D) {
    ctx = c;
}

export function fillSquareAt(x: number, y: number, size: number) {
    ctx.fillRect(x - size / 2, y - size / 2, size, size);
}

export function outlineSquareAt(x: number, y: number, size: number) {
    const lineWidth = 1;
    ctx.lineWidth = lineWidth;
    const d = size / 2 - lineWidth / 2;
    ctx.beginPath();
    ctx.moveTo(x - d, y - d);
    ctx.lineTo(x + d, y - d);
    ctx.lineTo(x + d, y + d);
    ctx.lineTo(x - d, y + d);
    ctx.closePath();
    ctx.stroke();
}
