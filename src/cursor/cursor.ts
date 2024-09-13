import { AppState, buildParagraphs } from "../index";
import { scrollToSelectedItem } from "../scroll";
import {
    getItemAbove,
    getItemBelow,
    getItemToSelectAfterRemovingSelected,
} from "../selection";
import { getFolderContent } from "../utils/files";
import {
    addItemAt,
    addItemsAt,
    createLoadMoreItem,
    getIndexOf,
    getLoadMoreTypeForItem,
    i,
    isParentOrSame,
    isRoot,
    Item,
    removeItem,
    replaceChildren,
} from "../utils/tree";
import {
    findPlaylistVideos,
    getChannelInfo,
    MyResponse,
    searchYoutube,
} from "../youtubeApi";
import { AdditionInfo, editTree, RenameInfo } from "./edit";

export type Cursor = {
    item: Item;
    position: number;
    selectionStart: number;
    titleBeforeEnteringInsertMode: string | undefined;
    positionBeforeEnteringInsertMode: number;
};

export type CursorState = {
    cursors: Cursor[];
    mode: "normal" | "insert";
    addedNewItemBeforeInsert: boolean;
};

export function getInitialCursorState(root: Item): CursorState {
    return {
        mode: "normal",
        cursors: [createCursor(root.children[1])],
        addedNewItemBeforeInsert: false,
    };
}

export function forEachCursor(state: AppState, fn: (c: Cursor) => void) {
    state.cursorState.cursors.forEach(fn);
}

export function getPrimaryCursor(state: AppState): Cursor {
    return state.cursorState.cursors[0];
}

function performMovement(state: AppState, movement: CursorMovement) {
    //prettier-ignore
    if      (movement == "jump-char-right")   jumpCharRight(state);
    else if (movement == "jump-char-left")    jumpCharLeft(state);
    else if (movement == "jump-item-end")     jumpToEnd(state);
    else if (movement == "jump-item-start")   jumpToStart(state);
    else if (movement == "jump-item-down")    moveSelectionDown(state);
    else if (movement == "jump-item-up")      moveSelectionUp(state);
    else if (movement == "jump-item-right")   moveSelectionRight(state);
    else if (movement == "jump-item-left")    moveSelectionLeft(state);
    else if (movement == "jump-word-left")    jumpWordForward(state);
    else if (movement == "jump-word-right")   jumpWordBackward(state);
    else if (movement == "jump-next-sibling") jumpNextSibling(state);
    else if (movement == "jump-prev-sibling") jumpPrevSibling(state);
    else if (movement == "jump-parent")       jumpParent(state);
    else assertNever(movement);

    removeDuplicatedCursors(state);
}

export function moveCursor(state: AppState, movement: CursorMovement) {
    performMovement(state, movement);
    forEachCursor(state, (c) => (c.selectionStart = -1));

    scrollToSelectedItem(state);
}

export function expandCursor(state: AppState, movement: CursorMovement) {
    forEachCursor(state, (c) => {
        if (c.selectionStart == -1) c.selectionStart = c.position;
    });
    performMovement(state, movement);

    forEachCursor(state, (c) => {
        if (c.selectionStart == c.position) c.selectionStart = -1;
    });
}

export function enterMode(state: AppState, mode: CursorState["mode"]) {
    state.cursorState.mode = mode;

    if (mode == "insert")
        forEachCursor(state, (c) => {
            c.titleBeforeEnteringInsertMode = c.item.title;
            c.positionBeforeEnteringInsertMode = c.position;
        });

    if (mode == "normal") {
        forEachCursor(state, (c) => {
            const renameFn = c.item.handle && (c.item.handle as any).move;
            if (renameFn) renameFn.call(c.item.handle, c.item.title);
        });
        if (state.isItemAddedDuringRename) {
            state.isItemAddedDuringRename = false;
        } else {
            triggerRenameAction(state);
        }

        forEachCursor(state, (c) => {
            if (
                c.item.type == "yt-search" &&
                c.item.title.length > 0 &&
                c.item.title != c.titleBeforeEnteringInsertMode
            ) {
                performSearch(state, c.item);
            }
        });
    }
}

