"use client";

import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t-[3px] border-ink">
      <div className="mx-auto grid max-w-[1600px] gap-8 px-4 py-12 sm:grid-cols-2 md:grid-cols-4 md:px-8">
        <div className="col-span-2 md:col-span-1">
          <span className="font-display text-3xl tracking-tight text-ink">
            DFS<span className="text-ink">.</span>ANALYSIS<span className="text-ink">.</span>ENGINE
          </span>
          <p className="mt-3 max-w-xs font-mono text-xs leading-relaxed text-muted-foreground">
            A DFS decision-intelligence coach. We never build lineups. We pinpoint
            where your edge leaks and show you exactly what to fix.
          </p>
        </div>
        <FooterCol
          title="ANALYZE"
          links={[
            ['Upload History', '/upload'],
            ['My Reports', '/reports'],
          ]}
        />
        <FooterCol
          title="PRODUCT"
          links={[
            ['Upload History', '/upload'],
            ['Sample Report', '/reports'],
          ]}
        />
        <FooterCol
          title="INFO"
          links={[
            ['Home', '/'],
            ['My Reports', '/reports'],
          ]}
        />
      </div>
      <div className="border-t border-ink/10">
        <div className="mx-auto flex max-w-[1600px] flex-col items-center justify-between gap-2 px-4 py-4 font-mono text-[10px] uppercase tracking-widest text-muted-foreground sm:flex-row md:px-8">
          <span>© {new Date().getFullYear()} DFS ANALYSIS ENGINE // COACH NOT OPTIMIZER</span>
          <span>USER-UPLOADED CSV ONLY // ZERO SCRAPING</span>
        </div>
      </div>
    </footer>
  )
}

function FooterCol({ title, links }: { title: string; links: [string, string][] }) {
  return (
    <div>
      <h4 className="mb-3 font-mono text-xs font-bold uppercase tracking-widest text-ink">
        {title}
      </h4>
      <ul className="space-y-2">
        {links.map(([label, href]) => (
          <li key={href}>
            <Link
              href={href}
              className="font-mono text-sm text-ink transition-colors hover:text-ink"
            >
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
