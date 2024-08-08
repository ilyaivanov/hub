import { AppState } from "./index";
import { isRoot, Item } from "./utils/tree";

export type Cursor = {
    item: Item;
    position: number;
};

function insertStrAtPosition(str: string, str2: string, index: number): string {
    return str.slice(0, index) + str2 + str.slice(index);
}

export function insertStrAtCurrentPosition(state: AppState, str: string) {
    state.selectedItem.title = insertStrAtPosition(
        state.selectedItem.title,
        str,
        state.cursor
    );
    state.MY_CURSOR.position += str.length;
}

export function jumpWordForward(state: AppState) {
    let nextIndex = state.selectedItem.title.indexOf(" ", state.cursor + 1) + 1;
    if (nextIndex == 0) nextIndex = state.selectedItem.title.length;
    state.MY_CURSOR.position = nextIndex;
}

export function jumpWordBackward(state: AppState) {
    if (state.cursor > 0) {
        const nextIndex =
            state.selectedItem.title
                .slice(0, state.cursor - 1)
                .lastIndexOf(" ") + 1;
        state.MY_CURSOR.position = nextIndex;
    }
}

export function removeCurrentChar(state: AppState) {
    const title = state.selectedItem.title;
    const { cursor } = state;
    state.selectedItem.title = title.slice(0, cursor - 1) + title.slice(cursor);

    state.MY_CURSOR.position--;
}

export function changeSelection(state: AppState, item: Item | undefined) {
    if (item) {
        state.MY_CURSOR.item = item;

        let parent = item.parent;
        while (!isRoot(parent)) {
            parent.isOpen = true;
            parent = parent.parent;
        }

        state.MY_CURSOR.position = 0;
    }
}