export function insertText(state: AppState, text: string) {
    state.cursorState.cursors.forEach((cursor) => {
        const newTitle = insertStrAtPosition(
            cursor.item.title,
            text,
            cursor.position
        );

        forEachCursor(state, (c) => {
            if (c.item == cursor.item && c.position > cursor.position)
                c.position += text.length;
        });

        cursor.item.title = newTitle;
        cursor.position += text.length;
    });
}

export function triggerRenameAction(state: AppState) {
    const renames: RenameInfo[] = state.cursorState.cursors
        .filter(
            (cursor) =>
                cursor.titleBeforeEnteringInsertMode != cursor.item.title
        )
        .map((cursor) => {
            return {
                item: cursor.item,
                oldTitle:
                    cursor.titleBeforeEnteringInsertMode ||
                    "ERROR!!! Haven't set titleBeforeEnteringInsertMode before insert mode",
                newTitle: cursor.item.title,
            };
        });

    if (renames.length > 0) editTree(state, { type: "rename", items: renames });
}

export function removeText(state: AppState, removeFrom: "left" | "right") {
    forEachCursor(state, (cursor) => {
        if (cursor.selectionStart != -1) {
            const from = Math.min(cursor.selectionStart, cursor.position);
            const to = Math.max(cursor.selectionStart, cursor.position);
            const title = cursor.item.title;
            cursor.item.title = title.slice(0, from) + title.slice(to);

            // move other cursors on the same items
            forEachCursor(state, (c) => {
                if (c.item == cursor.item && c.position > cursor.position) {
                    c.position -= to - from;

                    if (c.selectionStart != -1) c.selectionStart -= to - from;
                }
            });

            if (cursor.selectionStart < cursor.position)
                cursor.position = cursor.selectionStart;

            cursor.selectionStart = -1;
        } else if (removeFrom == "left") {
            if (cursor.position > 0) {
                const title = cursor.item.title;
                cursor.item.title =
                    title.slice(0, cursor.position - 1) +
                    title.slice(cursor.position);

                forEachCursor(state, (c) => {
                    if (c.item == cursor.item && c.position > cursor.position)
                        c.position -= 1;
                });

                cursor.position--;
            }
        } else if (removeFrom == "right") {
            if (cursor.position < cursor.item.title.length) {
                const title = cursor.item.title;
                cursor.item.title =
                    title.slice(0, cursor.position) +
                    title.slice(cursor.position + 1);

                forEachCursor(state, (c) => {
                    if (c.item == cursor.item && c.position > cursor.position)
                        c.position -= 1;
                });
            }
        } else assertNever(removeFrom);

        removeDuplicatedCursors(state);
    });
}

export function removeSelectedItems(state: AppState) {
    let nextItem = getItemToSelectAfterRemovingSelected(
        getPrimaryCursor(state).item
    );

    const selectedItems = state.cursorState.cursors.map((c) => c.item);
    while (nextItem && selectedItems.indexOf(nextItem) != -1)
        nextItem = getItemToSelectAfterRemovingSelected(nextItem);

    editTree(state, {
        type: "remove",
        items: state.cursorState.cursors.map((c) => ({
            item: c.item,
            position: c.item.parent.children.indexOf(c.item),
        })),
        itemToSelectNext: nextItem,
    });

    if (nextItem) state.cursorState.cursors = [createCursor(nextItem)];
    else state.cursorState.cursors = [];
}

