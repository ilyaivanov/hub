import {
    addItem,
    cancelSelection,
    createCursor,
    duplicateCursor,
    enterMode,
    expandCursor,
    getPrimaryCursor,
    insertText,
    moveCursor,
    removeSelectedItems,
    removeText,
} from "./cursor/cursor";
import { AppState, buildParagraphs } from "./index";
import { moveItems } from "./cursor/movement";
import { showMessage } from "./toasts";
import { redoLastChange, undoLastChange } from "./cursor/edit";
import { loadFromFile, saveToFile } from "./persistance";
import { scrollToSelectedItem } from "./scroll";

// //actions
// function saveRootToFile(state: AppState) {
//     saveToFile(state.root);
// }

// function createItemAfterCurrent(state: AppState) {
//     state.isItemAddedDuringRename = true;
//     const info = cursors.map((c) => {
//         const newItem = i("");
//         newItem.parent = c.item.parent;
//         return {
//             itemBefore: c.item,
//             positionBefore: c.position,
//             itemAfter: newItem,
//             positionAfter: 0,

//             positionOfItem: c.item.parent.children.indexOf(c.item) + 1,
//         };
//     });
//     itemAdded(state, info);
//     enterInsertMode(state);
// }

// function createItemBeforeCurrent(state: AppState) {
//     state.isItemAddedDuringRename = true;
//     const info = cursors.map((c) => {
//         const newItem = i("");
//         newItem.parent = c.item.parent;
//         return {
//             itemBefore: c.item,
//             positionBefore: c.position,
//             itemAfter: newItem,
//             positionAfter: 0,

//             positionOfItem: c.item.parent.children.indexOf(c.item),
//         };
//     });
//     itemAdded(state, info);
//     enterInsertMode(state);
// }
// function createItemInsideCurrent(state: AppState) {
//     state.isItemAddedDuringRename = true;
//     const info = cursors.map((c) => {
//         const newItem = i("");
//         newItem.parent = c.item;
//         return {
//             itemBefore: c.item,
//             positionBefore: c.position,
//             itemAfter: newItem,
//             positionAfter: 0,

//             positionOfItem: 0,
//         };
//     });
//     itemAdded(state, info);
//     enterInsertMode(state);
// }

// function removeSelected(state: AppState) {
//     const info = cursors.map((c) => ({
//         itemBefore: c.item,
//         positionBefore: c.position,
//         positionOfItem: c.item.parent.children.indexOf(c.item),
//         itemAfter: getItemToSelectAfterRemovingSelected(c.item)!,
//         positionAfter: 0,
//     }));

//     itemRemoved(state, info);
// }

// async function loadRootFromFile(state: AppState) {
//     const newRoot = await loadFromFile();
//     if (newRoot) {
//         state.root = newRoot;
//         changeSelection(state, state.root.children[0]);
//     }
// }

// function moveSelectionRight(state: AppState) {
//     forEachCursor((cursor) => {
//         const item = cursor.item;
//         if (!item.isOpen && item.children.length > 0) {
//             item.isOpen = true;
//         } else if (item.children.length > 0) {
//             cursor.item = item.children[0];
//         }
//     });
// }

// function moveSelectionDown(state: AppState) {
//     forEachCursor((cursor) => {
//         const itemBelow = getItemBelow(cursor.item);
//         if (itemBelow) {
//             cursor.item = itemBelow;
//             cursor.position = 0;
//             cursor.selectionStart = -1;
//         }
//     });
// }

// function expandSelectionLeft(state: AppState) {
//     const cursor = cursors[0];
//     if (cursor.selectionStart == -1) {
//         cursor.selectionStart = cursor.position;
//     }
//     cursors[0].position--;
// }

// function moveCursorRight(state: AppState) {
//     const cursor = cursors[0];
//     cursor.selectionStart = -1;
//     cursor.position = clamp(cursor.position + 1, 0, cursor.item.title.length);
// }

// function moveCursorLeft(state: AppState) {
//     const cursor = cursors[0];
//     cursor.selectionStart = -1;

//     cursor.position = clamp(cursor.position - 1, 0, cursor.item.title.length);
// }

// function enterInsertMode(state: AppState) {
//     onEditStart();
//     state.mode = "Insert";
// }

// function moveCursorToStart(state: AppState) {
//     const cursor = cursors[0];
//     cursor.selectionStart = -1;
//     cursor.position = 0;
// }

// function moveCursorToEnd(state: AppState) {
//     const cursor = cursors[0];
//     cursor.selectionStart = -1;
//     cursor.position = cursor.item.title.length;
// }

// function enterNormalMode(state: AppState) {
// state.mode = "Normal";
// if (state.isItemAddedDuringRename) {
//     // TODO: when creating a new item you don't need to register a rename change
//     // I have no other way to detect if I need to register a rename, besides setting this flag
//     state.isItemAddedDuringRename = false;
// } else itemRenamed(state);
// }

// function moveSelectedItem(state: AppState, movement: (item: Item) => void) {
//     const selected = state.selectedItem;
//     const oldParent = selected.parent;
//     const oldIndex = oldParent.children.indexOf(selected);

