/** Presentation-only accents for service categories. Kept deterministic so the
 * category has the same visual identity anywhere it is represented. */
export function categoryAccent(category: string) {
  const value = category.toLowerCase();
  if (value.includes("certificate")) return "bg-violet-50 text-violet-700 ring-1 ring-violet-100 dark:bg-violet-950/35 dark:text-violet-300 dark:ring-violet-900";
  if (value.includes("education") || value.includes("scholarship")) return "bg-amber-50 text-amber-700 ring-1 ring-amber-100 dark:bg-amber-950/35 dark:text-amber-300 dark:ring-amber-900";
  if (value.includes("examination")) return "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-100 dark:bg-indigo-950/35 dark:text-indigo-300 dark:ring-indigo-900";
  if (value.includes("scheme")) return "bg-teal-50 text-teal-700 ring-1 ring-teal-100 dark:bg-teal-950/35 dark:text-teal-300 dark:ring-teal-900";
  if (value.includes("identity") || value.includes("licence") || value.includes("license")) return "bg-blue-50 text-blue-700 ring-1 ring-blue-100 dark:bg-blue-950/35 dark:text-blue-300 dark:ring-blue-900";
  if (value.includes("health")) return "bg-teal-50 text-teal-700 ring-1 ring-teal-100 dark:bg-teal-950/35 dark:text-teal-300 dark:ring-teal-900";
  return "bg-primary/10 text-primary ring-1 ring-primary/10";
}

export function categoryHoverAccent(category: string) {
  const value = category.toLowerCase();
  if (value.includes("certificate")) return "hover:bg-violet-50/55 dark:hover:bg-violet-950/15";
  if (value.includes("education") || value.includes("scholarship")) return "hover:bg-amber-50/60 dark:hover:bg-amber-950/15";
  if (value.includes("examination")) return "hover:bg-indigo-50/55 dark:hover:bg-indigo-950/15";
  if (value.includes("scheme") || value.includes("health")) return "hover:bg-teal-50/55 dark:hover:bg-teal-950/15";
  if (value.includes("identity") || value.includes("licence") || value.includes("license")) return "hover:bg-blue-50/55 dark:hover:bg-blue-950/15";
  return "hover:bg-primary/5";
}
