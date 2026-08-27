const steps = ["Additional information", "Consent", "Preview", "Payment", "Submitted"];

export function ApplicationProgress({ currentStep = 1 }: { currentStep?: number }) {
  return (
    <nav aria-label="Application progress" className="overflow-x-auto pb-1">
      <ol className="flex min-w-max items-center gap-2 text-xs sm:text-sm">
        {steps.map((step, index) => {
          const stepNumber = index + 1;
          const current = stepNumber === currentStep;
          const complete = stepNumber < currentStep;
          return <li key={step} className="flex items-center gap-2"><span aria-current={current ? "step" : undefined} className={`grid size-6 place-items-center rounded-full text-xs font-semibold shadow-sm ${current ? "bg-primary text-primary-foreground" : complete ? "bg-emerald-500 text-white" : "bg-muted text-muted-foreground"}`}>{complete ? "✓" : stepNumber}</span><span className={current ? "font-medium text-primary" : complete ? "text-emerald-700" : "text-muted-foreground"}>{step}</span>{index < steps.length - 1 ? <span className={`mx-1 h-px w-5 sm:w-8 ${complete ? "bg-emerald-300" : "bg-border"}`} aria-hidden="true" /> : null}</li>;
        })}
      </ol>
    </nav>
  );
}
