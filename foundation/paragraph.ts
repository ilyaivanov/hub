export type Paragraph = {
    text: string;
    x: number;
    y: number;
    maxWidth: number;

    // derived from above
    lines: string[];
};

export function updateLines(ctx: CanvasRenderingContext2D, p: Paragraph) {
    p.lines = [];

    const words = p.text.split(" ");
    let line = "";

    ctx.fillStyle = "white";

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
}

export function drawParagraph(ctx: CanvasRenderingContext2D, p: Paragraph) {
    const ms = ctx.measureText("o");
    const h = ms.fontBoundingBoxAscent + ms.fontBoundingBoxDescent;

    for (let i = 0; i < p.lines.length; i++) {
        ctx.fillText(p.lines[i], p.x, p.y + (i + 1) * h);
    }
}

export function drawCursor(
    ctx: CanvasRenderingContext2D,
    paragraph: Paragraph,
    cursor: number
) {
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

    const ms = ctx.measureText("o");
    const h = ms.fontBoundingBoxAscent + ms.fontBoundingBoxDescent;
    ctx.fillRect(
        paragraph.x + ctx.measureText(t).width - 0.5,
        paragraph.y - ms.fontBoundingBoxAscent + (currentLine + 1) * h,
        1,
        h
    );
}

function takeFirst<T>(items: T[], count: number) {
    return items.slice(0, count);
}

function sumBy<T>(items: T[], fn: (item: T) => number) {
    return items.reduce((prev, item) => prev + fn(item), 0);
}
