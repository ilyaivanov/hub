import {
    addItem,
    breakItemIntoTwo,
    cancelSelection,
    createCursor,
    duplicateCursor,
    enterMode,
    expandCursor,
    getPrimaryCursor,
    insertText,
    loadMoreItems,
    moveCursor,
    removeSelectedItems,
    removeText,
    replaceTitle,
} from "./cursor/cursor";
import { AppState, buildParagraphs } from "./index";
import { moveItems } from "./cursor/movement";
import { showMessage } from "./toasts";
import { redoLastChange, undoLastChange } from "./cursor/edit";
import { loadFromFile, saveToFile } from "./persistance";
import { scrollToSelectedItem } from "./scroll";
import {
    addItemAt,
    createItem,
    createYtSearchItem,
    folder,
    getIndexOf,
} from "./utils/tree";
import {
    playItem,
    togglePlay,
    updatePlayerBrightness,
    updateVideoViewButton,
} from "./player/player";
import { getFolderContent } from "./utils/files";
import { getItemAbove, getItemBelow } from "./selection";

type Handler = {
    code: string;
    meta?: boolean;
    alt?: boolean;
    ctrl?: boolean;
    shift?: boolean;
    noDef?: boolean;
    fn: (state: AppState) => void | Promise<void>;
};

// order matters
const normalShortcuts: Handler[] = [
    { code: "KeyY", fn: addYoutubeSearchItem, meta: true, shift: true },
    { code: "KeyY", fn: showYoutubeChannel, alt: true },

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
    { code: "KeyW", fn: (s) => duplicateCursor(s, "word-right"), alt: true, noDef: true },
    // prettier-ignore
    { code: "KeyB", fn: (s) => duplicateCursor(s, "word-left"), alt: true, noDef: true },

    { code: "KeyL", fn: (s) => moveCursor(s, "jump-item-right") },
    { code: "KeyJ", fn: (s) => moveCursor(s, "jump-item-down") },
    { code: "KeyK", fn: (s) => moveCursor(s, "jump-item-up") },
    { code: "KeyH", fn: (s) => moveCursor(s, "jump-item-left") },

    { code: "KeyW", fn: (s) => moveCursor(s, "jump-word-left") },
    { code: "KeyB", fn: (s) => moveCursor(s, "jump-word-right") },

    { code: "KeyA", fn: (s) => expandCursor(s, "jump-char-left"), shift: true },
    // prettier-ignore
    { code: "KeyF", fn: s => expandCursor(s, "jump-char-right"), shift: true },
    // prettier-ignore
    { code: "KeyW", fn: s => expandCursor(s, "jump-word-left"), shift: true },
    // prettier-ignore
    { code: "KeyB", fn: (s) => expandCursor(s, "jump-word-right"), shift: true },

    // prettier-ignore
    { code: "KeyS", fn: (s) => saveToFile(s.root), meta: true, noDef: true },
    { code: "KeyL", fn: loadRootFromFile, meta: true, noDef: true },

    { code: "KeyO", fn: (s) => addItem(s, "before"), shift: true },
    { code: "KeyO", fn: (s) => addItem(s, "inside"), ctrl: true },
    { code: "KeyO", fn: (s) => addItem(s, "after") },
    { code: "KeyD", fn: removeSelectedItems },
    { code: "KeyR", fn: replaceTitle },

    { code: "KeyI", fn: (s) => enterMode(s, "insert") },

    { code: "KeyI", fn: (s) => document.body.requestFullscreen(), meta: true },

    { code: "Backspace", fn: (s) => removeText(s, "left") },
    { code: "KeyX", fn: (s) => removeText(s, "right"), meta: true },

    { code: "Escape", fn: cancelSelection },
    { code: "KeyU", fn: redoLastChange, shift: true },
    { code: "KeyU", fn: undoLastChange },

    { code: "Digit0", fn: (s) => moveCursor(s, "jump-item-start") },
    { code: "Digit4", fn: (s) => moveCursor(s, "jump-item-end"), shift: true },

    { code: "KeyC", fn: copySelectedItem, meta: true },
    { code: "KeyV", fn: pasteSelectedItem, meta: true },

    { code: "KeyO", fn: addFolder, meta: true, noDef: true },

    {
        code: "KeyF",
        fn: (s) => {
            s.focused = getPrimaryCursor(s).item;
        },
        ctrl: true,
    },

    {
        code: "KeyF",
        fn: (s) => {
            const oldFocus = s.focused;
            if (s.focused.parent) s.focused = s.focused.parent;

            if (!oldFocus.isOpen)
                s.cursorState.cursors = [createCursor(oldFocus)];
        },
        ctrl: true,
        shift: true,
    },

    { code: "Tab", fn: (s) => moveItems(s, "left"), shift: true, noDef: true },
    { code: "Tab", fn: (s) => moveItems(s, "right"), noDef: true },

    { code: "Enter", fn: breakItemIntoTwo },

    { code: "Space", fn: playSelected },
    { code: "KeyZ", fn: playPrev },
    { code: "KeyX", fn: playPause },
    { code: "KeyC", fn: playNext },

    { code: "KeyV", fn: toggleVideoView },
];