export function addItem(state: AppState, where: "after" | "before" | "inside") {
    const cursors = [...state.cursorState.cursors];

    const items: AdditionInfo[] = cursors.map((c) => {
        const newItem = i("");
        const parent = where == "inside" ? c.item : c.item.parent;
        const currentIndex = c.item.parent.children.indexOf(c.item);
        let position = 0;
        if (where == "inside") position = 0;
        else if (where == "after") position = currentIndex + 1;
        else if (where == "before") position = currentIndex;
        else assertNever(where);

        return {
            item: newItem,
            parent,
            position,
        };
    });

    items.sort((a, b) => b.position - a.position);

    editTree(state, { type: "add", items });

    state.isItemAddedDuringRename = true;
    enterMode(state, "insert");
}

export function replaceTitle(state: AppState) {
    enterMode(state, "insert");
    forEachCursor(state, (c) => {
        c.item.title = "";
    });
}

export function cancelSelection(state: AppState) {
    if (state.cursorState.cursors.find((c) => c.selectionStart != -1))
        forEachCursor(state, (c) => (c.selectionStart = -1));
    else state.cursorState.cursors = [getPrimaryCursor(state)];
}

type DuplicateDirection =
    | "down"
    | "up"
    | "word-left"
    | "word-right"
    | "down-jump"
    | "up-jump";
export function duplicateCursor(
    state: AppState,
    direction: DuplicateDirection
) {
    if (direction == "down") expandSelectionDown(state);
    else if (direction == "up") expandSelectionUp(state);
    else if (direction == "up-jump") expandSelectionUp(state, 1);
    else if (direction == "down-jump") expandSelectionDown(state, 1);
    else if (direction == "word-left") expandSelectionWordLeft(state);
    else if (direction == "word-right") expandSelectionWordRight(state);

    scrollToSelectedItem(state);
}

export function breakItemIntoTwo(state: AppState) {
    forEachCursor(state, (c) => {
        const title = c.item.title;
        c.item.title = title.substring(0, c.position);
        const newItem = i(title.substring(c.position));
        c.position = 0;
        c.selectionStart = -1;
        addItemAt(c.item.parent, newItem, getIndexOf(c.item) + 1);
        c.item = newItem;
    });
}

type CursorMovement =
    | "jump-char-right"
    | "jump-char-left"
    | "jump-word-right"
    | "jump-word-left"
    | "jump-item-down"
    | "jump-item-up"
    | "jump-item-left"
    | "jump-item-right"
    | "jump-item-end"
    | "jump-next-sibling"
    | "jump-prev-sibling"
    | "jump-parent"
    | "jump-item-start";

function removeDuplicatedCursors(state: AppState) {
    const uniqueCursors: Cursor[] = [];

    forEachCursor(state, (cursor) => {
        const hasCursor = uniqueCursors.find(
            (c) => cursor.item == c.item && cursor.position == c.position
        );
        if (!hasCursor) uniqueCursors.push(cursor);
    });

    state.cursorState.cursors = uniqueCursors;
}

function jumpWordForward(state: AppState) {
    forEachCursor(state, (cursor) => {
        if (cursor.position < cursor.item.title.length) {
            let nextIndex =
                cursor.item.title.indexOf(" ", cursor.position + 1) + 1;
            if (nextIndex == 0) nextIndex = cursor.item.title.length;
            cursor.position = nextIndex;
        }
    });
}

function jumpWordBackward(state: AppState) {
    forEachCursor(state, (cursor) => {
        if (cursor.position > 0) {
            const nextIndex =
                cursor.item.title
                    .slice(0, cursor.position - 1)
                    .lastIndexOf(" ") + 1;
            cursor.position = nextIndex;
        }
    });
}

function jumpCharRight(state: AppState) {
    forEachCursor(state, (c) => {
        if (c.position < c.item.title.length) c.position += 1;
    });
}

function jumpCharLeft(state: AppState) {
    forEachCursor(state, (c) => {
        if (c.position > 0) c.position -= 1;
    });
}

function jumpToEnd(state: AppState) {
    forEachCursor(state, (c) => (c.position = c.item.title.length));
}

