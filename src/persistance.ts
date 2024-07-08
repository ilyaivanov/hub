import { Item } from "./tree";

export type PersistedState = {
    selectedIndex: number;
};

// function repeat(str: string, times: number) {
//     let res = "";
//     for (let i = 0; i < times; i++) res += str;
//     return res;
// }

function replacer(key: keyof Item, value: unknown) {
    if (key == "parent") return undefined;
    else return value;
}
export function saveItemsToLocalStorage(root: Item) {
    // let res = "";
    // const stack = root.children.map((item) => ({ item, level: 0 })).reverse();
    // while (stack.length > 0) {
    //     const { item, level } = stack.pop()!;

    //     res += `${repeat(" ", level * 2)}${item.title}\n`;
    //     if (item.children.length > 0)
    //         stack.push(
    //             ...item.children.map((i) => ({ item: i, level: level + 1 }))
    //         );
    // }
    localStorage.setItem(
        "items",
        JSON.stringify(root, (key, value) => replacer(key as keyof Item, value))
    );
}
// export function saveStateToLocalStorage(state: PersistedState) {
//     localStorage.setItem("state", JSON.stringify(state));
// }

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
