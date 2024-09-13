import { PageInfo } from "../youtubeApi";

export type Item = {
    title: string;
    children: Item[];
    parent: Item;

    //undefined is used only during deserialization to distinguish setting isOpen to false or not setting isOpen at all
    isOpen: boolean | undefined;
    view: "tree" | "board";
    type:
        | "item"
        | "folder"
        | "file"
        | "yt-search"
        | "yt-channel"
        | "yt-load-more"
        | "yt-playlist"
        | "yt-video";

    itemId?: string;

    loadMoreWhat?: "channel" | "playlist" | "search";
    loadMorePageToken?: string;
    loadMoreResultsTotal?: number;
    loadMoreResultsLoaded?: number;
    loadMoreResultsPerPage?: number;

    ytChannelId?: string;
    ytChannelTitle?: string;

    handle?: FileSystemDirectoryHandle | FileSystemFileHandle;
};

export function i(title: string, children: Item[] = []) {
    return createItem("item", title, children);
}

export function createItem(
    type: Item["type"],
    title: string,
    children: Item[] = []
) {
    const res: Item = {
        title,
        children,
        type,
        parent: undefined!,
        isOpen: children.length > 0,
        view: "tree",
    };
    children.forEach((c) => (c.parent = res));
    return res;
}

export function getLoadMoreTypeForItem(item: Item): Item["loadMoreWhat"] {
    if (item.type == "yt-playlist") return "playlist";
    else if (item.type == "yt-channel") return "channel";
    else if (item.type == "yt-search") return "search";
    else throw new Error("Unknown laod more type for " + item.type);
}

export function createLoadMoreItem(
    itemId: string,
    type: Item["loadMoreWhat"],
    pageInfo: PageInfo,
    alreadyLoaded: number = 0
) {
    const item = createItem("yt-load-more", "");
    item.itemId = itemId;

    item.loadMoreWhat = type;
    item.loadMorePageToken = pageInfo.nextPageToken;

    item.loadMoreResultsLoaded = alreadyLoaded + pageInfo.resultsPerPage;
    item.loadMoreResultsPerPage = pageInfo.resultsPerPage;
    item.loadMoreResultsTotal = pageInfo.totalResults;

    const remainingitems = Math.min(
        item.loadMoreResultsPerPage,
        item.loadMoreResultsTotal - item.loadMoreResultsLoaded
    );
    item.title = `Press space to load ${remainingitems} more (${item.loadMoreResultsLoaded} of ${item.loadMoreResultsTotal} loaded)`;
    return item;
}

export function createYtSearchItem() {
    const res = createItem("yt-search", "");
    return res;
}

export function ytVideo(title: string, videoId: string) {
    const res = createItem("yt-video", title);
    res.itemId = videoId;
    return res;
}
export function ytPlaylist(title: string, playlistId: string) {
    const res = createItem("yt-playlist", title);
    res.itemId = playlistId;
    return res;
}
export function ytChannel(title: string, channelId: string) {
    const res = createItem("yt-channel", title);
    res.itemId = channelId;
    return res;
}

export function folder(
    title: string,
    handle: FileSystemDirectoryHandle,
    children: Item[] = []
) {
    const res = createItem("folder", title, children);
    res.handle = handle;
    return res;
}

export function file(title: string, handle: FileSystemFileHandle) {
    const res = createItem("file", title);
    res.handle = handle;
    return res;
}

export function isRoot(item: Item) {
    return !item.parent;
}

export function findParent(
    item: Item,
    fn: (parent: Item) => boolean
): Item | undefined {
    let parent = item.parent;
    while (parent) {
        if (fn(parent)) return parent;
        parent = parent.parent;
    }

    return undefined;
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
export function addItemsAt(parent: Item, children: Item[], index: number) {
    parent.children.splice(index, 0, ...children);
    children.forEach((child) => (child.parent = parent));
    parent.isOpen = true;
}

export function replaceChildren(parent: Item, children: Item[]) {
    parent.children = [];
    addItemsAt(parent, children, 0);
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

export function getIndexOf(item: Item) {
    if (isRoot(item))
        throw new Error(
            "You asked for an index of a Root item. You probably shouldn't do that."
        );

    return item.parent.children.indexOf(item);
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