//     movement(selected);

//     const newParent = selected.parent;
//     const newIndex = newParent.children.indexOf(selected);
//     addChange(state, {
//         type: "move",
//         item: selected,
//         oldIndex,
//         oldParent,
//         newIndex,
//         newParent,
//     });
// }

// function moveSelectedItemRight(state: AppState) {
//     moveSelectedItem(state, moveItemRight);
// }

// function moveSelectedItemLeft(state: AppState) {
//     moveSelectedItem(state, moveItemLeft);
// }

// function moveSelectedItemDown(state: AppState) {
//     moveSelectedItem(state, moveItemDown);
// }

// function moveSelectedItemUp(state: AppState) {
//     moveSelectedItem(state, moveItemUp);
// }

// function selectNextSibling(state: AppState) {
//     const children = state.selectedItem.parent.children;
//     const index = state.selectedItem.parent.children.indexOf(
//         state.selectedItem
//     );
//     if (index < children.length - 1)
//         changeSelection(state, children[index + 1]);
// }

// function selectPrevSibling(state: AppState) {
//     const children = state.selectedItem.parent.children;
//     const index = state.selectedItem.parent.children.indexOf(
//         state.selectedItem
//     );
//     if (index > 0) changeSelection(state, children[index - 1]);
// }
// function selectFirstChild(state: AppState) {
//     if (state.selectedItem.children.length > 0) {
//         state.selectedItem.isOpen = true;
//         changeSelection(state, state.selectedItem.children[0]);
//     }
// }
// function selectParent(state: AppState) {
//     if (!isRoot(state.selectedItem.parent))
//         changeSelection(state, state.selectedItem.parent);
// }

// function undoChange(state: AppState) {
//     undoLastChange(state);
// }

// function redoChange(state: AppState) {
//     redoLastChange(state);
// }

// function replaceTitle(state: AppState) {
//     enterInsertMode(state);
//     forEachCursor((c) => (c.item.title = ""));
// }

// function expandSelectionByWordForward(state: AppState) {
//     forEachCursor((c) => {
//         if (c.selectionStart == -1) c.selectionStart = c.position;
//     });
//     jumpWordForward();
// }

// function expandSelectionByWordBackward(state: AppState) {
//     forEachCursor((c) => {
//         if (c.selectionStart == -1) c.selectionStart = c.position;
//     });
//     jumpWordBackward();
// }

// function jumpWordForwardAction(state: AppState) {
//     forEachCursor((c) => (c.selectionStart = -1));
//     jumpWordForward();
// }

// function jumpWordBackwardAction(state: AppState) {
//     forEachCursor((c) => (c.selectionStart = -1));
//     jumpWordBackward();
// }

// function expandSelectionDown(state: AppState) {
//     const itemBelow = getItemBelow(cursors[0].item);
//     if (itemBelow) {
//         if (cursors.find((c) => c.item == itemBelow)) cursors.shift();
//         else cursors.unshift(createCursor(itemBelow, 0));
//     }
// }

// function expandSelectionUp(state: AppState) {
//     const itemAbove = getItemAbove(cursors[0].item);
//     if (itemAbove) {
//         if (cursors.find((c) => c.item == itemAbove)) cursors.shift();
//         else cursors.unshift(createCursor(itemAbove, 0));
//     }
// }

type Handler = {
    code: string;
    meta?: boolean;
    alt?: boolean;
    ctrl?: boolean;
    shift?: boolean;
    preventDefault?: boolean;
    fn: (state: AppState) => void | Promise<void>;
};

