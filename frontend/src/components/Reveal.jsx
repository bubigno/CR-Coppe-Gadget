import { motion } from "framer-motion";

const EASE = [0.22, 1, 0.36, 1];

export function Reveal({ children, delay = 0, className = "", y = 28 }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.7, ease: EASE, delay }}
    >
      {children}
    </motion.div>
  );
}

export function MaskedLines({ lines, className = "", lineClass = "" }) {
  return (
    <span className={className}>
      {lines.map((l, i) => (
        <span key={i} className="mask-reveal">
          <motion.span
            className={`block ${typeof lineClass === "function" ? lineClass(i) : lineClass}`}
            initial={{ y: "112%" }}
            animate={{ y: "0%" }}
            transition={{ duration: 0.95, ease: EASE, delay: 0.25 + i * 0.13 }}
          >
            {l}
          </motion.span>
        </span>
      ))}
    </span>
  );
}

export { EASE };