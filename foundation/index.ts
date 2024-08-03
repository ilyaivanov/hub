import { colors, spacings } from "./consts";
import { canvas, ctx, outlineSquareAt } from "./drawing";
import {
    buildParagraph,
    drawCursor,
    drawParagraph,
    Paragraph,
} from "./paragraph";
import { drawSelecitonBox } from "./selection";
import { text } from "./text";

document.body.style.backgroundColor = colors.bg;
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
    buildParagraphs();
});

const hPadding = 30;
const vPadding = 20;

let panelWidth = 0;

type Item = {
    title: string;
};
const items: Item[] = text.split("\n").map((title) => ({ title }));

type Mode = "Normal" | "Insert";

let mode: Mode = "Normal";

let ps: Paragraph[] = [];

function buildParagraphs() {
    panelWidth = Math.min(screenWidth, spacings.maxWidth);
    let y = vPadding;
    let x = hPadding + screenWidth / 2 - panelWidth / 2;
    ctx.font = `${spacings.fontWeight} ${spacings.fontSize}px ${spacings.font}`;

    ps = items.map((t) => {
        const p = buildParagraph(t.title, x, y, panelWidth - hPadding * 2);

        y += p.totalHeight;
        return p;
    });
}

buildParagraphs();

let selectedParagraph = 0;
let cursor = 0;

function draw(time: number) {
    ctx.clearRect(0, 0, screenWidth, screenHeight);

    const leftPanel = screenWidth / 2 - panelWidth / 2;
    ctx.globalAlpha = 0.3;
    ctx.fillStyle = "red";
    ctx.fillRect(leftPanel - 1, 0, 2, screenHeight);
    ctx.fillRect(leftPanel + panelWidth - 1, 0, 2, screenHeight);
    ctx.globalAlpha = 1;

    ctx.font = `${spacings.fontWeight} ${spacings.fontSize}px ${spacings.font}`;

    drawSelecitonBox(mode, screenWidth, ps[selectedParagraph]);

    for (let i = 0; i < ps.length; i++) {
        const p = ps[i];
        drawParagraph(p);

        ctx.strokeStyle = colors.icons;
        outlineSquareAt(p.x - hPadding / 2 + 3, p.y, spacings.iconSize);
    }

    ctx.fillStyle = "white";
    drawCursor(ps[selectedParagraph], cursor);

    requestAnimationFrame(draw);
}

document.body.addEventListener("keydown", (e) => {
    if (e.code == "Backspace") {
        const item = items[selectedParagraph];
        if (cursor > 0) {
            item.title =
                item.title.slice(0, cursor - 1) + item.title.slice(cursor);
            buildParagraphs();
            cursor--;
        }
    } else if (mode == "Insert") {
        if (e.code == "Escape" || e.code == "Enter") {
            mode = "Normal";
        } else if (e.key.length == 1) {
            items[selectedParagraph].title = insertChartAtPosition(
                items[selectedParagraph].title,
                e.key,
                cursor
            );
            cursor++;
            buildParagraphs();
        }
    } else {
        if (e.code == "KeyL") cursor++;
        if (e.code == "KeyH") cursor--;
        if (e.code == "KeyJ") {
            if (selectedParagraph < items.length - 1) {
                selectedParagraph++;
                cursor = 0;
            }
        }
        if (e.code == "KeyR") {
            items[selectedParagraph].title = "";
            buildParagraphs();
            mode = "Insert";
        }

        if (e.code == "KeyI") {
            if (mode == "Normal") {
                mode = "Insert";
            }
        }

        if (e.code == "KeyK") {
            if (selectedParagraph > 0) {
                selectedParagraph--;
                cursor = 0;
            }
        }
        if (e.code == "KeyW") {
            cursor = ps[selectedParagraph].text.indexOf(" ", cursor + 1) + 1;
        }
        if (e.code == "KeyB")
            cursor =
                ps[selectedParagraph].text
                    .slice(0, cursor - 1)
                    .lastIndexOf(" ") + 1;
    }
});

function insertChartAtPosition(str: string, ch: string, index: number): string {
    return str.slice(0, index) + ch + str.slice(index);
}

requestAnimationFrame(draw);
