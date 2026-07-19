"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import SignOutButton from "./SignOutButton";

const links = [
  { href: "/", label: "Dashboard" },
  { href: "/problems", label: "Problems" },
];

export default function AppNav() {
  const pathname = usePathname();

  return (
    <header className="border-b border-line">
      <div className="mx-auto flex h-14 w-full max-w-3xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2" aria-label="LeetCode Tracker home">
            {/* brand mark: the ladder rail, miniature */}
            <span aria-hidden className="flex items-center gap-0.5">
              <span className="h-1.5 w-2.5 rounded-full bg-olive" />
              <span className="h-1.5 w-2.5 rounded-full bg-olive" />
              <span className="h-1.5 w-2.5 rounded-full bg-raised ring-1 ring-line-strong ring-inset" />
            </span>
            <span className="hidden text-sm font-semibold tracking-tight sm:inline">Tracker</span>
          </Link>
          <nav className="flex items-center gap-1">
            {links.map(({ href, label }) => {
              const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={`rounded-lg px-3 py-1.5 text-sm transition-colors duration-150 ${
                    active ? "bg-surface text-ink" : "text-muted hover:text-ink"
                  }`}
                  aria-current={active ? "page" : undefined}
                >
                  {label}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/problems/new"
            className="btn-primary h-9 px-3 text-[0.8125rem]"
            aria-label="Add solve"
          >
            <svg aria-hidden width="14" height="14" viewBox="0 0 16 16" fill="none">
              <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
            </svg>
            <span className="hidden sm:inline">Add solve</span>
          </Link>
          <SignOutButton />
        </div>
      </div>
    </header>
  );
}
