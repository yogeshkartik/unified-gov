const steps = ["Additional information", "Consent", "Preview", "Payment", "Submitted"];

export function ApplicationProgress({ currentStep = 1 }: { currentStep?: number }) {
  return (
    <nav aria-label="Application progress" className="overflow-hidden">
      <ol className="grid grid-cols-5 gap-1 text-xs sm:gap-2 sm:text-sm">
        {steps.map((step, index) => {
          const stepNumber = index + 1;
          const current = stepNumber === currentStep;
          const complete = stepNumber < currentStep;
          return <li key={step} className="flex min-w-0 flex-col items-center gap-1 text-center"><span aria-current={current ? "step" : undefined} className={`grid size-6 place-items-center rounded-full text-xs font-semibold shadow-sm ${current ? "bg-primary text-primary-foreground" : complete ? "bg-emerald-500 text-white" : "bg-muted text-muted-foreground"}`}>{complete ? "✓" : stepNumber}</span><span className={`min-w-0 leading-tight ${current ? "font-medium text-primary" : complete ? "text-emerald-700" : "text-muted-foreground"}`}>{step}</span></li>;
        })}
      </ol>
    </nav>
  );
}
