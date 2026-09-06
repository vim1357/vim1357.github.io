import {
  cloneElement,
  isValidElement,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactElement,
  type ReactNode,
} from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'

type Side = 'top' | 'right' | 'bottom' | 'left'

const PREFIX: Record<Side, string> = {
  top: 'translate(-50%, -100%)',
  bottom: 'translate(-50%, 0)',
  left: 'translate(-100%, -50%)',
  right: 'translate(0, -50%)',
}

/**
 * beui.dev/components/motion/tooltip — ported to this project's stack.
 * Desktop: hover / focus. Touch: tap the trigger to open, tap outside or Esc
 * to close. Rendered in a portal; blur + spring spawn; respects reduced motion.
 */
export function Tooltip({
  content,
  children,
  side = 'top',
  delay = 120,
  className,
}: {
  content: ReactNode
  children: ReactElement
  side?: Side
  delay?: number
  className?: string
}) {
  const reduce = useReducedMotion()
  const [open, setOpen] = useState(false)
  const [coords, setCoords] = useState<{ x: number; y: number } | null>(null)
  const triggerRef = useRef<HTMLElement>(null)
  const timer = useRef<number | undefined>(undefined)
  const id = useId()

  const place = () => {
    const el = triggerRef.current
    if (!el) return
    const r = el.getBoundingClientRect()
    const gap = 8
    let x = r.left + r.width / 2
    let y = r.top - gap
    if (side === 'bottom') y = r.bottom + gap
    if (side === 'left') {
      x = r.left - gap
      y = r.top + r.height / 2
    }
    if (side === 'right') {
      x = r.right + gap
      y = r.top + r.height / 2
    }
    setCoords({ x, y })
  }

  const show = () => {
    window.clearTimeout(timer.current)
    place()
    timer.current = window.setTimeout(() => setOpen(true), delay)
  }
  const hide = () => {
    window.clearTimeout(timer.current)
    setOpen(false)
  }
  const toggle = () => {
    if (open) return hide()
    place()
    setOpen(true)
  }

  useEffect(() => {
    if (!open) return
    const onPointer = (e: PointerEvent) => {
      if (triggerRef.current && !triggerRef.current.contains(e.target as Node)) hide()
    }
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && hide()
    const onScroll = () => hide()
    document.addEventListener('pointerdown', onPointer)
    document.addEventListener('keydown', onKey)
    window.addEventListener('scroll', onScroll, true)
    return () => {
      document.removeEventListener('pointerdown', onPointer)
      document.removeEventListener('keydown', onKey)
      window.removeEventListener('scroll', onScroll, true)
    }
  }, [open])

  useEffect(() => () => window.clearTimeout(timer.current), [])

  if (!isValidElement(children)) return children

  const child = children as ReactElement<any>
  const props = child.props
  const trigger = cloneElement(child, {
    ref: (node: HTMLElement | null) => {
      triggerRef.current = node
      const r = (child as any).ref
      if (typeof r === 'function') r(node)
      else if (r && typeof r === 'object') r.current = node
    },
    'aria-describedby': open ? id : props['aria-describedby'],
    onMouseEnter: (e: any) => {
      props.onMouseEnter?.(e)
      show()
    },
    onMouseLeave: (e: any) => {
      props.onMouseLeave?.(e)
      hide()
    },
    onFocus: (e: any) => {
      props.onFocus?.(e)
      show()
    },
    onBlur: (e: any) => {
      props.onBlur?.(e)
      hide()
    },
    onPointerDown: (e: any) => {
      props.onPointerDown?.(e)
      if (e.pointerType === 'touch') toggle()
    },
  })

  return (
    <>
      {trigger}
      {createPortal(
        <AnimatePresence>
          {open && coords && (
            <motion.div
              role="tooltip"
              id={id}
              initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.9, filter: 'blur(5px)' }}
              animate={reduce ? { opacity: 1 } : { opacity: 1, scale: 1, filter: 'blur(0px)' }}
              exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.9, filter: 'blur(5px)' }}
              transition={{ type: 'spring', stiffness: 400, damping: 28 }}
              transformTemplate={(_, generated) => `${PREFIX[side]} ${generated}`}
              style={{ position: 'fixed', left: coords.x, top: coords.y, zIndex: 60 }}
              className={`pointer-events-none whitespace-nowrap rounded-btn border border-line bg-surface-2 px-2.5 py-1.5 text-xs leading-4 text-primary shadow-lg ${
                className ?? ''
              }`}
            >
              {content}
            </motion.div>
          )}
        </AnimatePresence>,
        document.body,
      )}
    </>
  )
}
