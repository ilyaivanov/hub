import type { AppState } from "./index";
import { getItemToSelectAfterRemovingSelected } from "./selection";
import { addItemAt, Item, removeItem } from "./utils/tree";

// dispatch and revert changes

export type Change =
    | { type: "rename"; oldName: string; newName: string; item: Item }
    | {
          type: "remove";
          position: number;
          item: Item;
          itemToSelect: Item | undefined;
      }
    | {
          type: "add";
          position: number;
          parent: Item;
          item: Item;
          selected: Item;
      }
    | {
          type: "move";
          item: Item;
          oldIndex: number;
          oldParent: Item;
          newIndex: number;
          newParent: Item;
      };

export function itemAdded(state: AppState, item: Item) {
    addChange(state, {
        type: "add",
        item: item,
        parent: item.parent,
        position: item.parent.children.indexOf(item),
        selected: state.selectedItem,
    });
}

export function itemRemoved(state: AppState, item: Item) {
    const nextItem = getItemToSelectAfterRemovingSelected(item);
    addChange(state, {
        type: "remove",
        item: item,
        position: item.parent.children.indexOf(item),
        itemToSelect: nextItem,
    });
}

export function registerRenameAction(state: AppState) {
    addChange(state, {
        type: "rename",
        item: state.selectedItem,
        newName: state.selectedItem.title,
        oldName: state.insertModeItemTitle,
    });
}

export function addChange(state: AppState, change: Change) {
    pushNewChange(state, change);
    // performChange(change);
}

export function undoLastChange(state: AppState) {
    const { currentChange, changeHistory } = state;
    if (currentChange > -1) {
        const change = changeHistory[currentChange];
        state.currentChange--;
        revertChange(change);
        return change;
    }
}

export function redoLastChange(state: AppState) {
    const { currentChange, changeHistory } = state;
    if (currentChange < changeHistory.length - 1) {
        state.currentChange++;
        const change = changeHistory[state.currentChange];
        performChange(change);
        return change;
    }
}

function pushNewChange(state: AppState, change: Change) {
    const { currentChange, changeHistory } = state;
    if (currentChange < changeHistory.length - 1) {
        changeHistory.splice(
            currentChange + 1,
            changeHistory.length - currentChange - 1
        );
    }

    changeHistory.push(change);
    state.currentChange++;
}

function updateTitle(item: Item, newTitle: string) {
    item.title = newTitle;
}

export function moveItem(item: Item, newParent: Item, index: number) {
    removeItem(item);

    addItemAt(newParent, item, index);
}

// prettier-ignore
function performChange(change: Change) {
    if (change.type == "move")        moveItem(change.item, change.newParent, change.newIndex);
    else if (change.type == "rename") updateTitle(change.item, change.newName);
    else if (change.type == "remove") removeItem(change.item);
    // else if (change.type == "loaded") renderApp(change.newRoot, change.newSelected);
    else if (change.type == "add")    addItemAt(change.parent, change.item, change.position);
    else                              assertNever(change);
}

// prettier-ignore
function revertChange(change: Change) {
    if (change.type == "move")        moveItem(change.item, change.oldParent, change.oldIndex);
    else if (change.type == "rename") updateTitle(change.item, change.oldName);
    else if (change.type == "remove") addItemAt(change.item.parent, change.item, change.position);
    // else if (change.type == "loaded") renderApp(change.oldRoot, change.oldSelected);
    else if (change.type == "add")    removeItem(change.item);
    else                              assertNever(change);
}

function assertNever(arg: never) {}
