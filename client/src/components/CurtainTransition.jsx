import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

export default function CurtainTransition() {
  const location = useLocation();
  const [playKey, setPlayKey] = useState(0);
  useEffect(() => {
    setPlayKey((k) => k + 1);
  }, [location.pathname]);
  return (
    <AnimatePresence>
      <motion.div key={`curtain-${playKey}`} className="fixed inset-0 z-[100] pointer-events-none">
        <motion.div
          initial={{ x: 0 }}
          animate={{ x: '-100%' }}
          transition={{ duration: 0.5, ease: [0.76, 0, 0.24, 1] }}
          className="absolute left-0 top-0 w-1/2 h-full bg-stage border-r border-marquee/40"
        />
        <motion.div
          initial={{ x: 0 }}
          animate={{ x: '100%' }}
          transition={{ duration: 0.5, ease: [0.76, 0, 0.24, 1] }}
          className="absolute right-0 top-0 w-1/2 h-full bg-stage border-l border-marquee/40"
        />
      </motion.div>
    </AnimatePresence>
  );
}