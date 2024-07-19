import { colors, dark, light, setColors, spacings } from "../src/consts";
import { loadFromFile, saveToFile } from "./filePersistance";

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
    render();
});

const padding = 10;

const cursorPos = {
    line: 0,
    char: 3,
};

type Mode = "normal" | "edit";
let mode: Mode = "normal";

let items = ["foo", "bar", "buzz"];

function render() {
    ctx.font = `${spacings.fontWeight} ${spacings.fontSize}px ${spacings.font}`;

    const ms = ctx.measureText("f");
    const h = ms.fontBoundingBoxAscent + ms.fontBoundingBoxDescent;

    ctx.clearRect(-20000, -20000, 40000, 40000);
    let y = padding + h / 2;
    let x = padding;

    ctx.fillStyle = colors.text;
    ctx.textBaseline = "middle";

    for (let i = 0; i < items.length; i++) {
        ctx.fillText(items[i], x, y);
        y += h;
    }

    ctx.fillStyle = mode == "edit" ? "green" : "white";
    const cursorWidth = 1.5;

    let cursorX = 0;
    let line = items[cursorPos.line];
    if (line) {
        const subline = line.slice(0, cursorPos.char);
        cursorX = ctx.measureText(subline).width - cursorWidth / 2;
    }

    ctx.fillRect(
        padding + cursorX,
        padding + cursorPos.line * h,
        cursorWidth,
        h
    );
}
render();

document.addEventListener("keydown", async (e) => {
    if (mode == "normal") {
        if (e.code == "KeyS" && e.metaKey) {
            saveToFile(items.join("\n"));
            e.preventDefault();
        } else if (e.code == "KeyO" && e.metaKey) {
            e.preventDefault();

            const lines = await loadFromFile();
            if (lines) {
                cursorPos.char = 0;
                cursorPos.line = 0;
                items = lines.split("\n");
            }
        } else if (e.code == "KeyI") mode = "edit";
        else if (e.code == "KeyJ") {
            if (cursorPos.line < items.length - 1) cursorPos.line += 1;
        } else if (e.code == "KeyK") {
            if (cursorPos.line > 0) cursorPos.line -= 1;
        } else if (e.code == "KeyH") {
            if (cursorPos.char > 0) cursorPos.char -= 1;
        } else if (e.code == "KeyL") {
            if (cursorPos.char < items[cursorPos.line].length)
                cursorPos.char += 1;
        } else if (e.code == "KeyD") {
            items.splice(cursorPos.line, 1);
            cursorPos.char = 0;

            if (cursorPos.line > 0) cursorPos.line -= 1;

            if (items.length == 0) items.push("");
        }
    } else {
        if (e.code == "Escape") mode = "normal";
        if (e.code == "Enter") {
            items.splice(cursorPos.line + 1, 0, "");
            cursorPos.line++;
            cursorPos.char = 0;
        }

        if (e.code == "Backspace") {
            if (cursorPos.char > 0) {
                const newLine = items[cursorPos.line].split("");

                newLine.splice(cursorPos.char - 1, 1);

                items[cursorPos.line] = newLine.join("");
                cursorPos.char--;
            }
        }

        if (e.key.length == 1) {
            insertTextIntoPosition(e.key);
        }
    }

    console.log(cursorPos);

    render();
});

function insertTextIntoPosition(str: string) {
    const newLine = items[cursorPos.line].split("");
    newLine.splice(cursorPos.char, 0, ...str);
    items[cursorPos.line] = newLine.join("");
    cursorPos.char += str.length;
}

document.addEventListener("paste", (e) => {
    const t = e.clipboardData?.getData("text");

    if (t) {
        insertTextIntoPosition(t);
        render();
    }
});
