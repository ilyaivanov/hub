import { Animated, animateto, slowAnim, spring, tick } from "./animations";
import { colors, dark, light, setColors, spacings } from "./consts";
import { itemEdited, startEdit, stopEdit } from "./html/input";
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
import {
    Item,
    getContext,
    getOpenChildrenCount,
    i,
    insertAsFirstChild,
    insertItemAfter,
    insertItemBefore,
    isParentOrSame,
    removeItem,
    root,
    setRoot,
} from "./tree";

const canvas = document.createElement("canvas");
const ctx = canvas.getContext("2d")!;
document.body.appendChild(canvas);

let screenWidth = 0;
let screenHeight = 0;
let scale = 0;

function onResize() {
    screenWidth = window.innerWidth;
    screenHeight = window.innerHeight;
    scale = window.devicePixelRatio || 1;

    canvas.style.width = `${screenWidth}px`;
    canvas.style.height = `${screenHeight}px`;
    canvas.width = Math.floor(screenWidth * scale);
    canvas.height = Math.floor(screenHeight * scale);
    ctx.scale(scale, scale);
}
onResize();
window.addEventListener("resize", () => {
    onResize();

    offset.target = clampOffset(offset.target);
    offset.isAnimating = true;
});

function updateSelectionPosition() {
    const view = views.get(selectedItem);
    if (selectedItem == focusedItem) {
        animateto(selectedItemHeight, 30);
        animateto(selectedItemY, 10);
    } else if (view) {
        const y = views.get(selectedItem)!.y.target - spacings.rowHeight / 2;
        animateto(selectedItemHeight, spacings.rowHeight);
        animateto(selectedItemY, y);
    } else {
        console.info(
            `Can't find view for selected item: ${selectedItem.title}`
        );
    }
}

function clampOffset(val: number) {
    const maxOffset = max(treeHeight - screenHeight, 0);
    return clamp(val, 0, maxOffset);
}

function changeSelection(newItem: Item | undefined) {
    const isP = isParentOrSame(newItem!, focusedItem);
    if (newItem && isP) {
        selectedItem = newItem;
        updateSelectionPosition();

        const itemsToLookAhead = 3;

        const spaceToLookAhead = spacings.rowHeight * itemsToLookAhead;
        if (
            treeHeight > screenHeight &&
            selectedItemY.target + spaceToLookAhead - screenHeight >
                offset.target
        ) {
            const targetOffset =
                selectedItemY.target - screenHeight + spaceToLookAhead;
            animateto(offset, clampOffset(targetOffset));
        } else if (
            treeHeight > screenHeight &&
            selectedItemY.target - spaceToLookAhead < offset.target
        ) {
            const targetOffset = selectedItemY.target - spaceToLookAhead;
            animateto(offset, clampOffset(targetOffset));
        }
    }
}

function startEditSelectedItem(carretPlacement: "start" | "end") {
    const view = views.get(selectedItem);
    if (view) {
        //TODO: need to sync canvas and html when animation is in progress
        const x = getViewTextX(view.x.target);
        const ms = ctx.measureText("foo");
        //TODO: 0.5 is picked by hand primarly because of ctx.textAlign = "middle";
        const y = view.y.target - ms.fontBoundingBoxAscent + 0.5;
        const width = screenWidth - y - 20;
        const input = startEdit(x, y, width, selectedItem);

        let position = 0;
        if (carretPlacement == "end") position = selectedItem.title.length;

        input.selectionStart = input.selectionEnd = position;
    }
}
export function isFocused(item: Item) {
    return item == focusedItem;
}

let offset = spring(0, slowAnim, "anim");

document.addEventListener("wheel", (e) => {
    if (treeHeight > screenHeight) {
        offset.target = clampOffset(offset.target + e.deltaY);
        offset.isAnimating = true;
    }
});

