import { colors, spacings } from "./consts";
import { fillSquareAt, setCtx } from "./drawing";
import { drawCursor, drawParagraph, Paragraph, updateLines } from "./paragraph";

document.body.style.backgroundColor = colors.bg;

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
});

const hPadding = 15;
const vPadding = hPadding * 0.6;

const ps: Paragraph[] = [
    {
        text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.",
        x: hPadding,
        y: vPadding,
        maxWidth: 0,
        lines: [],
    },
    {
        text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.",
        x: hPadding,
        y: vPadding,
        maxWidth: 0,
        lines: [],
    },
];

let cursor = 0;

let splitAtX = screenWidth / 2;

function updateWidths(time: number) {
    // splitAtX = screenWidth / 2 + Math.sin(time / 1000) * 100;
    splitAtX = screenWidth / 2 - 150;
    ps[0].maxWidth = splitAtX - hPadding * 2;
    ps[1].maxWidth = screenWidth - splitAtX - hPadding * 2;

    ps[1].x = splitAtX + hPadding;
}

function draw(time: number) {
    ctx.clearRect(0, 0, screenWidth, screenHeight);

    ctx.font = `${spacings.fontWeight} ${spacings.fontSize}px ${spacings.font}`;

    updateWidths(time);
    for (let i = 0; i < ps.length; i++) {
        const p = ps[i];
        updateLines(ctx, p);
        drawParagraph(ctx, p);

        if (i == 0) drawCursor(ctx, p, cursor);
    }

    ctx.globalAlpha = 0.3;
    ctx.fillStyle = "green";
    ctx.fillRect(splitAtX - 1, 0, 2, screenHeight);

    ctx.globalAlpha = 1;

    requestAnimationFrame(draw);
}

document.body.addEventListener("keydown", (e) => {
    if (e.code == "KeyL") cursor++;
    if (e.code == "KeyH") cursor--;
    if (e.code == "KeyW") cursor = ps[0].text.indexOf(" ", cursor + 1) + 1;
    if (e.code == "KeyB")
        cursor = ps[0].text.slice(0, cursor - 1).lastIndexOf(" ") + 1;
});

requestAnimationFrame(draw);
