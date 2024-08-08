export type Item = {
    title: string;
    children: Item[];
    parent: Item;
    isOpen: boolean;
    view: "tree" | "board";
};

export function i(title: string, children: Item[] = []) {
    const res: Item = {
        title,
        children,
        parent: undefined!,
        isOpen: children.length > 0,
        view: "tree",
    };
    children.forEach((c) => (c.parent = res));
    return res;
}

export function board(title: string, children: Item[] = []) {
    const res: Item = {
        title,
        children,
        parent: undefined!,
        isOpen: children.length > 0,
        view: "board",
    };
    children.forEach((c) => (c.parent = res));
    return res;
}

export function isRoot(item: Item) {
    return !item.parent;
}

export function removeItem(item: Item) {
    if (item.parent) {
        const context = item.parent.children;
        context.splice(context.indexOf(item), 1);
        if (item.parent.children.length == 0) item.parent.isOpen = false;
    }
}

export function addItemAt(parent: Item, child: Item, index: number) {
    parent.children.splice(index, 0, child);
    child.parent = parent;
    parent.isOpen = true;
}

export function insertAsLastChild(parent: Item, item: Item) {
    removeItem(item);
    parent.children.push(item);
    item.parent = parent;
}

export function insertAsFirstChild(parent: Item, item: Item) {
    removeItem(item);
    parent.children.unshift(item);
    item.parent = parent;
    if (parent.children.length == 1) parent.isOpen = true;
}

export function insertItemAfter(afterWhichToInsert: Item, newItem: Item) {
    if (newItem.parent) removeItem(newItem);

    const context = getContext(afterWhichToInsert);
    context.splice(context.indexOf(afterWhichToInsert) + 1, 0, newItem);
    newItem.parent = afterWhichToInsert.parent;
}

export function insertItemBefore(beforeWhichToInsert: Item, newItem: Item) {
    if (newItem.parent) removeItem(newItem);

    const context = getContext(beforeWhichToInsert);
    context.splice(context.indexOf(beforeWhichToInsert), 0, newItem);
    newItem.parent = beforeWhichToInsert.parent;
}

export function getContext(item: Item) {
    if (item.parent) {
        return item.parent.children;
    }
    throw new Error(
        `Attempt to get context from '${item.title}' which doesn't have a parent`
    );
}

export function getOpenChildrenCount(item: Item) {
    let res = 0;
    const stack = [...item.children];
    while (stack.length > 0) {
        const item = stack.pop()!;

        if (item.isOpen) {
            stack.push(...item.children);
        }
        res++;
    }
    return res;
}

export function isParentOrSame(child: Item, parent: Item) {
    let p = child;
    while (p) {
        if (p == parent) return true;

        p = p.parent;
    }
    return false;
}
