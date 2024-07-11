export type Animated = {
    from: number;
    target: number;
    current: number;
    lastValue: number;
    acceleration: number;
    isAnimating: boolean;
    props: AnimationProps;
    name?: string;
};
type AnimationProps = {
    stiffness: number;
    dumper: number;
    mass: number;
};
export const fastAnim: AnimationProps = {
    stiffness: 12.7,
    dumper: 0.36,
    mass: 0.8,
};
export const slowAnim: AnimationProps = {
    stiffness: 8.5,
    dumper: 0.4,
    mass: 1.05,
};

const animations: Animated[] = [];

export function spring(
    current: number,
    props: AnimationProps,
    name?: string
): Animated {
    const res: Animated = {
        from: current,
        target: current,
        current: current,
        lastValue: current,
        acceleration: 0,
        isAnimating: false,
        props,
        name,
    };
    animations.push(res);
    return res;
}

export function animateto(anim: Animated, to: number) {
    if (anim.target != to) {
        anim.target = to;
        anim.lastValue = anim.current;
        anim.from = anim.current;
        anim.isAnimating = true;
    }
}

export function tick(deltaTime: number) {
    const deltaSec = deltaTime / 1000;
    for (const anim of animations) {
        if (!anim.isAnimating) continue;

        const { stiffness, dumper, mass } = anim.props;

        const speed = (anim.current - anim.lastValue) / deltaSec;

        const range = anim.target - anim.current;
        const acceleration = (stiffness * range - dumper * speed) * (1 / mass);

        const next = anim.current + (speed + acceleration) * deltaSec;
        anim.lastValue = anim.current;
        anim.current = next;
    }
}