// order matters
const normalShortcuts: Handler[] = [
    { code: "KeyF", fn: (s) => moveCursor(s, "jump-char-right") },
    { code: "KeyA", fn: (s) => moveCursor(s, "jump-char-left") },

    { code: "KeyH", fn: (s) => moveItems(s, "left"), alt: true },
    { code: "KeyJ", fn: (s) => moveItems(s, "down"), alt: true },
    { code: "KeyK", fn: (s) => moveItems(s, "up"), alt: true },
    { code: "KeyL", fn: (s) => moveItems(s, "right"), alt: true },

    // { code: "KeyH", fn: selectParent, ctrl: true },
    { code: "KeyJ", fn: (s) => moveCursor(s, "jump-next-sibling"), ctrl: true },
    { code: "KeyK", fn: (s) => moveCursor(s, "jump-prev-sibling"), ctrl: true },
    { code: "KeyL", fn: (s) => moveCursor(s, "jump-item-right"), ctrl: true },
    { code: "KeyH", fn: (s) => moveCursor(s, "jump-parent"), ctrl: true },

    //prettier-ignore
    { code: "KeyJ", fn: (s) => duplicateCursor(s, "down-jump"), shift: true, alt: true },
    //prettier-ignore
    { code: "KeyK", fn: (s) => duplicateCursor(s, "up-jump"), shift: true, alt: true },

    { code: "KeyJ", fn: (s) => duplicateCursor(s, "down"), shift: true },
    { code: "KeyK", fn: (s) => duplicateCursor(s, "up"), shift: true },
    // prettier-ignore
    { code: "KeyW", fn: (s) => duplicateCursor(s, "word-right"), alt: true, preventDefault: true },
    // prettier-ignore
    { code: "KeyB", fn: (s) => duplicateCursor(s, "word-left"), alt: true, preventDefault: true },

    // { code: "KeyH", fn: moveSelectionLeft },
    { code: "KeyL", fn: (s) => moveCursor(s, "jump-item-right") },
    { code: "KeyJ", fn: (s) => moveCursor(s, "jump-item-down") },
    { code: "KeyK", fn: (s) => moveCursor(s, "jump-item-up") },
    { code: "KeyH", fn: (s) => moveCursor(s, "jump-item-left") },

    { code: "KeyW", fn: (s) => moveCursor(s, "jump-word-left") },
    { code: "KeyB", fn: (s) => moveCursor(s, "jump-word-right") },

    // { code: "KeyL", fn: moveSelectionRight },

    // { code: "KeyJ", fn: expandSelectionDown, meta: true },
    // { code: "KeyK", fn: expandSelectionUp, meta: true },

    { code: "KeyA", fn: (s) => expandCursor(s, "jump-char-left"), shift: true },
    // prettier-ignore
    { code: "KeyF", fn: s => expandCursor(s, "jump-char-right"), shift: true },
    // prettier-ignore
    { code: "KeyW", fn: s => expandCursor(s, "jump-word-left"), shift: true },
    // prettier-ignore
    { code: "KeyB", fn: (s) => expandCursor(s, "jump-word-right"), shift: true },

    // { code: "KeyA", fn: moveCursorLeft },
    // { code: "KeyF", fn: moveCursorRight },

    // prettier-ignore
    { code: "KeyS", fn: (s) => saveToFile(s.root), meta: true, preventDefault: true },
    { code: "KeyL", fn: loadRootFromFile, meta: true, preventDefault: true },

    { code: "KeyO", fn: (s) => addItem(s, "before"), shift: true },
    { code: "KeyO", fn: (s) => addItem(s, "inside"), ctrl: true },
    { code: "KeyO", fn: (s) => addItem(s, "after") },
    // { code: "Enter", fn: createItemAfterCurrent },
    { code: "KeyD", fn: removeSelectedItems },
    // { code: "KeyR", fn: replaceTitle },

    { code: "KeyI", fn: (s) => enterMode(s, "insert") },

    // { code: "KeyW", fn: expandSelectionByWordForward, shift: true },
    // { code: "KeyB", fn: expandSelectionByWordBackward, shift: true },
    // { code: "KeyW", fn: jumpWordForwardAction },
    // { code: "KeyB", fn: jumpWordBackwardAction },

    { code: "Backspace", fn: (s) => removeText(s, "left") },
    { code: "KeyX", fn: (s) => removeText(s, "right") },

    { code: "Escape", fn: cancelSelection },
    { code: "KeyU", fn: redoLastChange, shift: true },
    { code: "KeyU", fn: undoLastChange },

    { code: "Digit0", fn: (s) => moveCursor(s, "jump-item-start") },
    { code: "Digit4", fn: (s) => moveCursor(s, "jump-item-end"), shift: true },

    { code: "KeyC", fn: copySelectedItem },
    { code: "KeyV", fn: pasteSelectedItem, meta: true },

    // { code: "Digit1", fn: insertDumyItem1, meta: true, preventDefault: true },
    // { code: "Digit2", fn: insertDumyItem2, meta: true, preventDefault: true },
    // { code: "Digit3", fn: insertDumyItem3, meta: true, preventDefault: true },
];

const insertShortcuts: Handler[] = [
    { code: "Backspace", fn: (s) => removeText(s, "left") },
    // { code: "Enter", fn: createItemAfterCurrent },
    { code: "Escape", fn: (s) => enterMode(s, "normal") },
    { code: "KeyV", fn: pasteSelectedItem, meta: true, preventDefault: true },
];

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
        insertText(state, e.key);
        return true;
    }
    return false;
}

async function loadRootFromFile(state: AppState) {
    const res = await loadFromFile();
    if (res) {
        state.root = res;
        state.cursorState.cursors = [createCursor(state.root.children[0])];
        buildParagraphs();
        scrollToSelectedItem(state);
    }
}

function isShortcutMatches(action: Handler, e: KeyboardEvent) {
    return (
        action.code == e.code &&
        !!action.meta == e.metaKey &&
        !!action.alt == e.altKey &&
        !!action.ctrl == e.ctrlKey &&
        !!action.shift == e.shiftKey
    );
}

async function pasteSelectedItem(state: AppState) {
    let textToPaste = await navigator.clipboard.readText();
    textToPaste = textToPaste.replace("\n", "");
    insertText(state, textToPaste);
}

async function copySelectedItem(state: AppState) {
    const textToCopy = getPrimaryCursor(state).item.title;
    await navigator.clipboard.writeText(textToCopy);
    showMessage(textToCopy);
}
