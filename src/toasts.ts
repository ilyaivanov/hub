import { spacings } from "./utils/consts";

const elem = document.createElement("div");
Object.assign(elem.style, {
    position: "fixed",
    width: "300px",
    height: "100px",
    left: "calc(50vw - 150px)",

    bottom: "-100px",

    color: "white",
    backgroundColor: "green",
    pointerEvents: "none",
    fontFamily: spacings.font,
    fontSize: "13px",
    padding: "10px",
    boxSizing: "border-box",
});

document.body.appendChild(elem);

const hidden = { bottom: "-100px", opacity: 0 };
const visible = { bottom: "50px", opacity: 1 };

export function showMessage(str: string) {
    elem.innerText = `'${str}'\ncopied...`;
    const an = elem.animate([hidden, visible], {
        duration: 300,
        easing: "ease-out",
        fill: "forwards",
    });

    setTimeout(() => {
        elem.animate([visible, hidden], {
            duration: 300,
            easing: "ease-in",
        });

        // cancel because of the fill property of animation
        an.cancel();
    }, 2000);
}
