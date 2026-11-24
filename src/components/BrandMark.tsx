// Brand mark: a problem's journey as three pips — new (sun) → review (sky)
// → retired (grape). The same three colours that run through the app.
export default function BrandMark({ size = "sm" }: { size?: "sm" | "lg" }) {
  const pip = size === "lg" ? "h-3.5 w-3.5" : "h-2.5 w-2.5";
  return (
    <span aria-hidden className={`flex items-center ${size === "lg" ? "gap-1.5" : "gap-1"}`}>
      <span className={`${pip} rounded-full bg-sun`} />
      <span className={`${pip} rounded-full bg-sky`} />
      <span className={`${pip} rounded-[35%] bg-grape`} />
    </span>
  );
}
