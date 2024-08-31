type Child = string | Node | undefined | false;

type Props = {
    id?: string;
    children?: Child[] | Child;
    class?: string | Record<string, boolean>;
    ref?: (ref: HTMLElement) => void;
    style?: Record<string, any>;
};

export function div(props: Props) {
    return assignProps(document.createElement("div"), props);
}

export function fragment(children: Child[]) {
    const fragment = document.createDocumentFragment();
    for (const child of children) {
        if (child) fragment.append(child);
    }

    return fragment;
}

type ImageProps = Props & {
    src: string;
};
export function img(props: ImageProps) {
    const img = assignProps(document.createElement("img"), props);
    img.src = props.src;
    return img;
}

export function span(props: Props) {
    return assignProps(document.createElement("span"), props);
}

export function ul(props: Props) {
    return assignProps(document.createElement("ul"), props);
}

export function li(props: Props) {
    return assignProps(document.createElement("li"), props);
}

function assignProps<T extends HTMLElement>(el: T, props: Props): T {
    if (typeof props.class === "string") el.className = props.class;

    if (typeof props.class === "object") {
        for (const className in props.class) {
            if (props.class[className]) el.classList.add(className);
        }
    }

    if (Array.isArray(props.children)) {
        for (const child of props.children) {
            if (child) el.append(child);
        }
    } else if (props.children) el.append(props.children);

    if (props.id) el.id = props.id;

    if (props.style) Object.assign(el.style, props.style);

    if (props.ref) props.ref(el);

    return el;
}
