import {
    colors,
    SHOULD_PERSIST_TO_LOCAL_STORAGE,
    spacings,
} from "./utils/consts";
import { canvas, ctx } from "./utils/drawing";
import { buildParagraph, Paragraph } from "./paragraph";
import {
    loadItemsFromLocalStorage,
    saveItemsToLocalStorage,
} from "./persistance";
import { i, isRoot, Item } from "./utils/tree";
import { handleInsertModeKey, handleNormalModeKey } from "./keyboard";
import { clampOffset, scrollToSelectedItem } from "./scroll";
import { drawTree } from "./drawTree";
import { CursorState, getInitialCursorState } from "./cursor/cursor";
import { Edit } from "./cursor/edit";
import { onPlayerResize } from "./player/player";

document.body.style.backgroundColor = colors.bg;
document.body.appendChild(canvas);

export type AppState = {
    root: Item;
    focused: Item;
    focusedParagraph: Paragraph;

    itemPlaying?: Item;

    isItemAddedDuringRename: boolean;

    changeHistory: Edit[];
    currentChange: number;

    search: {
        currentSearchEntrance: number;
        occurences: number[];
    };

    cursorState: CursorState;
    //UI
    paragraphs: Paragraph[];
    paragraphsMap: WeakMap<Item, Paragraph>;
    canvas: {
        width: number;
        height: number;
        scale: number;
    };
    pageHeight: number;
    panelWidth: number;
    scrollOffset: number;

    player: {
        blur: number;
        brightness: number;
        videoView: "cover" | "contain";
    };
};

const initialRoot =
    loadItemsFromLocalStorage() || i("Root", [i("One"), i("Two")]);

const state: AppState = {
    root: initialRoot,
    focused: initialRoot,
    focusedParagraph: 0 as any,

    cursorState: getInitialCursorState(initialRoot),
    changeHistory: [],
    currentChange: -1,

    search: {
        currentSearchEntrance: 0,
        occurences: [],
    },

    isItemAddedDuringRename: false,
    paragraphs: [],
    paragraphsMap: new WeakMap(),
    canvas: { width: 0, height: 0, scale: 0 },
    pageHeight: 0,
    panelWidth: 0,
    scrollOffset: 0,

    player: {
        blur: 0,
        brightness: 0,
        videoView: "contain",
    },
};
// selectItem(state.root.children[0]);

//@ts-expect-error
window.state = state;

function onResize() {
    const width = window.innerWidth;
    const height = window.innerHeight - spacings.footer;
    const scale = window.devicePixelRatio || 1;
    state.canvas.width = width;
    state.canvas.height = height;
    state.canvas.scale = scale;

    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    canvas.width = Math.floor(width * scale);
    canvas.height = Math.floor(height * scale);
    ctx.scale(scale, scale);

    state.panelWidth = Math.min(state.canvas.width, spacings.maxWidth);

    onPlayerResize(state);
}
onResize();

window.addEventListener("resize", () => {
    onResize();
    buildParagraphs();
});

export function buildParagraphs() {
    ctx.font = `${spacings.titleFontWeight} ${spacings.titleFontSize}px ${spacings.font}`;
    state.focusedParagraph = buildParagraph(
        state.focused,
        12 + state.canvas.width / 2 - state.panelWidth / 2,
        20,
        state.panelWidth - 20 * 2
    );

    state.paragraphsMap.set(state.focused, state.focusedParagraph);

    const titleOffset = isRoot(state.focused)
        ? 12
        : state.focusedParagraph.totalHeight + 20;

    const { panelWidth } = state;
    let y = titleOffset;
    let x = spacings.hPadding + state.canvas.width / 2 - panelWidth / 2;
    ctx.font = `${spacings.fontWeight} ${spacings.fontSize}px ${spacings.font}`;

    state.paragraphs = [];
    const stack = state.focused.children
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
    if (SHOULD_PERSIST_TO_LOCAL_STORAGE) saveItemsToLocalStorage(state.root);
}

buildParagraphs();

function onTick(time: number) {
    drawTree(state);

    requestAnimationFrame(onTick);
}

document.body.addEventListener("keydown", async (e) => {
    let needtoRebuildUI = false;
    if (state.cursorState.mode == "normal") {
        needtoRebuildUI = await handleNormalModeKey(state, e);
    } else if (state.cursorState.mode == "insert")
        needtoRebuildUI = await handleInsertModeKey(state, e);

    if (needtoRebuildUI) {
        buildParagraphs();
        scrollToSelectedItem(state);
    }
});

document.body.addEventListener("wheel", (e) => {
    state.scrollOffset = clampOffset(state, state.scrollOffset + e.deltaY);
});

requestAnimationFrame(onTick);
