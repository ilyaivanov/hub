import type { AppState } from "./index";
import { loadFromFile, saveToFile } from "./persistance";
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
    }
}

function insertChartAtPosition(str: string, ch: string, index: number): string {
    return str.slice(0, index) + ch + str.slice(index);
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
    if (!item.isOpen) {
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
        state.selectedItem = item.parent;
        state.cursor = 0;
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

type Handler = { code: string; meta?: boolean; fn: (state: AppState) => void };

// order matters
const normalShortcuts: Handler[] = [
    { code: "KeyS", fn: saveRootToFile, meta: true },
    { code: "KeyO", fn: createItemAfterCurrent },
    { code: "KeyD", fn: removeSelected },
    { code: "KeyL", fn: loadRootFromFile, meta: true },
    { code: "KeyL", fn: moveSelectionRight },
    { code: "KeyH", fn: moveSelectionLeft },
    { code: "KeyJ", fn: moveSelectionDown },
    { code: "KeyK", fn: moveSelectionUp },
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
    return action.code == e.code && !!action.meta == e.metaKey;
}
export function handleNormalModeKey(state: AppState, e: KeyboardEvent) {
    for (let i = 0; i < normalShortcuts.length; i++) {
        const action = normalShortcuts[i];
        if (isShortcutMatches(action, e)) {
            action.fn(state);
            return true;
        }
    }
    return false;
}

export function handleInsertModeKey(state: AppState, e: KeyboardEvent) {
    for (let i = 0; i < insertShortcuts.length; i++) {
        const action = insertShortcuts[i];
        if (isShortcutMatches(action, e)) {
            action.fn(state);
            return true;
        }
    }
    if (e.key.length == 1) {
        state.selectedItem.title = insertChartAtPosition(
            state.selectedItem.title,
            e.key,
            state.cursor
        );
        state.cursor++;
        return true;
    }
    return false;
}