document.addEventListener("keydown", async (e) => {
    if (itemEdited) {
        if (e.code == "Enter" || e.code == "Escape") {
            stopEdit();
        }
    } else {
        if (e.code == "KeyF") {
            if (e.shiftKey) {
                if (focusedItem.parent) {
                    changeFocus(focusedItem.parent);
                }
            } else changeFocus(selectedItem);
        }
        if (e.code == "KeyS" && e.metaKey) {
            saveToFile(root);
            // saveItemsToLocalStorage(root);
            e.preventDefault();
        }
        if (e.code == "KeyV") {
            selectedItem.view = selectedItem.view == "board" ? "tree" : "board";
            layout();
        }
        if (e.code == "Space") {
            setColors(colors == light ? dark : light);
        } else if (e.code == "KeyI") {
            startEditSelectedItem("start");
            e.preventDefault();
        } else if (e.code == "KeyA") {
            startEditSelectedItem("end");
            e.preventDefault();
        } else if (e.code == "KeyK") {
            if (e.altKey) {
                moveItemUp(selectedItem);
                layout();
                updateSelectionPosition();
            } else changeSelection(getItemAbove(selectedItem));
        } else if (e.code == "KeyO") {
            const newItem = i("");

            if (e.ctrlKey) insertAsFirstChild(selectedItem, newItem);
            else if (e.shiftKey) insertItemBefore(selectedItem, newItem);
            else insertItemAfter(selectedItem, newItem);

            layout();
            changeSelection(newItem);
            startEditSelectedItem("start");
            e.preventDefault();
        } else if (e.code == "KeyJ") {
            if (e.altKey) {
                moveItemDown(selectedItem);
                layout();
                updateSelectionPosition();
            } else if (e.ctrlKey) {
                const context = getContext(selectedItem);
                const index = context.indexOf(selectedItem);
                if (index < context.length - 1)
                    changeSelection(context[index + 1]);
            } else {
                changeSelection(getItemBelow(selectedItem));
            }
        } else if (e.code == "KeyR" && !e.metaKey) {
            selectedItem.title = "";
            startEditSelectedItem("start");
            e.preventDefault();
        } else if (e.code == "KeyD") {
            const itemToSelect =
                getItemToSelectAfterRemovingSelected(selectedItem);
            removeItem(selectedItem);

            const stack = [selectedItem];
            while (stack.length > 0) {
                const item = stack.pop()!;
                const view = views.get(item);
                if (view) {
                    animateto(view.x, view.x.target + spacings.xStep * 2);
                    animateto(view.opacity, 0);
                }

                if (item.isOpen) stack.push(...item.children);
            }
            // MEMORY LEAK!!! Views are still in the map, just transparent
            layout();

            changeSelection(itemToSelect);
        } else if (e.code == "KeyH") {
            if (e.altKey) {
                if (selectedItem.parent != focusedItem) {
                    moveItemLeft(selectedItem);
                    layout();
                    updateSelectionPosition();
                }
            } else if (selectedItem.isOpen) {
                selectedItem.isOpen = false;

                const parentView = views.get(selectedItem)!;
                const stack = [...selectedItem.children];
                while (stack.length > 0) {
                    const item = stack.pop()!;
                    const view = views.get(item);
                    if (view) {
                        animateto(view.y, parentView.y.target);
                        animateto(view.x, parentView.x.target);
                        animateto(view.opacity, 0);
                    }

                    if (item.isOpen) stack.push(...item.children);
                }
                layout();
            } else if (selectedItem.parent.parent) {
                changeSelection(selectedItem.parent);
            }
        } else if (e.code == "KeyL") {
            if (e.altKey) {
                moveItemRight(selectedItem);
                layout();
                updateSelectionPosition();
            } else if (e.metaKey) {
                e.preventDefault();
                const newRoot = await loadFromFile();

                if (newRoot) {
                    setRoot(newRoot);
                    focusedItem = newRoot;

                    views.clear();
                    layout();
                    changeSelection(newRoot.children[0]);
                }
            } else if (
                selectedItem.children.length > 0 &&
                !selectedItem.isOpen
            ) {
                selectedItem.isOpen = true;
                const stack = [...selectedItem.children];
                while (stack.length > 0) {
                    const item = stack.pop()!;
                    const view = views.get(item);
                    if (view) {
                        animateto(view.opacity, 1);
                    }

                    if (item.isOpen) stack.push(...item.children);
                }

                layout();
            } else if (selectedItem.children.length > 0) {
                changeSelection(selectedItem.children[0]);
            }
        }
    }
});

