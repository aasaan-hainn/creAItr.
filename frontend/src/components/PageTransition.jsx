import { motion } from 'motion/react';
const MotionDiv = motion.div;

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
    <MotionDiv
      initial="initial"
      animate="in"
      exit="out"
      variants={pageVariants}
      transition={pageTransition}
      className="w-full h-full will-change-transform will-change-opacity"
    >
      {children}
    </MotionDiv>
  );
};

export default PageTransition;