function jumpToStart(state: AppState) {
    forEachCursor(state, (c) => (c.position = 0));
}
function moveSelectionUp(state: AppState) {
    forEachCursor(state, (cursor) => {
        const itemAbove = getItemAbove(cursor.item);
        if (itemAbove && isParentOrSame(itemAbove, state.focused)) {
            cursor.item = itemAbove;
            cursor.position = 0;
            cursor.selectionStart = -1;
        }
    });
}

function moveSelectionDown(state: AppState) {
    forEachCursor(state, (cursor) => {
        const itemBelow = getItemBelow(state, cursor.item);
        if (itemBelow && isParentOrSame(itemBelow, state.focused)) {
            cursor.item = itemBelow;
            cursor.position = 0;
            cursor.selectionStart = -1;
        }
    });
}

function jumpNextSibling(state: AppState) {
    forEachCursor(state, (cursor) => {
        const context = cursor.item.parent.children;
        const index = context.indexOf(cursor.item);
        if (index < context.length - 1) {
            cursor.item = context[index + 1];
            cursor.position = 0;
            cursor.selectionStart = -1;
        }
    });
}
function jumpPrevSibling(state: AppState) {
    forEachCursor(state, (cursor) => {
        const context = cursor.item.parent.children;
        const index = context.indexOf(cursor.item);
        if (index > 0) {
            cursor.item = context[index - 1];
            cursor.position = 0;
            cursor.selectionStart = -1;
        }
    });
}
function jumpParent(state: AppState) {
    forEachCursor(state, (c) => {
        if (
            !isRoot(c.item.parent) &&
            isParentOrSame(state.focused, c.item.parent)
        ) {
            c.item = c.item.parent;
            c.position = 0;
        }
    });
}

function moveSelectionLeft(state: AppState) {
    forEachCursor(state, (cursor) => {
        const item = cursor.item;
        if (item.isOpen) {
            item.isOpen = false;
        } else if (!isRoot(item.parent)) {
            cursor.item = item.parent;
            cursor.position = 0;
        }
    });
}

async function openItem(state: AppState, item: Item) {
    const { handle } = item;
    const isEmpty = item.children.length == 0;
    if (isEmpty) {
        if (handle instanceof FileSystemDirectoryHandle) {
            const children = await getFolderContent(handle);
            if (children.length > 0) {
                item.children = children;
                children.forEach((c) => (c.parent = item));
                item.isOpen = true;
                buildParagraphs();
            }
        } else if (item.type == "yt-playlist" && item.itemId) {
            const res = await findPlaylistVideos(item.itemId);

            const children = res.items;
            if (children.length > 0) {
                if (res.pageInfo.nextPageToken) {
                    const loadMore = createLoadMoreItem(
                        item.itemId,
                        "playlist",
                        res.pageInfo
                    );
                    children.push(loadMore);
                }

                addItemsAt(item, children, 0);
                buildParagraphs();
            }
        } else if (item.type == "yt-channel" && item.itemId) {
            const res = await getChannelInfo(item.itemId);

            const children = res.items;
            if (children.length > 0) {
                if (res.pageInfo.nextPageToken) {
                    const loadMore = createLoadMoreItem(
                        item.itemId,
                        getLoadMoreTypeForItem(item),
                        res.pageInfo
                    );
                    children.push(loadMore);
                }

                addItemsAt(item, children, 0);
                buildParagraphs();
            }
        }
    } else {
        item.isOpen = true;
    }
}

async function performSearch(state: AppState, item: Item) {
    //TODO: BUG title might change after await and before next line executes
    const res = await searchYoutube(item.title);

    if (res.pageInfo.nextPageToken) {
        const loadMore = createLoadMoreItem(
            item.title,
            getLoadMoreTypeForItem(item),
            res.pageInfo
        );

        res.items.push(loadMore);
    }

    replaceChildren(item, res.items);
    buildParagraphs();
}