let lastTime = 0;

function fillSquareAt(x: number, y: number, size: number) {
    ctx.fillRect(x - size / 2, y - size / 2, size, size);
}

function outlineSquareAt(x: number, y: number, size: number) {
    const lineWidth = 1;
    ctx.lineWidth = lineWidth;
    const d = size / 2 - lineWidth / 2;
    ctx.beginPath();
    ctx.moveTo(x - d, y - d);
    ctx.lineTo(x + d, y - d);
    ctx.lineTo(x + d, y + d);
    ctx.lineTo(x - d, y + d);
    ctx.closePath();
    ctx.stroke();
}

type View = {
    x: Animated;
    y: Animated;
    opacity: Animated;
    childrenHeight: Animated;
};
const views = new Map<Item, View>();

let selectedItem: Item;
let focusedItem: Item;
let selectedItemY = spring(50, slowAnim);
let selectedItemX = spring(0, slowAnim);
let selectedItemWidth = spring(screenWidth, slowAnim);
let selectedItemHeight = spring(spacings.rowHeight, slowAnim);

function updateOrCreateView(x: number, y: number, item: Item) {
    let existingView = views.get(item);
    const parentView = views.get(item.parent);

    if (!existingView) {
        existingView = {
            x: spring(parentView ? parentView.x.target : x, slowAnim),
            y: spring(parentView ? parentView.y.target : y, slowAnim),
            opacity: spring(0, slowAnim),
            childrenHeight: item.isOpen
                ? spring(
                      getOpenChildrenCount(item) * spacings.rowHeight,
                      slowAnim
                  )
                : spring(0, slowAnim),
        };
        views.set(item, existingView);
    }

    animateto(existingView.x, x);
    animateto(existingView.y, y);
    animateto(existingView.opacity, 1);
    const newHeight = item.isOpen
        ? getOpenChildrenCount(item) * spacings.rowHeight
        : 0;
    animateto(existingView.childrenHeight, newHeight);
    return existingView;
}

let treeHeight = 0;

function changeFocus(item: Item) {
    focusedItem = item;

    //TODO: check if selected item is visible
    views.clear();
    layout();
    updateSelectionPosition();
}

export function layout() {
    treeHeight =
        layoutTree(spacings.padding, spacings.padding + 30, focusedItem)
            .height + spacings.padding;
    offset.target = clampOffset(offset.target);
    offset.isAnimating = true;
}

function itemWidth(item: Item) {
    return ctx.measureText(item.title).width + getViewTextX(0);
}
function layoutTree(x: number, y: number, item: Item) {
    const startY = y;
    const stack = item.children.map((item) => ({ item, level: 0 })).reverse();

    let maxWidth = 0;
    while (stack.length > 0) {
        const { item, level } = stack.pop()!;
        let itemX = x + level * spacings.xStep;
        const view = updateOrCreateView(itemX, y, item);
        const width = itemWidth(item);

        if (width + (itemX - x) > maxWidth) {
            maxWidth = width + (itemX - x);
        }

        if (item.isOpen) {
            let maxHeight = 0;

            if (item.view == "board") {
                const boardView = view;
                y += spacings.rowHeight;
                let boardX = itemX + spacings.xStep;
                let cellWidth = 0;
                for (let i = 0; i < item.children.length; i++) {
                    let boardY = y + spacings.rowHeight;
                    const child = item.children[i];
                    cellWidth = itemWidth(child);
                    updateOrCreateView(boardX, boardY, child);

                    if (child.isOpen) {
                        boardY += spacings.rowHeight;

                        const tree = layoutTree(
                            boardX + spacings.xStep,
                            boardY,
                            child
                        );
                        if (tree.height > maxHeight) maxHeight = tree.height;
                        if (tree.width + spacings.xStep > cellWidth)
                            cellWidth = tree.width + spacings.xStep;
                    }
                    boardX += cellWidth + spacings.xStep;
                }
                if (boardX - itemX > maxWidth) {
                    maxWidth = boardX - itemX;
                }
                animateto(
                    boardView.childrenHeight,
                    boardX - itemX - cellWidth - spacings.xStep
                );
                y += maxHeight + spacings.rowHeight;
            } else {
                for (let i = item.children.length - 1; i >= 0; i--)
                    stack.push({ item: item.children[i], level: level + 1 });
            }
        }

        y += spacings.rowHeight;
    }
    return { height: y, width: maxWidth };
}
function getViewTextX(x: number) {
    return x + spacings.iconSize / 2 + spacings.textToIcon;
}

