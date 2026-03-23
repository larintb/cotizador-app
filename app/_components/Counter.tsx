'use client'

import { useEffect, useRef, useState } from 'react'

interface Props {
  to: number
  prefix?: string
  suffix?: string
  duration?: number   // ms
  className?: string
}

export default function Counter({ to, prefix = '', suffix = '', duration = 1600, className = '' }: Props) {
  const ref = useRef<HTMLSpanElement>(null)
  const [value, setValue] = useState(0)
  const [started, setStarted] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setStarted(true); observer.disconnect() } },
      { threshold: 0.5 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!started) return
    const start = performance.now()
    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1)
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      setValue(Math.floor(eased * to))
      if (progress < 1) requestAnimationFrame(tick)
      else setValue(to)
    }
    requestAnimationFrame(tick)
  }, [started, to, duration])

  return (
    <span ref={ref} className={className}>
      {prefix}{value}{suffix}
    </span>
  )
}
