import { AppState } from "../index";
import { spacings } from "../utils/consts";
import { div, span } from "../utils/html";
import { mapNumber } from "../utils/math";
import { Item } from "../utils/tree";
import {
    narrow,
    pauseIcon,
    playIcon,
    playNext,
    volumeDisabled,
    volumeHigh,
    wide,
} from "./icons";

import "./player.css";
import {
    getDuration,
    getPlayerProgressState,
    pause,
    play,
    resume,
    youtubeIframeId,
} from "./youtubePlayer";

const videoElem = document.createElement("video");
videoElem.classList.add("local-video");

let currentTimeElem: HTMLElement;
let maxTimeElem: HTMLElement;
let timeBlob: HTMLElement;
let titleElem: HTMLElement;

const footer = div({
    class: "footer",
    style: { height: spacings.footer + "px" },
    children: [
        playNext.cloneNode(true),
        playIcon,
        pauseIcon,
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

        wide,
        narrow,

        span({
            class: "player-title",
            ref: (ref) => (titleElem = ref),
        }),
        div({ id: youtubeIframeId }),
    ],
});

document.body.appendChild(videoElem);
document.body.appendChild(footer);

pauseIcon.style.display = "none";
narrow.style.display = "none";

function timeTick(time: number, maxTime: number) {
    if (maxTime >= 60 * 60) {
        currentTimeElem.textContent = formatTimeWithHour(time);
        maxTimeElem.textContent = formatTimeWithHour(maxTime);
    } else {
        currentTimeElem.textContent = formatTimeOmitHour(time);
        maxTimeElem.textContent = formatTimeOmitHour(maxTime);
    }

    timeBlob.style.left = mapNumber(0, maxTime, -6, 294, time) + "px";
}

export function updateVideoViewButton(state: AppState) {
    if (state.player.videoView == "contain") {
        narrow.style.display = "none";
        wide.style.removeProperty("display");
    } else {
        wide.style.display = "none";
        narrow.style.removeProperty("display");
    }
    onPlayerResize(state);
}

videoElem.addEventListener("durationchange", () => {
    timeTick(videoElem.currentTime, videoElem.duration);
});

videoElem.addEventListener("timeupdate", () => {
    timeTick(videoElem.currentTime, videoElem.duration);
});

document.addEventListener("video-progress", () => {
    const state = getPlayerProgressState();
    timeTick(state.currentTime, state.duration);
});

export function onPlayerResize(state: AppState) {
    videoElem.style.width = state.canvas.width + "px";

    // difference between contain and cover to be implemented
    // const videoWidth = videoElem.clientWidth;
    // const videoHeight = videoElem.clientHeight;
    // const aspectRatio = videoWidth / videoHeight;

    // console.log(videoWidth, videoHeight);
    // if (state.player.videoView == "contain") {
    //     // videoElem.style.
    // } else {
    //     videoElem.style.width = state.canvas.width + "px";
    // }
}

export function updatePlayerBrightness(state: AppState) {
    // videoElem.style.filter = `blur(${state.player.blur}px) brightness(${state.player.brightness}%)`;
    videoElem.style.opacity = (state.player.brightness / 100).toFixed(2) + "";
}

let isPlaying = false;
export async function playItem(state: AppState, item: Item) {
    if (item.type == "yt-video" && item.itemId) {
        play(item.itemId);
    } else if (item.handle && item.handle instanceof FileSystemFileHandle) {
        const file = await item.handle.getFile();
        videoElem.src = URL.createObjectURL(file);

        // if (file.type.startsWith("audio/"))
        // if (file.type.startsWith("video/"))
    } else {
        return;
    }

    state.itemPlaying = item;
    isPlaying = true;
    titleElem.innerText = item.title;
    if (item.type == "yt-video") updateButtons();
    else updatePlayButtons(state);
}

export function togglePlay(state: AppState) {
    isPlaying = !isPlaying;
    updatePlayButtons(state);
}

export function updatePlayButtons(state: AppState) {
    if (state.itemPlaying) {
        if (isPlaying) {
            if (state.itemPlaying.type == "yt-video") resume();
            else videoElem.play();
        } else {
            if (state.itemPlaying.type == "yt-video") pause();
            else videoElem.pause();
        }

        updateButtons();
    }
}

function updateButtons() {
    if (isPlaying) {
        playIcon.style.display = "none";
        pauseIcon.style.removeProperty("display");
    } else {
        pauseIcon.style.display = "none";
        playIcon.style.removeProperty("display");
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
