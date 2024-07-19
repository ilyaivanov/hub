const canvas = document.createElement("canvas");
const ctx = canvas.getContext("2d")!;
//@ts-expect-error
document.ctx = ctx;
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
window.addEventListener("resize", onResize);

let lastTime: number = 0;
const squreSize = 2;

function clearCanvas() {
    ctx.fillStyle = "#1e2021";
    ctx.fillRect(-200000, -200000, 400000, 400000);
}
let posX = screenWidth / squreSize / 2;
let posY = screenHeight / squreSize / 2;

// min inclusive, max exclusive
function randInt(min: number, max: number) {
    return min + Math.floor(Math.random() * (max - min));
}

function weightedThreeChoice(firstProb: number, secondProb: number) {
    const rand = Math.random();
    if (rand <= firstProb) return 0;
    if (rand <= firstProb + secondProb) return 1;
    return 2;
}

const bars = [0, 0, 0];
const probabilityToMoveRight = 0.5;

function onTick(time: number) {
    let delta = time - lastTime;
    // clearCanvas();

    // ctx.resetTransform();
    // ctx.translate(posX, posY);
    // ctx.scale(scale, scale);

    ctx.fillStyle = "white";
    ctx.fillRect(posX * squreSize, posY * squreSize, squreSize, squreSize);

    const xMovement = weightedThreeChoice(
        probabilityToMoveRight,
        (1 - probabilityToMoveRight) / 2
    );
    if (xMovement == 0) posX += 1;
    else if (xMovement == 1) posX -= 1;

    const YMovement = weightedThreeChoice(
        probabilityToMoveRight,
        (1 - probabilityToMoveRight) / 2
    );
    if (YMovement == 0) posY += 1;
    else if (YMovement == 1) posY -= 1;

    // bars[xMovement]++;

    // for (let i = 0; i < bars.length; i++) {
    //     const barHeight = bars[i];
    //     ctx.fillRect(i * 40, screenHeight - barHeight, 30, barHeight);
    // }

    // posY += randInt(-1, 2);
    // posX += randInt(-1, 2);

    lastTime = time;
    requestAnimationFrame(onTick);
}

console.log(probabilityToMoveRight, (1 - probabilityToMoveRight) / 2);

clearCanvas();
requestAnimationFrame(onTick);
