import {
    changeSelection,
    insertStrAtCurrentPosition,
    jumpWordBackward,
    jumpWordForward,
    removeCurrentChar,
} from "./cursor";
import type { AppState } from "./index";
import {
    moveItemDown,
    moveItemLeft,
    moveItemRight,
    moveItemUp,
} from "./movement";
import { loadFromFile, saveToFile } from "./persistance";
import {
    getItemAbove,
    getItemBelow,
    getItemToSelectAfterRemovingSelected,
} from "./selection";
import { showMessage } from "./toasts";
import {
    addChange,
    itemAdded,
    itemRemoved,
    redoLastChange,
    registerRenameAction,
    undoLastChange,
} from "./undo";
import {
    addItemAt,
    i,
    insertItemAfter,
    insertItemBefore,
    isRoot,
    Item,
    removeItem,
} from "./utils/tree";

//actions
function saveRootToFile(state: AppState) {
    saveToFile(state.root);
}

function itemCreated(state: AppState, item: Item) {
    itemAdded(state, item);
    state.isItemAddedDuringRename = true;

    changeSelection(state, item);
    enterInsertMode(state);
}

function createItemAfterCurrent(state: AppState) {
    const newItem = i("");
    insertItemAfter(state.selectedItem, newItem);

    itemCreated(state, newItem);
}
function createItemBeforeCurrent(state: AppState) {
    const newItem = i("");
    insertItemBefore(state.selectedItem, newItem);

    itemCreated(state, newItem);
}
function createItemInsideCurrent(state: AppState) {
    const newItem = i("");
    addItemAt(state.selectedItem, newItem, 0);

    itemCreated(state, newItem);
}

function removeSelected(state: AppState) {
    const nextItem = getItemToSelectAfterRemovingSelected(state.selectedItem);
    itemRemoved(state, state.selectedItem);

    removeItem(state.selectedItem);
    if (nextItem) {
        changeSelection(state, nextItem);
    }
}
async function loadRootFromFile(state: AppState) {
    const newRoot = await loadFromFile();
    if (newRoot) {
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

function enterNormalMode(state: AppState) {
    state.mode = "Normal";
    if (state.isItemAddedDuringRename) {
        //TODO: when creating a new item you don't need to register a rename change
        // I have no other way to detect if I need to register a rename, besides setting this flag
        state.isItemAddedDuringRename = false;
    } else registerRenameAction(state);
}

function enterInsertMode(state: AppState) {
    state.insertModeItemTitle = state.selectedItem.title;
    state.mode = "Insert";
}

function moveSelectedItem(state: AppState, movement: (item: Item) => void) {
    const selected = state.selectedItem;
    const oldParent = selected.parent;
    const oldIndex = oldParent.children.indexOf(selected);

    movement(selected);

    const newParent = selected.parent;
    const newIndex = newParent.children.indexOf(selected);
    addChange(state, {
        type: "move",
        item: selected,
        oldIndex,
        oldParent,
        newIndex,
        newParent,
    });
}

function moveSelectedItemRight(state: AppState) {
    moveSelectedItem(state, moveItemRight);
}

function moveSelectedItemLeft(state: AppState) {
    moveSelectedItem(state, moveItemLeft);
}

function moveSelectedItemDown(state: AppState) {
    moveSelectedItem(state, moveItemDown);
}

function moveSelectedItemUp(state: AppState) {
    moveSelectedItem(state, moveItemUp);
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

function undoChange(state: AppState) {
    const change = undoLastChange(state);
    if (change) {
        if (change.type == "add") changeSelection(state, change.selected);
        else changeSelection(state, change.item);
    }
}

function redoChange(state: AppState) {
    const change = redoLastChange(state);
    if (change) {
        if (change.type == "remove")
            changeSelection(state, change.itemToSelect);
        else changeSelection(state, change.item);
    }
}

function replaceTitle(state: AppState) {
    enterInsertMode(state);
    state.selectedItem.title = "";
}

type Handler = {
    code: string;
    meta?: boolean;
    alt?: boolean;
    ctrl?: boolean;
    shift?: boolean;
    preventDefault?: boolean;
    fn: (state: AppState) => void | Promise<void>;
};

async function copySelectedItem(state: AppState) {
    const textToCopy = state.selectedItem.title;
    await navigator.clipboard.writeText(textToCopy);
    showMessage(textToCopy);
}

async function pasteSelectedItem(state: AppState) {
    const textToPaste = await navigator.clipboard.readText();
    state.insertModeItemTitle = state.selectedItem.title;
    insertStrAtCurrentPosition(state, textToPaste);
    registerRenameAction(state);
}

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

    { code: "KeyO", fn: createItemBeforeCurrent, shift: true },
    { code: "KeyO", fn: createItemInsideCurrent, ctrl: true },
    { code: "KeyO", fn: createItemAfterCurrent },
    { code: "Enter", fn: createItemAfterCurrent },

    { code: "KeyD", fn: removeSelected },
    { code: "KeyL", fn: loadRootFromFile, meta: true, preventDefault: true },

    { code: "KeyR", fn: replaceTitle },
    { code: "KeyI", fn: enterInsertMode },
    { code: "KeyW", fn: jumpWordForward },
    { code: "KeyB", fn: jumpWordBackward },
    { code: "Backspace", fn: removeCurrentChar },

    { code: "KeyU", fn: redoChange, shift: true },
    { code: "KeyU", fn: undoChange },

    { code: "KeyC", fn: copySelectedItem },
    { code: "KeyV", fn: pasteSelectedItem, meta: true },
];

const insertShortcuts: Handler[] = [
    { code: "Backspace", fn: removeCurrentChar },
    { code: "Enter", fn: createItemAfterCurrent },
    { code: "Escape", fn: enterNormalMode },
    { code: "KeyV", fn: pasteSelectedItem, meta: true },
];

function isShortcutMatches(action: Handler, e: KeyboardEvent) {
    return (
        action.code == e.code &&
        !!action.meta == e.metaKey &&
        !!action.alt == e.altKey &&
        !!action.ctrl == e.ctrlKey &&
        !!action.shift == e.shiftKey
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
        insertStrAtCurrentPosition(state, e.key);
        return true;
    }
    return false;
}
