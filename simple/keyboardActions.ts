import { moveDown, moveLeft, moveRight, moveUp } from "./cursor";
import { AppState } from "./index";
import { loadFromFile, saveToFile } from "./infra/files";
import { insertTextAt } from "./infra/string";

function action(key: string, fn: (state: AppState) => void) {
    return { key, meta: false, fn };
}

function actionMeta(key: string, fn: (state: AppState) => void) {
    return { key, meta: true, fn };
}

const normalModeActions = [
    action("KeyI", (state) => (state.mode = "edit")),
    action("KeyH", moveLeft),
    action("KeyJ", moveDown),
    action("KeyK", moveUp),
    action("KeyL", moveRight),

    actionMeta("KeyS", ({ items }) => saveToFile(items.join("\n"))),
    actionMeta("KeyO", async (state) => {
        const lines = await loadFromFile();
        if (lines) {
            state.cursor.col = 0;
            state.cursor.row = 0;
            state.items = lines.split("\n");
        }
    }),

    action("KeyD", ({ items, cursor }) => {
        items.splice(cursor.row, 1);
        cursor.col = 0;

        if (cursor.row > 0) cursor.row -= 1;

        if (items.length == 0) items.push("");
    }),
];

const editModeActions = [
    action("Escape", (state) => (state.mode = "normal")),
    action("Enter", (state) => {
        const { items, cursor } = state;
        items.splice(cursor.row + 1, 0, "");
        cursor.row++;
        cursor.col = 0;
    }),
    action("Backspace", ({ items, cursor }) => {
        if (cursor.col > 0) {
            const newLine = items[cursor.row].split("");

            newLine.splice(cursor.col - 1, 1);

            items[cursor.row] = newLine.join("");
            cursor.col--;
        }
    }),
];

export async function onKeyDown(state: AppState, e: KeyboardEvent) {
    const { items, cursor, mode } = state;
    const actions = mode == "normal" ? normalModeActions : editModeActions;

    const action = actions.filter(
        (a) => a.key == e.code && a.meta == e.metaKey
    );
    if (action.length > 1)
        throw new Error(`Found multiple actions for ${e.code}`);
    else if (action.length == 1) {
        e.preventDefault();
        action[0].fn(state);
    } else if (mode == "edit") {
        if (e.key.length == 1) {
            items[cursor.row] = insertTextAt(
                items[cursor.row],
                cursor.col,
                e.key
            );
            cursor.col += e.key.length;
        }
    }
}
