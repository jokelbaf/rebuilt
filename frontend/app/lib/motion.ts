import type { Transition, Variants } from "motion/react";

export const easeOut: Transition = { duration: 0.25, ease: [0.22, 1, 0.36, 1] };

export const fadeInUp: Variants = {
	hidden: { opacity: 0, y: 8 },
	visible: { opacity: 1, y: 0, transition: easeOut },
};

export const fade: Variants = {
	hidden: { opacity: 0 },
	visible: { opacity: 1, transition: easeOut },
};

export const listContainer: Variants = {
	hidden: {},
	visible: { transition: { staggerChildren: 0.04 } },
};

export const listItem: Variants = {
	hidden: { opacity: 0, y: 10 },
	visible: { opacity: 1, y: 0, transition: easeOut },
};
