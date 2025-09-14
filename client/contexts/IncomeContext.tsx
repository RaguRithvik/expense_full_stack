import React, { createContext, useContext, useState, ReactNode, useCallback, useEffect } from 'react';
import { incomeApi, Income, IncomeInput } from '../services/api';

// Map backend income model to frontend IncomeItem
export type IncomeItem = {
  id: string;
  source: string;
  amount: number;
  date: string;
  description?: string;
};

interface IncomeContextType {
  incomeItems: IncomeItem[];
  addIncome: (item: Omit<IncomeItem, 'id'>) => Promise<void>;
  updateIncome: (id: string, item: Omit<IncomeItem, 'id'>) => Promise<void>;
  deleteIncome: (id: string) => Promise<void>;
  getTotalIncome: () => number;
  getRecentIncome: (limit?: number) => IncomeItem[];
  refreshData: () => Promise<void>;
  isRefreshing: boolean;
  totalPages: number;
  currentPage: number;
  loadNextPage: () => Promise<void>;
  loadPreviousPage: () => Promise<void>;
}

const IncomeContext = createContext<IncomeContextType | undefined>(undefined);

export const useIncome = () => {
  const context = useContext(IncomeContext);
  if (!context) {
    throw new Error('useIncome must be used within an IncomeProvider');
  }
  return context;
};

interface IncomeProviderProps {
  children: ReactNode;
}

export const IncomeProvider: React.FC<IncomeProviderProps> = ({ children }) => {
  const [incomeItems, setIncomeItems] = useState<IncomeItem[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  
  // Convert backend Income to frontend IncomeItem
  const mapIncomeToIncomeItem = (income: Income): IncomeItem => {
    return {
      id: income._id,
      source: income.source,
      amount: income.amount,
      date: income.date,
      description: income.description,
    };
  };
  
  // Load income on initial render
  useEffect(() => {
    refreshData();
  }, []);

  const addIncome = async (item: Omit<IncomeItem, 'id'>) => {
    try {
      // Convert frontend IncomeItem to backend IncomeInput
      const incomeInput: IncomeInput = {
        amount: item.amount,
        description: item.description || '',
        date: item.date,
        source: item.source,
      };
      
      const newIncome = await incomeApi.create(incomeInput);
      const newItem = mapIncomeToIncomeItem(newIncome);
      
      setIncomeItems(prev => [...prev, newItem]);
    } catch (error) {
      console.error('Error adding income:', error);
      throw error;
    }
  };

  const updateIncome = async (id: string, item: Omit<IncomeItem, 'id'>) => {
    try {
      // Convert frontend IncomeItem to backend IncomeInput
      const incomeInput: IncomeInput = {
        amount: item.amount,
        description: item.description || '',
        date: item.date,
        source: item.source,
      };
      
      const updatedIncome = await incomeApi.update(id, incomeInput);
      const updatedItem = mapIncomeToIncomeItem(updatedIncome);
      
      setIncomeItems(prev => 
        prev.map(income => 
          income.id === id ? updatedItem : income
        )
      );
    } catch (error) {
      console.error('Error updating income:', error);
      throw error;
    }
  };

  const deleteIncome = async (id: string) => {
    try {
      console.log('IncomeContext: Deleting income with ID:', id);
      
      if (!id || id.trim() === '') {
        throw new Error('Invalid income ID provided');
      }
      
      const response = await incomeApi.delete(id);
      console.log('IncomeContext: Delete API response:', response);
      
      setIncomeItems(prev => {
        const filtered = prev.filter(income => income.id !== id);
        console.log('IncomeContext: Items before delete:', prev.length);
        console.log('IncomeContext: Items after delete:', filtered.length);
        return filtered;
      });
      
      console.log('IncomeContext: Income deleted successfully');
    } catch (error: any) {
      console.error('IncomeContext: Error deleting income:', error);
      if (error.response) {
        console.error('IncomeContext: API Error Response:', error.response.data);
        console.error('IncomeContext: API Error Status:', error.response.status);
      }
      throw error;
    }
  };

  const getTotalIncome = () => {
    return incomeItems.reduce((sum, item) => sum + item.amount, 0);
  };

  const getRecentIncome = (limit: number = 3) => {
    return incomeItems
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, limit);
  };

  const refreshData = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const response = await incomeApi.getAll(currentPage, pageSize);
      const mappedItems = response.data.map(mapIncomeToIncomeItem);
      
      setIncomeItems(mappedItems);
      setTotalPages(response.pagination.totalPages);
      setCurrentPage(response.pagination.page);
    } catch (error) {
      console.error('Error refreshing income data:', error);
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
        const response = await incomeApi.getAll(nextPage, pageSize);
        const mappedItems = response.data.map(mapIncomeToIncomeItem);
        
        setIncomeItems(mappedItems);
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
        const response = await incomeApi.getAll(prevPage, pageSize);
        const mappedItems = response.data.map(mapIncomeToIncomeItem);
        
        setIncomeItems(mappedItems);
      } catch (error) {
        console.error('Error loading previous page:', error);
        // Revert page change on error
        setCurrentPage(currentPage);
      } finally {
        setIsRefreshing(false);
      }
    }
  };

  const value: IncomeContextType = {
    incomeItems,
    addIncome,
    updateIncome,
    deleteIncome,
    getTotalIncome,
    getRecentIncome,
    refreshData,
    isRefreshing,
    totalPages,
    currentPage,
    loadNextPage,
    loadPreviousPage,
  };

  return (
    <IncomeContext.Provider value={value}>
      {children}
    </IncomeContext.Provider>
  );
};
