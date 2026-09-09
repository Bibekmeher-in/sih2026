import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatWeight(kg: number): string {
  if (kg >= 100) {
    const quintals = kg / 100;
    return `${quintals % 1 === 0 ? quintals : quintals.toFixed(1)} Quintal${quintals > 1 ? "s" : ""}`;
  }
  return `${kg} kg`;
}
