"use client";


import { motion } from 'framer-motion'
import type { Bucket } from '@/lib/types'
import { fmtMoney } from '@/lib/analysis'
import { cn } from '@/lib/utils'

export function BucketTable({ label, buckets }: { label: string; buckets: Bucket[] }) {
  return (
    <div className="-mx-4 overflow-x-auto border-y-[3px] border-ink sm:mx-0 sm:border">
      <table className="w-full min-w-[560px] border-collapse font-mono text-xs sm:text-sm">
        <thead>
          <tr className="bg-ink text-paper">
            {[label, 'ENTRIES', 'FEES', 'WINNINGS', 'NET', 'ROI', 'WIN%'].map((h) => (
              <th
                key={h}
                className="border-r-[2px] border-paper/15 px-2.5 py-2 text-left uppercase tracking-widest last:border-r-0 sm:px-3"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {buckets.map((b, i) => (
            <motion.tr
              key={b.key}
              initial={{ opacity: 0, x: -12 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className={cn('border-t-[1px] border-ink/10', i % 2 && 'bg-ink/[0.03]')}
            >
              <td className="px-2.5 py-2 font-bold uppercase tracking-widest text-ink sm:px-3">
                {b.key}
                {b.smallSample && (
                  <span className="ml-2 inline-block border-[1px] border-orange px-1 py-0.5 text-[9px] uppercase text-ink">
                    small
                  </span>
                )}
              </td>
              <td className="px-2.5 py-2 text-muted-foreground sm:px-3">{b.entries}</td>
              <td className="px-2.5 py-2 text-muted-foreground sm:px-3">{fmtMoney(b.fees)}</td>
              <td className="px-2.5 py-2 text-muted-foreground sm:px-3">{fmtMoney(b.winnings)}</td>
              <td className={cn('px-2.5 py-2 font-bold sm:px-3', b.net >= 0 ? 'text-profit' : 'text-hotred')}>
                {fmtMoney(b.net)}
              </td>
              <td className={cn('px-2.5 py-2 font-bold sm:px-3', b.roi >= 0 ? 'text-profit' : 'text-hotred')}>
                {b.roi >= 0 ? '+' : ''}
                {b.roi.toFixed(1)}%
              </td>
              <td className="px-2.5 py-2 text-muted-foreground sm:px-3">{b.winRate.toFixed(0)}%</td>
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
