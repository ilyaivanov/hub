import { spacings } from "./utils/consts";
import { ctx } from "./utils/drawing";
import { Item } from "./utils/tree";

export type Paragraph = {
    x: number;
    y: number;
    maxWidth: number;
    item: Item;

    // derived from above
    lines: string[];
    totalHeight: number;
    lineHeight: number;
};

export function buildParagraph(
    item: Item,
    x: number,
    y: number,
    maxWidth: number
) {
    //prettier-ignore
    const p: Paragraph = {  x, y, maxWidth, item, lines: [], totalHeight: 0, lineHeight: 0 };

    updateLines(p);
    return p;
}

export function updateLines(p: Paragraph) {
    p.lines = [];

    const ms = ctx.measureText("Foo");
    const h = ms.fontBoundingBoxAscent + ms.fontBoundingBoxDescent;
    p.lineHeight = h * spacings.lineHeight;

    const text = p.item.title;
    if (text.length == 0) {
        p.lines.push("");
    } else {
        const paragraphWords = text.split(" ");
        let lineWords: string[] = [];

        for (let i = 0; i < paragraphWords.length; i++) {
            const word = paragraphWords[i];
            const nextLine = [...lineWords, word];

            if (ctx.measureText(nextLine.join(" ")).width > p.maxWidth) {
                p.lines.push(lineWords.join(" "));
                lineWords = [word];
            } else {
                lineWords = nextLine;
            }
        }
        if (lineWords.length > 0) p.lines.push(lineWords.join(" "));
    }

    p.totalHeight =
        p.lines.length * p.lineHeight + h * spacings.paragraphExtraLineHeight;
}
