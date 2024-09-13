import { i, insertAsLastChild, Item } from "./utils/tree";

export type PersistedState = {
    selectedIndex: number;
};

const types = [
    { description: "Viztly Text File", accept: { "text/*": [".txt"] } },
];

function formatItemAttributes(item: Item): string {
    const atrs: string[] = [];

    if (item.children.length > 0 && !item.isOpen) atrs.push("closed");

    if (item.type == "yt-channel") atrs.push("yt-ch:" + item.itemId);
    else if (item.type == "yt-playlist") atrs.push("yt-pl:" + item.itemId);
    else if (item.type == "yt-video") {
        atrs.push("yt-vid:" + item.itemId);

        if (item.ytChannelTitle && item.ytChannelId) {
            atrs.push("yt-vid-ch:" + item.ytChannelTitle.replace(" ", "№"));
            atrs.push("yt-vid-ch-id:" + item.ytChannelId);
        }
    } else if (item.type == "yt-search") atrs.push("yt-search");
    else if (item.type == "yt-load-more") {
        atrs.push("yt-load");
        atrs.push("yt-loaded:" + item.loadMoreResultsLoaded);
        atrs.push("yt-total:" + item.loadMoreResultsTotal);
        atrs.push("yt-page:" + item.loadMoreResultsPerPage);
        atrs.push("yt-token:" + item.loadMorePageToken);
        atrs.push("yt-load-type:" + item.loadMoreWhat);
    }

    if (atrs.length > 0) return atrs.map((atr) => "/" + atr).join(" ");
    return "";
}

const map: Record<string, (item: Item, value: string | undefined) => void> = {
    "/closed": (item) => (item.isOpen = false),
    "/yt-search": (item) => (item.type = "yt-search"),
    "/yt-ch": (item, id) => {
        item.type = "yt-channel";
        item.itemId = id;
    },
    "/yt-pl": (item, id) => {
        item.type = "yt-playlist";
        item.itemId = id;
    },
    "/yt-vid": (item, id) => {
        item.type = "yt-video";
        item.itemId = id;
    },

    "/yt-vid-ch": (item, title) => (item.ytChannelTitle = title),
    "/yt-vid-ch-id": (item, id) => (item.ytChannelId = id),

    //load more flags
    "/yt-load": (item) => (item.type = "yt-load-more"),
    "/yt-loaded": (item, loaded) =>
        (item.loadMoreResultsLoaded = loaded ? +loaded : 0),
    "/yt-page": (item, page) =>
        (item.loadMoreResultsPerPage = page ? +page : 0),

    "/yt-total": (item, total) =>
        (item.loadMoreResultsTotal = total ? +total : 0),
    "/yt-token": (item, token) => (item.loadMorePageToken = token),
    "/yt-load-type": (item, type) =>
        (item.loadMoreWhat = type as Item["loadMoreWhat"]),
};

function parseLine(line: string): { level: number; item: Item } {
    let level = 0;
    while (line[level] == " ") level++;

    const item = i("");

    //settings this to undefined, because I want to know if Item is explicitly /closed in a file
    item.isOpen = undefined;

    let words = line
        .trimStart()
        .split(" ")
        .filter((word) => {
            const [key, value] = word.split(":");
            const action = map[key];
            if (action) {
                action(item, value);
                return false;
            }
            return true;
        });

    item.title = words.join(" ");
    return { level, item };
}

function sarializeToFile(root: Item) {
    const stack = root.children.map((item) => ({ item, level: 0 })).reverse();
    const lines: string[] = [];
    while (stack.length > 0) {
        let line = "";
        const { item, level } = stack.pop()!;

        // ignore files and folders and their children during serialization for now
        if (item.handle) continue;

        line += `${repeat(" ", level * 2)}${item.title.trimStart()}`;

        const attributesFormatted = formatItemAttributes(item);
        if (attributesFormatted.length > 0) line += " " + attributesFormatted;

        lines.push(line);
        if (item.children.length > 0)
            stack.push(
                ...item.children
                    .map((i) => ({ item: i, level: level + 1 }))
                    .reverse()
            );
    }
    return lines.join("\n");
}

export function parseFileText(text: string): Item {
    const lines = text.split("\n");
    const root = i("Root");
    const stack: { item: Item; level: number }[] = [{ item: root, level: -1 }];

    function removeFromStackUntilLevel(level: number) {
        while (stack.length > 0 && stack[stack.length - 1].level >= level) {
            const i = stack.pop();

            if (i && i.item.children.length > 0 && i.item.isOpen !== false)
                i.item.isOpen = true;
        }
    }

    for (let j = 0; j < lines.length; j++) {
        const line = lines[j];

        const { level, item } = parseLine(line);

        removeFromStackUntilLevel(level);

        insertAsLastChild(stack[stack.length - 1].item, item);

        stack.push({ item, level });
    }

    removeFromStackUntilLevel(-1);

    return root;
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
            return parseFileText(txt);
        } catch (e) {
            if (!(e instanceof DOMException && e.name == "AbortError")) {
                throw e;
            }
        }
    } else {
        throw new Error("Browser doesn't have showOpenFilePicker");
    }
};

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

        // if (root.children[0].title == "sample youtube") root.children.shift();

        // addItemAt(
        //     root,
        //     createItem("item", "sample youtube", [
        //         ytVideo("Guitar video", "FujgXKf7yj4"),
        //         ytChannel("VSauce", "UC6nSFpj9HTCZ5t-N3Rm3-HA"),
        //         ytChannel("Folding Ideas", "UCyNtlmLB73-7gtlBz00XOQQ"),
        //         ytChannel("hbomberguy", "UClt01z1wHHT7c5lKcU8pxRQ"),
        //         ytChannel("Палає", "UCCnxINydEcDs-74iVMRU-Qw"),
        //         ytPlaylist("DOT. by VSauce", "PL8B1DDE384770FD97"),
        //         ytChannel("Radio Intense", "UCCWHSZ6VQPr7cnJAF8JbDzA"),
        //         ytPlaylist(
        //             "Xenia (Radio Intense)",
        //             "PLJJhuE0qsJfQlj6uw1vJCgHbPilEgPETY"
        //         ),
        //         ytVideo("Andy McKee - Into the Ocean", "Cvar4ZsqsEo"),
        //     ]),
        //     0
        // );

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
