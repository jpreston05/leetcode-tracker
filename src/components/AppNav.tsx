import Link from "next/link";
import SignOutButton from "./SignOutButton";

export default function AppNav({ title }: { title: string }) {
  return (
    <header className="mb-8 flex items-center justify-between">
      <div className="flex items-baseline gap-6">
        <h1 className="text-xl font-semibold">{title}</h1>
        <nav className="flex gap-4 text-sm text-gray-500">
          <Link href="/" className="hover:underline">
            Dashboard
          </Link>
          <Link href="/problems" className="hover:underline">
            All problems
          </Link>
          <Link href="/problems/new" className="hover:underline">
            Add
          </Link>
        </nav>
      </div>
      <SignOutButton />
    </header>
  );
}
