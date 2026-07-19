import AppNav from "@/components/AppNav";
import ProblemForm from "@/components/ProblemForm";

export default function NewProblemPage() {
  return (
    <main className="mx-auto w-full max-w-2xl flex-1 p-8">
      <AppNav title="Add problem" />
      <ProblemForm />
    </main>
  );
}