export async function loadMoreItems(state: AppState, item: Item) {
    if (item.itemId && item.loadMorePageToken && item.loadMoreWhat) {
        let res: MyResponse;
        if (item.loadMoreWhat == "playlist")
            res = await findPlaylistVideos(item.itemId, item.loadMorePageToken);
        else if (item.loadMoreWhat == "channel")
            res = await getChannelInfo(item.itemId, item.loadMorePageToken);
        else if (item.loadMoreWhat == "search")
            res = await searchYoutube(item.itemId, item.loadMorePageToken);
        else throw new Error("Unknown loadMoreWhat tag " + item.loadMoreWhat);

        const children = res.items;

        if (children.length > 0) {
            const position = getIndexOf(item);
            removeItem(item);
            if (res.pageInfo.nextPageToken) {
                const loadMore = createLoadMoreItem(
                    item.itemId,
                    item.loadMoreWhat,
                    res.pageInfo,
                    item.loadMoreResultsLoaded
                );

                children.push(loadMore);
            }

            addItemsAt(item.parent, children, position);

            if (getPrimaryCursor(state).item == item)
                state.cursorState.cursors = [createCursor(children[0])];
            buildParagraphs();
        }
    }
}

function moveSelectionRight(state: AppState) {
    //BUG: this is almost definitelly a bug, since noone is waiting for the callback.
    forEachCursor(state, async (cursor) => {
        const item = cursor.item;
        if (!item.isOpen) {
            openItem(state, cursor.item);
        } else if (item.children.length > 0) {
            cursor.item = item.children[0];
        }
    });
}

function expandSelectionDown(state: AppState, timeAfter = 0) {
    const primary = getPrimaryCursor(state);
    let itemBelow = getItemBelow(state, primary.item);
    for (let i = 0; i < timeAfter; i++) {
        if (!itemBelow) break;

        itemBelow = getItemBelow(state, itemBelow);
    }

    if (itemBelow) {
        const cursors = state.cursorState.cursors;
        if (cursors.find((c) => c.item == itemBelow)) cursors.shift();
        else cursors.unshift(createCursor(itemBelow));
    }
}

function expandSelectionUp(state: AppState, timeAfter = 0) {
    const primary = getPrimaryCursor(state);
    let itemBelow = getItemAbove(primary.item);

    for (let i = 0; i < timeAfter; i++) {
        if (!itemBelow) break;

        itemBelow = getItemAbove(itemBelow);
    }
    if (itemBelow) {
        const cursors = state.cursorState.cursors;
        if (cursors.find((c) => c.item == itemBelow)) cursors.shift();
        else cursors.unshift(createCursor(itemBelow));
    }
}

function expandSelectionWordRight(state: AppState) {
    const cursor = getPrimaryCursor(state);
    if (cursor.position < cursor.item.title.length) {
        let nextIndex = cursor.item.title.indexOf(" ", cursor.position + 1) + 1;
        if (nextIndex == 0) nextIndex = cursor.item.title.length;

        state.cursorState.cursors.unshift(createCursor(cursor.item, nextIndex));
    }
}
function expandSelectionWordLeft(state: AppState) {
    const cursor = getPrimaryCursor(state);
    if (cursor.position > 0) {
        const title = cursor.item.title;
        const nextIndex =
            title.slice(0, cursor.position - 1).lastIndexOf(" ") + 1;
        state.cursorState.cursors.unshift(createCursor(cursor.item, nextIndex));
    }
}

export function createCursor(item: Item, position = 0): Cursor {
    return {
        item,
        position,
        selectionStart: -1,
        titleBeforeEnteringInsertMode: undefined,
        positionBeforeEnteringInsertMode: 0,
    };
}

function insertStrAtPosition(str: string, str2: string, index: number): string {
    return str.slice(0, index) + str2 + str.slice(index);
}

function assertNever(arg: never) {}
