import AppNav from "@/components/AppNav";
import ProblemForm from "@/components/ProblemForm";

export default function NewProblemPage() {
  return (
    <>
      <AppNav />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-10 sm:px-6">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight">Log a solve</h1>
          <p className="mt-1 text-sm text-muted">
            Its review ladder starts tomorrow — 1 day, then 3, then a week, out to 6 months.
          </p>
        </div>
        <ProblemForm />
      </main>
    </>
  );
}
