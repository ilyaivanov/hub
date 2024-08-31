import { file, folder, Item } from "./tree";

export async function getFolderContent(
    folderHandle: FileSystemDirectoryHandle
) {
    const children: Item[] = [];
    for await (const [name, handle] of folderHandle.entries()) {
        if (handle.kind === "file") {
            children.push(file(name, handle));
        } else if (handle.kind === "directory") {
            children.push(folder(name, handle));
        }
    }

    return [
        ...children.filter(
            (item) => item.handle instanceof FileSystemDirectoryHandle
        ),
        ...children.filter(
            (item) => item.handle instanceof FileSystemFileHandle
        ),
    ];
}
