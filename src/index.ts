import { colors, spacings } from "./consts";
import { canvas, ctx, fillSquareAt, outlineSquareAt } from "./drawing";
import {
    buildParagraph,
    drawCursor,
    drawParagraph,
    Paragraph,
} from "./paragraph";
import { loadFromFile, saveToFile } from "./persistance";
import {
    drawSelecitonBox,
    getItemAbove,
    getItemBelow,
    getItemToSelectAfterRemovingSelected,
} from "./selection";
import { isRoot, Item, removeItem, root, setRoot } from "./tree";

document.body.style.backgroundColor = colors.bg;
document.body.appendChild(canvas);

type AppState = {
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
    buildParagraphs();
});

const hPadding = 30;
const vPadding = 20;

let panelWidth = 0;

type Mode = "Normal" | "Insert";

let mode: Mode = "Normal";

let ps: Paragraph[] = [];

const map = new WeakMap<Item, Paragraph>();

function buildParagraphs() {
    panelWidth = Math.min(screenWidth, spacings.maxWidth);
    let y = vPadding;
    let x = hPadding + screenWidth / 2 - panelWidth / 2;
    ctx.font = `${spacings.fontWeight} ${spacings.fontSize}px ${spacings.font}`;

    ps = [];
    const stack = root.children.map((item) => ({ item, level: 0 })).reverse();

    while (stack.length > 0) {
        const { item, level } = stack.pop()!;
        let itemX = x + level * spacings.xStep;

        const maxWidth = panelWidth - hPadding * 2 - level * spacings.xStep;
        const p = buildParagraph(item, itemX, y, maxWidth);
        y += p.totalHeight;
        map.set(item, p);
        ps.push(p);

        if (item.isOpen)
            for (let i = item.children.length - 1; i >= 0; i--)
                stack.push({ item: item.children[i], level: level + 1 });
    }

    //TODO move persistance elsewhere
    saveItemsToLocalStorage(root);
}

buildParagraphs();

let selectedItem: Item | undefined;
let cursor = 0;

function draw(time: number) {
    ctx.clearRect(0, 0, screenWidth, screenHeight);

    const leftPanel = screenWidth / 2 - panelWidth / 2;
    ctx.globalAlpha = 0.3;
    ctx.fillStyle = "red";
    ctx.fillRect(leftPanel - 1, 0, 2, screenHeight);
    ctx.fillRect(leftPanel + panelWidth - 1, 0, 2, screenHeight);
    ctx.globalAlpha = 1;

    ctx.font = `${spacings.fontWeight} ${spacings.fontSize}px ${spacings.font}`;

    drawSelecitonBox(mode, screenWidth, map.get(selectedItem!)!);

    for (let i = 0; i < ps.length; i++) {
        const p = ps[i];
        const color =
            p.item == selectedItem ? colors.selectedText : colors.text;
        drawParagraph(p, color);

        if (p.item.children.length > 0) {
            ctx.fillStyle = colors.icons;
            fillSquareAt(p.x - hPadding / 2 + 3, p.y, spacings.iconSize);
        } else {
            ctx.strokeStyle = colors.icons;
            outlineSquareAt(p.x - hPadding / 2 + 3, p.y, spacings.iconSize);
        }
    }

    ctx.fillStyle = "white";
    drawCursor(map.get(selectedItem!)!, cursor);

    requestAnimationFrame(draw);
}

function changeSelection(item: Item | undefined) {
    if (item) {
        selectedItem = item;
        cursor = 0;
    }
}

changeSelection(root.children[0]);

document.body.addEventListener("keydown", async (e) => {
    const item = selectedItem;
    if (!item) return;

    if (e.code == "Backspace") {
        if (cursor > 0) {
            item.title =
                item.title.slice(0, cursor - 1) + item.title.slice(cursor);
            buildParagraphs();

            cursor--;
        }
    } else if (mode == "Insert") {
        if (e.code == "Escape" || e.code == "Enter") {
            mode = "Normal";
        } else if (e.key.length == 1) {
            item.title = insertChartAtPosition(item.title, e.key, cursor);
            cursor++;
            buildParagraphs();
        }
    } else {
        if (e.code == "KeyS" && e.metaKey) {
            saveToFile(root);
        }

        if (e.code == "KeyL" && e.metaKey) {
            e.preventDefault();
            const newRoot = await loadFromFile();
            if (newRoot) {
                setRoot(newRoot);
                cursor = 0;
                selectedItem = root.children[0];
                buildParagraphs();
            }
        }

        if (e.code == "KeyD") {
            const nextItem = getItemToSelectAfterRemovingSelected(item);
            removeItem(item);
            if (nextItem) {
                changeSelection(nextItem);
                cursor = 0;
            }
            buildParagraphs();
        }
        if (e.code == "KeyL") {
            if (!item.isOpen) {
                item.isOpen = true;
                buildParagraphs();
            } else if (item.children.length > 0) {
                changeSelection(item.children[0]);
                cursor = 0;
            }
        }
        if (e.code == "KeyH") {
            if (item.isOpen) {
                item.isOpen = false;
                buildParagraphs();
            } else if (!isRoot(item.parent)) {
                changeSelection(item.parent);
                cursor = 0;
            }
        }
        if (e.code == "KeyJ") {
            changeSelection(getItemBelow(item));
        }
        if (e.code == "KeyR" && !e.metaKey) {
            item.title = "";
            buildParagraphs();
            mode = "Insert";
        }

        if (e.code == "KeyI") {
            if (mode == "Normal") {
                mode = "Insert";
            }
        }

        if (e.code == "KeyK") {
            changeSelection(getItemAbove(item));
        }
        if (e.code == "KeyW") {
            cursor = item.title.indexOf(" ", cursor + 1) + 1;
        }
        if (e.code == "KeyB")
            cursor = item.title.slice(0, cursor - 1).lastIndexOf(" ") + 1;
    }
});

function insertChartAtPosition(str: string, ch: string, index: number): string {
    return str.slice(0, index) + ch + str.slice(index);
}

requestAnimationFrame(draw);

function replacer(key: keyof Item, value: unknown) {
    if (key == "parent") return undefined;
    else return value;
}

export function saveItemsToLocalStorage(root: Item) {
    localStorage.setItem(
        "items",
        JSON.stringify(root, (key, value) => replacer(key as keyof Item, value))
    );
}
