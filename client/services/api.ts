import axios from 'axios';
import API_CONFIG from '../config/api';

// Create an axios instance with default config from API_CONFIG
const api = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: API_CONFIG.HEADERS,
});

// Types for API responses
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
}

// Expense types
export interface Expense {
  _id: string;
  amount: number;
  description: string;
  date: string;
  category_id: string | { _id: string; name: string };
  subcat_id?: string | { _id: string; name: string };
  created_at?: string;
  updated_at?: string;
}

export interface ExpenseInput {
  amount: number;
  description: string;
  date: string;
  category_id: string;
  subcat_id?: string;
}

// Income types
export interface Income {
  _id: string;
  amount: number;
  description: string;
  date: string;
  source: string;
  created_at?: string;
  updated_at?: string;
}

export interface IncomeInput {
  amount: number;
  description: string;
  date: string;
  source: string;
}

// Category types
export interface Category {
  _id: string;
  name: string;
  created_at?: string;
  updated_at?: string;
}

export interface CategoryInput {
  name: string;
}

// Subcategory types
export interface Subcategory {
  _id: string;
  name: string;
  category_id: string | Category;
  created_at?: string;
  updated_at?: string;
}

export interface SubcategoryInput {
  name: string;
  category_id: string;
}

// Budget types
export interface Budget {
  _id: string;
  name: string;
  amount: number;
  category_id?: string | Category;
  created_at?: string;
  updated_at?: string;
}

export interface BudgetInput {
  name: string;
  amount: number;
}

// API service for expenses
export const expenseApi = {
  getAll: async (page = 1, pageSize = 10) => {
    const response = await api.get<PaginatedResponse<Expense>>(`/expenses?page=${page}&pageSize=${pageSize}`);
    return response.data;
  },
  getById: async (id: string) => {
    const response = await api.get<Expense>(`/expenses/${id}`);
    return response.data;
  },
  create: async (expense: ExpenseInput) => {
    const response = await api.post<Expense>('/expenses', expense);
    return response.data;
  },
  update: async (id: string, expense: ExpenseInput) => {
    const response = await api.put<Expense>(`/expenses/${id}`, expense);
    return response.data;
  },
  delete: async (id: string) => {
    const response = await api.delete(`/expenses/${id}`);
    return response.data;
  },
};

// API service for income
export const incomeApi = {
  getAll: async (page = 1, pageSize = 10) => {
    const response = await api.get<PaginatedResponse<Income>>(`/income?page=${page}&pageSize=${pageSize}`);
    return response.data;
  },
  getById: async (id: string) => {
    const response = await api.get<Income>(`/income/${id}`);
    return response.data;
  },
  create: async (income: IncomeInput) => {
    const response = await api.post<Income>('/income', income);
    return response.data;
  },
  update: async (id: string, income: IncomeInput) => {
    const response = await api.put<Income>(`/income/${id}`, income);
    return response.data;
  },
  delete: async (id: string) => {
    const response = await api.delete(`/income/${id}`);
    return response.data;
  },
};

// API service for categories
export const categoryApi = {
  getAll: async () => {
    const response = await api.get<Category[]>('/categories');
    return response.data;
  },
  getById: async (id: string) => {
    const response = await api.get<Category>(`/categories/${id}`);
    return response.data;
  },
  create: async (category: CategoryInput) => {
    const response = await api.post<Category>('/categories', category);
    return response.data;
  },
  update: async (id: string, category: CategoryInput) => {
    const response = await api.put<Category>(`/categories/${id}`, category);
    return response.data;
  },
  delete: async (id: string) => {
    const response = await api.delete(`/categories/${id}`);
    return response.data;
  },
};

// API service for subcategories
export const subcategoryApi = {
  getAll: async () => {
    const response = await api.get<Subcategory[]>('/subcategories');
    return response.data;
  },
  getByCategory: async (categoryId: string) => {
    const response = await api.get<Subcategory[]>(`/subcategories?category_id=${categoryId}`);
    return response.data;
  },
  getById: async (id: string) => {
    const response = await api.get<Subcategory>(`/subcategories/${id}`);
    return response.data;
  },
  create: async (subcategory: SubcategoryInput) => {
    const response = await api.post<Subcategory>('/subcategories', subcategory);
    return response.data;
  },
  update: async (id: string, subcategory: SubcategoryInput) => {
    const response = await api.put<Subcategory>(`/subcategories/${id}`, subcategory);
    return response.data;
  },
  delete: async (id: string) => {
    const response = await api.delete(`/subcategories/${id}`);
    return response.data;
  },
};

// API service for budgets
export const budgetApi = {
  getAll: async () => {
    const response = await api.get<Budget[]>('/budgets');
    return response.data;
  },
  getById: async (id: string) => {
    const response = await api.get<Budget>(`/budgets/${id}`);
    return response.data;
  },
  create: async (budget: BudgetInput) => {
    const response = await api.post<Budget>('/budgets', budget);
    return response.data;
  },
  update: async (id: string, budget: BudgetInput) => {
    const response = await api.put<Budget>(`/budgets/${id}`, budget);
    return response.data;
  },
  delete: async (id: string) => {
    const response = await api.delete(`/budgets/${id}`);
    return response.data;
  },
};

export default {
  expense: expenseApi,
  income: incomeApi,
  category: categoryApi,
  subcategory: subcategoryApi,
  budget: budgetApi,
};