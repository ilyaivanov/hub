// import { cursors, forEachCursor } from "./cursor";
import { forEachCursor, getPrimaryCursor } from "./cursor/cursor";
import { AppState } from "./index";
import type { Paragraph } from "./paragraph";
import { playIconSize, playPath } from "./player/icons";
import { colors, spacings } from "./utils/consts";
import { ctx, fillSquareAt, outlineSquareAt } from "./utils/drawing";
import { lerp } from "./utils/math";
import { isRoot, Item } from "./utils/tree";

function drawTextOverflowLines(state: AppState) {
    const { width, height } = state.canvas;
    const { panelWidth } = state;
    const leftPanel = width / 2 - panelWidth / 2;
    ctx.globalAlpha = 0.1;
    ctx.fillStyle = "green";
    ctx.fillRect(leftPanel - 1, 0, 2, height);
    ctx.fillRect(leftPanel + panelWidth - 1, 0, 2, height);
    ctx.globalAlpha = 1;
}

function drawParagraph(p: Paragraph, color: string) {
    ctx.fillStyle = color;
    ctx.textBaseline = "middle";
    for (let i = 0; i < p.lines.length; i++) {
        ctx.fillText(p.lines[i], p.x, p.y + i * p.lineHeight);
    }
}

export function drawTree(state: AppState) {
    // console.log(getPrimaryCursor(state).item.title);
    // const { selectedItem, cursor } = state;
    const { width, height } = state.canvas;

    ctx.resetTransform();
    ctx.scale(state.canvas.scale, state.canvas.scale);

    ctx.clearRect(0, 0, width, height);

    drawTextOverflowLines(state);

    const { pageHeight, scrollOffset } = state;
    if (pageHeight > height) {
        const scrollWidth = 8;
        const scrollHeight = (height * height) / pageHeight;
        const maxOffset = pageHeight - height;
        const maxScrollY = height - scrollHeight;
        const scrollY = lerp(0, maxScrollY, scrollOffset / maxOffset);

        ctx.fillStyle = colors.lines;
        ctx.fillRect(width - scrollWidth, scrollY, scrollWidth, scrollHeight);
    }

    ctx.translate(0, -state.scrollOffset);
    drawSelecitonBox(state);

    forEachCursor(state, (cursor) => {
        if (cursor.selectionStart > -1) {
            const left = Math.min(cursor.selectionStart, cursor.position);
            const right = Math.max(cursor.selectionStart, cursor.position);

            highlightParagraphText(
                state,
                state.paragraphsMap.get(cursor.item)!,
                left,
                right,
                "green",
                1
            );
        }
    });

    const cursor = getPrimaryCursor(state);
    if (cursor.selectionStart > -1) {
        const left = Math.min(cursor.selectionStart, cursor.position);
        const right = Math.max(cursor.selectionStart, cursor.position);

        const selectedText = cursor.item.title.slice(left, right);

        for (let i = 0; i < state.paragraphs.length; i++) {
            const p = state.paragraphs[i];
            const occurences = findAllOccurrencesOf(p.item.title, selectedText);
            occurences.forEach((start) => {
                const end = start + selectedText.length;
                if (start >= 0) {
                    highlightParagraphText(state, p, start, end, "green", 0.5);
                }
            });
        }
    }

    if (!isRoot(state.focused)) {
        ctx.font = `${spacings.titleFontWeight} ${spacings.titleFontSize}px ${spacings.font}`;

        drawParagraph(state.focusedParagraph, "white");
    }

    ctx.font = `${spacings.fontWeight} ${spacings.fontSize}px ${spacings.font}`;

    for (let i = 0; i < state.paragraphs.length; i++) {
        const p = state.paragraphs[i];
        const color = p.item == cursor.item ? colors.selectedText : colors.text;
        drawParagraph(p, color);

        const iconX = p.x - spacings.hPadding / 2 + 3;

        if (p.item.type == "yt-video") {
            var path = new Path2D(playPath);
            ctx.save();
            const scale = 50;
            const xOffset = playIconSize.x / scale / 2;
            const YOffset = playIconSize.y / scale / 2;
            ctx.translate(iconX - xOffset, p.y - YOffset);

            ctx.scale(1 / scale, 1 / scale);
            ctx.fillStyle = colors.foldericons;
            ctx.fill(path);
            ctx.restore();
        } else if (p.item.handle instanceof FileSystemDirectoryHandle) {
            ctx.fillStyle = colors.foldericons;
            fillSquareAt(iconX, p.y, spacings.iconSize);
        } else if (p.item.handle instanceof FileSystemFileHandle) {
            ctx.strokeStyle = colors.foldericons;
            outlineSquareAt(iconX, p.y, spacings.iconSize);
        } else if (p.item.children.length > 0) {
            ctx.fillStyle = colors.icons;
            fillSquareAt(iconX, p.y, spacings.iconSize);
        } else {
            ctx.strokeStyle = colors.icons;
            outlineSquareAt(iconX, p.y, spacings.iconSize);
        }
    }

    ctx.fillStyle = "white";

    drawCursors(state);
}

