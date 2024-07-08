import { colors, spacings } from "../consts";
import { layout } from "../index";
import { Item } from "../tree";

export let itemEdited: Item | undefined;
const input = document.createElement("input");
Object.assign(input.style, {
    position: "absolute",
    fontSize: spacings.fontSize + "px",
    backgroundColor: "transparent",
    padding: 0,
    fontFamily: spacings.font,
    fontWeight: spacings.fontWeight,
    border: "none",
    outline: "none",
    boxSizing: "border-box",
});

input.addEventListener("input", (e) => {
    if (itemEdited) itemEdited.title = input.value;
    layout();
});

export function startEdit(x: number, y: number, width: number, item: Item) {
    itemEdited = item;
    Object.assign(input.style, {
        left: x + "px",
        top: y + "px",
        width: "400px",
        color: colors.selectedText,
    });
    input.value = item.title;
    document.body.appendChild(input);
    input.focus();
    return input;
}

export function stopEdit() {
    if (itemEdited) {
        input.remove();
        itemEdited.title = input.value;
        itemEdited = undefined;
    }
}

export function placeCarretAt(element: HTMLElement, position: number) {
    if (element.innerText.length == 0) return;

    const range = document.createRange();
    const selection = window.getSelection()!;

    range.setStart(element.childNodes[0], position);
    // range.selectNodeContents(element);
    range.collapse(true);

    selection.removeAllRanges();
    selection.addRange(range);
}

export function pasteIntoCursor(text: string) {
    const selection = window.getSelection()!;
    if (!selection.rangeCount) return;

    const range = selection.getRangeAt(0);

    range.deleteContents();

    const textNode = document.createTextNode(text);

    range.insertNode(textNode);

    range.setStartAfter(textNode);
    range.setEndAfter(textNode);
    selection.removeAllRanges();
    selection.addRange(range);
}
