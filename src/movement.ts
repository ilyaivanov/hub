import {
    Item,
    getContext,
    insertAsLastChild,
    insertItemAfter,
    isRoot,
} from "./tree";

import { getPreviousSibling } from "./selection";

export function moveItemDown(item: Item) {
    const context = getContext(item);
    const index = context.indexOf(item);
    if (index < context.length - 1) {
        context.splice(index, 1);
        context.splice(index + 1, 0, item);
    }
}

export function moveItemUp(item: Item) {
    const context = getContext(item);
    const index = context.indexOf(item);
    if (index > 0) {
        context.splice(index, 1);
        context.splice(index - 1, 0, item);
    }
}

export function moveItemRight(item: Item) {
    const previousSibling = getPreviousSibling(item);
    if (previousSibling) {
        previousSibling.isOpen = true;
        insertAsLastChild(previousSibling, item);
    }
}

export function moveItemLeft(item: Item) {
    const parent = item.parent;
    if (parent && !isRoot(parent)) {
        insertItemAfter(parent, item);
        if (parent.children.length == 0) parent.isOpen = false;
    }
}