function playPrev(state: AppState) {
    if (state.itemPlaying) {
        let prev = getItemAbove(state.itemPlaying);
        if (prev) playItem(state, prev);
    }
}
function playPause(state: AppState) {
    togglePlay(state);
}
function playNext(state: AppState) {
    if (state.itemPlaying) {
        let prev = getItemBelow(state, state.itemPlaying);
        if (prev) playItem(state, prev);
    }
}

function toggleVideoView(state: AppState) {
    state.player.videoView =
        state.player.videoView == "contain" ? "cover" : "contain";
    updateVideoViewButton(state);
}

const insertShortcuts: Handler[] = [
    { code: "Backspace", fn: (s) => removeText(s, "left") },
    { code: "Enter", fn: breakItemIntoTwo },
    { code: "Escape", fn: (s) => enterMode(s, "normal") },
    { code: "Tab", fn: (s) => moveItems(s, "left"), shift: true, noDef: true },
    { code: "Tab", fn: (s) => moveItems(s, "right"), noDef: true },
    { code: "KeyV", fn: pasteSelectedItem, meta: true, noDef: true },
];

export async function handleNormalModeKey(state: AppState, e: KeyboardEvent) {
    const player = state.player;
    if (e.altKey && e.code.startsWith("Digit")) {
        const digit = +e.code.substring("Digit".length);
        if (player.brightness != 100 && digit == 0) player.brightness = 100;
        else player.brightness = digit * 10;

        updatePlayerBrightness(state);
    } else {
        for (let i = 0; i < normalShortcuts.length; i++) {
            const action = normalShortcuts[i];
            if (isShortcutMatches(action, e)) {
                if (action.noDef) e.preventDefault();

                await action.fn(state);
                return true;
            }
        }
    }
    return false;
}

export async function handleInsertModeKey(state: AppState, e: KeyboardEvent) {
    for (let i = 0; i < insertShortcuts.length; i++) {
        const action = insertShortcuts[i];
        if (isShortcutMatches(action, e)) {
            if (action.noDef) e.preventDefault();

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

function addYoutubeSearchItem(state: AppState) {
    const item = getPrimaryCursor(state).item;
    const search = createYtSearchItem();
    addItemAt(item.parent, search, getIndexOf(item));
    state.cursorState.cursors = [createCursor(search)];
    enterMode(state, "insert");
}

async function loadRootFromFile(state: AppState) {
    const res = await loadFromFile();
    if (res) {
        state.root = res;
        state.focused = res;
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

function showYoutubeChannel(state: AppState) {
    const item = getPrimaryCursor(state).item;
    if (item.ytChannelId && item.ytChannelTitle) {
        const channel = createItem("yt-channel", item.ytChannelTitle);
        channel.itemId = item.ytChannelId;
        addItemAt(item.parent, channel, getIndexOf(item));

        state.cursorState.cursors = [createCursor(channel)];
    }
}

async function addFolder(state: AppState) {
    const openFileFn: any = window.showDirectoryPicker;
    if (openFileFn) {
        try {
            const fileHandle = await openFileFn();
            const children = await getFolderContent(fileHandle);
            const f = folder(fileHandle.name, fileHandle, children);
            addItemAt(state.focused, f, state.focused.children.length);
        } catch (e) {
            if (!(e instanceof DOMException && e.name == "AbortError")) {
                throw e;
            }
        }
    }
}

async function playSelected(state: AppState) {
    const item = getPrimaryCursor(state).item;
    if (item.type == "yt-load-more") loadMoreItems(state, item);
    else playItem(state, item);
}
