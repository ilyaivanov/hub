import { AppState } from "../index";
import { spacings } from "../utils/consts";
import { div, span } from "../utils/html";
import { mapNumber } from "../utils/math";
import { Item } from "../utils/tree";
import { pause, play, playNext, volumeDisabled, volumeHigh } from "./icons";

import "./player.css";

const videoElem = document.createElement("video");

let currentTimeElem: HTMLElement;
let maxTimeElem: HTMLElement;
let timeBlob: HTMLElement;
let titleElem: HTMLElement;

const footer = div({
    class: "footer",
    style: { height: spacings.footer + "px" },
    children: [
        playNext.cloneNode(true),
        play,
        pause,
        playNext.cloneNode(true),

        span({
            class: "current-time",
            ref: (ref) => (currentTimeElem = ref),
            style: { minWidth: "50px", textAlign: "right" },
        }),

        div({
            class: "list",
            children: [div({ class: "blob", ref: (ref) => (timeBlob = ref) })],
        }),

        span({
            ref: (ref) => (maxTimeElem = ref),
            style: { minWidth: "50px" },
        }),
        volumeHigh,
        // volumeDisabled,

        div({
            class: "list-vol",
            children: [div({ class: "blob" })],
        }),

        span({
            class: "player-title",
            ref: (ref) => (titleElem = ref),
        }),
    ],
});

document.body.appendChild(videoElem);
document.body.appendChild(footer);

pause.style.display = "none";

let maxTime = 0;
let time = 0;

function timeTick() {
    if (maxTime >= 60 * 60) {
        currentTimeElem.textContent = formatTimeWithHour(time);
        maxTimeElem.textContent = formatTimeWithHour(maxTime);
    } else {
        currentTimeElem.textContent = formatTimeOmitHour(time);
        maxTimeElem.textContent = formatTimeOmitHour(maxTime);
    }

    timeBlob.style.left = mapNumber(0, maxTime, -6, 294, time) + "px";
}

videoElem.addEventListener("durationchange", (e) => {
    maxTime = videoElem.duration;
    timeTick();
});

videoElem.addEventListener("timeupdate", (e) => {
    time = videoElem.currentTime;
    timeTick();
});

let isPlaying = false;
export async function playItem(state: AppState, item: Item) {
    if (item.handle && item.handle instanceof FileSystemFileHandle) {
        state.itemPlaying = item;
        const file = await item.handle.getFile();
        videoElem.src = URL.createObjectURL(file);

        isPlaying = true;
        titleElem.innerText = item.title;
        updatePlayButtons();

        // if (file.type.startsWith("audio/"))
        // if (file.type.startsWith("video/"))
    } else {
    }
}

export function togglePlay() {
    isPlaying = !isPlaying;
    updatePlayButtons();
}

export function updatePlayButtons() {
    if (isPlaying) {
        videoElem.play();
        play.style.display = "none";
        pause.style.removeProperty("display");
    } else {
        videoElem.pause();
        pause.style.display = "none";
        play.style.removeProperty("display");
    }
}

function formatTimeOmitHour(t: number) {
    let minutes = Math.floor(t / 60);
    let seconds = Math.round(t % 60);
    return pad(minutes, 2) + ":" + pad(seconds, 2);
}

function formatTimeWithHour(t: number) {
    let hours = Math.floor(t / 60 / 60);
    let minutes = Math.floor(t / 60) - 60 * hours;
    let seconds = Math.round(t % 60);
    return pad(hours, 2) + ":" + pad(minutes, 2) + ":" + pad(seconds, 2);
}

function pad(n: { toString: () => string }, max: number): string {
    let str = n.toString();
    while (str.length < max) str = "0" + str;
    return str;
}
