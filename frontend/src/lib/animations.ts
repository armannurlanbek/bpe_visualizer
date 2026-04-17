export const fadeInUp = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.28 } },
}

export const staggerContainer = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.05,
    },
  },
}

export const tokenPop = {
  initial: { scale: 0.85, opacity: 0, y: 8 },
  animate: { scale: 1, opacity: 1, y: 0, transition: { duration: 0.22 } },
  exit: { scale: 0.9, opacity: 0, y: -6, transition: { duration: 0.16 } },
}
