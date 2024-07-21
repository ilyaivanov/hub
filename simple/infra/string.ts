export function insertTextAt(str: string, index: number, substr: string) {
    return str.slice(0, index) + substr + str.slice(index);
}
