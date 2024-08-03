import { spacings } from "./consts";
import { ctx } from "./drawing";

export type Paragraph = {
    text: string;
    x: number;
    y: number;
    maxWidth: number;

    // derived from above
    lines: string[];
    totalHeight: number;
    lineHeight: number;
};

export function buildParagraph(
    text: string,
    x: number,
    y: number,
    maxWidth: number
) {
    //prettier-ignore
    const p: Paragraph = { text, x, y, maxWidth, lines: [], totalHeight: 0, lineHeight: 0 };

    updateLines(p);
    return p;
}

export function updateLines(p: Paragraph) {
    p.lines = [];

    const ms = ctx.measureText("Foo");
    const h = ms.fontBoundingBoxAscent + ms.fontBoundingBoxDescent;
    p.lineHeight = h * spacings.lineHeight;

    if (p.text.length == 0) {
        p.lines.push("");
        return;
    }

    const words = p.text.split(" ");
    let line = "";

    for (let i = 0; i < words.length; i++) {
        if (line.length != 0) line += " ";
        const nextLine = line + words[i];

        if (ctx.measureText(nextLine).width > p.maxWidth) {
            p.lines.push(line);
            line = words[i];
        } else {
            line = nextLine;
        }
    }
    if (line.length > 0) p.lines.push(line);

    p.totalHeight =
        p.lines.length * p.lineHeight + h * spacings.paragraphExtraLineHeight;
}

export function drawParagraph(p: Paragraph) {
    ctx.fillStyle = "white";
    ctx.textBaseline = "middle";
    for (let i = 0; i < p.lines.length; i++) {
        ctx.fillText(p.lines[i], p.x, p.y + i * p.lineHeight);
    }
}

export function drawCursor(paragraph: Paragraph, cursor: number) {
    const { text, lines } = paragraph;

    let currentChars = 0;
    let currentLine = -2;
    for (let i = 0; i < lines.length; i++) {
        if (currentChars >= cursor) {
            currentLine = i - 1;
            break;
        }
        currentChars += lines[i].length - 1;
    }
    if (currentLine == -2) currentLine = lines.length - 1;
    else if (currentLine < 0) currentLine = 0;

    const lineStart = sumBy(takeFirst(lines, currentLine), (l) => l.length);

    const t = text.slice(lineStart, cursor);

    const cursorHeight = paragraph.lineHeight;
    const cursorWidth = 1;
    ctx.fillRect(
        paragraph.x + ctx.measureText(t).width - cursorWidth / 2,
        paragraph.y + currentLine * paragraph.lineHeight - cursorHeight / 2,
        cursorWidth,
        cursorHeight
    );
}

function takeFirst<T>(items: T[], count: number) {
    return items.slice(0, count);
}

function sumBy<T>(items: T[], fn: (item: T) => number) {
    return items.reduce((prev, item) => prev + fn(item), 0);
}
