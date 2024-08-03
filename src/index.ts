import { colors, spacings } from "./consts";
import { canvas, ctx, fillSquareAt, outlineSquareAt } from "./drawing";
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
import { i, isRoot, Item, removeItem } from "./tree";

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

function getPanelWidth() {
    return Math.min(state.canvas.width, spacings.maxWidth);
}
function buildParagraphs() {
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

    //TODO move persistance elsewhere
    saveItemsToLocalStorage(state.root);
}

buildParagraphs();

function draw(time: number) {
    const { selectedItem, cursor } = state;
    const { width, height } = state.canvas;
    const panelWidth = getPanelWidth();

    ctx.clearRect(0, 0, width, height);

    const leftPanel = width / 2 - panelWidth / 2;
    ctx.globalAlpha = 0.3;
    ctx.fillStyle = "red";
    ctx.fillRect(leftPanel - 1, 0, 2, height);
    ctx.fillRect(leftPanel + panelWidth - 1, 0, 2, height);
    ctx.globalAlpha = 1;

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
    drawCursor(state.paragraphsMap.get(selectedItem!)!, cursor);

    requestAnimationFrame(draw);
}

function changeSelection(item: Item | undefined) {
    if (item) {
        state.selectedItem = item;
        state.cursor = 0;
    }
}

document.body.addEventListener("keydown", async (e) => {
    const item = state.selectedItem;
    const { cursor, mode } = state;
    if (!item) return;

    if (e.code == "Backspace") {
        if (cursor > 0) {
            item.title =
                item.title.slice(0, cursor - 1) + item.title.slice(cursor);
            buildParagraphs();

            state.cursor--;
        }
    } else if (mode == "Insert") {
        if (e.code == "Escape" || e.code == "Enter") {
            state.mode = "Normal";
        } else if (e.key.length == 1) {
            item.title = insertChartAtPosition(item.title, e.key, cursor);
            state.cursor++;
            buildParagraphs();
        }
    } else {
        if (e.code == "KeyS" && e.metaKey) {
            saveToFile(state.root);
        }

        if (e.code == "KeyD") {
            const nextItem = getItemToSelectAfterRemovingSelected(item);
            removeItem(item);
            if (nextItem) {
                changeSelection(nextItem);
                state.cursor = 0;
            }
            buildParagraphs();
        }
        if (e.code == "KeyL") {
            if (e.code == "KeyL" && e.metaKey) {
                e.preventDefault();
                const newRoot = await loadFromFile();
                if (newRoot) {
                    console.log(newRoot);
                    state.root = newRoot;
                    changeSelection(state.root.children[0]);
                    buildParagraphs();
                }
            } else if (!item.isOpen) {
                item.isOpen = true;
                buildParagraphs();
            } else if (item.children.length > 0) {
                changeSelection(item.children[0]);
                state.cursor = 0;
            }
        }
        if (e.code == "KeyH") {
            if (item.isOpen) {
                item.isOpen = false;
                buildParagraphs();
            } else if (!isRoot(item.parent)) {
                changeSelection(item.parent);
                state.cursor = 0;
            }
        }
        if (e.code == "KeyJ") {
            changeSelection(getItemBelow(item));
        }
        if (e.code == "KeyR" && !e.metaKey) {
            item.title = "";
            buildParagraphs();
            state.mode = "Insert";
        }

        if (e.code == "KeyI") {
            if (mode == "Normal") {
                state.mode = "Insert";
            }
        }

        if (e.code == "KeyK") {
            changeSelection(getItemAbove(item));
        }
        if (e.code == "KeyW") {
            state.cursor = item.title.indexOf(" ", cursor + 1) + 1;
        }
        if (e.code == "KeyB")
            state.cursor = item.title.slice(0, cursor - 1).lastIndexOf(" ") + 1;
    }
});

function insertChartAtPosition(str: string, ch: string, index: number): string {
    return str.slice(0, index) + ch + str.slice(index);
}

requestAnimationFrame(draw);
