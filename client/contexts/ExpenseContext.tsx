import React, { createContext, useContext, useState, ReactNode, useCallback, useEffect } from 'react';
import { expenseApi, Expense, ExpenseInput } from '../services/api';

// Map backend expense model to frontend ExpenseItem
export type ExpenseItem = {
  id: string;
  category: string;
  amount: number;
  date: string;
  description?: string;
  category_id?: string;
  subcat_id?: string;
};

interface ExpenseContextType {
  expenseItems: ExpenseItem[];
  addExpense: (item: Omit<ExpenseItem, 'id'>) => Promise<void>;
  updateExpense: (id: string, item: Omit<ExpenseItem, 'id'>) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  getTotalExpense: () => number;
  getRecentExpense: (limit?: number) => ExpenseItem[];
  refreshData: () => Promise<void>;
  isRefreshing: boolean;
  totalPages: number;
  currentPage: number;
  loadNextPage: () => Promise<void>;
  loadPreviousPage: () => Promise<void>;
}

const ExpenseContext = createContext<ExpenseContextType | undefined>(undefined);

export const useExpense = () => {
  const context = useContext(ExpenseContext);
  if (!context) {
    throw new Error('useExpense must be used within an ExpenseProvider');
  }
  return context;
};

interface ExpenseProviderProps {
  children: ReactNode;
}

export const ExpenseProvider: React.FC<ExpenseProviderProps> = ({ children }) => {
  const [expenseItems, setExpenseItems] = useState<ExpenseItem[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  
  // Convert backend Expense to frontend ExpenseItem
  const mapExpenseToExpenseItem = (expense: Expense): ExpenseItem => {
    const categoryName = typeof expense.category_id === 'object' ? expense.category_id.name : 'Uncategorized';
    
    return {
      id: expense._id,
      category: categoryName,
      amount: expense.amount,
      date: expense.date,
      description: expense.description,
      category_id: typeof expense.category_id === 'object' ? expense.category_id._id : expense.category_id,
      subcat_id: typeof expense.subcat_id === 'object' ? expense.subcat_id._id : expense.subcat_id,
    };
  };
  
  // Load expenses on initial render
  useEffect(() => {
    refreshData();
  }, []);

  const addExpense = async (item: Omit<ExpenseItem, 'id'>) => {
    try {
      console.log('Adding expense with data:', item);
      // Validate required fields
      if (!item.category_id || item.category_id.trim() === '') {
        throw new Error('Category ID is required');
      }
      
      // Convert frontend ExpenseItem to backend ExpenseInput
      const expenseInput: ExpenseInput = {
        amount: item.amount,
        description: item.description || '',
        date: item.date,
        category_id: item.category_id.trim(),
        subcat_id: item.subcat_id && item.subcat_id.trim() ? item.subcat_id.trim() : undefined,
      };
      
      console.log('Sending to API:', expenseInput);
      const newExpense = await expenseApi.create(expenseInput);
      const newItem = mapExpenseToExpenseItem(newExpense);
      
      setExpenseItems(prev => [...prev, newItem]);
    } catch (error: any) {
      console.error('Error adding expense:', error);
      if (error.response) {
        console.error('Response data:', error.response.data);
        console.error('Response status:', error.response.status);
        console.error('Response headers:', error.response.headers);
      } else if (error.request) {
        console.error('Request made but no response:', error.request);
      } else {
        console.error('Error setting up request:', error.message);
      }
      throw error;
    }
  };

  const updateExpense = async (id: string, item: Omit<ExpenseItem, 'id'>) => {
    try {
      // Convert frontend ExpenseItem to backend ExpenseInput
      const expenseInput: ExpenseInput = {
        amount: item.amount,
        description: item.description || '',
        date: item.date,
        category_id: item.category_id || '', // This should be properly set in the UI
        subcat_id: item.subcat_id,
      };
      
      const updatedExpense = await expenseApi.update(id, expenseInput);
      const updatedItem = mapExpenseToExpenseItem(updatedExpense);
      
      setExpenseItems(prev => 
        prev.map(expense => 
          expense.id === id ? updatedItem : expense
        )
      );
    } catch (error) {
      console.error('Error updating expense:', error);
      throw error;
    }
  };

  const deleteExpense = async (id: string) => {
    try {
      console.log('ExpenseContext: Deleting expense with ID:', id);
      
      if (!id || id.trim() === '') {
        throw new Error('Invalid expense ID provided');
      }
      
      const response = await expenseApi.delete(id);
      console.log('ExpenseContext: Delete API response:', response);
      
      setExpenseItems(prev => {
        const filtered = prev.filter(expense => expense.id !== id);
        console.log('ExpenseContext: Items before delete:', prev.length);
        console.log('ExpenseContext: Items after delete:', filtered.length);
        return filtered;
      });
      
      console.log('ExpenseContext: Expense deleted successfully');
    } catch (error: any) {
      console.error('ExpenseContext: Error deleting expense:', error);
      if (error.response) {
        console.error('ExpenseContext: API Error Response:', error.response.data);
        console.error('ExpenseContext: API Error Status:', error.response.status);
      }
      throw error;
    }
  };

  const getTotalExpense = () => {
    return expenseItems.reduce((sum, item) => sum + item.amount, 0);
  };

  const getRecentExpense = (limit: number = 3) => {
    return expenseItems
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, limit);
  };

  const refreshData = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const response = await expenseApi.getAll(currentPage, pageSize);
      const mappedItems = response.data.map(mapExpenseToExpenseItem);
      
      setExpenseItems(mappedItems);
      setTotalPages(response.pagination.totalPages);
      setCurrentPage(response.pagination.page);
    } catch (error) {
      console.error('Error refreshing expense data:', error);
    } finally {
      setIsRefreshing(false);
    }
  }, [currentPage, pageSize]);
  
  const loadNextPage = async () => {
    if (currentPage < totalPages) {
      const nextPage = currentPage + 1;
      setCurrentPage(nextPage);
      setIsRefreshing(true);
      
      try {
        const response = await expenseApi.getAll(nextPage, pageSize);
        const mappedItems = response.data.map(mapExpenseToExpenseItem);
        
        setExpenseItems(mappedItems);
      } catch (error) {
        console.error('Error loading next page:', error);
        // Revert page change on error
        setCurrentPage(currentPage);
      } finally {
        setIsRefreshing(false);
      }
    }
  };
  
  const loadPreviousPage = async () => {
    if (currentPage > 1) {
      const prevPage = currentPage - 1;
      setCurrentPage(prevPage);
      setIsRefreshing(true);
      
      try {
        const response = await expenseApi.getAll(prevPage, pageSize);
        const mappedItems = response.data.map(mapExpenseToExpenseItem);
        
        setExpenseItems(mappedItems);
      } catch (error) {
        console.error('Error loading previous page:', error);
        // Revert page change on error
        setCurrentPage(currentPage);
      } finally {
        setIsRefreshing(false);
      }
    }
  };

  const value: ExpenseContextType = {
    expenseItems,
    addExpense,
    updateExpense,
    deleteExpense,
    getTotalExpense,
    getRecentExpense,
    refreshData,
    isRefreshing,
    totalPages,
    currentPage,
    loadNextPage,
    loadPreviousPage,
  };

  return (
    <ExpenseContext.Provider value={value}>
      {children}
    </ExpenseContext.Provider>
  );
};