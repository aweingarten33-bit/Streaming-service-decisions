"use client";


import { cn } from '@/lib/utils'
import { SplitWords } from '@/components/fx/split-text'
import { KineticHeading } from '@/components/fx/kinetic-heading'

interface SectionHeaderProps {
  index?: string
  label: string
  title: string
  className?: string
}

export function SectionHeader({ index, label, title, className }: SectionHeaderProps) {
  return (
    <div className={cn('mb-10', className)}>
      <div className="edu-rule mb-3 w-full" />
      <div className="flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
        {index && <span>{index}</span>}
        <span>{label}</span>
      </div>
      <KineticHeading className="mt-3">
        <h2 className="font-display text-4xl font-bold leading-[1.02] tracking-[-0.01em] sm:text-5xl">
          <SplitWords text={title} />
        </h2>
      </KineticHeading>
    </div>
  )
}
