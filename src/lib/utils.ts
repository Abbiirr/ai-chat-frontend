import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// Merge clsx + tailwind-merge for predictable, deduped class names.
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