function drawSelecitonBox(state: AppState) {
    const { mode } = state.cursorState;
    const screenWidth = state.canvas.width;

    ctx.globalAlpha = 0.2;

    const itemsHighlighed = new Set<Item>();
    forEachCursor(state, (cursor) => {
        // if (itemsHighlighed.has(cursor.item)) return;

        itemsHighlighed.add(cursor.item);

        const p = state.paragraphsMap.get(cursor.item);
        if (!p) console.warn(`Can't find parahraph for ${cursor.item.title}`);
        else {
            const ms = ctx.measureText("foo");
            const h = ms.fontBoundingBoxAscent + ms.fontBoundingBoxDescent;

            ctx.fillStyle =
                mode == "normal"
                    ? colors.selectedRect
                    : colors.selectedRectInsert;

            //TODO: paragraphExtraLineHeight is used improperly here, to be corrected
            const selectedBoxY =
                p.y -
                p.lineHeight / 2 -
                (h * spacings.paragraphExtraLineHeight) / 2;

            const selectedBoxHeight = p.totalHeight;

            ctx.fillRect(0, selectedBoxY, screenWidth, selectedBoxHeight);
        }
    });

    ctx.globalAlpha = 1;
}

function drawCursors(state: AppState) {
    forEachCursor(state, (cursor) => {
        const paragraph = state.paragraphsMap.get(cursor.item);
        if (paragraph) {
            const { item, lines } = paragraph;
            const text = item.title;

            let currentChars = 0;
            let currentLine = -2;
            for (let i = 0; i < lines.length; i++) {
                if (currentChars >= cursor.position) {
                    currentLine = i - 1;
                    break;
                }
                currentChars += lines[i].length - 1;
            }
            if (currentLine == -2) currentLine = lines.length - 1;
            else if (currentLine < 0) currentLine = 0;

            let lineStart = sumBy(
                takeFirst(lines, currentLine),
                (l) => l.length + 1
            );

            const t = text.slice(lineStart, cursor.position);
            const cursorHeight = paragraph.lineHeight;
            const cursorWidth = 1;
            ctx.fillStyle = colors.cursor;

            setFont(state, cursor.item);

            ctx.fillRect(
                paragraph.x + ctx.measureText(t).width - cursorWidth / 2,
                paragraph.y +
                    currentLine * paragraph.lineHeight -
                    cursorHeight / 2,
                cursorWidth,
                cursorHeight
            );
        }
    });
}

export function highlightParagraphText(
    state: AppState,
    paragraph: Paragraph,
    from: number,
    to: number,
    color: string,
    alpha: number
) {
    const left = Math.min(from, to);
    const right = Math.max(from, to);
    const title = paragraph.item.title;

    // const rangeStartStr = title.slice(0, left);
    // const rangeEndStr = title.slice(left, right);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = color;

    let lineStart = 0;
    for (let i = 0; i < paragraph.lines.length; i++) {
        let lineEnd = lineStart + paragraph.lines[i].length;

        const partOnLineStart = Math.max(lineStart, left);
        const partOnLineEnd = Math.min(lineEnd, right);

        const skipText = title.slice(lineStart, partOnLineStart);
        const selectRange = title.slice(partOnLineStart, partOnLineEnd);

        setFont(state, paragraph.item);
        ctx.fillRect(
            paragraph.x + ctx.measureText(skipText).width,
            paragraph.y + i * paragraph.lineHeight - paragraph.lineHeight / 2,
            ctx.measureText(selectRange).width,
            paragraph.lineHeight
        );

        lineStart += paragraph.lines[i].length;
    }
    ctx.globalAlpha = 1;
}

function takeFirst<T>(items: T[], count: number) {
    return items.slice(0, count);
}

function sumBy<T>(items: T[], fn: (item: T) => number) {
    return items.reduce((prev, item) => prev + fn(item), 0);
}

function findAllOccurrencesOf(original: string, substring: string): number[] {
    const indices: number[] = [];
    let index = original.indexOf(substring);

    while (index !== -1) {
        indices.push(index);
        index = original.indexOf(substring, index + substring.length);
    }

    return indices;
}

function setFont(state: AppState, item: Item) {
    if (state.focused == item)
        ctx.font = `${spacings.titleFontWeight} ${spacings.titleFontSize}px ${spacings.font}`;
    else
        ctx.font = `${spacings.fontWeight} ${spacings.fontSize}px ${spacings.font}`;
}

function assertNever(arg: never) {}
