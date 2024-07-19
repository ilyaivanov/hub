import { Item } from "./tree";

export type PersistedState = {
    selectedIndex: number;
};

const types = [
    { description: "Viztly Text File", accept: { "text/*": [".txt"] } },
];

function sarializeToFile(root: Item) {
    let res = "";
    const stack = root.children.map((item) => ({ item, level: 0 })).reverse();
    while (stack.length > 0) {
        const { item, level } = stack.pop()!;

        res += `${repeat(" ", level * 2)}${item.title}`;

        //add item specific words aka /yt:fdgdvc12 /v:board /closed
        const atrs: string[] = [];

        if (item.view == "board") atrs.push("/board");

        if (item.children.length > 0 && !item.isOpen) atrs.push("/closed");

        if (atrs.length > 0) res += " " + atrs.join(" ");
        res += "\n";
        if (item.children.length > 0)
            stack.push(
                ...item.children
                    .map((i) => ({ item: i, level: level + 1 }))
                    .reverse()
            );
    }
    return res;
}

export const saveToFile = async (root: Item) => {
    const saveFileFn: any = window.showSaveFilePicker;
    if (saveFileFn) {
        try {
            const fileHandle = await saveFileFn({
                suggestedName: "viztly.txt",
                types,
            });
            const file = await fileHandle.createWritable();
            await file.write(sarializeToFile(root));
            await file.close();
        } catch (e) {
            if (!(e instanceof DOMException && e.name == "AbortError")) {
                throw e;
            }
        }
    } else {
        throw new Error("Browser doesn't have showSaveFilePicker");
    }
};

export const loadFromFile = async (): Promise<Item | undefined> => {
    const openFileFn: any = window.showOpenFilePicker;
    if (openFileFn) {
        try {
            const [fileHandle] = await openFileFn({ types });

            const fileData = await fileHandle.getFile();
            const txt: string = await fileData.text();

            const lines = txt.split("\n");
            const stack = [];

            return undefined;
            // console.log(txt);
            // return txt;
        } catch (e) {
            if (!(e instanceof DOMException && e.name == "AbortError")) {
                throw e;
            }
        }
    } else {
        throw new Error("Browser doesn't have showOpenFilePicker");
    }
};

function replacer(key: keyof Item, value: unknown) {
    if (key == "parent") return undefined;
    else return value;
}

export function saveItemsToLocalStorage(root: Item) {
    localStorage.setItem(
        "items",
        JSON.stringify(root, (key, value) => replacer(key as keyof Item, value))
    );
}

export function loadItemsFromLocalStorage(): Item | undefined {
    const saved = localStorage.getItem("items");
    if (saved) {
        const root: Item = JSON.parse(saved);
        const stack = [root];
        while (stack.length > 0) {
            const parent = stack.pop()!;
            for (const child of parent.children) {
                child.parent = parent;
                stack.push(child);
            }
        }
        return root;
    } else return undefined;
}

export function loadStateFromLocalStorage(): PersistedState | undefined {
    const saved = localStorage.getItem("state");
    if (saved != undefined) return JSON.parse(saved);
}
function repeat(str: string, times: number) {
    let res = "";
    for (let i = 0; i < times; i++) res += str;
    return res;
}
