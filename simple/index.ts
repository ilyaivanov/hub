import { colors, spacings } from "./consts";
import { Cursor } from "./cursor";
import { insertTextAt } from "./infra/string";
import { onKeyDown } from "./keyboardActions";

const canvas = document.createElement("canvas");
const ctx = canvas.getContext("2d")!;
document.body.appendChild(canvas);

let screenWidth = 0;
let screenHeight = 0;
let scale = 0;

function onResize() {
    screenWidth = window.innerWidth;
    screenHeight = window.innerHeight;
    scale = window.devicePixelRatio || 1;

    canvas.style.width = `${screenWidth}px`;
    canvas.style.height = `${screenHeight}px`;
    canvas.width = Math.floor(screenWidth * scale);
    canvas.height = Math.floor(screenHeight * scale);
    ctx.scale(scale, scale);
}
onResize();

window.addEventListener("resize", () => {
    onResize();
    render();
});

export type AppState = {
    cursor: Cursor;
    mode: "normal" | "edit";
    items: string[];
};

const padding = 10;

const state: AppState = {
    cursor: { col: 0, row: 0 },
    items: ["foo", "bar", "buzz"],
    mode: "normal",
};

function render() {
    ctx.font = `${spacings.fontWeight} ${spacings.fontSize}px ${spacings.font}`;

    const ms = ctx.measureText("f");
    const h = ms.fontBoundingBoxAscent + ms.fontBoundingBoxDescent;

    ctx.clearRect(-20000, -20000, 40000, 40000);
    let y = padding + h / 2;
    let x = padding;

    ctx.fillStyle = colors.text;
    ctx.textBaseline = "middle";

    const { items, cursor, mode } = state;
    for (let i = 0; i < items.length; i++) {
        ctx.fillText(items[i], x, y);
        y += h;
    }

    ctx.fillStyle = mode == "edit" ? "green" : "white";
    const cursorWidth = 1.5;

    let cursorX = 0;
    let line = items[cursor.row];
    if (line) {
        const subline = line.slice(0, cursor.col);
        cursorX = ctx.measureText(subline).width - cursorWidth / 2;
    }

    ctx.fillRect(padding + cursorX, padding + cursor.row * h, cursorWidth, h);
}
render();

document.addEventListener("keydown", async (e) => {
    await onKeyDown(state, e);
    render();
});

document.addEventListener("paste", (e) => {
    const t = e.clipboardData?.getData("text");

    const { items, cursor } = state;
    if (t) {
        items[cursor.row] = insertTextAt(items[cursor.row], cursor.col, t);
        cursor.col += t.length;
        render();
    }
});
