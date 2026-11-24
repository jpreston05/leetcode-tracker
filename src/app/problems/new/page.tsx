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
            Your time, grade, and confidence set the first review: a week out if it went well, tomorrow if not.
          </p>
        </div>
        <ProblemForm />
      </main>
    </>
  );
}
