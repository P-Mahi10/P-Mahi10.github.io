
export type Category = 
  | 'Food' 
  | 'Travel' 
  | 'Entertainment' 
  | 'Shopping' 
  | 'Bills' 
  | 'Healthcare' 
  | 'Other';

export const CATEGORIES: Category[] = [
  'Food', 
  'Travel', 
  'Entertainment', 
  'Shopping', 
  'Bills', 
  'Healthcare', 
  'Other'
];

export interface Expense {
  id: string;
  userId: string;
  date: string;
  category: Category;
  amount: number;
  notes?: string;
}

export interface Budget {
  userId: string;
  category: Category;
  amount: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}
