import type { AppState } from "./index";
import {
    moveItemDown,
    moveItemLeft,
    moveItemRight,
    moveItemUp,
} from "./movement";
import { loadFromFile, saveToFile } from "./persistance";
import { clampOffset } from "./scroll";
import {
    getItemAbove,
    getItemBelow,
    getItemToSelectAfterRemovingSelected,
} from "./selection";
import { i, insertItemAfter, isRoot, Item, removeItem } from "./utils/tree";

//helpers
function changeSelection(state: AppState, item: Item | undefined) {
    if (item) {
        state.selectedItem = item;
        state.cursor = 0;

        const itemsToLookAhead = 3;

        const p = state.paragraphsMap.get(state.selectedItem);
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
}

function insertChartAtPosition(str: string, ch: string, index: number): string {
    return str.slice(0, index) + ch + str.slice(index);
}
function insertCharAtCurrentPosition(state: AppState, char: string) {
    state.selectedItem.title = insertChartAtPosition(
        state.selectedItem.title,
        char,
        state.cursor
    );
    state.cursor++;
}

//actions
function saveRootToFile(state: AppState) {
    saveToFile(state.root);
}

function createItemAfterCurrent(state: AppState) {
    const newItem = i("");
    insertItemAfter(state.selectedItem, newItem);
    changeSelection(state, newItem);
    state.mode = "Insert";
}

function removeSelected(state: AppState) {
    const nextItem = getItemToSelectAfterRemovingSelected(state.selectedItem);
    removeItem(state.selectedItem);
    if (nextItem) {
        changeSelection(state, nextItem);
    }
}
async function loadRootFromFile(state: AppState) {
    const newRoot = await loadFromFile();
    if (newRoot) {
        console.log(newRoot);
        state.root = newRoot;
        changeSelection(state, state.root.children[0]);
    }
}

function moveSelectionRight(state: AppState) {
    const item = state.selectedItem;
    if (!item.isOpen && item.children.length > 0) {
        item.isOpen = true;
    } else if (item.children.length > 0) {
        changeSelection(state, item.children[0]);
    }
}
function moveSelectionLeft(state: AppState) {
    const item = state.selectedItem;
    if (item.isOpen) {
        item.isOpen = false;
    } else if (!isRoot(item.parent)) {
        changeSelection(state, item.parent);
    }
}
function moveSelectionUp(state: AppState) {
    changeSelection(state, getItemAbove(state.selectedItem));
}
function moveSelectionDown(state: AppState) {
    changeSelection(state, getItemBelow(state.selectedItem));
}

function replaceTitle(state: AppState) {
    state.selectedItem.title = "";
    state.mode = "Insert";
}

function jumpWordForward(state: AppState) {
    state.cursor = state.selectedItem.title.indexOf(" ", state.cursor + 1) + 1;
}
function jumpWordBackward(state: AppState) {
    state.cursor =
        state.selectedItem.title.slice(0, state.cursor - 1).lastIndexOf(" ") +
        1;
}

function removeCurrentChar(state: AppState) {
    const title = state.selectedItem.title;
    const { cursor } = state;
    state.selectedItem.title = title.slice(0, cursor - 1) + title.slice(cursor);

    state.cursor--;
}

function enterNormalMode(state: AppState) {
    state.mode = "Normal";
}

function enterInsertMode(state: AppState) {
    state.mode = "Insert";
}

function moveSelectedItemRight(state: AppState) {
    moveItemRight(state.selectedItem);
}
function moveSelectedItemLeft(state: AppState) {
    moveItemLeft(state.selectedItem);
}
function moveSelectedItemDown(state: AppState) {
    moveItemDown(state.selectedItem);
}
function moveSelectedItemUp(state: AppState) {
    moveItemUp(state.selectedItem);
}

function selectNextSibling(state: AppState) {
    const children = state.selectedItem.parent.children;
    const index = state.selectedItem.parent.children.indexOf(
        state.selectedItem
    );
    if (index < children.length - 1)
        changeSelection(state, children[index + 1]);
}

function selectPrevSibling(state: AppState) {
    const children = state.selectedItem.parent.children;
    const index = state.selectedItem.parent.children.indexOf(
        state.selectedItem
    );
    if (index > 0) changeSelection(state, children[index - 1]);
}
function selectFirstChild(state: AppState) {
    if (state.selectedItem.children.length > 0) {
        state.selectedItem.isOpen = true;
        changeSelection(state, state.selectedItem.children[0]);
    }
}
function selectParent(state: AppState) {
    if (!isRoot(state.selectedItem.parent))
        changeSelection(state, state.selectedItem.parent);
}

type Handler = {
    code: string;
    meta?: boolean;
    alt?: boolean;
    ctrl?: boolean;
    preventDefault?: boolean;
    fn: (state: AppState) => void | Promise<void>;
};

// order matters
const normalShortcuts: Handler[] = [
    { code: "KeyH", fn: moveSelectedItemLeft, alt: true },
    { code: "KeyJ", fn: moveSelectedItemDown, alt: true },
    { code: "KeyK", fn: moveSelectedItemUp, alt: true },
    { code: "KeyL", fn: moveSelectedItemRight, alt: true },

    { code: "KeyH", fn: selectParent, ctrl: true },
    { code: "KeyJ", fn: selectNextSibling, ctrl: true },
    { code: "KeyK", fn: selectPrevSibling, ctrl: true },
    { code: "KeyL", fn: selectFirstChild, ctrl: true },

    { code: "KeyH", fn: moveSelectionLeft },
    { code: "KeyJ", fn: moveSelectionDown },
    { code: "KeyK", fn: moveSelectionUp },
    { code: "KeyL", fn: moveSelectionRight },

    { code: "KeyS", fn: saveRootToFile, meta: true },
    { code: "KeyO", fn: createItemAfterCurrent },
    { code: "KeyD", fn: removeSelected },
    { code: "KeyL", fn: loadRootFromFile, meta: true, preventDefault: true },

    { code: "KeyR", fn: replaceTitle },
    { code: "KeyI", fn: enterInsertMode },
    { code: "KeyW", fn: jumpWordForward },
    { code: "KeyB", fn: jumpWordBackward },
    { code: "KeyB", fn: jumpWordBackward },
    { code: "Backspace", fn: removeCurrentChar },
];

const insertShortcuts: Handler[] = [
    { code: "Backspace", fn: removeCurrentChar },
    { code: "Enter", fn: enterNormalMode },
    { code: "Escape", fn: enterNormalMode },
];

function isShortcutMatches(action: Handler, e: KeyboardEvent) {
    return (
        action.code == e.code &&
        !!action.meta == e.metaKey &&
        !!action.alt == e.altKey &&
        !!action.ctrl == e.ctrlKey
    );
}
export async function handleNormalModeKey(state: AppState, e: KeyboardEvent) {
    for (let i = 0; i < normalShortcuts.length; i++) {
        const action = normalShortcuts[i];
        if (isShortcutMatches(action, e)) {
            if (action.preventDefault) e.preventDefault();

            await action.fn(state);
            return true;
        }
    }
    return false;
}

export async function handleInsertModeKey(state: AppState, e: KeyboardEvent) {
    for (let i = 0; i < insertShortcuts.length; i++) {
        const action = insertShortcuts[i];
        if (isShortcutMatches(action, e)) {
            if (action.preventDefault) e.preventDefault();

            await action.fn(state);
            return true;
        }
    }
    if (e.key.length == 1) {
        insertCharAtCurrentPosition(state, e.key);
        return true;
    }
    return false;
}
