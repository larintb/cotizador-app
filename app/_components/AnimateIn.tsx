'use client'

import { useEffect, useRef, useState } from 'react'

interface Props {
  children: React.ReactNode
  className?: string
  delay?: number          // ms
  direction?: 'up' | 'down' | 'left' | 'right' | 'none'
}

export default function AnimateIn({
  children,
  className = '',
  delay = 0,
  direction = 'up',
}: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect() } },
      { threshold: 0.15 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const translate: Record<string, string> = {
    up:    'translateY(32px)',
    down:  'translateY(-32px)',
    left:  'translateX(32px)',
    right: 'translateX(-32px)',
    none:  'none',
  }

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity:    visible ? 1 : 0,
        transform:  visible ? 'none' : translate[direction],
        transition: `opacity 0.7s ease ${delay}ms, transform 0.7s ease ${delay}ms`,
      }}
    >
      {children}
    </div>
  )
}
