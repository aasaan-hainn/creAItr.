import { motion } from 'motion/react';

const pageVariants = {
  initial: {
    opacity: 0,
    scale: 0.98,
    y: 10,
    filter: "blur(4px)"
  },
  in: {
    opacity: 1,
    scale: 1,
    y: 0,
    filter: "blur(0px)"
  },
  out: {
    opacity: 0,
    scale: 1.02,
    y: -10,
    filter: "blur(4px)"
  }
};

const pageTransition = {
  type: "tween",
  ease: "circOut",
  duration: 0.4
};

const PageTransition = ({ children }) => {
  return (
    <motion.div
      initial="initial"
      animate="in"
      exit="out"
      variants={pageVariants}
      transition={pageTransition}
      className="w-full h-full"
    >
      {children}
    </motion.div>
  );
};

export default PageTransition;
