import type { LucideIcon } from "lucide-react";

export interface Category {
  id: string;
  name: string;
  icon: LucideIcon;
  color: string;
}

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  date: Date;
  category: string;
  isRecurring?: boolean;
}

export interface Budget {
  id: string;
  name: string;
  limit: number;
  spent: number;
}