function onTick(time: number) {
    let delta = time - lastTime;

    ctx.fillStyle = colors.bg;
    ctx.fillRect(-200000, -200000, 400000, 400000);

    ctx.resetTransform();
    ctx.scale(scale, scale);

    ctx.translate(0, -offset.current);

    ctx.fillStyle = colors.selectedRect;
    ctx.fillRect(
        selectedItemX.current,
        selectedItemY.current,
        selectedItemWidth.current,
        selectedItemHeight.current
    );

    ctx.fillStyle = colors.text;
    ctx.font = `${spacings.titleFontWeight} ${spacings.titleFontSize}px ${spacings.font}`;

    ctx.textBaseline = "middle";
    ctx.fillText(
        focusedItem.title,
        spacings.padding - spacings.iconSize / 2 - 4,
        spacings.padding
    );

    ctx.font = `${spacings.fontWeight} ${spacings.fontSize}px ${spacings.font}`;

    for (const item of views.keys()) {
        const { x: xPos, y: yPos, opacity, childrenHeight } = views.get(item)!;

        const x = xPos.current;
        const y = yPos.current;
        ctx.fillStyle = colors.icons;
        ctx.strokeStyle = colors.icons;

        ctx.globalAlpha = clamp(opacity.current, 0, 1);
        if (item.children.length > 0) fillSquareAt(x, y, spacings.iconSize);
        else outlineSquareAt(x, y, spacings.iconSize);

        if (childrenHeight.current > 0) {
            ctx.fillStyle = colors.lines;
            if (item.view == "board") {
                ctx.fillRect(
                    x - 1,
                    y + spacings.rowHeight / 2,
                    2,
                    spacings.rowHeight / 2 + 1
                );
                ctx.fillRect(
                    x,
                    y + spacings.rowHeight - 1,
                    childrenHeight.current + 1,
                    2
                );
            } else
                ctx.fillRect(
                    x - 1,
                    y + spacings.rowHeight / 2,
                    2,
                    childrenHeight.current
                );
        }

        if (item.parent.view == "board") {
            ctx.fillStyle = colors.lines;
            ctx.fillRect(
                x - 1,
                y - spacings.rowHeight,
                2,
                spacings.rowHeight / 2
            );
        }

        if (item != itemEdited) {
            ctx.fillStyle =
                item == selectedItem ? colors.selectedText : colors.text;
            ctx.fillText(item.title, getViewTextX(x), y);
        }
    }

    ctx.globalAlpha = 1;

    ctx.resetTransform();
    ctx.scale(scale, scale);

    if (treeHeight > screenHeight) {
        ctx.fillStyle = colors.lines;
        const scrollWidth = 6;
        const scrollHeight = (screenHeight * screenHeight) / treeHeight;
        const maxOffset = treeHeight - screenHeight;
        const maxScrollY = screenHeight - scrollHeight;
        const scrollY = lerp(0, maxScrollY, offset.current / maxOffset);
        ctx.fillRect(
            screenWidth - scrollWidth,
            scrollY,
            scrollWidth,
            scrollHeight
        );
    }

    //sometimes time is passed twice with the same value, resulting in delta time being zero
    if (delta > 0.5) tick(delta);

    lastTime = time;
    requestAnimationFrame(onTick);
}

focusedItem = root;

layout();
changeSelection(root.children[0]);

requestAnimationFrame(onTick);

function clamp(v: number, min: number, max: number) {
    if (v < min) return min;
    if (v > max) return max;
    return v;
}
function max(v1: number, v2: number) {
    if (v1 > v2) return v1;
    return v2;
}

function lerp(from: number, to: number, lerping: number) {
    return from * (1 - lerping) + to * lerping;
}
