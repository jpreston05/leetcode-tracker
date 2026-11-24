"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import BrandMark from "./BrandMark";
import SignOutButton from "./SignOutButton";
import ThemeToggle from "./ThemeToggle";

const links = [
  { href: "/", label: "Dashboard" },
  { href: "/problems", label: "Problems" },
];

export default function AppNav({ isOwner = false }: { isOwner?: boolean }) {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-canvas/85 backdrop-blur-md">
      <div className="mx-auto flex h-14 w-full max-w-3xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2" aria-label="LeetCode Tracker home">
            <BrandMark />
            <span className="hidden text-sm font-extrabold tracking-tight sm:inline">Tracker</span>
          </Link>
          <nav className="flex items-center gap-1">
            {links.map(({ href, label }) => {
              const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={`rounded-full px-3 py-1.5 text-sm font-semibold transition-colors duration-150 ${
                    active ? "bg-brand-soft text-brand-ink" : "text-muted hover:bg-raised hover:text-ink"
                  }`}
                  aria-current={active ? "page" : undefined}
                >
                  {label}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="flex items-center gap-1.5">
          <ThemeToggle />
          {isOwner && (
            <>
              <Link
                href="/problems/new"
                className="btn-primary h-9 px-3.5 text-[0.8125rem]"
                aria-label="Add solve"
              >
                <svg aria-hidden width="14" height="14" viewBox="0 0 16 16" fill="none">
                  <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
                <span className="hidden sm:inline">Add solve</span>
              </Link>
              <SignOutButton />
            </>
          )}
        </div>
      </div>
    </header>
  );
}
