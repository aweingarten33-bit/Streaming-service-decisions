"use client";

import { motion, useScroll, useTransform } from 'framer-motion'
import { useRef } from 'react'

/**
 * Ambient cinematic backdrop — never static. A deep-space wash with
 * slowly drifting aurora gradients, floating orbs, and a subtle grain.
 * Positioned absolute inside its parent, so it only paints the landing
 * scope and doesn't bleed into other routes.
 */
export function AmbientBackdrop() {
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] })
  const y1 = useTransform(scrollYProgress, [0, 1], ['0%', '30%'])
  const y2 = useTransform(scrollYProgress, [0, 1], ['0%', '-20%'])

  return (
    <div
      ref={ref}
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-0 overflow-hidden bg-[#05070d]"
    >
      {/* aurora blobs */}
      <motion.div
        style={{ y: y1 }}
        className="absolute -left-40 top-[10%] h-[70vh] w-[70vh] rounded-full opacity-60 blur-[120px]"
        animate={{
          background: [
            'radial-gradient(circle, rgba(120,80,255,0.55), transparent 60%)',
            'radial-gradient(circle, rgba(60,180,255,0.55), transparent 60%)',
            'radial-gradient(circle, rgba(120,80,255,0.55), transparent 60%)',
          ],
        }}
        transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
      />
      <motion.div
        style={{ y: y2 }}
        className="absolute -right-40 top-[40%] h-[80vh] w-[80vh] rounded-full opacity-50 blur-[140px]"
        animate={{
          background: [
            'radial-gradient(circle, rgba(255,90,140,0.5), transparent 60%)',
            'radial-gradient(circle, rgba(255,180,80,0.5), transparent 60%)',
            'radial-gradient(circle, rgba(255,90,140,0.5), transparent 60%)',
          ],
        }}
        transition={{ duration: 22, repeat: Infinity, ease: 'linear' }}
      />
      <motion.div
        className="absolute left-1/3 top-[70%] h-[60vh] w-[60vh] rounded-full opacity-40 blur-[120px]"
        animate={{
          background: [
            'radial-gradient(circle, rgba(80,255,200,0.45), transparent 60%)',
            'radial-gradient(circle, rgba(120,140,255,0.45), transparent 60%)',
            'radial-gradient(circle, rgba(80,255,200,0.45), transparent 60%)',
          ],
        }}
        transition={{ duration: 26, repeat: Infinity, ease: 'linear' }}
      />

      {/* fine grid */}
      <div
        className="absolute inset-0 opacity-[0.08]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)',
          backgroundSize: '80px 80px',
        }}
      />

      {/* vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(0,0,0,0.75)_100%)]" />

      {/* floating orbs */}
      {Array.from({ length: 14 }).map((_, i) => (
        <FloatingOrb key={i} i={i} />
      ))}
    </div>
  )
}

function FloatingOrb({ i }: { i: number }) {
  const size = 3 + ((i * 7) % 6)
  const left = ((i * 137) % 100)
  const top = ((i * 53) % 100)
  const dur = 8 + (i % 5) * 2
  const delay = (i % 7) * 0.7
  return (
    <motion.span
      className="absolute rounded-full bg-white/60"
      style={{
        left: `${left}%`,
        top: `${top}%`,
        width: size,
        height: size,
        boxShadow: '0 0 12px rgba(255,255,255,0.7)',
      }}
      animate={{ y: [-14, 14, -14], opacity: [0.3, 0.9, 0.3] }}
      transition={{ duration: dur, repeat: Infinity, ease: 'easeInOut', delay }}
    />
  )
}