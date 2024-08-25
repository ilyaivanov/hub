import { AppState } from "../index";
import { addItemAt, Item, removeItem } from "../utils/tree";
import { createCursor, CursorState, enterMode } from "./cursor";

export type MoveInfo = {
    item: Item;
    oldParent: Item;
    oldPosition: number;
    newParent: Item;
    newPosition: number;
};

export type AdditionInfo = {
    item: Item;
    parent: Item;
    position: number;
};

export type RenameInfo = {
    item: Item;
    oldTitle: string;
    newTitle: string;
};

export type Edit =
    | {
          type: "rename";
          items: RenameInfo[];
      }
    | {
          type: "remove";
          items: {
              item: Item;
              position: number;
          }[];
          itemToSelectNext: Item | undefined;
      }
    | {
          type: "add";
          items: AdditionInfo[];
      }
    | {
          type: "move";
          items: MoveInfo[];
      };

export function editTree(state: AppState, edit: Edit) {
    console.log(edit.type, edit.items.length);

    pushNewChange(state, edit);
    performChange(state, edit);
}

function performChange(state: AppState, edit: Edit) {
    if (edit.type == "add") {
        edit.items.forEach((info) =>
            addItemAt(info.parent, info.item, info.position)
        );

        state.cursorState.cursors = edit.items.map((addition) =>
            createCursor(addition.item)
        );
    }

    if (edit.type == "remove") {
        edit.items.forEach((c) => removeItem(c.item));
    }

    if (edit.type == "rename") {
        edit.items.forEach((c) => {
            c.item.title = c.newTitle;
        });
    }

    if (edit.type == "move") {
        for (const move of edit.items) {
            removeItem(move.item);
            addItemAt(move.newParent, move.item, move.newPosition);
        }
    }
}

function revertChange(state: AppState, edit: Edit) {
    if (edit.type == "add") {
        edit.items.forEach((info) => removeItem(info.item));
    }
    if (edit.type == "remove") {
        edit.items.forEach((info) =>
            addItemAt(info.item.parent, info.item, info.position)
        );
    } else if (edit.type == "rename") {
        edit.items.forEach((c) => {
            c.item.title = c.oldTitle;
        });
    }
    if (edit.type == "move") {
        for (const move of edit.items) {
            removeItem(move.item);
            addItemAt(move.oldParent, move.item, move.oldPosition);
        }
    }
}

export function undoLastChange(state: AppState) {
    const { currentChange, changeHistory } = state;
    if (currentChange > -1) {
        const change = changeHistory[currentChange];
        state.currentChange--;
        revertChange(state, change);

        return change;
    }
}

export function redoLastChange(state: AppState) {
    const { currentChange, changeHistory } = state;
    if (currentChange < changeHistory.length - 1) {
        state.currentChange++;
        const change = changeHistory[state.currentChange];
        performChange(state, change);
        return change;
    }
}

function pushNewChange(state: AppState, change: Edit) {
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
