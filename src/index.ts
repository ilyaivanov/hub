import { colors, spacings } from "./utils/consts";
import { canvas, ctx, fillSquareAt, outlineSquareAt } from "./utils/drawing";
import {
    buildParagraph,
    drawCursor,
    drawParagraph,
    Paragraph,
} from "./paragraph";
import {
    loadFromFile,
    loadItemsFromLocalStorage,
    saveItemsToLocalStorage,
    saveToFile,
} from "./persistance";
import {
    drawSelecitonBox,
    getItemAbove,
    getItemBelow,
    getItemToSelectAfterRemovingSelected,
} from "./selection";
import { i, insertItemAfter, isRoot, Item, removeItem } from "./utils/tree";
import { handleInsertModeKey, handleNormalModeKey } from "./keyboard";
import { clampOffset } from "./scroll";

document.body.style.backgroundColor = colors.bg;
document.body.appendChild(canvas);

type Mode = "Normal" | "Insert";

export type AppState = {
    root: Item;
    selectedItem: Item;
    cursor: number;

    mode: Mode;

    //UI
    paragraphs: Paragraph[];
    paragraphsMap: WeakMap<Item, Paragraph>;
    canvas: {
        width: number;
        height: number;
        scale: number;
    };
    pageHeight: number;
    scrollOffset: number;
};
const initialRoot =
    loadItemsFromLocalStorage() || i("Root", [i("One"), i("Two")]);

const state: AppState = {
    root: initialRoot,
    selectedItem: initialRoot.children[0],
    cursor: 0,
    mode: "Normal",
    paragraphs: [],
    paragraphsMap: new WeakMap(),
    canvas: { width: 0, height: 0, scale: 0 },
    pageHeight: 0,
    scrollOffset: 0,
};

function onResize() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const scale = window.devicePixelRatio || 1;
    state.canvas.width = width;
    state.canvas.height = height;
    state.canvas.scale = scale;

    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    canvas.width = Math.floor(width * scale);
    canvas.height = Math.floor(height * scale);
    ctx.scale(scale, scale);
}
onResize();
window.addEventListener("resize", () => {
    onResize();
    buildParagraphs();
});

function lerp(from: number, to: number, factor: number) {
    return from * (1 - factor) + to * factor;
}

function getPanelWidth() {
    return Math.min(state.canvas.width, spacings.maxWidth);
}
export function buildParagraphs() {
    const panelWidth = getPanelWidth();
    let y = spacings.vPadding;
    let x = spacings.hPadding + state.canvas.width / 2 - panelWidth / 2;
    ctx.font = `${spacings.fontWeight} ${spacings.fontSize}px ${spacings.font}`;

    state.paragraphs = [];
    const stack = state.root.children
        .map((item) => ({ item, level: 0 }))
        .reverse();

    while (stack.length > 0) {
        const { item, level } = stack.pop()!;
        let itemX = x + level * spacings.xStep;

        const maxWidth =
            panelWidth - spacings.hPadding * 2 - level * spacings.xStep;
        const p = buildParagraph(item, itemX, y, maxWidth);
        y += p.totalHeight;
        state.paragraphsMap.set(item, p);
        state.paragraphs.push(p);

        if (item.isOpen)
            for (let i = item.children.length - 1; i >= 0; i--)
                stack.push({ item: item.children[i], level: level + 1 });
    }

    state.pageHeight = y;
    //TODO move persistance elsewhere
    saveItemsToLocalStorage(state.root);
}

buildParagraphs();

function draw(time: number) {
    const { selectedItem, cursor } = state;
    const { width, height } = state.canvas;
    const panelWidth = getPanelWidth();

    ctx.resetTransform();
    ctx.scale(state.canvas.scale, state.canvas.scale);

    ctx.clearRect(0, 0, width, height);

    const leftPanel = width / 2 - panelWidth / 2;
    ctx.globalAlpha = 0.3;
    ctx.fillStyle = "red";
    ctx.fillRect(leftPanel - 1, 0, 2, height);
    ctx.fillRect(leftPanel + panelWidth - 1, 0, 2, height);
    ctx.globalAlpha = 1;

    const { pageHeight, scrollOffset } = state;
    const scrollWidth = 8;
    const scrollHeight = (height * height) / pageHeight;
    const maxOffset = pageHeight - height;
    const maxScrollY = height - scrollHeight;
    const scrollY = lerp(0, maxScrollY, scrollOffset / maxOffset);

    ctx.fillStyle = colors.lines;
    ctx.fillRect(width - scrollWidth, scrollY, scrollWidth, scrollHeight);

    ctx.translate(0, -state.scrollOffset);

    ctx.font = `${spacings.fontWeight} ${spacings.fontSize}px ${spacings.font}`;

    drawSelecitonBox(state);

    for (let i = 0; i < state.paragraphs.length; i++) {
        const p = state.paragraphs[i];
        const color =
            p.item == selectedItem ? colors.selectedText : colors.text;
        drawParagraph(p, color);

        if (p.item.children.length > 0) {
            ctx.fillStyle = colors.icons;
            fillSquareAt(
                p.x - spacings.hPadding / 2 + 3,
                p.y,
                spacings.iconSize
            );
        } else {
            ctx.strokeStyle = colors.icons;
            outlineSquareAt(
                p.x - spacings.hPadding / 2 + 3,
                p.y,
                spacings.iconSize
            );
        }
    }

    ctx.fillStyle = "white";

    const p = state.paragraphsMap.get(selectedItem!);
    if (p) drawCursor(p, cursor);

    requestAnimationFrame(draw);
}

document.body.addEventListener("keydown", async (e) => {
    const item = state.selectedItem;
    if (!item) return;

    let needtoRebuildUI = false;
    if (state.mode == "Normal") {
        needtoRebuildUI = await handleNormalModeKey(state, e);
    } else if (state.mode == "Insert")
        needtoRebuildUI = await handleInsertModeKey(state, e);

    if (needtoRebuildUI) {
        buildParagraphs();
        state.scrollOffset = clampOffset(state, state.scrollOffset);
    }
});

document.body.addEventListener("wheel", (e) => {
    state.scrollOffset = clampOffset(state, state.scrollOffset + e.deltaY);
});

requestAnimationFrame(draw);
