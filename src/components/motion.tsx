import { Children, type ReactNode } from 'react'
import { motion, useReducedMotion, type Transition, type Variants } from 'motion/react'

const SPRING: Transition = { type: 'spring', stiffness: 260, damping: 30, mass: 1 }
const VIEWPORT = { once: true, margin: '-8% 0px' } as const
const NBSP = String.fromCharCode(160)

/**
 * Single block that rises + blurs into view once (scroll-reveal).
 * Above the fold it plays on load; below, when scrolled into view.
 */
export function Reveal({
  children,
  className,
  y = 24,
  delay = 0,
}: {
  children: ReactNode
  className?: string
  y?: number
  delay?: number
}) {
  const reduce = useReducedMotion()
  const variants: Variants = reduce
    ? { hidden: { opacity: 0 }, visible: { opacity: 1 } }
    : {
        hidden: { opacity: 0, y, filter: 'blur(8px)' },
        visible: { opacity: 1, y: 0, filter: 'blur(0px)' },
      }
  return (
    <motion.div
      className={className}
      variants={variants}
      initial="hidden"
      whileInView="visible"
      viewport={VIEWPORT}
      transition={{ ...SPRING, delay }}
    >
      {children}
    </motion.div>
  )
}

/**
 * Container that staggers its children in from below (the "magnetize
 * bottom-up" load effect). Each direct child is wrapped as an item.
 */
export function Stagger({
  children,
  className,
  stagger = 0.08,
  y = 20,
}: {
  children: ReactNode
  className?: string
  stagger?: number
  y?: number
}) {
  const reduce = useReducedMotion()
  const container: Variants = {
    hidden: {},
    visible: { transition: { staggerChildren: reduce ? 0 : stagger } },
  }
  const item: Variants = reduce
    ? { hidden: { opacity: 0 }, visible: { opacity: 1 } }
    : {
        hidden: { opacity: 0, y, filter: 'blur(6px)' },
        visible: { opacity: 1, y: 0, filter: 'blur(0px)', transition: SPRING },
      }
  return (
    <motion.div
      className={className}
      variants={container}
      initial="hidden"
      whileInView="visible"
      viewport={VIEWPORT}
    >
      {Children.map(children, (child) => (
        <motion.div variants={item}>{child}</motion.div>
      ))}
    </motion.div>
  )
}

/** Character-by-character rise + blur reveal (for the revenue numbers). */
export function TextReveal({ text, className }: { text: string; className?: string }) {
  const reduce = useReducedMotion()
  if (reduce) return <span className={className}>{text}</span>
  return (
    <motion.span
      className={className}
      aria-label={text}
      initial="hidden"
      whileInView="visible"
      viewport={VIEWPORT}
      variants={{ visible: { transition: { staggerChildren: 0.03 } } }}
    >
      {Array.from(text).map((ch, i) => (
        <motion.span
          key={i}
          aria-hidden
          className="inline-block"
          variants={{
            hidden: { opacity: 0, y: '0.5em', filter: 'blur(6px)' },
            visible: { opacity: 1, y: 0, filter: 'blur(0px)', transition: SPRING },
          }}
        >
          {ch.trim() ? ch : NBSP}
        </motion.span>
      ))}
    </motion.span>
  )
}
